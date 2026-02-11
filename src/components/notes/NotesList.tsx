'use client';

import { useState, useRef, useEffect } from 'react';
import type { Note } from '@/lib/types';

interface NotesListProps {
  notes: Note[];
  onToggleDone: (id: string, done: boolean) => void;
  onAddReply: (noteId: string, text: string) => Promise<void>;
  onEditNote: (noteId: string, text: string) => Promise<void>;
  onEditReply: (noteId: string, replyIndex: number, text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onDeleteReply: (noteId: string, replyIndex: number) => Promise<void>;
  onToggleTag: (noteId: string, tag: string) => Promise<void>;
}

export function NotesList({ notes, onToggleDone, onAddReply, onEditNote, onEditReply, onDeleteNote, onDeleteReply, onToggleTag }: NotesListProps): React.ReactElement {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<{ noteId: string; index: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyingTo && replyInputRef.current) replyInputRef.current.focus();
  }, [replyingTo]);

  useEffect(() => {
    if ((editingNote || editingReply) && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.selectionStart = editTextareaRef.current.value.length;
    }
  }, [editingNote, editingReply]);

  async function handleToggle(note: Note): Promise<void> {
    setTogglingId(note.id);
    try {
      await onToggleDone(note.id, !note.done);
    } finally {
      setTogglingId(null);
    }
  }

  function toggleReplies(noteId: string): void {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }

  async function handleSubmitReply(noteId: string): Promise<void> {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddReply(noteId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
      // Auto-expand replies
      setExpandedReplies((prev) => new Set(prev).add(noteId));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEditNote(noteId: string): Promise<void> {
    if (!editText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onEditNote(noteId, editText.trim());
      setEditingNote(null);
      setEditText('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEditReply(noteId: string, replyIndex: number): Promise<void> {
    if (!editText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onEditReply(noteId, replyIndex, editText.trim());
      setEditingReply(null);
      setEditText('');
    } finally {
      setSubmitting(false);
    }
  }

  function startEditNote(note: Note): void {
    setEditingNote(note.id);
    setEditingReply(null);
    setEditText(note.text);
  }

  function startEditReply(noteId: string, index: number, text: string): void {
    setEditingReply({ noteId, index });
    setEditingNote(null);
    setEditText(text);
  }

  function cancelEdit(): void {
    setEditingNote(null);
    setEditingReply(null);
    setEditText('');
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatReplyDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <span className="text-4xl mb-4">📝</span>
        <p>No notes yet</p>
        <p className="text-sm mt-1">Click &quot;Add Note&quot; to create one</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const hasReplies = note.replies && note.replies.length > 0;
        const isExpanded = expandedReplies.has(note.id);
        const isEditingThis = editingNote === note.id;

        return (
          <li
            key={note.id}
            className="group bg-surface-raised/60 backdrop-blur-sm border border-border rounded-xl p-4 transition-all hover:border-accent/30 hover:bg-surface-raised/80"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleToggle(note)}
                disabled={togglingId === note.id}
                className={`
                  mt-0.5 w-6 h-6 min-w-[24px] rounded border-2 flex items-center justify-center
                  transition-all duration-200 flex-shrink-0 active:scale-90
                  ${note.done
                    ? 'bg-accent border-accent text-background'
                    : 'border-text-muted hover:border-accent'
                  }
                  ${togglingId === note.id ? 'opacity-50' : ''}
                `}
                aria-label={note.done ? 'Mark as undone' : 'Mark as done'}
              >
                {note.done && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                {isEditingThis ? (
                  <div>
                    <textarea
                      ref={editTextareaRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg p-2 text-foreground text-sm resize-none focus:outline-none focus:border-accent"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEditNote(note.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleSaveEditNote(note.id)}
                        disabled={submitting || !editText.trim()}
                        className="px-3 py-1 min-h-[32px] text-xs rounded-md bg-accent text-background font-medium hover:bg-accent-dim disabled:opacity-50 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 min-h-[32px] text-xs rounded-md border border-border text-text-muted hover:text-foreground transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group/note">
                    <p 
                      className={`leading-relaxed whitespace-pre-wrap break-words ${note.done ? 'text-text-muted/40' : 'text-foreground'} ${!expandedNotes.has(note.id) ? 'line-clamp-4' : ''}`}
                    >
                      {note.text}
                    </p>
                    {note.text.length > 200 && (
                      <button
                        onClick={() => setExpandedNotes((prev) => {
                          const next = new Set(prev);
                          if (next.has(note.id)) next.delete(note.id);
                          else next.add(note.id);
                          return next;
                        })}
                        className="text-xs text-accent hover:text-accent/80 mt-1 transition-colors"
                      >
                        {expandedNotes.has(note.id) ? 'Show less' : 'Expand'}
                      </button>
                    )}
                    <div className="absolute -right-1 -top-1 flex gap-0.5 opacity-0 group-hover/note:opacity-100 transition-all">
                      <button
                        onClick={() => startEditNote(note)}
                        className="p-1 rounded text-text-muted hover:text-accent transition-all"
                        aria-label="Edit note"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 rounded text-text-muted hover:text-red-400 transition-all"
                        aria-label="Delete note"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <p className="text-xs text-text-muted">
                    {formatDate(note.createdAt)}
                    {note.updatedAt && <span className="ml-1 text-text-muted/60">(edited)</span>}
                  </p>
                  {note.tags?.includes('discuss') && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/15 text-accent border border-accent/30">
                      🗣️ Discuss
                    </span>
                  )}
                  <button
                    onClick={() => onToggleTag(note.id, 'discuss')}
                    className={`text-xs transition-colors ${
                      note.tags?.includes('discuss')
                        ? 'text-accent hover:text-accent/70'
                        : 'text-text-muted hover:text-accent'
                    }`}
                    title={note.tags?.includes('discuss') ? 'Remove from discussion' : 'Mark for discussion'}
                  >
                    {note.tags?.includes('discuss') ? '✕ discuss' : '+ discuss'}
                  </button>
                  {hasReplies && (
                    <button
                      onClick={() => toggleReplies(note.id)}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      {note.replies?.length} {note.replies?.length === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === note.id ? null : note.id);
                      setReplyText('');
                      if (!expandedReplies.has(note.id) && hasReplies) {
                        setExpandedReplies((prev) => new Set(prev).add(note.id));
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply
                  </button>
                </div>

                {/* Replies Section */}
                {hasReplies && isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                    {note.replies?.map((reply, idx) => {
                      const isEditingThisReply = editingReply?.noteId === note.id && editingReply?.index === idx;
                      return (
                        <div key={idx} className={`pl-3 border-l-2 group/reply relative ${reply.from === 'aaron' ? 'border-blue-400/40' : 'border-accent/40'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium capitalize ${reply.from === 'aaron' ? 'text-blue-400' : 'text-accent'}`}>
                              {reply.from}
                            </span>
                            <span className="text-xs text-text-muted">
                              {formatReplyDate(reply.at)}
                              {reply.updatedAt && <span className="ml-1 text-text-muted/60">(edited)</span>}
                            </span>
                          </div>
                          {isEditingThisReply ? (
                            <div>
                              <textarea
                                ref={editTextareaRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-surface border border-border rounded-lg p-2 text-foreground text-sm resize-none focus:outline-none focus:border-accent"
                                rows={2}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEditReply(note.id, idx);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                              />
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => handleSaveEditReply(note.id, idx)}
                                  disabled={submitting || !editText.trim()}
                                  className="px-3 py-1 min-h-[32px] text-xs rounded-md bg-accent text-background font-medium hover:bg-accent-dim disabled:opacity-50 transition-all"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1 min-h-[32px] text-xs rounded-md border border-border text-text-muted hover:text-foreground transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative group/replytext">
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                                {reply.text}
                              </p>
                              <div className="absolute -right-1 -top-1 flex gap-0.5 opacity-0 group-hover/replytext:opacity-100 transition-all">
                                <button
                                  onClick={() => startEditReply(note.id, idx, reply.text)}
                                  className="p-1 rounded text-text-muted hover:text-accent transition-all"
                                  aria-label="Edit reply"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => onDeleteReply(note.id, idx)}
                                  className="p-1 rounded text-text-muted hover:text-red-400 transition-all"
                                  aria-label="Delete reply"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === note.id && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <textarea
                      ref={replyInputRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSubmitReply(note.id);
                        }
                        if (e.key === 'Escape') {
                          setReplyingTo(null);
                          setReplyText('');
                        }
                      }}
                      placeholder="Write a reply... (⌘+Enter to send)"
                      rows={3}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-3 py-1.5 min-h-[36px] text-xs rounded-md border border-border text-text-muted hover:text-foreground transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitReply(note.id)}
                        disabled={submitting || !replyText.trim()}
                        className="px-4 py-1.5 min-h-[36px] text-xs rounded-md bg-accent text-background font-medium hover:bg-accent-dim disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {submitting ? 'Sending...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
