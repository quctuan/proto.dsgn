// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { INSPECT_SELECTION_OVERLAY_SCRIPT } from '../../src/runtime/inspect-selection-overlay';

describe('inspect selection overlay', () => {
  it('tracks bounds and padding without changing the inspected element, then clears on Escape', () => {
    const dom = new JSDOM('<body><button style="padding:16px" data-component="Action">Go</button></body>', { runScripts: 'outside-only' });
    const win = dom.window;
    const target = win.document.querySelector('button')!;
    let top = 60;
    target.getBoundingClientRect = () => ({ left:20, top, width:120, height:48, right:140, bottom:top+48, x:20, y:top, toJSON() {} });
    win.requestAnimationFrame = callback => { callback(0); return 1; };
    win.eval('var inspectEnabled = true;' + INSPECT_SELECTION_OVERLAY_SCRIPT);
    win.eval('inspectSelectionOverlay.select(document.querySelector("button"), "button")');
    const host = win.document.querySelector('[data-od-inspect-overlay]') as HTMLElement;
    const box = host.shadowRoot!.querySelector('.box') as HTMLElement;
    expect(box.style.top).toBe('60px');
    expect(host.shadowRoot!.querySelector('.label')!.textContent).toBe('Action  120 × 48');
    expect((host.shadowRoot!.querySelector('.edge') as HTMLElement).style.height).toBe('16px');
    expect(host.shadowRoot!.querySelectorAll('.handle')).toHaveLength(4);
    top = 25;
    win.dispatchEvent(new win.Event('scroll'));
    expect(box.style.top).toBe('25px');
    expect(target.getAttribute('style')).toBe('padding:16px');
    win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key:'Escape' }));
    expect(host.style.display).toBe('none');
    dom.window.close();
  });
});
