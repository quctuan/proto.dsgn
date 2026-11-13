// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { InspectTarget } from '../../src/components/FileViewer';
import type { ProjectFile } from '../../src/types';
import { PrototypeWorkspace } from '../../src/components/PrototypeWorkspace';
vi.mock('../../src/components/FileViewer', async () => {
  const { useState, useEffect } = await import('react');
  const { createPortal } = await import('react-dom');
  return { FileViewer: ({ file, workspaceView, onInspectTargetChange }: { file: ProjectFile; workspaceView?: { inspect?: boolean }; onInspectTargetChange?: (target: InspectTarget | null) => void }) => {
    const [host, setHost] = useState<Element | null>(null);
    const [open, setOpen] = useState(false);
    useEffect(() => { setHost(document.querySelector('.proto-workspace__publish')); }, []);
    return <div data-testid="screen-file">{file.name}{workspaceView?.inspect && <button onClick={() => onInspectTargetChange?.({ elementId: 'heading', selector: '#heading', label: 'h1.title', text: 'Welcome', bounds: { x: 20, y: 30, width: 240, height: 48 }, style: { width: '240px', height: '48px', fontSize: '32px', fontWeight: '700', color: 'rgb(10, 20, 30)', display: 'block' } })}>Inspect heading fixture</button>}{host && createPortal(<button onClick={() => setOpen(true)}>{open ? 'History open' : 'History fixture'}</button>, host)}</div>;
  } };
});
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
  it('does not capture pointer events from a viewer control portaled into the header', () => {
    mount();
    const article = document.querySelector('article')!;
    const stage = screen.getByLabelText('Infinite canvas');
    const capture = vi.fn();
    article.setPointerCapture = capture;
    stage.setPointerCapture = capture;
    const history = screen.getByRole('button', { name: 'History fixture' });
    fireEvent.pointerDown(history, { pointerId: 1 });
    fireEvent.click(history);
    expect(capture).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'History open' })).toBeTruthy();
  });
  it('can reopen conversation controls while the conversation is collapsed', () => {
    const change = vi.fn();
    render(<PrototypeWorkspace projectId="sample" files={files} revision={1} onCreatePrototype={vi.fn()} onRefresh={() => {}} conversationCollapsed onConversationCollapsedChange={change} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expand conversation pane' }));
    expect(change).toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: 'Expand conversation pane' }).closest('header')).toBeNull();
  });
  it('starts gray, selects on context click and persists copied and renamed frames', () => {
    mount();
    const frame = document.querySelector('article')!;
    expect(frame.className).not.toContain('is-selected');
    expect(frame.textContent).toContain('Desktop');
    expect(frame.textContent).toContain('1200');
    fireEvent.contextMenu(frame, { clientX: 300, clientY: 200 });
    expect(frame.className).toContain('is-selected');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    fireEvent.contextMenu(frame);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Paste' }));
    expect(document.querySelectorAll('article')).toHaveLength(2);
    const copy = document.querySelectorAll('article')[1]!;
    fireEvent.contextMenu(copy);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Screen name' }), { target: { value: 'Checkout' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(copy.textContent).toContain('Checkout');
    const meta = JSON.parse(localStorage.getItem('proto-board-meta:sample')!);
    expect(meta.copies).toHaveLength(1);
    expect(Object.values(meta.aliases)).toContain('Checkout');
    fireEvent.contextMenu(copy);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(document.querySelectorAll('article')).toHaveLength(1);
    expect(screen.getByTestId('screen-file').textContent).toBe('design.html');
  });
  it('collapses Flows and exposes the Framer zoom commands', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(document.querySelector('aside')?.hidden).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(document.querySelector('aside')?.hidden).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Zoom to 100%/ }));
    expect(screen.getByRole('button', { name: 'Zoom options' }).textContent).toContain('100%');
  });
  it('uses the compact project menu while collapsed and remembers sidebar state', () => {
    mount();
    const collapse = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(collapse.closest('aside')).not.toBeNull();
    fireEvent.click(collapse);
    expect(screen.getByLabelText('Workspace toolbar').hasAttribute('hidden')).toBe(true);
    expect(screen.queryByRole('tab', { name: 'Screens' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('proto-board-meta:sample')!).sidebarCollapsed).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Workspace menu' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Prototype' }));
    expect(screen.getByTestId('screen-file').textContent).toContain('prototypes/');
    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(screen.getByRole('tab', { name: 'Prototype' }).getAttribute('aria-selected')).toBe('true');
  });
  it('keeps the point under the cursor anchored during trackpad pinch', () => {
    mount();
    const stage = screen.getByLabelText('Infinite canvas');
    stage.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800, toJSON: () => ({}) });
    const world = document.querySelector('.proto-workspace__world') as HTMLElement;
    const read = () => world.style.transform.match(/translate\(([-.\d]+)px, ([-.\d]+)px\) scale\(([-.\d]+)\)/)!.slice(1).map(Number);
    const before = read();
    fireEvent.wheel(stage, { ctrlKey: true, deltaY: -100, clientX: 320, clientY: 200 });
    const after = read();
    expect(after[2]).toBeGreaterThan(before[2]!);
    expect((320 - after[0]!) / after[2]!).toBeCloseTo((320 - before[0]!) / before[2]!);
    expect((200 - after[1]!) / after[2]!).toBeCloseTo((200 - before[1]!) / before[2]!);
  });
  it('replaces Agent with live element properties in Dev mode and returns to View mode', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Dev mode' }));
    expect(screen.getByRole('complementary', { name: 'Properties' })).toBeTruthy();
    expect(screen.getByText('Page / Frame')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Inspect heading fixture' }));
    expect(screen.getByText('h1.title')).toBeTruthy();
    expect(screen.getByText('#heading')).toBeTruthy();
    expect(screen.getByText('32px')).toBeTruthy();
    expect(screen.getByText('700')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Page properties/ }));
    expect(screen.getByText('Page / Frame')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View mode' }));
    expect(screen.queryByRole('complementary', { name: 'Properties' })).toBeNull();
  });
  it('keeps Canvas open and reports a rejected generation request', async () => {
    mount(vi.fn().mockResolvedValue(false));
    fireEvent.click(screen.getByRole('button', { name: 'Create prototype' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not start'));
    expect(screen.getByRole('tab', { name: 'Screens' }).getAttribute('aria-selected')).toBe('true');
  });
});
