'use client';

import { useState } from 'react';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/lib/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  ownerFilter?: 'all' | 'aaron' | 'orion';
  clientFilter?: string;
  sortMode?: 'default' | 'dueDate' | 'priority';
  hideDone?: boolean;
  onToggleHideDone?: () => void;
  onCardClick?: (cardId: string, columnId: string) => void;
  onMoveCard?: (cardId: string, fromColumnId: string, toColumnId: string) => void;
}

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

function sortCards(cards: KanbanCardType[], mode: string): KanbanCardType[] {
  if (mode === 'default') return cards;
  return [...cards].sort((a, b) => {
    if (mode === 'dueDate') {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    }
    // priority
    return (priorityOrder[a.priority ?? 'none'] ?? 3) - (priorityOrder[b.priority ?? 'none'] ?? 3);
  });
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

export function KanbanColumn({ column, ownerFilter = 'all', clientFilter = 'all', sortMode = 'default', hideDone = true, onToggleHideDone, onCardClick, onMoveCard }: KanbanColumnProps): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState(false);
  const topBorder = columnColors[column.id] ?? 'border-t-accent';
  const isDone = column.id === 'done';
  
  // Filter cards by owner and client
  let filteredCards = ownerFilter === 'all'
    ? column.cards
    : column.cards.filter((card) => card.owner.toLowerCase() === ownerFilter);
  if (clientFilter !== 'all') {
    filteredCards = filteredCards.filter((card) => card.client === clientFilter);
  }
  // Sort
  filteredCards = sortCards(filteredCards, sortMode);
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
          <div className="flex items-center gap-1.5">
            {isDone && onToggleHideDone && (
              <button
                onClick={onToggleHideDone}
                className="text-text-muted hover:text-foreground transition-colors p-0.5"
                title={hideDone ? 'Show done cards' : 'Hide done cards'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {hideDone ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            )}
            <span className="text-xs text-text-muted bg-surface-raised px-2 py-0.5 rounded-full">
              {ownerFilter === 'all' && clientFilter === 'all' ? cardCount : `${cardCount}/${totalCount}`}
              {column.maxCards && ` / ${column.maxCards}`}
            </span>
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <div className={`flex-1 bg-surface/40 backdrop-blur-sm rounded-b-lg border-x border-b border-border p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] transition-colors ${isDragOver ? 'bg-accent/10 border-accent/50' : ''}`}>
        {isDone && hideDone ? (
          <div className="text-center text-text-muted text-xs py-4 italic">
            {cardCount} completed — click 👁 to show
          </div>
        ) : filteredCards.length === 0 ? (
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
