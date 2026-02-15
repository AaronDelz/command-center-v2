'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import type { Goal, GoalCategory, GoalsData } from '@/lib/types';

const CATEGORY_FILTERS: Array<{ key: GoalCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'financial', label: '💰 Financial' },
  { key: 'business', label: '📈 Business' },
  { key: 'health', label: '💪 Health' },
  { key: 'personal', label: '🌹 Personal' },
  { key: 'technical', label: '🔧 Technical' },
];

export default function GoalsPage(): React.ReactElement {
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
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
            <span className="text-2xl">🎯</span> The Helm
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            Navigate your trajectory
            <span className="ml-3 text-xs">
              {activeCount} active · {completedCount} completed · {avgProgress}% avg
            </span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 min-h-[44px] rounded-lg bg-accent text-background font-medium hover:bg-accent-dim active:scale-95 transition-all duration-200 flex items-center gap-2 flex-shrink-0"
        >
          <span className="text-lg">+</span>
          <span className="hidden sm:inline">Add Goal</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORY_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border
              ${filter === key
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-surface-raised/40 border-border text-text-muted hover:border-accent/30 hover:text-foreground'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
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
