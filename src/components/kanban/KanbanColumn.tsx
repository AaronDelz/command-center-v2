'use client';

import { useState } from 'react';
import type { KanbanColumn as KanbanColumnType } from '@/lib/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  ownerFilter?: 'all' | 'aaron' | 'orion';
  onCardClick?: (cardId: string, columnId: string) => void;
  onMoveCard?: (cardId: string, fromColumnId: string, toColumnId: string) => void;
}

const columnColors: Record<string, string> = {
  ideas: 'border-t-yellow-400',
  bench: 'border-t-orange-400',
  'on-deck': 'border-t-blue-400',
  'in-progress': 'border-t-purple-500',
  blocked: 'border-t-red-500',
  review: 'border-t-cyan-400',
  done: 'border-t-green-500',
};

export function KanbanColumn({ column, ownerFilter = 'all', onCardClick, onMoveCard }: KanbanColumnProps): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState(false);
  const topBorder = columnColors[column.id] ?? 'border-t-accent';
  
  // Filter cards by owner
  const filteredCards = ownerFilter === 'all'
    ? column.cards
    : column.cards.filter((card) => card.owner.toLowerCase() === ownerFilter);
  const cardCount = filteredCards.length;
  const totalCount = column.cards.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const cardId = e.dataTransfer.getData('cardId');
    const fromColumnId = e.dataTransfer.getData('fromColumnId');
    
    if (cardId && fromColumnId && onMoveCard) {
      onMoveCard(cardId, fromColumnId, column.id);
    }
  };

  return (
    <div 
      className="flex flex-col min-w-[75vw] max-w-[75vw] md:min-w-[280px] md:max-w-[280px] snap-start flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        className={`bg-surface/80 backdrop-blur-sm rounded-t-lg border-t-2 ${topBorder} border-x border-border px-3 py-2`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {column.title}
          </h3>
          <span className="text-xs text-text-muted bg-surface-raised px-2 py-0.5 rounded-full">
            {ownerFilter === 'all' ? cardCount : `${cardCount}/${totalCount}`}
            {column.maxCards && ` / ${column.maxCards}`}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className={`flex-1 bg-surface/40 backdrop-blur-sm rounded-b-lg border-x border-b border-border p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] transition-colors ${isDragOver ? 'bg-accent/10 border-accent/50' : ''}`}>
        {filteredCards.length === 0 ? (
          <div className="text-center text-text-muted text-xs py-4 italic">
            No cards
          </div>
        ) : (
          filteredCards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              onClick={() => onCardClick?.(card.id, column.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
