'use client';

import { useState } from 'react';
import { GlassCard, EmberButton, GlassPill } from '@/components/ui';
import { color, typography, animation } from '@/styles/tokens';
import type { Drop, JournalTag } from '@/lib/types';
import type { Note } from '@/lib/types';

// Unified item that can be either a Drop or a Note
export interface UnifiedItem {
  id: string;
  type: 'note' | 'idea' | 'link' | 'task' | 'file' | 'question' | 'unsorted';
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
}

const JOURNAL_TAG_CONFIG: Record<JournalTag, { icon: string; label: string; color: string; bg: string; border: string }> = {
  discussed: { icon: '📋', label: 'Discussed', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.10)', border: 'rgba(96, 165, 250, 0.25)' },
  decisions: { icon: '⚡', label: 'Decision', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.10)', border: 'rgba(251, 191, 36, 0.25)' },
  built:     { icon: '🔨', label: 'Built', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.10)', border: 'rgba(74, 222, 128, 0.25)' },
  insight:   { icon: '💡', label: 'Insight', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.10)', border: 'rgba(167, 139, 250, 0.25)' },
  open:      { icon: '❓', label: 'Open', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.10)', border: 'rgba(244, 114, 182, 0.25)' },
};

const TYPE_ICONS: Record<string, string> = {
  note: '📝',
  idea: '💡',
  link: '🔗',
  task: '✅',
  file: '📎',
  question: '❓',
  unsorted: '📦',
};

const TYPE_LABELS: Record<string, string> = {
  note: 'Note',
  idea: 'Idea',
  link: 'Link',
  task: 'Task',
  file: 'File',
  question: 'Question',
  unsorted: 'Unsorted',
};

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

interface DropCardProps {
  item: UnifiedItem;
  onPromote?: (item: UnifiedItem) => void;
  onArchive?: (item: UnifiedItem) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function DropCard({ item, onPromote, onArchive, selectionMode, selected, onToggleSelect }: DropCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const icon = TYPE_ICONS[item.type] || '📦';
  const isLink = item.type === 'link' && item.url;
  const isFile = item.type === 'file' && item.files && item.files.length > 0;
  const isPromoted = item.status === 'promoted';
  const isArchived = item.status === 'archived';
  const journalConfig = item.journalTag ? JOURNAL_TAG_CONFIG[item.journalTag] : null;

  return (
    <GlassCard
      hover
      padding="sm"
      className={`group ${isPromoted || isArchived ? 'opacity-60' : ''}`}
      style={selected ? { border: `1.5px solid ${color.ember.DEFAULT}`, boxShadow: '0 0 12px rgba(255, 107, 53, 0.15)' } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        {selectionMode && (
          <label
            className="flex-shrink-0 mt-1 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selected || false}
              onChange={() => onToggleSelect?.(item.id)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: color.ember.DEFAULT,
                cursor: 'pointer',
              }}
            />
          </label>
        )}

        {/* Type icon */}
        <span
          className="flex-shrink-0 text-lg mt-0.5"
          style={{ filter: isPromoted ? 'grayscale(1)' : 'none' }}
        >
          {icon}
        </span>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Header row: type pill + time */}
          <div className="flex items-center gap-2 mb-1.5">
            <GlassPill variant={item.type === 'idea' ? 'ember' : 'default'} size="xs">
              {TYPE_LABELS[item.type]}
            </GlassPill>
            {journalConfig && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: typography.fontSize.metadata,
                  fontWeight: typography.fontWeight.medium,
                  color: journalConfig.color,
                  background: journalConfig.bg,
                  border: `1px solid ${journalConfig.border}`,
                }}
              >
                {journalConfig.icon} {journalConfig.label}
              </span>
            )}
            {item.source === 'note' && (
              <GlassPill variant="info" size="xs">Note</GlassPill>
            )}
            {item.tags?.includes('discuss') && (
              <GlassPill variant="warning" size="xs">🗣️ Discuss</GlassPill>
            )}
            {isPromoted && (
              <GlassPill variant="success" size="xs">Promoted</GlassPill>
            )}
            <span
              style={{
                fontSize: typography.fontSize.metadata,
                color: color.text.dim,
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {formatRelativeTime(item.createdAt)}
            </span>
          </div>

          {/* Content text */}
          <p
            style={{
              fontSize: typography.fontSize.body,
              color: color.text.primary,
              lineHeight: typography.lineHeight.normal,
              margin: 0,
              wordBreak: 'break-word',
            }}
            className={expanded ? '' : 'line-clamp-3'}
            onClick={() => item.content.length > 200 && setExpanded(!expanded)}
          >
            {item.content}
          </p>

          {/* Link preview */}
          {isLink && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block"
              style={{
                fontSize: typography.fontSize.caption,
                color: color.blue.DEFAULT,
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(96, 165, 250, 0.06)',
                border: '1px solid rgba(96, 165, 250, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
              }}
            >
              <span>🔗</span>
              <span className="truncate">{item.url}</span>
              <span style={{ marginLeft: 'auto', opacity: 0.5 }}>↗</span>
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

          {/* Action buttons (visible on hover) */}
          {!isPromoted && !isArchived && (
            <div
              className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100"
              style={{ transition: `opacity ${animation.duration.normal} ${animation.easing.default}` }}
            >
              {onPromote && (
                <EmberButton variant="ghost" size="sm" onClick={() => onPromote(item)}>
                  🚀 Promote to Kanban
                </EmberButton>
              )}
              {onArchive && (
                <EmberButton variant="ghost" size="sm" onClick={() => onArchive(item)}>
                  📦 Archive
                </EmberButton>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
