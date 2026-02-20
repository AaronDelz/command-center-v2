'use client';

import { useState, useEffect, useRef } from 'react';
import { GlassModal, GlassInput, GlassSelect, EmberButton } from '@/components/ui';
import { color, radius, typography, animation } from '@/styles/tokens';
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

  // Client dropdown
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [addingNewClient, setAddingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Single source of truth: clients.json via Client Command
    // NEVER pull client names from kanban cards or time entries — those can have garbage data
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        const names: string[] = (data.clients || [])
          .filter((c: { name: string; status?: string }) => c.status !== 'closed')
          .map((c: { name: string }) => c.name)
          .filter(Boolean)
          .sort();
        setClientNames(names);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
        setAddingNewClient(false);
        setNewClientName('');
      }
    }
    if (clientDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clientDropdownOpen]);

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
    { value: 'none', label: 'Unassigned' },
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

          {/* Client dropdown */}
          <div ref={clientDropdownRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 500, color: color.text.secondary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Client
            </label>
            <button
              type="button"
              onClick={() => { setClientDropdownOpen((o) => !o); setAddingNewClient(false); }}
              style={{
                padding: '10px 14px',
                background: color.bg.surface,
                border: `1px solid ${clientDropdownOpen ? color.ember.DEFAULT : color.glass.border}`,
                borderRadius: radius.md,
                color: client ? color.text.primary : color.text.dim,
                fontSize: typography.fontSize.body,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: `border-color ${animation.duration.fast}`,
              }}
            >
              <span>{client || 'Select client (optional)…'}</span>
              <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>{clientDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {clientDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#1a1a24',
                border: `1px solid ${color.glass.border}`,
                borderRadius: radius.md,
                zIndex: 9999,
                maxHeight: '220px',
                overflowY: 'auto',
                boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
              }}>
                {/* Clear option */}
                <button
                  type="button"
                  onClick={() => { setClient(''); setClientDropdownOpen(false); }}
                  style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: color.text.dim, fontSize: typography.fontSize.body, textAlign: 'left', cursor: 'pointer', borderBottom: `1px solid ${color.glass.border}` }}
                >
                  — None —
                </button>

                {/* Client list */}
                {clientNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setClient(name); setClientDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      background: client === name ? `${color.ember.DEFAULT}20` : 'none',
                      border: 'none',
                      color: client === name ? color.ember.DEFAULT : color.text.primary,
                      fontSize: typography.fontSize.body,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${color.glass.border}20`,
                    }}
                    onMouseEnter={(e) => { if (client !== name) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { if (client !== name) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {name}
                  </button>
                ))}

                {/* Add new client */}
                {!addingNewClient ? (
                  <button
                    type="button"
                    onClick={() => setAddingNewClient(true)}
                    style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderTop: `1px solid ${color.glass.border}`, color: color.ember.DEFAULT, fontSize: typography.fontSize.body, textAlign: 'left', cursor: 'pointer', fontWeight: 500 }}
                  >
                    + Add New Client
                  </button>
                ) : (
                  <div style={{ padding: '8px 10px', borderTop: `1px solid ${color.glass.border}`, display: 'flex', gap: '6px' }}>
                    <input
                      autoFocus
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newClientName.trim()) {
                          const name = newClientName.trim();
                          setClientNames((prev) => Array.from(new Set([...prev, name])).sort());
                          setClient(name);
                          setClientDropdownOpen(false);
                          setAddingNewClient(false);
                          setNewClientName('');
                        }
                        if (e.key === 'Escape') { setAddingNewClient(false); setNewClientName(''); }
                      }}
                      placeholder="Client name…"
                      style={{ flex: 1, padding: '6px 10px', background: color.bg.surface, border: `1px solid ${color.ember.DEFAULT}`, borderRadius: radius.sm, color: color.text.primary, fontSize: typography.fontSize.body, outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const name = newClientName.trim();
                        if (!name) return;
                        setClientNames((prev) => Array.from(new Set([...prev, name])).sort());
                        setClient(name);
                        setClientDropdownOpen(false);
                        setAddingNewClient(false);
                        setNewClientName('');
                      }}
                      style={{ padding: '6px 12px', background: color.ember.DEFAULT, border: 'none', borderRadius: radius.sm, color: '#fff', fontSize: typography.fontSize.body, cursor: 'pointer', fontWeight: 500 }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
