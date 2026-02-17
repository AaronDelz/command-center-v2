'use client';

import { useState } from 'react';
import { GlassModal, GlassInput, GlassSelect, EmberButton } from '@/components/ui';
import { color, typography } from '@/styles/tokens';
import type { UnifiedItem } from './DropCard';

interface PromoteToKanbanProps {
  item: UnifiedItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPromote: (item: UnifiedItem, title: string, column: string, priority: string) => Promise<void>;
}

export function PromoteToKanban({ item, isOpen, onClose, onPromote }: PromoteToKanbanProps): React.ReactElement {
  const [title, setTitle] = useState('');
  const [column, setColumn] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when item changes
  const itemId = item?.id;
  const [lastItemId, setLastItemId] = useState<string | null>(null);
  if (itemId && itemId !== lastItemId) {
    setLastItemId(itemId);
    setTitle(item?.content.slice(0, 80) || '');
    setColumn('todo');
    setPriority('medium');
  }

  async function handleSubmit() {
    if (!item || !title.trim()) return;
    setIsSubmitting(true);
    try {
      await onPromote(item, title.trim(), column, priority);
      onClose();
    } catch (err) {
      console.error('Failed to promote:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GlassModal open={isOpen} onClose={onClose} title="🚀 Promote to Kanban">
      <div className="flex flex-col gap-4">
        <p
          style={{
            fontSize: typography.fontSize.caption,
            color: color.text.secondary,
            margin: 0,
          }}
        >
          Create a kanban card from this drop
        </p>

        <GlassInput
          label="Card Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the task?"
        />

        <GlassSelect
          label="Column"
          value={column}
          onChange={(e) => setColumn(e.target.value)}
          options={[
            { label: 'To Do', value: 'todo' },
            { label: 'On Deck', value: 'on-deck' },
            { label: 'Doing', value: 'doing' },
          ]}
        />

        <GlassSelect
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={[
            { label: '🔴 High', value: 'high' },
            { label: '🟡 Medium', value: 'medium' },
            { label: '🔵 Low', value: 'low' },
          ]}
        />

        <div className="flex justify-end gap-2 mt-2">
          <EmberButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </EmberButton>
          <EmberButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Promoting...' : '🚀 Promote'}
          </EmberButton>
        </div>
      </div>
    </GlassModal>
  );
}
