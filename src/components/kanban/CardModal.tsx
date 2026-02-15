'use client';

import { useState, useEffect, useCallback } from 'react';
import type { KanbanCard, KanbanColumn } from '@/lib/types';

interface CardModalProps {
  card: KanbanCard | null;
  columns: KanbanColumn[];
  currentColumnId: string;
  isNew?: boolean;
  onSave: (card: KanbanCard, columnId: string) => void;
  onDelete: (cardId: string, columnId: string) => void;
  onClose: () => void;
}

const priorityOptions: Array<{ value: KanbanCard['priority']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const priorityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-gray-500',
};

export function CardModal({
  card,
  columns,
  currentColumnId,
  isNew = false,
  onSave,
  onDelete,
  onClose,
}: CardModalProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(isNew);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [title, setTitle] = useState(card?.title ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [owner, setOwner] = useState(card?.owner ?? 'aaron');
  const [priority, setPriority] = useState<KanbanCard['priority']>(card?.priority ?? 'none');
  const [tags, setTags] = useState(card?.tags?.join(', ') ?? '');
  const [notes, setNotes] = useState(card?.notes ?? '');
  const [client, setClient] = useState(card?.client ?? '');
  const [dueDate, setDueDate] = useState(card?.dueDate ?? '');
  const [columnId, setColumnId] = useState(currentColumnId);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showDeleteConfirm) {
        setShowDeleteConfirm(false);
      } else {
        onClose();
      }
    }
  }, [onClose, showDeleteConfirm]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = () => {
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedCard: KanbanCard = {
      id: card?.id ?? `card-${Date.now()}`,
      title: title.trim() || 'Untitled',
      description: description.trim(),
      owner: owner.trim() || 'aaron',
      priority,
      tags: parsedTags,
      notes: notes.trim(),
      created: card?.created ?? new Date().toISOString(),
      completed: card?.completed,
      acknowledged: card?.acknowledged,
      ...(client.trim() ? { client: client.trim() } : {}),
      ...(dueDate ? { dueDate } : {}),
    };

    onSave(updatedCard, columnId);
    onClose();
  };

  const handleDelete = () => {
    if (card) {
      onDelete(card.id, currentColumnId);
      onClose();
    }
  };

  const handleCancel = () => {
    if (isNew) {
      onClose();
    } else {
      // Reset to original values
      setTitle(card?.title ?? '');
      setDescription(card?.description ?? '');
      setOwner(card?.owner ?? 'aaron');
      setPriority(card?.priority ?? 'none');
      setTags(card?.tags?.join(', ') ?? '');
      setNotes(card?.notes ?? '');
      setClient(card?.client ?? '');
      setDueDate(card?.dueDate ?? '');
      setColumnId(currentColumnId);
      setIsEditing(false);
    }
  };

  const currentPriority = priority ?? 'none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-accent/10 w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${priorityColors[currentPriority]}`} />
            <h2 className="text-lg font-semibold text-foreground">
              {isNew ? 'New Card' : isEditing ? 'Edit Card' : 'Card Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-foreground transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isEditing ? (
            <>
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="Card title..."
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                  placeholder="Brief description..."
                />
              </div>

              {/* Owner & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Owner</label>
                  <select
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    <option value="aaron">Aaron</option>
                    <option value="orion">Orion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Priority</label>
                  <select
                    value={priority ?? 'none'}
                    onChange={(e) => setPriority(e.target.value as KanbanCard['priority'])}
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Client</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="Client name (optional)..."
                />
              </div>

              {/* Column */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Column</label>
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="tag1, tag2, tag3..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{card?.title}</h3>
                {card?.description && (
                  <p className="text-sm text-text-muted">{card.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Owner:</span>
                  <span className="ml-2 text-foreground capitalize">{card?.owner}</span>
                </div>
                <div>
                  <span className="text-text-muted">Priority:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs text-white ${priorityColors[currentPriority]}`}>
                    {priorityOptions.find((p) => p.value === currentPriority)?.label}
                  </span>
                </div>
              </div>

              {card?.client && (
                <div className="text-sm">
                  <span className="text-text-muted">Client:</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">{card.client}</span>
                </div>
              )}

              {card?.dueDate && (
                <div className="text-sm">
                  <span className="text-text-muted">Due:</span>
                  <span className={`ml-2 ${new Date(card.dueDate + 'T23:59:59') < new Date() ? 'text-red-400' : 'text-foreground'}`}>
                    {new Date(card.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}

              <div>
                <span className="text-sm text-text-muted">Column:</span>
                <span className="ml-2 text-sm text-foreground">
                  {columns.find((c) => c.id === currentColumnId)?.title}
                </span>
              </div>

              {card?.tags && card.tags.length > 0 && (
                <div>
                  <span className="text-sm text-text-muted block mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-medium rounded bg-accent/20 text-accent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {card?.notes && (
                <div>
                  <span className="text-sm text-text-muted block mb-1">Notes:</span>
                  <p className="text-sm text-foreground bg-surface-raised rounded-lg p-3 whitespace-pre-wrap">
                    {card.notes}
                  </p>
                </div>
              )}

              <div className="text-xs text-text-muted pt-2 border-t border-border">
                Created: {card?.created ? new Date(card.created).toLocaleString() : 'Unknown'}
                {card?.completed && (
                  <span className="ml-4">
                    Completed: {new Date(card.completed).toLocaleString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-surface-raised/50">
          {isEditing ? (
            <>
              <div>
                {!isNew && (
                  showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">Delete this card?</span>
                      <button
                        onClick={handleDelete}
                        className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-2 py-1 text-xs bg-surface-raised hover:bg-surface text-text-muted rounded transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-1.5 text-sm text-text-muted hover:text-foreground hover:bg-surface-raised rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors"
                >
                  {isNew ? 'Create' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Delete
              </button>
              {showDeleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">Confirm?</span>
                  <button
                    onClick={handleDelete}
                    className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs bg-surface-raised hover:bg-surface text-text-muted rounded transition-colors"
                  >
                    No
                  </button>
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
