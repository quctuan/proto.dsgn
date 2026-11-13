/** Runs inside the sandboxed preview so bounds follow nested scroll and zoom. */
export const INSPECT_SELECTION_OVERLAY_SCRIPT = String.raw`
  var inspectSelectionOverlay = (function () {
    var selected = null, selector = null, host = null, box = null, label = null;
    var edges = [], resize = null, mutation = null, pending = false;
    function mount() {
      if (host) return;
      host = document.createElement('div');
      host.setAttribute('data-od-inspect-overlay', '');
      host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483646!important;display:block!important;';
      var shadow = host.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      style.textContent = '.box{position:absolute;box-sizing:border-box;border:2px solid #0099ff;background:rgba(0,153,255,.045);pointer-events:none}.label{position:absolute;left:-2px;bottom:calc(100% + 5px);padding:3px 6px;border-radius:3px;background:#0099ff;color:white;font:11px/1.3 -apple-system,BlinkMacSystemFont,Arial,sans-serif;white-space:nowrap;max-width:320px;overflow:hidden;text-overflow:ellipsis}.handle{position:absolute;width:6px;height:6px;background:white;border:1px solid #0099ff;box-sizing:border-box}.edge{position:absolute;box-sizing:border-box;background:repeating-linear-gradient(135deg,rgba(0,153,255,.17) 0,rgba(0,153,255,.17) 1px,transparent 1px,transparent 4px)}';
      shadow.appendChild(style);
      box = document.createElement('div'); box.className = 'box';
      for (var i = 0; i < 4; i++) { var edge = document.createElement('div'); edge.className = 'edge'; edges.push(edge); box.appendChild(edge); }
      for (var j = 0; j < 4; j++) { var corner = document.createElement('div'); corner.className = 'handle'; corner.style.cssText = (j % 2 ? 'right:-4px;' : 'left:-4px;') + (j < 2 ? 'top:-4px;' : 'bottom:-4px;'); box.appendChild(corner); }
      label = document.createElement('div'); label.className = 'label'; box.appendChild(label);
      shadow.appendChild(box); document.documentElement.appendChild(host);
    }
    function disconnect() { if (resize) resize.disconnect(); if (mutation) mutation.disconnect(); }
    function clear() { selected = null; selector = null; disconnect(); if (host) host.style.setProperty('display', 'none', 'important'); }
    function render() {
      pending = false;
      if (!inspectEnabled || !selected) { clear(); return; }
      if (!selected.isConnected) { clear(); window.parent.postMessage({ type: 'od:inspect-clear' }, '*'); return; }
      var r = selected.getBoundingClientRect(), cs = window.getComputedStyle(selected);
      if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') { if (host) host.style.setProperty('display', 'none', 'important'); return; }
      mount(); host.style.setProperty('display', 'block', 'important');
      box.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
      var name = selected.getAttribute('data-component') || selected.getAttribute('data-od-component') || selected.getAttribute('aria-label') || selected.tagName.toLowerCase() + (selected.id ? '#' + selected.id : '');
      label.textContent = name + '  ' + Math.round(r.width) + ' × ' + Math.round(r.height);
      label.style.bottom = r.top < 26 ? 'auto' : 'calc(100% + 5px)'; label.style.top = r.top < 26 ? 'calc(100% + 5px)' : 'auto';
      var t = Math.min(parseFloat(cs.paddingTop) || 0, r.height / 2), b = Math.min(parseFloat(cs.paddingBottom) || 0, r.height / 2);
      var l = Math.min(parseFloat(cs.paddingLeft) || 0, r.width / 2), rr = Math.min(parseFloat(cs.paddingRight) || 0, r.width / 2);
      edges[0].style.cssText = 'left:0;right:0;top:0;height:' + t + 'px';
      edges[1].style.cssText = 'left:0;right:0;bottom:0;height:' + b + 'px';
      edges[2].style.cssText = 'left:0;top:' + t + 'px;bottom:' + b + 'px;width:' + l + 'px';
      edges[3].style.cssText = 'right:0;top:' + t + 'px;bottom:' + b + 'px;width:' + rr + 'px';
    }
    function schedule() { if (!pending && selected) { pending = true; requestAnimationFrame(render); } }
    function select(element, nextSelector) {
      if (!inspectEnabled || !element || element.hasAttribute('data-od-inspect-overlay')) { clear(); return; }
      disconnect(); selected = element; selector = nextSelector || null;
      if (typeof ResizeObserver !== 'undefined') { resize = new ResizeObserver(schedule); resize.observe(element); }
      if (typeof MutationObserver !== 'undefined') { mutation = new MutationObserver(schedule); mutation.observe(document.body, { subtree:true, childList:true, attributes:true }); }
      render();
    }
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('keydown', function (event) { if (inspectEnabled && event.key === 'Escape') { clear(); window.parent.postMessage({ type:'od:inspect-clear' }, '*'); } }, true);
    return { select:select, clear:clear, schedule:schedule };
  })();
`;
