// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BoardComposerPopover } from '../../src/components/BoardComposerPopover';
import type { PreviewComment } from '../../src/types';
afterEach(cleanup);
it('shows persisted replies and stages context without invoking Reply', () => {
  const save=vi.fn(), add=vi.fn();
  const root: PreviewComment={id:'root',projectId:'p',conversationId:'c',filePath:'index.html',elementId:'hero',selector:'#hero',label:'Hero',text:'',position:{x:10,y:20,width:200,height:80},htmlHint:'',note:'Make this larger',status:'open',createdAt:1,updatedAt:1};
  render(<BoardComposerPopover target={root} existing={root} replies={[{...root,id:'reply',parentCommentId:'root',note:'Increase it by 8px',authorDisplayName:'Designer'}]} draft="" notes={[]} onDraft={()=>{}} onAddDraft={()=>{}} onRemoveQueuedNote={()=>{}} onClose={()=>{}} onSaveComment={save} onSendBatch={add} onRemoveMember={()=>{}} sending={false} t={((key:string)=>key) as never} />);
  expect(screen.getByText('Make this larger')).toBeVisible();
  expect(screen.getByText('Increase it by 8px')).toBeVisible();
  expect(screen.getByRole('button',{name:'Reply'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Add to chat'}));
  expect(add).toHaveBeenCalledOnce();
  expect(save).not.toHaveBeenCalled();
});
