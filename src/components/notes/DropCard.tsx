'use client';

import { useState } from 'react';
import { GlassCard, EmberButton, GlassPill } from '@/components/ui';
import { color, typography, animation } from '@/styles/tokens';
import type { Drop } from '@/lib/types';
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
}

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
}

export function DropCard({ item, onPromote, onArchive }: DropCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const icon = TYPE_ICONS[item.type] || '📦';
  const isLink = item.type === 'link' && item.url;
  const isFile = item.type === 'file' && item.files && item.files.length > 0;
  const isPromoted = item.status === 'promoted';
  const isArchived = item.status === 'archived';

  return (
    <GlassCard
      hover
      padding="sm"
      className={`group ${isPromoted || isArchived ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
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
