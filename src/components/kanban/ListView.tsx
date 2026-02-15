'use client';

import { useState, useRef } from 'react';
import type { KanbanData, KanbanCard, KanbanColumn } from '@/lib/types';

interface ListViewProps {
  data: KanbanData;
  ownerFilter: string;
  clientFilter?: string;
  sortMode?: 'default' | 'dueDate' | 'priority';
  hideDone?: boolean;
  onToggleHideDone?: () => void;
  onCardClick: (cardId: string, columnId: string) => void;
  onMoveCard: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  onAddCard: (card: Partial<KanbanCard>, columnId: string) => void;
}

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

function sortCards(cards: KanbanCard[], mode: string): KanbanCard[] {
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

const columnIcons: Record<string, string> = {
  ideas: '💡',
  todo: '📋',
  'on-deck': '🎯',
  doing: '🔨',
  done: '✅',
};

const priorityDotColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return due < today;
}

export function ListView({ data, ownerFilter, clientFilter = 'all', sortMode = 'default', hideDone = true, onToggleHideDone, onCardClick, onMoveCard, onAddCard }: ListViewProps): React.ReactElement {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [quickOwner, setQuickOwner] = useState('aaron');
  const [quickDue, setQuickDue] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [quickNotes, setQuickNotes] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleCollapse = (colId: string) => {
    setCollapsed((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    onAddCard(
      {
        title: quickTitle.trim(),
        priority: quickPriority,
        owner: quickOwner,
        ...(quickDue ? { dueDate: quickDue } : {}),
        ...(quickNotes.trim() ? { notes: quickNotes.trim() } : {}),
      },
      'todo'
    );
    setQuickTitle('');
    setQuickPriority('none');
    setQuickDue('');
    setQuickNotes('');
    setShowNotes(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const handleCheckbox = (card: KanbanCard, columnId: string) => {
    if (columnId === 'done') {
      onMoveCard(card.id, 'done', 'todo');
    } else {
      onMoveCard(card.id, columnId, 'done');
    }
  };

  const filterCards = (cards: KanbanCard[]) => {
    let result = ownerFilter === 'all' ? cards : cards.filter((c) => c.owner === ownerFilter);
    if (clientFilter !== 'all') {
      result = result.filter((c) => c.client === clientFilter);
    }
    return sortCards(result, sortMode);
  };

  return (
    <div className="space-y-3">
      {/* Quick Add Bar */}
      <div className="bg-surface-raised/60 border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-accent text-lg">+</span>
          <input
            ref={inputRef}
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            autoFocus
            className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-text-muted focus:outline-none"
          />
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as 'none' | 'low' | 'medium' | 'high')}
            className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accent"
          >
            <option value="none">Priority</option>
            <option value="low">Low</option>
            <option value="medium">Med</option>
            <option value="high">High</option>
          </select>
          <select
            value={quickOwner}
            onChange={(e) => setQuickOwner(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accent"
          >
            <option value="aaron">Aaron</option>
            <option value="orion">Orion</option>
          </select>
          <input
            type="date"
            value={quickDue}
            onChange={(e) => setQuickDue(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accent w-[130px]"
          />
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-text-muted hover:text-foreground transition-colors text-xs px-1"
            title="Add notes"
          >
            ···
          </button>
          <button
            onClick={handleQuickAdd}
            disabled={!quickTitle.trim()}
            className="px-3 py-1 text-xs bg-accent hover:bg-accent/90 disabled:opacity-30 text-white rounded transition-colors"
          >
            Add
          </button>
        </div>
        {showNotes && (
          <textarea
            value={quickNotes}
            onChange={(e) => setQuickNotes(e.target.value)}
            placeholder="Notes..."
            rows={2}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
          />
        )}
      </div>

      {/* Task List by Column */}
      {data.columns.map((column) => {
        const cards = filterCards(column.cards);
        const isDone = column.id === 'done';
        const isCollapsed = isDone ? (hideDone && !(collapsed[column.id] === false)) || (collapsed[column.id] ?? false) : (collapsed[column.id] ?? false);
        const icon = columnIcons[column.id] ?? '📌';

        return (
          <div key={column.id}>
            {/* Column Header */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => isDone && hideDone ? onToggleHideDone?.() : toggleCollapse(column.id)}
                className="flex items-center gap-2 flex-1 text-left px-2 py-1.5 hover:bg-surface-raised/40 rounded transition-colors"
              >
                <svg
                  className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6 4l8 6-8 6V4z" />
                </svg>
                <span className="text-sm">{icon}</span>
                <span className="text-sm font-medium text-foreground">{column.title}</span>
                <span className="text-xs text-text-muted">({cards.length})</span>
              </button>
              {isDone && onToggleHideDone && (
                <button
                  onClick={onToggleHideDone}
                  className="text-text-muted hover:text-foreground transition-colors p-1"
                  title={hideDone ? 'Show done tasks' : 'Hide done tasks'}
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
            </div>

            {/* Rows */}
            {!isCollapsed && (
              <div className="ml-2">
                {cards.length === 0 ? (
                  <div className="px-6 py-2 text-xs text-text-muted italic">No tasks</div>
                ) : (
                  cards.map((card) => {
                    const priority = card.priority ?? 'none';
                    const hasPriority = priority !== 'none';
                    const overdue = card.dueDate ? isOverdue(card.dueDate) : false;

                    return (
                      <div
                        key={card.id}
                        className={`flex items-center gap-3 px-3 py-1.5 hover:bg-surface-raised/40 rounded transition-colors group ${
                          isDone ? 'opacity-40' : ''
                        }`}
                        style={{ minHeight: '34px' }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckbox(card, column.id);
                          }}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-accent/60 border-accent/60'
                              : 'border-border hover:border-accent'
                          }`}
                        >
                          {isDone && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Title */}
                        <button
                          onClick={() => onCardClick(card.id, column.id)}
                          className={`flex-1 text-left text-sm truncate transition-colors ${
                            isDone
                              ? 'line-through text-text-muted'
                              : 'text-foreground hover:text-accent'
                          }`}
                        >
                          {card.title}
                        </button>

                        {/* Owner */}
                        <span className="text-xs text-text-muted w-14 text-right capitalize flex-shrink-0">
                          {card.owner}
                        </span>

                        {/* Priority Dot */}
                        <div className="w-5 flex justify-center flex-shrink-0">
                          {hasPriority && (
                            <div className={`w-2 h-2 rounded-full ${priorityDotColors[priority]}`} title={priority} />
                          )}
                        </div>

                        {/* Due Date */}
                        <span className={`text-xs w-16 text-right flex-shrink-0 ${
                          overdue && !isDone ? 'text-red-400 font-medium' : 'text-text-muted'
                        }`}>
                          {card.dueDate ? formatShortDate(card.dueDate) : ''}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
