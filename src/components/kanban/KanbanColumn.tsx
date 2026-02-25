'use client';

import { useState } from 'react';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/lib/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  ownerFilter?: 'all' | 'aaron' | 'orion' | 'none';
  clientFilter?: string;
  sortMode?: 'default' | 'dueDate' | 'priority';
  compactMode?: boolean;
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
    return (priorityOrder[a.priority ?? 'none'] ?? 3) - (priorityOrder[b.priority ?? 'none'] ?? 3);
  });
}

// Warming column progression: cool → warm → hot → golden → green
const columnConfig: Record<string, { emoji: string; label: string; accentColor: string; glowColor: string; headerBg: string; isActive: boolean }> = {
  todo:   { emoji: '📋', label: 'To Do',    accentColor: '#8b9dc3', glowColor: 'rgba(139, 157, 195, 0.2)',  headerBg: 'rgba(139, 157, 195, 0.04)', isActive: false },
  ondeck: { emoji: '🎯', label: 'On Deck',  accentColor: '#ffb347', glowColor: 'rgba(255, 179, 71, 0.25)', headerBg: 'rgba(255, 179, 71, 0.04)',  isActive: true },
  doing:  { emoji: '🔨', label: 'Doing',    accentColor: '#ff6b35', glowColor: 'rgba(255, 107, 53, 0.35)', headerBg: 'rgba(255, 107, 53, 0.05)',  isActive: true },
  hold:   { emoji: '⏳', label: 'Hold',     accentColor: '#a78bfa', glowColor: 'rgba(167, 139, 250, 0.2)', headerBg: 'rgba(167, 139, 250, 0.04)', isActive: false },
  done:   { emoji: '✅', label: 'Done',     accentColor: '#4ade80', glowColor: 'rgba(74, 222, 128, 0.25)', headerBg: 'rgba(74, 222, 128, 0.03)',  isActive: false },
};

export function KanbanColumn({ column, ownerFilter = 'all', clientFilter = 'all', sortMode = 'default', compactMode = false, hideDone = true, onToggleHideDone, onCardClick, onMoveCard }: KanbanColumnProps): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState(false);
  const isDone = column.id === 'done';
  const config = columnConfig[column.id] ?? { emoji: '📋', label: column.title, accentColor: '#60a5fa', glowColor: 'rgba(96, 165, 250, 0.3)', headerBg: 'rgba(96, 165, 250, 0.03)', isActive: false };

  let filteredCards = ownerFilter === 'all'
    ? column.cards
    : column.cards.filter((card) => card.owner.toLowerCase() === ownerFilter);
  if (clientFilter !== 'all') {
    filteredCards = filteredCards.filter((card) => card.client === clientFilter);
  }
  filteredCards = sortCards(filteredCards, sortMode);
  const cardCount = filteredCards.length;
  const totalCount = column.cards.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('cardId');
    const fromColumnId = e.dataTransfer.getData('fromColumnId');
    if (cardId && fromColumnId && onMoveCard) {
      onMoveCard(cardId, fromColumnId, column.id);
    }
  };

  const displayCount = ownerFilter === 'all' && clientFilter === 'all' ? cardCount : `${cardCount}/${totalCount}`;

  // Count high priority cards for column urgency indicator
  const highPriorityCount = filteredCards.filter(c => c.priority === 'high').length;

  return (
    <div
      className="flex flex-col min-w-[75vw] max-w-[75vw] md:min-w-[280px] md:max-w-[280px] snap-start flex-shrink-0"
      style={{ opacity: isDone ? 0.6 : 1, transition: 'opacity 200ms ease' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        style={{
          background: config.headerBg,
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          borderTop: `2px solid ${config.accentColor}`,
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px 12px 0 0',
          padding: '10px 12px',
          boxShadow: config.isActive ? `0 -2px 16px ${config.glowColor}` : 'none',
          transition: 'box-shadow 200ms ease',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{config.emoji}</span>
            <h3
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                color: config.isActive ? config.accentColor : '#f0ece6',
                margin: 0,
              }}
            >
              {config.label}
            </h3>
            {/* High priority indicator */}
            {highPriorityCount > 0 && !isDone && (
              <span style={{
                fontSize: '0.5625rem', fontWeight: 600,
                padding: '0px 5px', borderRadius: '9999px',
                background: 'rgba(255, 69, 0, 0.15)',
                border: '1px solid rgba(255, 69, 0, 0.3)',
                color: '#ff4500',
              }}>
                {highPriorityCount} 🔥
              </span>
            )}
          </div>
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
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 500,
                color: '#8a8494',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {displayCount}
              {column.maxCards ? ` / ${column.maxCards}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <div
        style={{
          flex: 1,
          background: isDragOver ? 'rgba(255, 107, 53, 0.06)' : 'rgba(255, 255, 255, 0.015)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          padding: '8px',
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto' as const,
          transition: 'background 200ms ease, border-color 200ms ease',
          ...(isDragOver ? { borderColor: 'rgba(255, 107, 53, 0.3)' } : {}),
        }}
        className="space-y-2"
      >
        {isDone && hideDone ? (
          <>
            {filteredCards.slice(0, 10).map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                columnId={column.id}
                compact={compactMode}
                onClick={() => onCardClick?.(card.id, column.id)}
              />
            ))}
            {cardCount > 10 && (
              <button
                onClick={onToggleHideDone}
                className="w-full text-center text-xs py-2 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  color: '#8a8494',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                Show all {cardCount} cards
              </button>
            )}
          </>
        ) : filteredCards.length === 0 ? (
          <div className="text-center text-xs py-4 italic" style={{ color: '#555060' }}>
            No cards
          </div>
        ) : (
          filteredCards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              compact={compactMode}
              onClick={() => onCardClick?.(card.id, column.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
