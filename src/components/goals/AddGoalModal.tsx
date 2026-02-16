'use client';

import { useState } from 'react';
import { GlassModal, GlassInput, GlassSelect, EmberButton } from '@/components/ui';
import { color, radius } from '@/styles/tokens';
import type { Goal, GoalCategory } from '@/lib/types';

const CATEGORIES: GoalCategory[] = ['financial', 'health', 'business', 'personal', 'technical'];

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Omit<Goal, 'id' | 'created'>) => Promise<void>;
}

export function AddGoalModal({ isOpen, onClose, onSubmit }: AddGoalModalProps): React.ReactElement | null {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = CATEGORIES.map((c) => ({
    value: c,
    label: c.charAt(0).toUpperCase() + c.slice(1),
  }));

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!title.trim() || !target || !unit.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        target: parseFloat(target),
        current: parseFloat(current) || 0,
        unit: unit.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        milestones: [],
        status: 'active',
      });
      setTitle(''); setDescription(''); setCategory('personal');
      setTarget(''); setCurrent('0'); setUnit(''); setDeadline('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GlassModal
      open={isOpen}
      onClose={onClose}
      title="New Goal"
      width="md"
      footer={
        <EmberButton
          variant="primary"
          size="md"
          onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          disabled={isSubmitting || !title.trim() || !target || !unit.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Goal'}
        </EmberButton>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassInput
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. $10K/mo Revenue"
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
            placeholder="Optional description..."
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

        <div className="grid grid-cols-2 gap-4">
          <GlassSelect
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
            options={categoryOptions}
          />
          <GlassInput
            label="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="$, %, clients, days"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <GlassInput
            label="Target"
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="10000"
          />
          <GlassInput
            label="Current"
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="0"
          />
        </div>

        <GlassInput
          label="Deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </form>
    </GlassModal>
  );
}
