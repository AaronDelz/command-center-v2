'use client';

import { useState } from 'react';
import type { KanbanCard as KanbanCardType } from '@/lib/types';

interface KanbanCardProps {
  card: KanbanCardType;
  columnId: string;
  onClick?: () => void;
}

const priorityBorderColors: Record<string, string> = {
  high: '#ff4500',
  medium: '#ffb347',
  low: '#60a5fa',
  none: 'rgba(255, 255, 255, 0.08)',
};

const priorityDotColors: Record<string, string> = {
  high: '#ff4500',
  medium: '#ffb347',
  low: '#60a5fa',
  none: '#555060',
};

const ownerColors: Record<string, { bg: string; text: string; border: string }> = {
  aaron: { bg: 'rgba(255, 107, 53, 0.12)', text: '#ffb347', border: 'rgba(255, 107, 53, 0.25)' },
  orion: { bg: 'rgba(96, 165, 250, 0.12)', text: '#93c5fd', border: 'rgba(96, 165, 250, 0.25)' },
};

export function KanbanCard({ card, columnId, onClick }: KanbanCardProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const priority = card.priority ?? 'none';
  const borderColor = priorityBorderColors[priority];
  const isOverdue = card.dueDate ? new Date(card.dueDate + 'T23:59:59') < new Date() : false;
  const ownerStyle = ownerColors[card.owner.toLowerCase()] ?? ownerColors.aaron;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
  };
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('fromColumnId', columnId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => setIsDragging(false);

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      role="button"
      tabIndex={0}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        border: `1px solid ${isHovered ? 'rgba(255, 107, 53, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '10px 12px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered
          ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 107, 53, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
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
        {/* Priority dot */}
        {priority !== 'none' && (
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: priorityDotColors[priority],
            boxShadow: `0 0 6px ${priorityDotColors[priority]}`,
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

      {/* Footer: Owner + Client + Due */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.5625rem', color: '#8a8494',
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

          {/* Due date */}
          {card.dueDate && (
            <span style={{
              fontWeight: isOverdue ? 600 : 400,
              color: isOverdue ? '#ef4444' : '#8a8494',
              ...(isOverdue ? { textShadow: '0 0 6px rgba(239, 68, 68, 0.4)' } : {}),
            }}>
              📅 {new Date(card.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
