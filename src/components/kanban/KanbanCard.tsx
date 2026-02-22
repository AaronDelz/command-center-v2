'use client';

import { useState } from 'react';
import type { KanbanCard as KanbanCardType, KanbanSubtask } from '@/lib/types';

interface KanbanCardProps {
  card: KanbanCardType;
  columnId: string;
  compact?: boolean;
  onClick?: () => void;
}

const priorityConfig: Record<string, { border: string; glow: string; dot: string; label: string }> = {
  high:   { border: '#ff4500', glow: 'rgba(255, 69, 0, 0.25)',   dot: '#ff4500', label: '🔴' },
  medium: { border: '#ffb347', glow: 'rgba(255, 179, 71, 0.15)', dot: '#ffb347', label: '🟡' },
  low:    { border: '#60a5fa', glow: 'rgba(96, 165, 250, 0.12)', dot: '#60a5fa', label: '🔵' },
  none:   { border: 'rgba(255, 255, 255, 0.08)', glow: 'none',   dot: '#555060', label: '' },
};

const ownerColors: Record<string, { bg: string; text: string; border: string }> = {
  aaron: { bg: 'rgba(255, 107, 53, 0.12)', text: '#ffb347', border: 'rgba(255, 107, 53, 0.25)' },
  orion: { bg: 'rgba(96, 165, 250, 0.12)', text: '#93c5fd', border: 'rgba(96, 165, 250, 0.25)' },
};

function getDueDateInfo(dueDate: string): { label: string; color: string; bg: string; borderColor: string; urgent: boolean } {
  const now = new Date();
  const due = new Date(dueDate + 'T23:59:59');
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (diffDays < 0) {
    return { label: `⚠️ ${formatted}`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', urgent: true };
  } else if (diffDays <= 2) {
    return { label: `🔥 ${formatted}`, color: '#ff6b35', bg: 'rgba(255, 107, 53, 0.12)', borderColor: 'rgba(255, 107, 53, 0.25)', urgent: true };
  } else if (diffDays <= 7) {
    return { label: `📅 ${formatted}`, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.2)', urgent: false };
  } else {
    return { label: `📅 ${formatted}`, color: '#8a8494', bg: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)', urgent: false };
  }
}

function getSubtaskInfo(notes: string): { total: number; done: number } | null {
  // Parse checklist-like patterns from notes: "- [x]", "✅", numbered items
  const lines = notes.split('\n').filter(l => l.trim());
  const checkboxLines = lines.filter(l => /^[\s]*[-*]\s*\[[ x]\]/i.test(l) || /^[\s]*\d+[\.)]\s/.test(l));
  if (checkboxLines.length < 2) return null;
  const done = lines.filter(l => /^[\s]*[-*]\s*\[x\]/i.test(l) || /✅/.test(l)).length;
  return { total: checkboxLines.length, done };
}

export function KanbanCard({ card, columnId, compact = false, onClick }: KanbanCardProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const priority = card.priority ?? 'none';
  const pConfig = priorityConfig[priority];
  const ownerStyle = ownerColors[card.owner.toLowerCase()] ?? ownerColors.aaron;
  const dueDateInfo = card.dueDate ? getDueDateInfo(card.dueDate) : null;
  const subtaskInfo = card.notes ? getSubtaskInfo(card.notes) : null;

  // Structured subtasks state
  const hasSubtasks = !!(card.subtasks && card.subtasks.length > 0);
  const [localSubtasks, setLocalSubtasks] = useState<KanbanSubtask[]>(card.subtasks ?? []);
  const localCompleted = localSubtasks.filter(s => s.completed).length;
  const localTotal = localSubtasks.length;
  const [subtasksExpanded, setSubtasksExpanded] = useState(localTotal <= 3);

  const handleSubtaskToggle = async (e: React.MouseEvent, subtaskId: string, completed: boolean) => {
    e.stopPropagation();
    // Optimistic update
    setLocalSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, completed } : s));
    try {
      await fetch('/api/kanban/subtask', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, subtaskId, completed }),
      });
    } catch {
      // Revert on error
      setLocalSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, completed: !completed } : s));
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('fromColumnId', columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Priority glow for high/medium cards
  const priorityGlow = isHovered && priority !== 'none'
    ? `0 0 20px ${pConfig.glow}, 0 8px 24px rgba(0, 0, 0, 0.4)`
    : isHovered
      ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 107, 53, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)';

  if (compact) {
    // Compact card variant: single line, minimal info
    return (
      <div
        onClick={onClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={() => setIsDragging(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          borderLeft: `3px solid ${pConfig.border}`,
          borderRadius: '8px',
          padding: '6px 10px',
          cursor: 'grab',
          opacity: isDragging ? 0.4 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 150ms ease',
        }}
      >
        {priority !== 'none' && (
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: pConfig.dot, boxShadow: `0 0 4px ${pConfig.dot}`,
            flexShrink: 0,
          }} />
        )}
        <span style={{
          fontSize: '0.75rem', color: '#f0ece6', fontWeight: 500,
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
        }}>
          {card.title}
        </span>
        <span style={{
          fontSize: '0.5rem', padding: '1px 5px', borderRadius: '9999px',
          background: ownerStyle.bg, color: ownerStyle.text,
          border: `1px solid ${ownerStyle.border}`,
          textTransform: 'capitalize' as const, flexShrink: 0,
        }}>
          {card.owner}
        </span>
        {dueDateInfo && (
          <span style={{
            fontSize: '0.5rem', padding: '1px 5px', borderRadius: '9999px',
            background: dueDateInfo.bg, color: dueDateInfo.color,
            border: `1px solid ${dueDateInfo.borderColor}`,
            flexShrink: 0, fontWeight: dueDateInfo.urgent ? 600 : 400,
          }}>
            {dueDateInfo.label}
          </span>
        )}
      </div>
    );
  }

  // Full card
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      role="button"
      tabIndex={0}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        border: `1px solid ${isHovered ? 'rgba(255, 107, 53, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderLeft: `3px solid ${pConfig.border}`,
        borderRadius: '10px',
        padding: '10px 12px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: priorityGlow,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative' as const,
        overflow: 'hidden',
      }}
    >
      {/* Inner shine */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        pointerEvents: 'none',
      }} />

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
        {priority !== 'none' && (
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: pConfig.dot,
            boxShadow: `0 0 6px ${pConfig.dot}`,
            flexShrink: 0, marginTop: '5px',
          }} />
        )}
        <h4 style={{
          fontSize: '0.8125rem', fontWeight: 500, color: '#f0ece6',
          margin: 0, lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
        }}>
          {card.title}
        </h4>
      </div>

      {/* Description */}
      {card.description && (
        <p style={{
          fontSize: '0.6875rem', color: '#8a8494', margin: '0 0 6px 0',
          lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
        }}>
          {card.description}
        </p>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '6px' }}>
          {card.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              fontSize: '0.5625rem', fontWeight: 500,
              padding: '1px 6px', borderRadius: '9999px',
              background: 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.15)',
              color: '#ff6b35', letterSpacing: '0.025em',
            }}>
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span style={{ fontSize: '0.5625rem', color: '#555060', padding: '1px 4px' }}>
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Interactive subtasks (structured) */}
      {hasSubtasks && (
        <div style={{ marginBottom: '6px' }}>
          {/* Toggle row + progress bar */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginBottom: subtasksExpanded ? '6px' : 0 }}
            onClick={e => { e.stopPropagation(); setSubtasksExpanded(v => !v); }}
          >
            <span style={{ fontSize: '9px', color: '#555060', lineHeight: 1, userSelect: 'none' as const }}>
              {subtasksExpanded ? '▾' : '▸'}
            </span>
            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                width: `${localTotal > 0 ? (localCompleted / localTotal) * 100 : 0}%`,
                background: localCompleted === localTotal && localTotal > 0 ? '#4ade80' : 'linear-gradient(90deg, #ff6b35, #ffb347)',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.5625rem', color: '#8a8494', flexShrink: 0, fontWeight: 500 }}>
              {localCompleted}/{localTotal}
            </span>
          </div>
          {/* Checklist items */}
          {subtasksExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
              {localSubtasks.map(sub => (
                <div
                  key={sub.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}
                  onClick={e => handleSubtaskToggle(e, sub.id, !sub.completed)}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '13px', height: '13px', borderRadius: '3px', flexShrink: 0, marginTop: '1px',
                    border: sub.completed ? 'none' : '1.5px solid rgba(255,255,255,0.18)',
                    background: sub.completed ? 'linear-gradient(135deg, #ff6b35, #ffb347)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: sub.completed ? '0 0 6px rgba(255,107,53,0.4)' : 'none',
                  }}>
                    {sub.completed && (
                      <span style={{ color: '#fff', fontSize: '8px', lineHeight: 1, fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                  {/* Text */}
                  <span style={{
                    fontSize: '0.6875rem', lineHeight: 1.4,
                    color: sub.completed ? '#44404e' : '#a09aad',
                    textDecoration: sub.completed ? 'line-through' : 'none',
                    transition: 'all 0.15s ease',
                  }}>
                    {sub.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes-parsed progress bar (fallback for cards without structured subtasks) */}
      {!hasSubtasks && subtaskInfo && (
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${subtaskInfo.total > 0 ? (subtaskInfo.done / subtaskInfo.total) * 100 : 0}%`,
              height: '100%', borderRadius: '2px',
              background: subtaskInfo.done === subtaskInfo.total ? '#4ade80' : '#ffb347',
              transition: 'width 300ms ease',
            }} />
          </div>
          <span style={{ fontSize: '0.5625rem', color: '#8a8494', flexShrink: 0, fontWeight: 500 }}>
            {subtaskInfo.done}/{subtaskInfo.total}
          </span>
        </div>
      )}

      {/* Footer: Owner + Client + Due */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.5625rem', color: '#8a8494', gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' as const }}>
          {/* Owner badge */}
          <span style={{
            padding: '1px 7px', borderRadius: '9999px', fontWeight: 500,
            background: ownerStyle.bg, color: ownerStyle.text,
            border: `1px solid ${ownerStyle.border}`,
            textTransform: 'capitalize' as const, letterSpacing: '0.025em',
          }}>
            {card.owner}
          </span>

          {/* Client tag */}
          {card.client && (
            <span style={{
              padding: '1px 6px', borderRadius: '9999px', fontWeight: 500,
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              color: '#22d3ee',
            }}>
              {card.client}
            </span>
          )}
        </div>

        {/* Due date chip */}
        {dueDateInfo && (
          <span style={{
            padding: '1px 7px', borderRadius: '9999px', fontWeight: dueDateInfo.urgent ? 600 : 500,
            background: dueDateInfo.bg,
            border: `1px solid ${dueDateInfo.borderColor}`,
            color: dueDateInfo.color,
            fontSize: '0.5625rem',
            ...(dueDateInfo.urgent ? { animation: 'pulse-subtle 2s infinite' } : {}),
          }}>
            {dueDateInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}
