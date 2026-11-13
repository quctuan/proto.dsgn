import { useState, type ReactNode } from 'react';
import type { InspectTarget, InspectStyleSnapshot } from './FileViewer';
import { Icon } from './Icon';
import styles from './PropertiesPanel.module.css';

type Frame = { x: number; y: number; width: number; height: number };
interface Props {
  target: InspectTarget | null;
  fileName?: string;
  frame: Frame | null;
  onCollapse: () => void;
  onPage: () => void;
}
const groups: { title: string; fields: [keyof InspectStyleSnapshot, string][] }[] = [
  { title: 'Layout', fields: [['display', 'Display'], ['position', 'Position'], ['width', 'Width'], ['height', 'Height'], ['flexDirection', 'Direction'], ['gap', 'Gap'], ['justifyContent', 'Justify'], ['alignItems', 'Align'], ['overflow', 'Overflow']] },
  { title: 'Spacing', fields: [['paddingTop', 'Padding top'], ['paddingRight', 'Padding right'], ['paddingBottom', 'Padding bottom'], ['paddingLeft', 'Padding left'], ['margin', 'Margin']] },
  { title: 'Typography', fields: [['fontFamily', 'Family'], ['fontSize', 'Size'], ['fontWeight', 'Weight'], ['lineHeight', 'Line height'], ['letterSpacing', 'Letter spacing'], ['textAlign', 'Alignment']] },
  { title: 'Appearance', fields: [['color', 'Text color'], ['backgroundColor', 'Fill'], ['border', 'Border'], ['borderRadius', 'Radius'], ['opacity', 'Opacity'], ['boxShadow', 'Shadow'], ['transform', 'Transform']] },
];
function cssName(name: string) { return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`); }
function Row({ label, value, color = false }: { label: string; value: string | number; color?: boolean }) {
  return <div className={styles.row}><dt>{label}</dt><dd>{color && <span className={styles.swatch} style={{ background: String(value) }} />}<span title={String(value)}>{value}</span></dd></div>;
}

function PropertyGroup({ title, children }: { title: string; children: ReactNode }) {
  return <details className={styles.group} open><summary>{title}<Icon name="chevron-down" size={14} /></summary><div className={styles.groupBody}>{children}</div></details>;
}

/** Read-only developer handoff. Values originate from the preview selection bridge. */
export function PropertiesPanel({ target, fileName, frame, onCollapse, onPage }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const style = target?.style;
  const css = style ? Object.entries(style).filter(([, value]) => typeof value === 'string' && value).map(([key, value]) => `  ${cssName(key)}: ${value};`).join('\n') : '';
  const code = target ? `${target.selector} {\n${css}\n}` : frame ? `/* ${fileName} */\nwidth: ${frame.width}px;\nheight: ${frame.height}px;` : '';
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <aside className={styles.panel} aria-label="Properties">
    <header className={styles.header}><strong>Properties</strong><button type="button" aria-label="Collapse properties" onClick={onCollapse}><Icon name="panel-left" size={18} /></button></header>
    <div className={styles.content}>
      <section className={styles.identity}>
        <span className={styles.kind}>{target ? target.componentName ? 'Component' : 'Element' : 'Page / Frame'}</span>
        <strong>{target?.componentName || target?.label || fileName || 'No screen selected'}</strong>
        {target && <><code className={styles.selector}>{target.selector}</code><button className={styles.pageLink} onClick={onPage}>← Page properties</button></>}
        {!target && frame && <p>Click an element on the canvas to inspect its layout and CSS.</p>}
      </section>
      {frame && !target && <PropertyGroup title="Layout"><dl><Row label="Canvas X" value={Math.round(frame.x)} /><Row label="Canvas Y" value={Math.round(frame.y)} /><Row label="Width" value={`${Math.round(frame.width)}px`} /><Row label="Height" value={`${Math.round(frame.height)}px`} /><Row label="Breakpoint" value={frame.width >= 1024 ? 'Desktop' : frame.width >= 600 ? 'Tablet' : 'Mobile'} /></dl></PropertyGroup>}
      {target?.bounds && <PropertyGroup title="Bounds"><dl><Row label="Viewport X" value={`${target.bounds.x}px`} /><Row label="Viewport Y" value={`${target.bounds.y}px`} /><Row label="Width" value={`${target.bounds.width}px`} /><Row label="Height" value={`${target.bounds.height}px`} /></dl></PropertyGroup>}
      {style && groups.map(group => <PropertyGroup key={group.title} title={group.title}><dl>{group.fields.map(([key, label]) => style[key] ? <Row key={key} label={label} value={style[key]!} color={key === 'color' || key === 'backgroundColor'} /> : null)}</dl></PropertyGroup>)}
      {target?.text && <PropertyGroup title="Content"><p className={styles.text}>{target.text}</p></PropertyGroup>}
      {code && <section><div className={styles.codeHeading}><h3>CSS</h3><button onClick={() => void copy()} aria-label="Copy CSS"><Icon name="copy" size={14} />{copied ? 'Copied' : 'Copy'}</button></div><pre><code>{code}</code></pre>{copyError && <p role="status">Copy unavailable. Select the CSS above to copy it.</p>}</section>}
    </div>
  </aside>;
}
