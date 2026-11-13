import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import type { ProjectFile } from '../types';
import { PropertiesPanel } from './PropertiesPanel';
import type { InspectTarget } from './FileViewer';
import { FileViewer } from './FileViewer';
import { APP_CHROME_FILE_ACTIONS_ID } from './AppChromeHeader';
import './PrototypeWorkspace.css';
import { Icon } from './Icon';
import { ResponsiveDevicePicker, type ResponsiveDevice } from './ResponsiveDevicePicker';
import styles from './PrototypeWorkspace.module.css';

interface Props {
  projectId: string;
  projectName?: string;
  presence?: ReactNode;
  files: ProjectFile[];
  revision: number;
  busy?: boolean;
  readOnly?: boolean;
  conversationCollapsed?: boolean;
  onConversationCollapsedChange?: (collapsed: boolean) => void;
  onCreatePrototype: (prompt: string) => Promise<boolean>;
  onRefresh: () => void;
  viewerProps?: Partial<ComponentProps<typeof FileViewer>>;
}

/** Design remains a non-interactive board; prototype revisions are separate files. */
export function PrototypeWorkspace({ projectId, projectName, files, revision, busy, readOnly, onCreatePrototype, onRefresh, viewerProps, presence, conversationCollapsed = false, onConversationCollapsedChange }: Props) {
  const [tab, setTab] = useState<'canvas' | 'preview'>('canvas');
  const [panel, setPanel] = useState<'pages' | 'comments'>('pages');
  const [tool, setTool] = useState<'select' | 'pan' | 'edit' | 'comment'>('select');
  const [inspected, setInspected] = useState<InspectTarget | null>(null);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [dev, setDev] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspaceMenu, setWorkspaceMenu] = useState(false);
  const [zoomMenu, setZoomMenu] = useState(false);
  const [fastZoom, setFastZoom] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [copies, setCopies] = useState<{ id: string; fileName: string }[]>([]);
  const [loadedProject, setLoadedProject] = useState<string | null>(null);
  const clipboard = useRef<{ fileName: string; label?: string; geometry: { x: number; y: number; width: number; height: number } } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const [zoom, setZoom] = useState(0.65);
  const [offset, setOffset] = useState({ x: 48, y: 56 });
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [geometry, setGeometry] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const screenDrag = useRef<{ name: string; x: number; y: number; left: number; top: number; width: number; height: number; resize: boolean } | null>(null);
  const [error, setError] = useState('');
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const pages = files.filter(file => /\.html?$/i.test(file.name) && !file.name.startsWith('prototypes/'));
  const prototypes = files.filter(file => file.name.startsWith('prototypes/') && /\.html?$/i.test(file.name));
  const sourceFiles = tab === 'canvas' ? pages : prototypes;
  const visible = [
    ...sourceFiles.map(file => ({ ...file, boardId: file.name })),
    ...copies.flatMap(copy => { const file = sourceFiles.find(item => item.name === copy.fileName); return file ? [{ ...file, boardId: copy.id }] : []; }),
  ].filter(file => !hidden.includes(file.boardId));
  const current = visible.find(file => file.boardId === selected) ?? visible[0];
  useEffect(() => { setInspected(null); }, [selected, projectId, tab]);
  function frameGeometry(id: string, index = 0) { return geometry[id] ?? { x: index * 1280, y: 0, width: 1200, height: 900 }; }
  function responsiveName(width: number) { return width >= 1024 ? 'Desktop' : width >= 600 ? 'Tablet' : 'Mobile'; }
  function zoomAt(next: number, point?: { x: number; y: number }) {
    const stage = stageRef.current; if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const anchor = point ?? { x: rect.width / 2, y: rect.height / 2 };
    const value = Math.min(4, Math.max(.05, next));
    setOffset(old => ({ x: anchor.x - (anchor.x - old.x) * value / zoom, y: anchor.y - (anchor.y - old.y) * value / zoom }));
    setZoom(value);
  }
  function fit(selectionOnly = false) {
    const frames = selectionOnly ? visible.filter(file => file.boardId === selected) : visible;
    if (!frames.length || !stageRef.current) return;
    const boxes = frames.map(file => frameGeometry(file.boardId, visible.indexOf(file)));
    const left = Math.min(...boxes.map(g => g.x)), top = Math.min(...boxes.map(g => g.y));
    const right = Math.max(...boxes.map(g => g.x + g.width)), bottom = Math.max(...boxes.map(g => g.y + g.height));
    const rect = stageRef.current.getBoundingClientRect();
    const insetLeft = sidebarCollapsed ? 40 : 250, insetRight = dev ? (propertiesCollapsed ? 40 : 350) : conversationCollapsed ? 40 : 350;
    const width = Math.max(160, rect.width - insetLeft - insetRight), height = Math.max(160, rect.height - 180);
    const value = Math.min(2, Math.max(.05, Math.min(width / (right - left), height / (bottom - top + 60))));
    setZoom(value); setOffset({ x: insetLeft + (width - (right - left) * value) / 2 - left * value, y: 110 + (height - (bottom - top) * value) / 2 - top * value });
  }
  function copyFrame() {
    if (!current) return;
    clipboard.current = { fileName: current.name, label: aliases[current.boardId], geometry: frameGeometry(current.boardId, visible.indexOf(current)) };
    setMenu(null);
  }
  function pasteFrame() {
    const source = clipboard.current; if (!source || readOnly) return;
    const id = `frame-${crypto.randomUUID()}`;
    setCopies(old => [...old, { id, fileName: source.fileName }]);
    setGeometry(old => ({ ...old, [id]: { ...source.geometry, x: source.geometry.x + 64, y: source.geometry.y + 64 } }));
    if (source.label) setAliases(old => ({ ...old, [id]: source.label! }));
    setSelected(id); setMenu(null);
  }
  useEffect(() => { setTab('canvas'); setSelected(null); setOffset({ x: 280, y: 140 }); }, [projectId]);
  useEffect(() => {
    try {
      setGeometry(JSON.parse(localStorage.getItem(`proto-board:${projectId}`) || '{}'));
      const meta = JSON.parse(localStorage.getItem(`proto-board-meta:${projectId}`) || '{}');
      setCopies(Array.isArray(meta.copies) ? meta.copies : []); setHidden(Array.isArray(meta.hidden) ? meta.hidden : []); setAliases(meta.aliases ?? {}); setSidebarCollapsed(Boolean(meta.sidebarCollapsed));
    } catch { setGeometry({}); setCopies([]); setHidden([]); setAliases({}); }
    setLoadedProject(projectId);
  }, [projectId]);
  useEffect(() => {
    if (loadedProject !== projectId) return;
    try {
      localStorage.setItem(`proto-board:${projectId}`, JSON.stringify(geometry));
      localStorage.setItem(`proto-board-meta:${projectId}`, JSON.stringify({ copies, hidden, aliases, sidebarCollapsed }));
    } catch { /* Storage is optional for viewing the board. */ }
  }, [geometry, copies, hidden, aliases, sidebarCollapsed, loadedProject, projectId]);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!(event.target as Element).closest('[data-board-menu]')) { setMenu(null); setZoomMenu(false); setWorkspaceMenu(false); } };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  // A non-passive native wheel listener is required for macOS trackpad pinch.
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const wheel = (event: WheelEvent) => {
      if ((event.target as Element).closest('[data-board-menu], .proto-workspace__dock')) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
      if (event.ctrlKey || event.metaKey) {
        const rect = stage.getBoundingClientRect();
        zoomAt(zoom * Math.exp(-event.deltaY * unit * (fastZoom ? .012 : .004)), { x: event.clientX - rect.left, y: event.clientY - rect.top });
      } else setOffset(old => ({ x: old.x - event.deltaX * unit, y: old.y - event.deltaY * unit }));
    };
    stage.addEventListener('wheel', wheel, { passive: false });
    return () => stage.removeEventListener('wheel', wheel);
  }, [zoom, fastZoom]);
  function commitGeometry() { screenDrag.current = null; }
  async function createPrototype() {
    if (creating || busy || readOnly || !pages.length) return;
    setCreating(true); setError('');
    try {
      const accepted = await onCreatePrototype(`Create a working interactive prototype from the current static design screens: ${pages.map(p => p.name).join(', ')}. Preserve all original design files unchanged. Write the interactive entry and its supporting files into a NEW unique revision folder under prototypes/ (for example prototypes/revision-<timestamp>/index.html). Implement the intended navigation and interactions using the applied design system. Do not overwrite earlier prototype revisions.`);
      if (accepted) { setTab('preview'); setSelected(null); } else setError('Could not start. Check the agent connection and try again.');
    } catch { setError('Could not create prototype. Try again.'); }
    finally { setCreating(false); }
  }
  return <section ref={rootRef} className={`proto-workspace ${styles.workspace}`} aria-label="Project workspace" data-sidebar-collapsed={sidebarCollapsed} data-conversation-collapsed={conversationCollapsed} data-dev-mode={dev} onKeyDown={event => { if ((event.target as Element).closest('input, textarea, select, [contenteditable="true"]')) return; if (event.key === 'Escape') { setMenu(null); setZoomMenu(false); setSelected(null); setInspected(null); } if (event.metaKey || event.ctrlKey) { if (['+', '=', '-', '0', '1', '2'].includes(event.key)) { event.preventDefault(); if (event.key === '0') zoomAt(1); else if (event.key === '1') fit(); else if (event.key === '2') fit(true); else zoomAt(zoom * (event.key === '-' ? 1 / 1.2 : 1.2)); } } }}>
      {sidebarCollapsed && <div className={styles.compactProject} data-board-menu>
        <button className={styles.projectMenuTrigger} aria-label="Workspace menu" aria-haspopup="menu" aria-expanded={workspaceMenu} onClick={() => setWorkspaceMenu(!workspaceMenu)}><Icon name="folder" size={16} /><strong>{projectName || 'Untitled project'}</strong><Icon name="chevron-down" size={12} /></button>
        <button type="button" aria-label="Expand sidebar" title="Expand sidebar" aria-controls={`flows-${projectId}`} aria-expanded={false} onClick={() => setSidebarCollapsed(false)}><Icon name="panel-left" size={16} /></button>
        {workspaceMenu && <div className={styles.workspaceMenu} role="menu" aria-label="Workspace views"><button role="menuitemradio" aria-checked={tab === 'canvas'} onClick={() => { setTab('canvas'); setSelected(null); setViewMode('preview'); setWorkspaceMenu(false); }}>Screens</button><button role="menuitemradio" aria-checked={tab === 'preview'} onClick={() => { setTab('preview'); setSelected(null); setViewMode('preview'); setWorkspaceMenu(false); }}>Prototype</button></div>}
      </div>}
    <header className="proto-workspace__bar" aria-label="Workspace toolbar" hidden={sidebarCollapsed}>
      <div className={styles.viewControls}>
        <div className={styles.segment} role="tablist" aria-label="Project mode">
          <button role="tab" aria-selected={tab === 'canvas'} onClick={() => { setTab('canvas'); setSelected(null); setViewMode('preview'); }}><Icon name="eye" size={16} />Screens</button>
          <button role="tab" aria-selected={tab === 'preview'} onClick={() => { setTab('preview'); setSelected(null); setViewMode('preview'); }}><Icon name="file-code" size={16} />Prototype</button>
        </div>
        <ResponsiveDevicePicker value={current ? responsiveName(frameGeometry(current.boardId, visible.indexOf(current)).width).toLowerCase() as ResponsiveDevice : viewport} onChange={(value, width) => { setViewport(value); if (current) { const g = frameGeometry(current.boardId, visible.indexOf(current)); setGeometry(old => ({ ...old, [current.boardId]: { ...g, width } })); } }} />
      </div>
      <div className={styles.projectTitle}><strong>{projectName || 'Untitled project'}</strong></div>
      <div className={styles.topActions}>
      {presence}
      <div id={APP_CHROME_FILE_ACTIONS_ID} className="proto-workspace__publish" data-app-chrome-file-actions="true" />
      {tab === 'canvas' && <button className={`proto-workspace__create ${styles.create}`} disabled={busy || creating || readOnly || !pages.length} onClick={() => void createPrototype()}>{busy || creating ? 'Creating…' : 'Create prototype'}</button>}</div>
    </header>
    {!dev && conversationCollapsed && <div className={styles.agentRestore}><strong>Agent</strong><button type="button" aria-label="Expand conversation pane" title="Expand conversation pane" onClick={() => onConversationCollapsedChange?.(false)}><Icon name="panel-left" size={18} /></button></div>}
    {dev && (propertiesCollapsed ? <div className={styles.agentRestore}><strong>Properties</strong><button aria-label="Expand properties" onClick={() => setPropertiesCollapsed(false)}><Icon name="panel-left" size={18} /></button></div> : <PropertiesPanel target={inspected} fileName={current?.name} frame={current ? frameGeometry(current.boardId, visible.indexOf(current)) : null} onCollapse={() => setPropertiesCollapsed(true)} onPage={() => setInspected(null)} />)}
    {error && <div role="alert" className="proto-workspace__error">{error}</div>}
    <div className="proto-workspace__body">
      <div ref={stageRef} className={`proto-workspace__stage is-${tab} tool-${tool}`} tabIndex={0} aria-label="Infinite canvas"
        onPointerDown={event => { if (!event.currentTarget.contains(event.target as Node)) return; if (event.button === 2) return; if (event.target === event.currentTarget) setSelected(null); if (tool !== 'pan' && event.button !== 1 && event.target !== event.currentTarget) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, left: offset.x, top: offset.y }; }}
        onPointerMove={event => { const screen = screenDrag.current; if (screen) { const dx = (event.clientX - screen.x) / zoom; const dy = (event.clientY - screen.y) / zoom; setGeometry(value => ({ ...value, [screen.name]: { x: screen.left + (screen.resize ? 0 : dx), y: screen.top + (screen.resize ? 0 : dy), width: Math.max(320, screen.width + (screen.resize ? dx : 0)), height: Math.max(240, screen.height + (screen.resize ? dy : 0)) } })); } if (drag.current) setOffset({ x: drag.current.left + event.clientX - drag.current.x, y: drag.current.top + event.clientY - drag.current.y }); }}
        onPointerUp={() => { drag.current = null; commitGeometry(); }} onPointerCancel={() => { drag.current = null; }}>
        {visible.length ? <div className="proto-workspace__world" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
          {(tab === 'preview' ? (current ? [current] : []) : visible).map((file, index) => <article key={file.boardId} data-frame-id={file.boardId} aria-label={`Screen ${aliases[file.boardId] || file.name}`} className={`proto-workspace__screen${selected === file.boardId ? ' is-selected' : ''}`} style={{ left: frameGeometry(file.boardId, index).x, top: frameGeometry(file.boardId, index).y, width: frameGeometry(file.boardId, index).width, height: frameGeometry(file.boardId, index).height }} onContextMenu={event => { event.preventDefault(); setSelected(file.boardId); setMenu({ x: Math.min(event.clientX, window.innerWidth - 210), y: Math.min(event.clientY, window.innerHeight - 200) }); }} onPointerDown={event => { if (!event.currentTarget.contains(event.target as Node)) return; setSelected(file.boardId); if (!dev && event.button === 0 && tab === 'canvas' && tool === 'select') { event.currentTarget.setPointerCapture(event.pointerId); const g = frameGeometry(file.boardId, index); screenDrag.current = { name: file.boardId, x: event.clientX, y: event.clientY, left: g?.x ?? index * 1280, top: g?.y ?? 0, width: g?.width ?? 1024, height: g?.height ?? 768, resize: false }; } }}>
            <div className="proto-workspace__screen-label"><Icon name="play" size={18} /><strong>{aliases[file.boardId] || responsiveName(frameGeometry(file.boardId, index).width)}</strong><span>{Math.round(frameGeometry(file.boardId, index).width)}</span></div>
            <div className="proto-workspace__render"><FileViewer {...viewerProps} onInspectTargetChange={current?.boardId === file.boardId ? setInspected : undefined} workspaceView={{ inspect: dev, inspectSelection: inspected?.selector ?? null, mode: viewMode, viewport: responsiveName(frameGeometry(file.boardId, index).width).toLowerCase() as typeof viewport }} workspaceActive={current?.boardId === file.boardId} shareRequest={current?.boardId === file.boardId ? viewerProps?.shareRequest : null} downloadRequest={current?.boardId === file.boardId ? viewerProps?.downloadRequest : null} commentPortalId={`proto-comments-${projectId}`} projectId={projectId} projectKind="prototype" file={file} filesRefreshKey={revision} onFileSaved={onRefresh} />{!dev && viewMode === 'preview' && tab === 'canvas' && (tool === 'select' || tool === 'pan') && <div className="proto-workspace__shield" aria-label="Static design screen" />}</div>
            {tab === 'canvas' && !readOnly && <button className="proto-workspace__resize" aria-label={`Resize ${file.name}`} onPointerDown={event => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); const g = frameGeometry(file.boardId, index); screenDrag.current = { name: file.boardId, x: event.clientX, y: event.clientY, left: g?.x ?? index * 1280, top: g?.y ?? 0, width: g?.width ?? 1024, height: g?.height ?? 768, resize: true }; }} />}
          </article>)}
        </div> : <div className="proto-workspace__empty"><strong>{tab === 'canvas' ? 'Your design starts here' : busy ? 'Creating your prototype' : 'Bring your design to life'}</strong><p>{tab === 'canvas' ? 'Add a brief or reference in chat. Ask your agent to create static screens.' : busy ? 'New prototype revisions will appear here when the agent finishes.' : 'Create static screens in Canvas, then choose Create prototype.'}</p></div>}
        <div className="proto-workspace__dock" onPointerDown={event => event.stopPropagation()}>
          {(['select', 'pan', 'comment', 'edit'] as const).map(item => <button key={item} aria-label={({ select: 'Select', pan: 'Hand', comment: 'Comment', edit: 'Edit' })[item]} title={({ select: 'Select', pan: 'Hand', comment: 'Comment', edit: 'Edit' })[item]} aria-pressed={tool === item} disabled={item === 'edit' && readOnly} onClick={event => { setTool(item); if (item === 'comment') setPanel('comments'); const root = event.currentTarget.closest('.proto-workspace'); const selector = item === 'edit' ? '[data-testid=manual-edit-mode-toggle]' : item === 'comment' ? '[data-testid=comment-panel-toggle]' : null; if (selector) (root?.querySelector(`.proto-workspace__screen.is-selected ${selector}`) as HTMLButtonElement | null)?.click(); }}>{item === 'select' || item === 'pan' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item === 'select' ? <path d="m4 3 16 8-7 2-3 8L4 3Z" /> : <path d="M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 4-2.5 6-6 6h-1c-2 0-3.5-1-5-3l-4-5a1.5 1.5 0 0 1 2-2l2 2Z" />}</svg> : <Icon name={item === 'comment' ? 'comment' : 'pencil'} size={20} />}</button>)}
          <span className="proto-workspace__divider" />
          <div className={styles.modeSwitch} role="group" aria-label="Workspace mode"><button aria-label="View mode" title="View mode" aria-pressed={!dev} onClick={() => { setDev(false); setViewMode('preview'); setInspected(null); }}><Icon name="layout" size={18} /></button><button aria-label="Dev mode" title="Dev mode" aria-pressed={dev} onClick={() => { setDev(true); setViewMode('preview'); setPropertiesCollapsed(false); setInspected(null); }}><Icon name="file-code" size={18} /></button></div>
          <div className={styles.zoomControl} data-board-menu>
            <button aria-label="Zoom options" aria-haspopup="menu" aria-expanded={zoomMenu} onClick={() => setZoomMenu(!zoomMenu)}>{Math.round(zoom * 100)}%<Icon name="chevron-down" size={14} /></button>
            {zoomMenu && <div role="menu" aria-label="Zoom" className={styles.zoomMenu}>
              <div className={styles.menuHeading}>Zoom</div>
              <button role="menuitem" onClick={() => { zoomAt(zoom * 1.2); setZoomMenu(false); }}>Zoom in <kbd>⌘ +</kbd></button>
              <button role="menuitem" onClick={() => { zoomAt(zoom / 1.2); setZoomMenu(false); }}>Zoom out <kbd>⌘ −</kbd></button>
              <hr /><button role="menuitem" onClick={() => { zoomAt(1); setZoomMenu(false); }}>Zoom to 100% <kbd>⌘ 0</kbd></button>
              <button role="menuitem" onClick={() => { fit(); setZoomMenu(false); }}>Zoom to fit <kbd>⌘ 1</kbd></button>
              <button role="menuitem" disabled={!selected} onClick={() => { fit(true); setZoomMenu(false); }}>Zoom to selection <kbd>⌘ 2</kbd></button>
              <hr /><button role="menuitemcheckbox" aria-checked={fastZoom} onClick={() => setFastZoom(!fastZoom)}>Fast zoom <span>{fastZoom ? '✓' : ''}</span></button>
            </div>}
          </div>
        </div>
      </div>
      <aside id={`flows-${projectId}`} className="proto-workspace__inspector" hidden={sidebarCollapsed}>
        <div className={styles.sidebarHeader}><strong>{projectName || 'Untitled project'}</strong><button type="button" aria-label="Collapse sidebar" title="Collapse sidebar" aria-controls={`flows-${projectId}`} aria-expanded={true} onClick={() => setSidebarCollapsed(true)}><Icon name="panel-left" size={18} /></button></div>
        <div className="proto-workspace__panel-tabs" role="tablist" aria-label="Project navigation"><button role="tab" aria-selected={panel === 'pages'} onClick={() => setPanel('pages')}>Flows</button><button role="tab" aria-selected={panel === 'comments'} onClick={() => setPanel('comments')}>Comment</button></div>
        {panel === 'pages' ? <><div className="proto-workspace__section-label">{tab === 'canvas' ? 'Design screens' : 'Prototype revisions'}<span>{visible.length}</span></div>{visible.map((file, index) => <button key={file.boardId} className="proto-workspace__page" aria-current={selected === file.boardId ? 'page' : undefined} onClick={() => { setSelected(file.boardId); const g = frameGeometry(file.boardId, index); setOffset({ x: (sidebarCollapsed ? 80 : 280) - g.x * zoom, y: 140 - g.y * zoom }); }}><span className="proto-workspace__page-icon">▤</span><span>{aliases[file.boardId] || file.name.replace(/^prototypes\//, '')}</span></button>)}{!visible.length && <p className="proto-workspace__hint">{tab === 'canvas' ? 'Screens created by your agent appear here.' : 'Each generated revision appears here.'}</p>}</> : <div className="proto-workspace__comments"><p className="proto-workspace__hint">Select a screen and use its comment button to pin feedback.</p><div id={`proto-comments-${projectId}`} /></div>}
      </aside>
    </div>
    {menu && <div role="menu" aria-label="Screen actions" data-board-menu className={styles.contextMenu} style={{ left: menu.x, top: menu.y }} onPointerDown={event => event.stopPropagation()}>
      <button role="menuitem" onClick={copyFrame}>Copy</button>
      <button role="menuitem" disabled={!clipboard.current || readOnly} onClick={pasteFrame}>Paste</button>
      <hr /><button role="menuitem" disabled={readOnly} onClick={() => { setRenaming(current?.boardId ?? null); setMenu(null); }}>Rename</button>
      <button role="menuitem" disabled={readOnly} onClick={() => { if (current) setHidden(old => [...old, current.boardId]); setSelected(null); setMenu(null); }}>Delete</button>
    </div>}
    {renaming && <div className={styles.renameBackdrop}><form role="dialog" aria-label="Rename screen" className={styles.renameDialog} onSubmit={event => { event.preventDefault(); const input = new FormData(event.currentTarget).get('name')?.toString().trim(); if (input) setAliases(old => ({ ...old, [renaming]: input })); setRenaming(null); }}><label>Screen name<input autoFocus name="name" defaultValue={aliases[renaming] || responsiveName(frameGeometry(renaming).width)} required maxLength={80} /></label><div><button type="button" onClick={() => setRenaming(null)}>Cancel</button><button type="submit">Save</button></div></form></div>}
  </section>;
}
