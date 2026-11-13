import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';
import { RemixIcon } from './RemixIcon';
import styles from './ResponsiveDevicePicker.module.css';

export type ResponsiveDevice = 'desktop' | 'tablet' | 'mobile';
const devices = [
  { id: 'desktop', label: 'Desktop', icon: 'computer-line', width: 1200 },
  { id: 'tablet', label: 'Tablet', icon: 'tablet-line', width: 810 },
  { id: 'mobile', label: 'Mobile', icon: 'smartphone-line', width: 390 },
] as const;

export function ResponsiveDevicePicker({ value, onChange }: { value: ResponsiveDevice; onChange: (device: ResponsiveDevice, width: number) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();
  const current = devices.find(device => device.id === value) ?? devices[0];
  const filtered = devices.filter(device => device.label.toLowerCase().includes(search.trim().toLowerCase()));
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <div ref={root} className={styles.root} onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); } }}>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={`Preview device: ${current.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} onClick={() => { setSearch(''); setOpen(!open); }} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setSearch(''); setOpen(true); } }}>
      <RemixIcon name={current.icon} size={18} /><span>{current.label}</span><Icon name="chevron-down" size={12} />
    </button>
    {open && <div className={styles.popover}>
      <div className={styles.search}><Icon name="search" size={17} /><input ref={input} aria-label="Search devices" placeholder="Search devices" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); options.current[event.key === 'ArrowDown' ? 0 : filtered.length - 1]?.focus(); } }} /></div>
      <div id={listId} role="listbox" aria-label="Responsive device" className={styles.list}>
        {filtered.map((device, index) => <button key={device.id} ref={element => { options.current[index] = element; }} type="button" role="option" aria-selected={device.id === value} className={styles.option} onClick={() => { onChange(device.id, device.width); close(); }} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); options.current[(index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % filtered.length]?.focus(); } if (event.key === 'Home') { event.preventDefault(); options.current[0]?.focus(); } if (event.key === 'End') { event.preventDefault(); options.current[filtered.length - 1]?.focus(); } }}>
          <RemixIcon name={device.icon} size={18} /><span>{device.label}</span><span className={styles.width}>{device.width}</span><span className={styles.check}>{device.id === value && <Icon name="check" size={16} />}</span>
        </button>)}
      </div>
      {!filtered.length && <p className={styles.empty} role="status">No matching devices</p>}
    </div>}
  </div>;
}
