'use client';

import { useState } from 'react';
import { GlassModal, GlassInput, GlassSelect, EmberButton } from '@/components/ui';
import { color, radius } from '@/styles/tokens';
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

const priorityOptions = [
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

  const columnOptions = columns.map((col) => ({
    value: col.id,
    label: col.title,
  }));

  const ownerOptions = [
    { value: 'aaron', label: 'Aaron' },
    { value: 'orion', label: 'Orion' },
  ];

  const footer = isEditing ? (
    <div className="flex items-center justify-between w-full">
      <div>
        {!isNew && (
          showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: color.status.error }}>Delete this card?</span>
              <EmberButton variant="primary" size="sm" onClick={handleDelete}>
                Yes
              </EmberButton>
              <EmberButton variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                No
              </EmberButton>
            </div>
          ) : (
            <EmberButton variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <span style={{ color: color.status.error }}>Delete</span>
            </EmberButton>
          )
        )}
      </div>
      <div className="flex gap-2">
        <EmberButton variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </EmberButton>
        <EmberButton variant="primary" size="sm" onClick={handleSave}>
          {isNew ? 'Create' : 'Save'}
        </EmberButton>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between w-full">
      <div>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: color.status.error }}>Confirm?</span>
            <EmberButton variant="primary" size="sm" onClick={handleDelete}>
              Yes
            </EmberButton>
            <EmberButton variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              No
            </EmberButton>
          </div>
        ) : (
          <EmberButton variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <span style={{ color: color.status.error }}>Delete</span>
          </EmberButton>
        )}
      </div>
      <EmberButton variant="primary" size="sm" onClick={() => setIsEditing(true)}>
        Edit
      </EmberButton>
    </div>
  );

  return (
    <GlassModal
      open={true}
      onClose={onClose}
      title={isNew ? 'New Card' : isEditing ? 'Edit Card' : 'Card Details'}
      width="md"
      footer={footer}
    >
      {isEditing ? (
        <div className="space-y-4">
          <GlassInput
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title..."
            autoFocus
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 500, color: color.text.secondary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description..."
              style={{
                width: '100%',
                background: color.bg.surface,
                border: `1.5px solid ${color.glass.border}`,
                borderRadius: radius.lg,
                color: color.text.primary,
                padding: '10px 14px',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GlassSelect
              label="Owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              options={ownerOptions}
            />
            <GlassSelect
              label="Priority"
              value={priority ?? 'none'}
              onChange={(e) => setPriority(e.target.value as KanbanCard['priority'])}
              options={priorityOptions}
            />
          </div>

          <GlassInput
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <GlassInput
            label="Client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Client name (optional)..."
          />

          <GlassSelect
            label="Column"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
            options={columnOptions}
          />

          <GlassInput
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2, tag3..."
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 500, color: color.text.secondary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes..."
              style={{
                width: '100%',
                background: color.bg.surface,
                border: `1.5px solid ${color.glass.border}`,
                borderRadius: radius.lg,
                color: color.text.primary,
                padding: '10px 14px',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Mode */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: color.text.primary, marginBottom: '8px' }}>
              {card?.title}
            </h3>
            {card?.description && (
              <p style={{ fontSize: '0.875rem', color: color.text.secondary }}>{card.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: color.text.secondary }}>Owner:</span>
              <span className="ml-2 capitalize" style={{ color: color.text.primary }}>{card?.owner}</span>
            </div>
            <div>
              <span style={{ color: color.text.secondary }}>Priority:</span>
              <span className={`ml-2 px-2 py-0.5 rounded text-xs text-white ${priorityColors[currentPriority]}`}>
                {priorityOptions.find((p) => p.value === currentPriority)?.label}
              </span>
            </div>
          </div>

          {card?.client && (
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ color: color.text.secondary }}>Client:</span>
              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">{card.client}</span>
            </div>
          )}

          {card?.dueDate && (
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ color: color.text.secondary }}>Due:</span>
              <span className="ml-2" style={{ color: new Date(card.dueDate + 'T23:59:59') < new Date() ? color.status.error : color.text.primary }}>
                {new Date(card.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.875rem', color: color.text.secondary }}>Column:</span>
            <span className="ml-2" style={{ fontSize: '0.875rem', color: color.text.primary }}>
              {columns.find((c) => c.id === currentColumnId)?.title}
            </span>
          </div>

          {card?.tags && card.tags.length > 0 && (
            <div>
              <span style={{ fontSize: '0.875rem', color: color.text.secondary, display: 'block', marginBottom: '4px' }}>Tags:</span>
              <div className="flex flex-wrap gap-1">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs font-medium rounded"
                    style={{ background: 'rgba(255,107,53,0.15)', color: color.ember.DEFAULT }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card?.notes && (
            <div>
              <span style={{ fontSize: '0.875rem', color: color.text.secondary, display: 'block', marginBottom: '4px' }}>Notes:</span>
              <p style={{
                fontSize: '0.875rem',
                color: color.text.primary,
                background: color.bg.surface,
                borderRadius: radius.lg,
                padding: '12px',
                whiteSpace: 'pre-wrap',
              }}>
                {card.notes}
              </p>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: color.text.dim, paddingTop: '8px', borderTop: `1px solid ${color.glass.border}` }}>
            Created: {card?.created ? new Date(card.created).toLocaleString() : 'Unknown'}
            {card?.completed && (
              <span className="ml-4">
                Completed: {new Date(card.completed).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}
    </GlassModal>
  );
}
