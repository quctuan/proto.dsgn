import { useEffect, useState } from 'react';
import type { PreviewComment } from '../types';
import { Icon } from './Icon';

export function ReviewThread({ comments, canEdit, canDelete, onEdit, onDelete }: {
  comments: PreviewComment[]; canEdit: boolean; canDelete: boolean;
  onEdit?: (comment: PreviewComment, note: string) => Promise<unknown>;
  onDelete?: (id: string) => void | Promise<unknown>;
}) {
  const [menu, setMenu] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!menu) return;
    const dismiss = (event: PointerEvent) => { if (!(event.target as Element).closest('.review-thread-menu')) setMenu(null); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [menu]);
  async function edit(comment: PreviewComment) {
    if (!text.trim() || !onEdit) return;
    setBusy(true); setError('');
    try { const saved = await onEdit(comment, text.trim()); if (!saved) throw new Error(); setEditing(null); }
    catch { setError('Could not save comment. Try again.'); }
    finally { setBusy(false); }
  }
  return <div className="review-thread-messages">{comments.map(comment => <article className="review-thread-message" key={comment.id}>
    <span className="review-thread-avatar" aria-hidden="true">{(comment.authorDisplayName || 'You').trim().slice(0, 1).toUpperCase()}</span>
    <div className="review-thread-content"><div className="review-thread-meta"><strong>{comment.authorDisplayName || 'You'}</strong><time title={new Date(comment.createdAt).toLocaleString()}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
      {(canEdit || canDelete) && <div className="review-thread-menu"><button type="button" aria-label="Comment actions" aria-expanded={menu === comment.id} onClick={() => setMenu(menu === comment.id ? null : comment.id)}>···</button>{menu === comment.id && <div role="menu">{canEdit && onEdit && <button type="button" role="menuitem" onClick={() => { setEditing(comment.id); setText(comment.note); setMenu(null); }}><Icon name="pencil" size={16} />Edit</button>}{canDelete && onDelete && <button type="button" role="menuitem" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onDelete(comment.id); setMenu(null); } catch { setError('Could not delete comment.'); } finally { setBusy(false); } }}><Icon name="trash" size={16} />Delete</button>}</div>}</div>}
    </div>{editing === comment.id ? <div className="review-thread-edit"><textarea aria-label="Edit comment" value={text} onChange={event => setText(event.target.value)} autoFocus onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setEditing(null); } if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void edit(comment); } }} /><div><button aria-label="Cancel edit" onClick={() => setEditing(null)}><Icon name="close" size={16} /></button><button aria-label="Save edit" disabled={busy || !text.trim()} onClick={() => void edit(comment)}><Icon name="arrow-up" size={16} /></button></div></div> : <p>{comment.note}</p>}</div>
  </article>)}{error && <p role="alert">{error}</p>}</div>;
}
