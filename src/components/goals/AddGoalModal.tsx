'use client';

import { useState } from 'react';
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

  if (!isOpen) return null;

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
      // Reset
      setTitle(''); setDescription(''); setCategory('personal');
      setTarget(''); setCurrent('0'); setUnit(''); setDeadline('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">New Goal</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Title *</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-accent focus:outline-none"
              placeholder="e.g. $10K/mo Revenue"
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-accent focus:outline-none resize-none"
              rows={2} placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Category *</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-accent focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Unit *</label>
              <input
                type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-accent focus:outline-none"
                placeholder="$, %, clients, days"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Target *</label>
              <input
                type="number" value={target} onChange={(e) => setTarget(e.target.value)} required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-accent focus:outline-none"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Current</label>
              <input
                type="number" value={current} onChange={(e) => setCurrent(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-accent focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">Deadline</label>
            <input
              type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <button
            type="submit" disabled={isSubmitting || !title.trim() || !target || !unit.trim()}
            className="w-full py-2.5 rounded-lg bg-accent text-background font-medium hover:bg-accent-dim disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Creating...' : 'Create Goal'}
          </button>
        </form>
      </div>
    </div>
  );
}
