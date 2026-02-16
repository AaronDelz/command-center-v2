'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmberButton, GlassPill } from '@/components/ui';
import type { Goal, GoalCategory, GoalsData } from '@/lib/types';
import { color } from '@/styles/tokens';

const CATEGORY_FILTERS: Array<{ key: GoalCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'financial', label: '💰 Financial' },
  { key: 'business', label: '📈 Business' },
  { key: 'health', label: '💪 Health' },
  { key: 'personal', label: '🌹 Personal' },
  { key: 'technical', label: '🔧 Technical' },
];

export default function HelmPage(): React.ReactElement {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GoalCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = await res.json() as GoalsData;
      setGoals(data.goals);
      setError(null);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function handleUpdate(id: string, updates: Partial<Goal>): Promise<void> {
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    const updated = await res.json() as Goal;
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  }

  async function handleAddGoal(goalData: Omit<Goal, 'id' | 'created'>): Promise<void> {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      created: new Date().toISOString(),
    };
    const newData: GoalsData = {
      goals: [...goals, newGoal],
      lastUpdated: new Date().toISOString(),
    };
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    if (!res.ok) throw new Error('Failed to add goal');
    setGoals(newData.goals);
  }

  const filtered = filter === 'all' ? goals : goals.filter((g) => g.category === filter);
  const activeCount = goals.filter((g) => g.status === 'active').length;
  const completedCount = goals.filter((g) => g.status === 'completed').length;
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + Math.min((g.current / g.target) * 100, 100), 0) / goals.length)
    : 0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <PageHeader
        title="🎯 The Helm"
        subtitle={`Navigate your trajectory — ${activeCount} active · ${completedCount} completed · ${avgProgress}% avg`}
        actions={
          <EmberButton onClick={() => setIsModalOpen(true)}>
            <span className="text-lg">+</span>
            <span className="hidden sm:inline">Add Goal</span>
          </EmberButton>
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORY_FILTERS.map(({ key, label }) => (
          <GlassPill
            key={key}
            variant="ember"
            size="md"
            active={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </GlassPill>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: color.ember.DEFAULT, borderTopColor: 'transparent' }}
          />
        </div>
      ) : error ? (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: color.status.error,
          }}
        >
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: color.text.secondary }}>
          <p className="text-4xl mb-3">🎯</p>
          <p>No goals yet. Set your course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((goal, i) => (
            <div
              key={goal.id}
              className={
                filtered.length % 2 === 1 && i === filtered.length - 1 && filtered.length > 1
                  ? 'md:col-span-2 xl:col-span-1'
                  : ''
              }
            >
              <GoalCard goal={goal} onUpdate={handleUpdate} />
            </div>
          ))}
        </div>
      )}

      <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddGoal} />
    </div>
  );
}
