// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ResponsiveDevicePicker, type ResponsiveDevice } from '../../src/components/ResponsiveDevicePicker';
afterEach(cleanup);
function Harness() {
  const [value, setValue] = useState<ResponsiveDevice>('desktop');
  const [width, setWidth] = useState(1200);
  return <><ResponsiveDevicePicker value={value} onChange={(device, nextWidth) => { setValue(device); setWidth(nextWidth); }} /><output>{width}px</output></>;
}
describe('responsive device picker', () => {
  it('filters devices and applies the selected device and breakpoint width', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview device: Desktop' }));
    expect(screen.getByRole('option', { name: /Desktop/ }).getAttribute('aria-selected')).toBe('true');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search devices' }), { target: { value: 'tablet' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.click(screen.getByRole('option', { name: /Tablet/ }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Preview device: Tablet' })).toBe(document.activeElement);
    expect(screen.getByText('810px')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Preview device: Tablet' }));
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: /Tablet/ }).getAttribute('aria-selected')).toBe('true');
  });
  it('supports arrow navigation, Escape and outside dismissal', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Preview device: Desktop' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const search = screen.getByRole('textbox', { name: 'Search devices' });
    expect(document.activeElement).toBe(search);
    fireEvent.keyDown(search, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(screen.getByRole('option', { name: /Mobile/ }));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
