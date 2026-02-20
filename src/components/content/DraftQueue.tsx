'use client';

import { useState } from 'react';
import { color, typography, radius, animation } from '@/styles/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Draft {
  id: string;
  title: string;
  content: string;
  pillar: string;
  type: string;
  platforms: string[];
  status: 'idea' | 'outline' | 'inProgress' | 'ready';
  scheduledFor: string | null;
  createdAt: string;
}

interface Pillars {
  [key: string]: { label: string; target: number; color: string };
}

interface DraftQueueProps {
  drafts: Draft[];
  pillars: Pillars;
  onStatusChange?: (draftId: string, newStatus: Draft['status']) => void;
  onEdit?: (draft: Draft) => void;
}

const STATUS_CONFIG: Record<Draft['status'], { label: string; color: string; icon: string }> = {
  idea: { label: 'Idea', color: '#8a8494', icon: '💡' },
  outline: { label: 'Outline', color: '#60a5fa', icon: '📋' },
  inProgress: { label: 'In Progress', color: '#ffb347', icon: '✍️' },
  ready: { label: 'Ready', color: '#4ade80', icon: '✅' },
};

const STATUS_ORDER: Draft['status'][] = ['idea', 'outline', 'inProgress', 'ready'];

const PLATFORM_ICONS: Record<string, string> = {
  x: '𝕏',
  facebook: 'f',
  youtube: '▶',
  community: '👥',
  linkedin: 'in',
  instagram: '📷',
};

export function DraftQueue({ drafts, pillars, onStatusChange, onEdit }: DraftQueueProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...drafts].sort((a, b) => {
    const aIdx = STATUS_ORDER.indexOf(a.status);
    const bIdx = STATUS_ORDER.indexOf(b.status);
    // Ready first, then in progress, etc.
    return bIdx - aIdx;
  });

  return (
    <GlassCard padding="md">
      <SectionHeading
        title="Draft Queue"
        icon="📝"
        badge={drafts.length}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sorted.map((draft) => {
          const statusConf = STATUS_CONFIG[draft.status];
          const pillarConf = pillars[draft.pillar];
          const nextStatus = STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(draft.status) + 1, STATUS_ORDER.length - 1)];

          return (
            <div
              key={draft.id}
              onClick={() => {
                if (onEdit) {
                  onEdit(draft);
                } else {
                  setExpandedId(expandedId === draft.id ? null : draft.id);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0px',
                padding: '0',
                borderRadius: radius.lg,
                background: expandedId === draft.id ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${expandedId === draft.id ? color.glass.borderHover : color.glass.border}`,
                cursor: 'pointer',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color.glass.borderHover;
                if (expandedId !== draft.id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (expandedId !== draft.id) {
                  e.currentTarget.style.borderColor = color.glass.border;
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }
              }}
            >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
            }}>
              {/* Pillar color bar */}
              <div
                style={{
                  width: '3px',
                  height: '36px',
                  borderRadius: radius.full,
                  background: pillarConf?.color || color.text.dim,
                  flexShrink: 0,
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.cardTitle,
                    fontWeight: typography.fontWeight.medium,
                    color: color.text.primary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {draft.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: typography.fontSize.metadata,
                      color: color.text.dim,
                    }}
                  >
                    {pillarConf?.label || draft.pillar}
                  </span>
                  <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>·</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {draft.platforms.map(p => (
                      <span
                        key={p}
                        style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: radius.full,
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: color.text.secondary,
                        }}
                      >
                        {PLATFORM_ICONS[p] || p}
                      </span>
                    ))}
                  </div>
                  {draft.scheduledFor && (
                    <>
                      <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>·</span>
                      <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
                        📅 {new Date(draft.scheduledFor + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status pill */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (draft.status !== 'ready') onStatusChange?.(draft.id, nextStatus);
                }}
                style={{
                  fontSize: typography.fontSize.caption,
                  fontWeight: typography.fontWeight.medium,
                  color: statusConf.color,
                  padding: '3px 10px',
                  borderRadius: radius.full,
                  border: `1px solid ${statusConf.color}40`,
                  background: `${statusConf.color}15`,
                  cursor: draft.status !== 'ready' ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  transition: `all ${animation.duration.fast} ${animation.easing.default}`,
                }}
                title={draft.status !== 'ready' ? `Click to advance to ${STATUS_CONFIG[nextStatus].label}` : 'Ready to publish'}
              >
                {statusConf.icon} {statusConf.label}
              </div>
            </div>

            {/* Expandable content preview */}
            {expandedId === draft.id && draft.content && (
              <div style={{
                padding: '0 16px 14px 16px',
                borderTop: `1px solid ${color.glass.border}`,
                marginTop: '0',
              }}>
                <div style={{
                  fontSize: typography.fontSize.body,
                  color: color.text.secondary,
                  lineHeight: 1.6,
                  paddingTop: '12px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {draft.content}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '10px',
                  fontSize: typography.fontSize.caption,
                  color: color.text.dim,
                }}>
                  <span>Created {new Date(draft.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>·</span>
                  <span>{draft.type}</span>
                </div>
              </div>
            )}
            {expandedId === draft.id && !draft.content && (
              <div style={{
                padding: '8px 16px 14px 16px',
                borderTop: `1px solid ${color.glass.border}`,
                fontSize: typography.fontSize.body,
                color: color.text.dim,
                fontStyle: 'italic',
              }}>
                No content yet — click status pill to advance this draft
              </div>
            )}
            </div>
          );
        })}

        {drafts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: color.text.dim, fontSize: typography.fontSize.body }}>
            No drafts yet. Start creating!
          </div>
        )}
      </div>
    </GlassCard>
  );
}
