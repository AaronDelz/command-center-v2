'use client';

import { useState, useRef, useEffect } from 'react';
import { color, typography, radius, animation, zIndex } from '@/styles/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassModal } from '@/components/ui/GlassModal';
import { EmberButton } from '@/components/ui/EmberButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassSelect } from '@/components/ui/GlassSelect';
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
  onDraftUpdate?: (draftId: string, updates: Partial<Draft>) => void;
  onDraftDelete?: (draftId: string) => void;
  onDraftCreate?: (draft: Partial<Draft>) => void;
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

const ALL_PLATFORMS = ['x', 'facebook', 'youtube', 'community', 'linkedin', 'instagram'];
const PLATFORM_NAMES: Record<string, string> = {
  x: 'X (Twitter)',
  facebook: 'Facebook',
  youtube: 'YouTube',
  community: 'Community',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
};

const DRAFT_TYPES = ['tip', 'story', 'tutorial', 'process', 'insight', 'news', 'youtube-script', 'repost', 'quote'];

export function DraftQueue({ drafts, pillars, onStatusChange, onDraftUpdate, onDraftDelete, onDraftCreate }: DraftQueueProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [editModalDraft, setEditModalDraft] = useState<Draft | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [editScheduled, setEditScheduled] = useState('');
  const [newDraftModal, setNewDraftModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPillar, setNewPillar] = useState('build');
  const [newType, setNewType] = useState('tip');
  const [newPlatforms, setNewPlatforms] = useState<string[]>(['x']);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitleId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownId(null);
      }
    }
    if (statusDropdownId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [statusDropdownId]);

  const sorted = [...drafts].sort((a, b) => {
    const aIdx = STATUS_ORDER.indexOf(a.status);
    const bIdx = STATUS_ORDER.indexOf(b.status);
    return bIdx - aIdx;
  });

  const handleTitleSave = (draftId: string) => {
    if (editingTitleValue.trim() && onDraftUpdate) {
      onDraftUpdate(draftId, { title: editingTitleValue.trim() });
    }
    setEditingTitleId(null);
  };

  const handleContentSave = () => {
    if (editModalDraft && onDraftUpdate) {
      onDraftUpdate(editModalDraft.id, {
        content: editContent,
        platforms: editPlatforms,
        scheduledFor: editScheduled || null,
      });
    }
    setEditModalDraft(null);
  };

  const handleCreateDraft = () => {
    if (newTitle.trim() && onDraftCreate) {
      onDraftCreate({
        title: newTitle.trim(),
        pillar: newPillar,
        type: newType,
        platforms: newPlatforms,
        status: 'idea',
      });
    }
    setNewDraftModal(false);
    setNewTitle('');
    setNewPillar('build');
    setNewType('tip');
    setNewPlatforms(['x']);
  };

  const togglePlatform = (platform: string, current: string[], setter: (v: string[]) => void) => {
    if (current.includes(platform)) {
      if (current.length > 1) setter(current.filter(p => p !== platform));
    } else {
      setter([...current, platform]);
    }
  };

  return (
    <GlassCard padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <SectionHeading
          title="Draft Queue"
          icon="📝"
          badge={drafts.length}
        />
        {onDraftCreate && (
          <EmberButton size="sm" variant="ghost" onClick={() => setNewDraftModal(true)}>
            + New Draft
          </EmberButton>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sorted.map((draft) => {
          const statusConf = STATUS_CONFIG[draft.status];
          const pillarConf = pillars[draft.pillar];
          const isExpanded = expandedId === draft.id;

          return (
            <div
              key={draft.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
                borderRadius: radius.lg,
                background: isExpanded ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isExpanded ? color.glass.borderHover : color.glass.border}`,
                cursor: 'pointer',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color.glass.borderHover;
                if (!isExpanded) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.borderColor = color.glass.border;
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }
              }}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                }}
              >
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
                  {editingTitleId === draft.id ? (
                    <input
                      ref={titleInputRef}
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={() => handleTitleSave(draft.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSave(draft.id);
                        if (e.key === 'Escape') setEditingTitleId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: typography.fontSize.cardTitle,
                        fontWeight: typography.fontWeight.medium,
                        color: color.text.primary,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${color.glass.borderFocus}`,
                        borderRadius: radius.sm,
                        padding: '2px 8px',
                        outline: 'none',
                        width: '100%',
                        fontFamily: typography.fontFamily.body,
                      }}
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingTitleId(draft.id);
                        setEditingTitleValue(draft.title);
                      }}
                      style={{
                        fontSize: typography.fontSize.cardTitle,
                        fontWeight: typography.fontWeight.medium,
                        color: color.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title="Double-click to edit title"
                    >
                      {draft.title}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
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

                {/* Status dropdown */}
                <div style={{ position: 'relative' }} ref={statusDropdownId === draft.id ? dropdownRef : undefined}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusDropdownId(statusDropdownId === draft.id ? null : draft.id);
                    }}
                    style={{
                      fontSize: typography.fontSize.caption,
                      fontWeight: typography.fontWeight.medium,
                      color: statusConf.color,
                      padding: '3px 10px',
                      borderRadius: radius.full,
                      border: `1px solid ${statusConf.color}40`,
                      background: `${statusConf.color}15`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: `all ${animation.duration.fast} ${animation.easing.default}`,
                      userSelect: 'none',
                    }}
                  >
                    {statusConf.icon} {statusConf.label} ▾
                  </div>

                  {/* Status dropdown menu */}
                  {statusDropdownId === draft.id && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: color.bg.elevated,
                        border: `1px solid ${color.glass.border}`,
                        borderRadius: radius.md,
                        overflow: 'hidden',
                        zIndex: zIndex.dropdown,
                        minWidth: '140px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      }}
                    >
                      {STATUS_ORDER.map((s) => {
                        const conf = STATUS_CONFIG[s];
                        const isActive = draft.status === s;
                        return (
                          <div
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) onStatusChange?.(draft.id, s);
                              setStatusDropdownId(null);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: typography.fontSize.caption,
                              color: isActive ? conf.color : color.text.secondary,
                              background: isActive ? `${conf.color}15` : 'transparent',
                              cursor: isActive ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: `background ${animation.duration.fast}`,
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <span>{conf.icon}</span>
                            <span style={{ fontWeight: isActive ? typography.fontWeight.medium : typography.fontWeight.regular }}>
                              {conf.label}
                            </span>
                            {isActive && <span style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable content area */}
              {isExpanded && (
                <div style={{
                  padding: '0 16px 14px 16px',
                  borderTop: `1px solid ${color.glass.border}`,
                }}>
                  {draft.content ? (
                    <div style={{
                      fontSize: typography.fontSize.body,
                      color: color.text.secondary,
                      lineHeight: 1.6,
                      paddingTop: '12px',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {draft.content}
                    </div>
                  ) : (
                    <div style={{
                      paddingTop: '12px',
                      fontSize: typography.fontSize.body,
                      color: color.text.dim,
                      fontStyle: 'italic',
                    }}>
                      No content yet
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    alignItems: 'center',
                  }}>
                    {onDraftUpdate && (
                      <EmberButton
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditModalDraft(draft);
                          setEditContent(draft.content);
                          setEditPlatforms([...draft.platforms]);
                          setEditScheduled(draft.scheduledFor || '');
                        }}
                      >
                        ✏️ Edit
                      </EmberButton>
                    )}
                    {onDraftDelete && (
                      confirmDeleteId === draft.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: typography.fontSize.caption, color: color.status.error }}>Delete?</span>
                          <EmberButton
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDraftDelete(draft.id);
                              setConfirmDeleteId(null);
                              setExpandedId(null);
                            }}
                          >
                            Yes
                          </EmberButton>
                          <EmberButton
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                          >
                            No
                          </EmberButton>
                        </div>
                      ) : (
                        <EmberButton
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(draft.id);
                          }}
                        >
                          🗑️ Delete
                        </EmberButton>
                      )
                    )}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
                      Created {new Date(draft.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {draft.type}
                    </span>
                  </div>
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

      {/* Edit Content Modal */}
      <GlassModal
        open={!!editModalDraft}
        onClose={() => setEditModalDraft(null)}
        title={`Edit: ${editModalDraft?.title || ''}`}
        width="lg"
        footer={
          <>
            <EmberButton variant="ghost" size="sm" onClick={() => setEditModalDraft(null)}>Cancel</EmberButton>
            <EmberButton size="sm" onClick={handleContentSave}>Save Changes</EmberButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Content textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
            }}>
              Content
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: typography.fontSize.body,
                color: color.text.primary,
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${color.glass.border}`,
                borderRadius: radius.lg,
                fontFamily: typography.fontFamily.body,
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = color.glass.borderFocus; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = color.glass.border; }}
            />
          </div>

          {/* Platforms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
            }}>
              Platforms
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ALL_PLATFORMS.map(p => {
                const active = editPlatforms.includes(p);
                return (
                  <div
                    key={p}
                    onClick={() => togglePlatform(p, editPlatforms, setEditPlatforms)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: radius.full,
                      fontSize: typography.fontSize.caption,
                      cursor: 'pointer',
                      border: `1px solid ${active ? color.ember.DEFAULT + '60' : color.glass.border}`,
                      background: active ? color.ember.DEFAULT + '20' : 'transparent',
                      color: active ? color.ember.flame : color.text.dim,
                      transition: `all ${animation.duration.fast}`,
                    }}
                  >
                    {PLATFORM_ICONS[p]} {PLATFORM_NAMES[p]}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheduled date */}
          <GlassInput
            label="Scheduled For"
            type="date"
            value={editScheduled}
            onChange={(e) => setEditScheduled(e.target.value)}
            size="sm"
          />
        </div>
      </GlassModal>

      {/* New Draft Modal */}
      <GlassModal
        open={newDraftModal}
        onClose={() => setNewDraftModal(false)}
        title="New Draft"
        width="md"
        footer={
          <>
            <EmberButton variant="ghost" size="sm" onClick={() => setNewDraftModal(false)}>Cancel</EmberButton>
            <EmberButton size="sm" onClick={handleCreateDraft} disabled={!newTitle.trim()}>Create Draft</EmberButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <GlassInput
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What's the post about?"
          />
          <GlassSelect
            label="Pillar"
            value={newPillar}
            onChange={(e) => setNewPillar(e.target.value)}
            options={Object.entries(pillars).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <GlassSelect
            label="Type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            options={DRAFT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
            }}>
              Platforms
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ALL_PLATFORMS.map(p => {
                const active = newPlatforms.includes(p);
                return (
                  <div
                    key={p}
                    onClick={() => togglePlatform(p, newPlatforms, setNewPlatforms)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: radius.full,
                      fontSize: typography.fontSize.caption,
                      cursor: 'pointer',
                      border: `1px solid ${active ? color.ember.DEFAULT + '60' : color.glass.border}`,
                      background: active ? color.ember.DEFAULT + '20' : 'transparent',
                      color: active ? color.ember.flame : color.text.dim,
                      transition: `all ${animation.duration.fast}`,
                    }}
                  >
                    {PLATFORM_ICONS[p]} {PLATFORM_NAMES[p]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassModal>
    </GlassCard>
  );
}
