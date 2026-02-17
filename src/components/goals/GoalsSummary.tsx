'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Goal, GoalsData, GoalCategory } from '@/lib/types';
import { GlassCard } from '@/components/ui';

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  financial: 'text-emerald-400',
  health: 'text-cyan-400',
  business: 'text-amber-400',
  personal: 'text-rose-400',
  technical: 'text-blue-400',
};

const CATEGORY_BAR: Record<GoalCategory, string> = {
  financial: 'from-emerald-500 to-emerald-400',
  health: 'from-cyan-500 to-cyan-400',
  business: 'from-amber-500 to-amber-400',
  personal: 'from-rose-500 to-rose-400',
  technical: 'from-blue-500 to-blue-400',
};

const CATEGORY_GLOW: Record<GoalCategory, string> = {
  financial: 'rgba(16,185,129,0.3)',
  health: 'rgba(6,182,212,0.3)',
  business: 'rgba(245,158,11,0.3)',
  personal: 'rgba(244,63,94,0.3)',
  technical: 'rgba(59,130,246,0.3)',
};

const CATEGORY_ICONS: Record<GoalCategory, string> = {
  financial: '💰',
  health: '💪',
  business: '📈',
  personal: '🌹',
  technical: '🔧',
};

export function GoalsSummary(): React.ReactElement {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/goals')
      .then((r) => r.json())
      .then((data: GoalsData) => {
        setGoals(data.goals.filter((g) => g.status === 'active'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassCard padding="md">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎯</span>
          <h2 className="text-base font-semibold text-foreground">The Helm</h2>
        </div>
        <div className="h-24 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </GlassCard>
    );
  }

  if (goals.length === 0) {
    return (
      <Link href="/goals" className="block">
        <GlassCard padding="md" hover>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <h2 className="text-base font-semibold text-foreground">The Helm</h2>
          </div>
          <p className="text-sm text-text-muted">No active goals. Set your course →</p>
        </GlassCard>
      </Link>
    );
  }

  const avgProgress = Math.round(
    goals.reduce((sum, g) => sum + Math.min((g.current / g.target) * 100, 100), 0) / goals.length
  );

  return (
    <GlassCard padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h2 className="text-base font-semibold text-foreground">The Helm</h2>
          <span className="text-xs text-text-muted ml-1">{avgProgress}% avg</span>
        </div>
        <Link
          href="/goals"
          className="text-xs text-accent hover:text-accent-dim transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Goal bars */}
      <div className="space-y-3">
        {goals.slice(0, 5).map((goal) => {
          const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
          const barColor = CATEGORY_BAR[goal.category];
          const textColor = CATEGORY_COLORS[goal.category];
          const glow = CATEGORY_GLOW[goal.category];
          const icon = CATEGORY_ICONS[goal.category];

          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground truncate flex items-center gap-1.5">
                  <span className="text-xs">{icon}</span>
                  {goal.title}
                </span>
                <span className={`text-xs font-medium ${textColor} ml-2 flex-shrink-0`}>
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                  style={{ width: `${pct}%`, boxShadow: `0 0 8px ${glow}` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
