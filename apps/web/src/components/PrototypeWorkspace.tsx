import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import type { ProjectFile } from '../types';
import { FileViewer } from './FileViewer';
import { APP_CHROME_FILE_ACTIONS_ID } from './AppChromeHeader';
import './PrototypeWorkspace.css';

interface Props {
  projectId: string;
  projectName?: string;
  presence?: ReactNode;
  files: ProjectFile[];
  revision: number;
  busy?: boolean;
  readOnly?: boolean;
  onCreatePrototype: (prompt: string) => Promise<boolean>;
  onRefresh: () => void;
  viewerProps?: Partial<ComponentProps<typeof FileViewer>>;
}

/** Design remains a non-interactive board; prototype revisions are separate files. */
export function PrototypeWorkspace({ projectId, projectName, files, revision, busy, readOnly, onCreatePrototype, onRefresh, viewerProps, presence }: Props) {
  const [tab, setTab] = useState<'canvas' | 'preview'>('canvas');
  const [panel, setPanel] = useState<'pages' | 'comments'>('pages');
  const [tool, setTool] = useState<'select' | 'pan' | 'edit' | 'comment'>('select');
  const [dev, setDev] = useState(false);
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
  const visible = tab === 'canvas' ? pages : prototypes;
  const current = visible.find(file => file.name === selected) ?? visible[0];
  useEffect(() => { setTab('canvas'); setSelected(null); setOffset({ x: 48, y: 56 }); }, [projectId]);
  useEffect(() => { try { setGeometry(JSON.parse(localStorage.getItem(`proto-board:${projectId}`) || '{}')); } catch { setGeometry({}); } }, [projectId]);
  function commitGeometry() { screenDrag.current = null; try { localStorage.setItem(`proto-board:${projectId}`, JSON.stringify(geometry)); } catch { /* Board remains usable when browser storage is unavailable. */ } }
  async function createPrototype() {
    if (creating || busy || readOnly || !pages.length) return;
    setCreating(true); setError('');
    try {
      const accepted = await onCreatePrototype(`Create a working interactive prototype from the current static design screens: ${pages.map(p => p.name).join(', ')}. Preserve all original design files unchanged. Write the interactive entry and its supporting files into a NEW unique revision folder under prototypes/ (for example prototypes/revision-<timestamp>/index.html). Implement the intended navigation and interactions using the applied design system. Do not overwrite earlier prototype revisions.`);
      if (accepted) { setTab('preview'); setSelected(null); } else setError('Could not start. Check the agent connection and try again.');
    } catch { setError('Could not create prototype. Try again.'); }
    finally { setCreating(false); }
  }
  return <section className="proto-workspace" aria-label="Project workspace">
    <header className="proto-workspace__bar">
      <div className="proto-workspace__identity"><strong>{projectName || 'Untitled project'}</strong><span role="status">{busy ? 'Agent working…' : 'Saved'} · revision {prototypes.length}</span></div>
      <div className="proto-workspace__tabs" role="tablist" aria-label="Project mode">
        {(['canvas', 'preview'] as const).map(mode => <button key={mode} role="tab" aria-selected={tab === mode} onClick={() => { setTab(mode); setSelected(null); }}>{mode === 'canvas' ? 'Canvas' : 'Preview'}</button>)}
      </div>
      {presence}
      <div id={APP_CHROME_FILE_ACTIONS_ID} className="proto-workspace__publish" />
      <button className="proto-workspace__create" disabled={busy || creating || readOnly || !pages.length} onClick={() => void createPrototype()}>{busy || creating ? 'Creating…' : 'Create prototype'}</button>
    </header>
    {error && <div role="alert" className="proto-workspace__error">{error}</div>}
    <div className="proto-workspace__body">
      <div className={`proto-workspace__stage is-${tab} tool-${tool}`} tabIndex={0} aria-label="Infinite canvas"
        onWheel={event => { event.preventDefault(); if (event.ctrlKey || event.metaKey) setZoom(value => Math.min(2, Math.max(.1, value * Math.exp(-event.deltaY * .002)))); else setOffset(value => ({ x: value.x - event.deltaX, y: value.y - event.deltaY })); }}
        onPointerDown={event => { if (tool !== 'pan' && event.button !== 1 && event.target !== event.currentTarget) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, left: offset.x, top: offset.y }; }}
        onPointerMove={event => { const screen = screenDrag.current; if (screen) { const dx = (event.clientX - screen.x) / zoom; const dy = (event.clientY - screen.y) / zoom; setGeometry(value => ({ ...value, [screen.name]: { x: screen.left + (screen.resize ? 0 : dx), y: screen.top + (screen.resize ? 0 : dy), width: Math.max(320, screen.width + (screen.resize ? dx : 0)), height: Math.max(240, screen.height + (screen.resize ? dy : 0)) } })); } if (drag.current) setOffset({ x: drag.current.left + event.clientX - drag.current.x, y: drag.current.top + event.clientY - drag.current.y }); }}
        onPointerUp={() => { drag.current = null; commitGeometry(); }} onPointerCancel={() => { drag.current = null; }}>
        {visible.length ? <div className="proto-workspace__world" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
          {(tab === 'preview' ? (current ? [current] : []) : visible).map((file, index) => <article key={file.name} className={`proto-workspace__screen${current?.name === file.name ? ' is-selected' : ''}`} style={{ left: tab === 'canvas' ? geometry[file.name]?.x ?? index * 1080 : 0, top: geometry[file.name]?.y ?? 0, width: geometry[file.name]?.width ?? 1024, height: geometry[file.name]?.height ?? 768 }} onPointerDown={event => { setSelected(file.name); if (tab === 'canvas' && tool === 'select') { event.currentTarget.setPointerCapture(event.pointerId); const g = geometry[file.name]; screenDrag.current = { name: file.name, x: event.clientX, y: event.clientY, left: g?.x ?? index * 1080, top: g?.y ?? 0, width: g?.width ?? 1024, height: g?.height ?? 768, resize: false }; } }}>
            <div className="proto-workspace__screen-label">{file.name}{dev && <span>1024 × 768 · HTML</span>}</div>
            <div className="proto-workspace__render"><FileViewer {...viewerProps} workspaceActive={current?.name === file.name} shareRequest={current?.name === file.name ? viewerProps?.shareRequest : null} downloadRequest={current?.name === file.name ? viewerProps?.downloadRequest : null} commentPortalId={`proto-comments-${projectId}`} projectId={projectId} projectKind="prototype" file={file} filesRefreshKey={revision} onFileSaved={onRefresh} />{tab === 'canvas' && (tool === 'select' || tool === 'pan') && <div className="proto-workspace__shield" aria-label="Static design screen" />}</div>
            {tab === 'canvas' && !readOnly && <button className="proto-workspace__resize" aria-label={`Resize ${file.name}`} onPointerDown={event => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); const g = geometry[file.name]; screenDrag.current = { name: file.name, x: event.clientX, y: event.clientY, left: g?.x ?? index * 1080, top: g?.y ?? 0, width: g?.width ?? 1024, height: g?.height ?? 768, resize: true }; }} />}
          </article>)}
        </div> : <div className="proto-workspace__empty"><strong>{tab === 'canvas' ? 'Your design starts here' : busy ? 'Creating your prototype' : 'Bring your design to life'}</strong><p>{tab === 'canvas' ? 'Add a brief or reference in chat. Ask your agent to create static screens.' : busy ? 'New prototype revisions will appear here when the agent finishes.' : 'Create static screens in Canvas, then choose Create prototype.'}</p></div>}
        <div className="proto-workspace__dock" onPointerDown={event => event.stopPropagation()}>
          {(['select', 'pan', 'comment', 'edit'] as const).map(item => <button key={item} aria-pressed={tool === item} disabled={item === 'edit' && readOnly} onClick={event => { setTool(item); if (item === 'comment') setPanel('comments'); const root = event.currentTarget.closest('.proto-workspace'); const selector = item === 'edit' ? '[data-testid=manual-edit-mode-toggle]' : item === 'comment' ? '[data-testid=comment-panel-toggle]' : null; if (selector) (root?.querySelector(`.proto-workspace__screen.is-selected ${selector}`) as HTMLButtonElement | null)?.click(); }}>{({ select: 'Select', pan: 'Hand', comment: 'Comment', edit: 'Edit' })[item]}</button>)}
          <span className="proto-workspace__divider" />
          <button aria-pressed={dev} onClick={() => setDev(!dev)}>{dev ? 'Dev mode' : 'View mode'}</button>
          <button aria-label="Zoom out" onClick={() => setZoom(v => Math.max(.1, v - .1))}>−</button><button onClick={() => { setZoom(.65); setOffset({ x: 48, y: 56 }); }} title="Reset canvas">{Math.round(zoom * 100)}%</button><button aria-label="Zoom in" onClick={() => setZoom(v => Math.min(2, v + .1))}>+</button>
        </div>
      </div>
      <aside className="proto-workspace__inspector">
        <div className="proto-workspace__panel-tabs" role="tablist" aria-label="Project navigation"><button role="tab" aria-selected={panel === 'pages'} onClick={() => setPanel('pages')}>Pages / Flows</button><button role="tab" aria-selected={panel === 'comments'} onClick={() => setPanel('comments')}>Comment</button></div>
        {panel === 'pages' ? <><div className="proto-workspace__section-label">{tab === 'canvas' ? 'Design screens' : 'Prototype revisions'}<span>{visible.length}</span></div>{visible.map((file, index) => <button key={file.name} className="proto-workspace__page" aria-current={current?.name === file.name ? 'page' : undefined} onClick={() => { setSelected(file.name); setOffset({ x: 48 - (tab === 'canvas' ? index * 1080 * zoom : 0), y: 56 }); }}><span className="proto-workspace__page-icon">▤</span><span>{file.name.replace(/^prototypes\//, '')}</span></button>)}{!visible.length && <p className="proto-workspace__hint">{tab === 'canvas' ? 'Screens created by your agent appear here.' : 'Each generated revision appears here.'}</p>}</> : <div className="proto-workspace__comments"><p className="proto-workspace__hint">Select a screen and use its comment button to pin feedback.</p><div id={`proto-comments-${projectId}`} /></div>}
      </aside>
    </div>
  </section>;
}
