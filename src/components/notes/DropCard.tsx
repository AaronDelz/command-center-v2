'use client';

import { useState } from 'react';
import { GlassCard, EmberButton, GlassPill, GlassSelect } from '@/components/ui';
import { color, typography, animation, radius, glass, shadow } from '@/styles/tokens';
import type { Drop, JournalTag, Reply } from '@/lib/types';

// Unified item that can be either a Drop or a Note
export interface UnifiedItem {
  id: string;
  shortId?: string;
  type: 'note' | 'idea' | 'link' | 'task' | 'file' | 'question' | 'unsorted';
  title?: string;
  content: string;
  url?: string;
  files?: string[];
  status: string;
  createdAt: string;
  tags?: string[];
  source: 'drop' | 'note';
  done?: boolean;
  promotedTo?: string;
  journalTag?: JournalTag;
  archived?: boolean;
  archivedAt?: string;
  seen?: boolean;
  seenAt?: string;
  replies?: Reply[];
}

const JOURNAL_TAG_CONFIG: Record<JournalTag, { icon: string; label: string; color: string; bg: string; border: string }> = {
  discussed: { icon: '📋', label: 'Discussed', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.10)', border: 'rgba(96, 165, 250, 0.25)' },
  decisions: { icon: '⚡', label: 'Decision', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.10)', border: 'rgba(251, 191, 36, 0.25)' },
  built:     { icon: '🔨', label: 'Built', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.10)', border: 'rgba(74, 222, 128, 0.25)' },
  insight:   { icon: '💡', label: 'Insight', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.10)', border: 'rgba(167, 139, 250, 0.25)' },
  open:      { icon: '❓', label: 'Open', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.10)', border: 'rgba(244, 114, 182, 0.25)' },
};

const TYPE_ICONS: Record<string, string> = {
  note: '📝', idea: '💡', link: '🔗', task: '✅', file: '📎', question: '❓', unsorted: '📦',
};

const TYPE_LABELS: Record<string, string> = {
  note: 'Note', idea: 'Idea', link: 'Link', task: 'Task', file: 'File', question: 'Question', unsorted: 'Unsorted',
};

const COLUMN_OPTIONS = [
  { value: 'quick', label: 'Quick Drops' },
  { value: 'questions', label: 'Open Questions' },
  { value: 'parked', label: 'Parked Conversations' },
];

const JOURNAL_TAG_OPTIONS = [
  { value: '', label: 'No Tag' },
  { value: 'discussed', label: '📋 Discussed' },
  { value: 'decisions', label: '⚡ Decisions' },
  { value: 'built', label: '🔨 Built' },
  { value: 'insight', label: '💡 Insight' },
  { value: 'open', label: '❓ Open' },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getColumnForItem(item: UnifiedItem): string {
  if (item.type === 'question' || (item.tags?.includes('discuss') && item.content.includes('?'))) return 'questions';
  if (item.tags?.includes('discuss')) return 'parked';
  return 'quick';
}

interface DropCardProps {
  item: UnifiedItem;
  onPromote?: (item: UnifiedItem) => void;
  onArchive?: (item: UnifiedItem) => void;
  onUpdate?: (item: UnifiedItem) => void;
  showArchiveView?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function DropCard({ item, onPromote, onArchive, onUpdate, showArchiveView, selectionMode, selected, onToggleSelect }: DropCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title || '');
  const [editContent, setEditContent] = useState(item.content);
  const [editColumn, setEditColumn] = useState(getColumnForItem(item));
  const [editTag, setEditTag] = useState<string>(item.journalTag || '');
  const [saving, setSaving] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyAuthor, setReplyAuthor] = useState<'aaron' | 'orion'>('aaron');
  const [sendingReply, setSendingReply] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const icon = TYPE_ICONS[item.type] || '📦';
  const isLink = item.type === 'link' && item.url;
  const isFile = item.type === 'file' && item.files && item.files.length > 0;
  const isPromoted = item.status === 'promoted';
  const isArchived = item.archived;
  const journalConfig = item.journalTag ? JOURNAL_TAG_CONFIG[item.journalTag] : null;
  const replyCount = item.replies?.length || 0;

  async function handleSave() {
    if (!onUpdate || saving) return;
    setSaving(true);
    try {
      // Determine new tags based on column
      const newTags = editColumn === 'parked' ? ['discuss'] : editColumn === 'questions' ? ['discuss'] : undefined;
      const newType = editColumn === 'questions' ? 'question' as const : item.type;

      if (item.source === 'drop') {
        await fetch('/api/drops', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            title: editTitle.trim() || null,
            content: editContent,
            type: newType,
            journalTag: editTag || null,
          }),
        });
      } else {
        await fetch('/api/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            text: editContent,
            tags: newTags,
          }),
        });
      }
      onUpdate({ ...item, title: editTitle.trim() || undefined, content: editContent, type: newType, journalTag: (editTag || undefined) as JournalTag | undefined, tags: newTags });
      setEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveToggle() {
    if (archiving) return;
    setArchiving(true);
    try {
      const newArchived = !item.archived;
      await fetch('/api/drops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, archived: newArchived }),
      });
      onUpdate?.({ ...item, archived: newArchived, archivedAt: newArchived ? new Date().toISOString() : undefined });
    } catch (err) {
      console.error('Archive failed:', err);
    } finally {
      setArchiving(false);
    }
  }

  async function handleReply() {
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      if (item.source === 'drop') {
        const res = await fetch(`/api/drops/${item.id}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: replyText, author: replyAuthor }),
        });
        if (res.ok) {
          const reply = await res.json() as Reply;
          const updatedReplies = [...(item.replies || []), reply];
          onUpdate?.({ ...item, replies: updatedReplies });
          setReplyText('');
        }
      } else {
        // Notes use a different reply format
        const res = await fetch('/api/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            reply: { from: replyAuthor, text: replyText },
          }),
        });
        if (res.ok) {
          const newReply: Reply = {
            id: `reply-${Date.now()}`,
            content: replyText,
            author: replyAuthor,
            createdAt: new Date().toISOString(),
          };
          const updatedReplies = [...(item.replies || []), newReply];
          onUpdate?.({ ...item, replies: updatedReplies });
          setReplyText('');
        }
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <GlassCard
      hover
      padding="sm"
      className={`group ${isPromoted ? 'opacity-60' : ''}`}
      style={{
        position: 'relative',
        ...(selected ? { border: `1.5px solid ${color.ember.DEFAULT}`, boxShadow: '0 0 12px rgba(255, 107, 53, 0.15)' } : {}),
        transition: `all ${animation.duration.slow} ${animation.easing.default}`,
        ...(isArchived && !showArchiveView ? { display: 'none' } : {}),
      }}
    >
      {/* Seen indicator */}
      {item.seen && (
        <span
          title={item.seenAt ? `Seen ${formatRelativeTime(item.seenAt)}` : 'Seen'}
          style={{
            position: 'absolute', top: '6px', right: '8px',
            fontSize: '13px', opacity: 0.7, zIndex: 1,
          }}
        >👁️</span>
      )}
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        {selectionMode && (
          <label className="flex-shrink-0 mt-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected || false}
              onChange={() => onToggleSelect?.(item.id)}
              style={{ width: '16px', height: '16px', accentColor: color.ember.DEFAULT, cursor: 'pointer' }}
            />
          </label>
        )}

        {/* Type icon + Short ID */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
          <span className="text-lg" style={{ filter: isPromoted ? 'grayscale(1)' : 'none' }}>{icon}</span>
          {item.shortId && (
            <span style={{
              fontSize: '9px',
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
              fontFamily: typography.fontFamily.mono,
              letterSpacing: '0.5px',
            }}>
              #{item.shortId}
            </span>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1.5">
            <GlassPill variant={item.type === 'idea' ? 'ember' : 'default'} size="xs">
              {TYPE_LABELS[item.type]}
            </GlassPill>
            {journalConfig && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '2px 8px', borderRadius: '9999px',
                fontSize: typography.fontSize.metadata, fontWeight: typography.fontWeight.medium,
                color: journalConfig.color, background: journalConfig.bg, border: `1px solid ${journalConfig.border}`,
              }}>
                {journalConfig.icon} {journalConfig.label}
              </span>
            )}
            {item.source === 'note' && <GlassPill variant="info" size="xs">Note</GlassPill>}
            {item.tags?.includes('discuss') && <GlassPill variant="warning" size="xs">🗣️ Discuss</GlassPill>}
            {isPromoted && <GlassPill variant="success" size="xs">Promoted</GlassPill>}
            {replyCount > 0 && (
              <span style={{ fontSize: typography.fontSize.metadata, color: color.text.secondary }}>
                💬 {replyCount}
              </span>
            )}
            <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, marginLeft: 'auto', flexShrink: 0 }}>
              {formatRelativeTime(item.createdAt)}
            </span>
          </div>

          {/* Content text */}
          {editing ? (
            <div className="flex flex-col gap-3 mt-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title (optional)"
                style={{
                  width: '100%',
                  background: color.bg.surface, backdropFilter: glass.blur.card,
                  border: `1.5px solid ${color.glass.borderFocus}`, borderRadius: radius.lg,
                  color: color.text.primary, fontFamily: typography.fontFamily.body,
                  fontSize: '1rem', fontWeight: typography.fontWeight.semibold,
                  padding: '8px 14px', outline: 'none',
                  boxShadow: `${shadow.innerShine}, 0 0 12px rgba(255, 107, 53, 0.12)`,
                }}
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                style={{
                  width: '100%', resize: 'vertical',
                  background: color.bg.surface, backdropFilter: glass.blur.card,
                  border: `1.5px solid ${color.glass.borderFocus}`, borderRadius: radius.lg,
                  color: color.text.primary, fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.body, padding: '10px 14px', outline: 'none',
                  boxShadow: `${shadow.innerShine}, 0 0 12px rgba(255, 107, 53, 0.12)`,
                }}
              />
              <div className="flex gap-3">
                <GlassSelect
                  size="sm"
                  options={COLUMN_OPTIONS}
                  value={editColumn}
                  onChange={(e) => setEditColumn(e.target.value)}
                  style={{ flex: 1 }}
                />
                <GlassSelect
                  size="sm"
                  options={JOURNAL_TAG_OPTIONS}
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div className="flex gap-2">
                <EmberButton size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Save'}
                </EmberButton>
                <EmberButton variant="ghost" size="sm" onClick={() => { setEditing(false); setEditTitle(item.title || ''); setEditContent(item.content); }}>
                  Cancel
                </EmberButton>
              </div>
            </div>
          ) : (
            <div style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
              {item.title && (
                <p style={{
                  fontSize: '1rem', fontWeight: typography.fontWeight.semibold,
                  color: '#f0f0f5', lineHeight: typography.lineHeight.normal,
                  margin: '0 0 2px 0', wordBreak: 'break-word',
                }}>
                  {item.title}
                </p>
              )}
              <p
                style={{
                  fontSize: typography.fontSize.body, color: item.title ? color.text.secondary : color.text.primary,
                  lineHeight: typography.lineHeight.normal, margin: 0, wordBreak: 'break-word',
                }}
                className={expanded ? '' : (item.title ? 'line-clamp-2' : 'line-clamp-3')}
              >
                {item.content}
              </p>
            </div>
          )}

          {/* Link preview */}
          {isLink && item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 block"
              style={{
                fontSize: typography.fontSize.caption, color: color.blue.DEFAULT, textDecoration: 'none',
                padding: '8px 12px', borderRadius: '8px', background: 'rgba(96, 165, 250, 0.06)',
                border: '1px solid rgba(96, 165, 250, 0.15)', display: 'flex', alignItems: 'center', gap: '8px',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
              }}>
              <span>🔗</span><span className="truncate">{item.url}</span><span style={{ marginLeft: 'auto', opacity: 0.5 }}>↗</span>
            </a>
          )}

          {/* File list */}
          {isFile && item.files && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.files.map((file, i) => {
                const filename = file.split('/').pop() || file;
                return (
                  <GlassPill key={i} variant="default" size="xs" icon={<span>📎</span>}>
                    {filename.length > 30 ? filename.slice(0, 27) + '...' : filename}
                  </GlassPill>
                );
              })}
            </div>
          )}

          {/* Expanded: Reply Thread */}
          {expanded && item.replies && item.replies.length > 0 && (
            <div className="mt-3 flex flex-col gap-2" style={{
              borderTop: `1px solid ${color.glass.border}`, paddingTop: '12px',
            }}>
              <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Replies
              </span>
              {item.replies.map((reply) => (
                <div key={reply.id} style={{
                  padding: '8px 12px', borderRadius: radius.md,
                  background: reply.author === 'aaron' ? 'rgba(255, 107, 53, 0.08)' : 'rgba(96, 165, 250, 0.08)',
                  borderLeft: `3px solid ${reply.author === 'aaron' ? color.ember.DEFAULT : color.blue.DEFAULT}`,
                }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{
                      fontSize: typography.fontSize.metadata, fontWeight: typography.fontWeight.semibold,
                      color: reply.author === 'aaron' ? color.ember.flame : color.blue.light,
                      textTransform: 'capitalize',
                    }}>
                      {reply.author}
                    </span>
                    <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: typography.fontSize.caption, color: color.text.primary, margin: 0, lineHeight: typography.lineHeight.normal }}>
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Expanded: Reply Input */}
          {expanded && (
            <div className="mt-3 flex flex-col gap-2" style={{
              ...((!item.replies || item.replies.length === 0) ? { borderTop: `1px solid ${color.glass.border}`, paddingTop: '12px' } : {}),
            }}>
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a reply..."
                  rows={2}
                  style={{
                    flex: 1, resize: 'none',
                    background: color.bg.surface, border: `1px solid ${color.glass.border}`,
                    borderRadius: radius.md, color: color.text.primary, fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.caption, padding: '8px 10px', outline: 'none',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleReply(); }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {(['aaron', 'orion'] as const).map((a) => (
                    <GlassPill key={a} variant={replyAuthor === a ? 'ember' : 'default'} size="xs"
                      onClick={() => setReplyAuthor(a)}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </GlassPill>
                  ))}
                </div>
                <EmberButton variant="ghost" size="sm" onClick={handleReply} disabled={!replyText.trim() || sendingReply}>
                  {sendingReply ? '⏳' : '📨 Reply'}
                </EmberButton>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isPromoted && !editing && (
            <div
              className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100"
              style={{ transition: `opacity ${animation.duration.normal} ${animation.easing.default}` }}
            >
              {showArchiveView ? (
                <EmberButton variant="ghost" size="sm" onClick={handleArchiveToggle} disabled={archiving}>
                  {archiving ? '⏳' : '📤 Unarchive'}
                </EmberButton>
              ) : (
                <>
                  {onPromote && (
                    <EmberButton variant="ghost" size="sm" onClick={() => onPromote(item)}>
                      🚀 Promote
                    </EmberButton>
                  )}
                  <EmberButton variant="ghost" size="sm" onClick={handleArchiveToggle} disabled={archiving}>
                    {archiving ? '⏳' : '📦'}
                  </EmberButton>
                  <EmberButton variant="ghost" size="sm" onClick={() => { setEditing(true); setExpanded(true); }}>
                    ✏️
                  </EmberButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
