// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ProjectFile } from '../../src/types';
import { PrototypeWorkspace } from '../../src/components/PrototypeWorkspace';
vi.mock('../../src/components/FileViewer', () => ({ FileViewer: ({ file }: { file: ProjectFile }) => <div data-testid="screen-file">{file.name}</div> }));
vi.mock('../../src/components/AppChromeHeader', () => ({ APP_CHROME_FILE_ACTIONS_ID: 'app-chrome-file-actions' }));
afterEach(() => { cleanup(); localStorage.clear(); });
const files = [{ name: 'design.html', kind: 'html', size: 1, mtime: 1 }, { name: 'prototypes/revision-1/index.html', kind: 'html', size: 1, mtime: 1 }] as ProjectFile[];
function mount(onCreatePrototype = vi.fn().mockResolvedValue(true)) {
  render(<PrototypeWorkspace projectId="sample" files={files} revision={1} onCreatePrototype={onCreatePrototype} onRefresh={() => {}} />);
  return onCreatePrototype;
}
describe('PrototypeWorkspace design and prototype lifecycle', () => {
  it('opens static designs by default and selects prototype files separately', () => {
    mount();
    expect(screen.getByTestId('screen-file').textContent).toBe('design.html');
    fireEvent.click(screen.getByRole('tab', { name: 'Prototype' }));
    expect(screen.getByTestId('screen-file').textContent).toBe('prototypes/revision-1/index.html');
    fireEvent.click(screen.getByRole('tab', { name: 'Screens' }));
    expect(screen.getByTestId('screen-file').textContent).toBe('design.html');
  });
  it('starts a new agent revision without asking it to overwrite designs', async () => {
    const create = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Create prototype' }));
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Prototype' }).getAttribute('aria-selected')).toBe('true'));
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0]?.[0]).toContain('Preserve all original design files unchanged');
    expect(create.mock.calls[0]?.[0]).toContain('NEW unique revision folder under prototypes/');
  });
  it('shows Create prototype only on Canvas', () => {
    mount();
    fireEvent.click(screen.getByRole('tab', { name: 'Prototype' }));
    expect(screen.queryByRole('button', { name: 'Create prototype' })).toBeNull();
    expect(screen.getAllByRole('tab', { name: /Screens|Prototype/ })).toHaveLength(2);
  });
  it('keeps Canvas open and reports a rejected generation request', async () => {
    mount(vi.fn().mockResolvedValue(false));
    fireEvent.click(screen.getByRole('button', { name: 'Create prototype' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not start'));
    expect(screen.getByRole('tab', { name: 'Screens' }).getAttribute('aria-selected')).toBe('true');
  });
});
