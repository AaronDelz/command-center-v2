'use client';

import { useState } from 'react';
import type { KanbanCard as KanbanCardType } from '@/lib/types';

interface KanbanCardProps {
  card: KanbanCardType;
  columnId: string;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-transparent',
};

const priorityLabels: Record<string, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

export function KanbanCard({ card, columnId, onClick }: KanbanCardProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const priority = card.priority ?? 'none';
  const showPriority = priority !== 'none';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('fromColumnId', columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`group bg-surface-raised/90 backdrop-blur-sm rounded-lg border border-border hover:border-accent/50 p-3 transition-all duration-200 hover:shadow-lg hover:shadow-accent/10 cursor-grab active:cursor-grabbing active:scale-[0.98] min-h-[44px] ${isDragging ? 'opacity-50 border-accent' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      role="button"
      tabIndex={0}
    >
      {/* Priority indicator bar */}
      {showPriority && (
        <div className={`h-1 w-full rounded-full mb-2 ${priorityColors[priority]}`} />
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
        {card.title}
      </h4>

      {/* Description */}
      {card.description && (
        <p className="text-xs text-text-muted mb-2 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent/20 text-accent"
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-text-muted">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Owner + Client + Due + Priority badge */}
      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="capitalize">{card.owner}</span>
          {card.client && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[9px]">{card.client}</span>
          )}
          {card.dueDate && (
            <span className={`text-[9px] ${new Date(card.dueDate + 'T23:59:59') < new Date() ? 'text-red-400 font-medium' : ''}`}>
              {new Date(card.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {showPriority && (
          <span className={`px-1.5 py-0.5 rounded text-white ${priorityColors[priority]}`}>
            {priorityLabels[priority]}
          </span>
        )}
      </div>
    </div>
  );
}
