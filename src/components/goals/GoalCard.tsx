'use client';

import { useState } from 'react';
import type { Goal, GoalCategory } from '@/lib/types';

const CATEGORY_COLORS: Record<GoalCategory, { bg: string; text: string; glow: string; border: string }> = {
  financial: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'shadow-emerald-500/30', border: 'border-emerald-500/30' },
  health: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', glow: 'shadow-cyan-500/30', border: 'border-cyan-500/30' },
  business: { bg: 'bg-amber-500/15', text: 'text-amber-400', glow: 'shadow-amber-500/30', border: 'border-amber-500/30' },
  personal: { bg: 'bg-rose-500/15', text: 'text-rose-400', glow: 'shadow-rose-500/30', border: 'border-rose-500/30' },
  technical: { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'shadow-blue-500/30', border: 'border-blue-500/30' },
};

const CATEGORY_BAR_COLORS: Record<GoalCategory, string> = {
  financial: 'from-emerald-500 to-emerald-400',
  health: 'from-cyan-500 to-cyan-400',
  business: 'from-amber-500 to-amber-400',
  personal: 'from-rose-500 to-rose-400',
  technical: 'from-blue-500 to-blue-400',
};

function formatValue(value: number, unit: string): string {
  if (unit === '$') return `$${value.toLocaleString()}`;
  if (unit === '%') return `${value}%`;
  return `${value} ${unit}`;
}

function daysUntil(deadline: string): number {
  const now = new Date();
  const target = new Date(deadline);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface GoalCardProps {
  goal: Goal;
  onUpdate: (id: string, updates: Partial<Goal>) => Promise<void>;
}

export function GoalCard({ goal, onUpdate }: GoalCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCurrent, setEditCurrent] = useState(goal.current.toString());

  const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
  const colors = CATEGORY_COLORS[goal.category];
  const barColor = CATEGORY_BAR_COLORS[goal.category];
  const deadlineDays = goal.deadline ? daysUntil(goal.deadline) : null;

  async function handleSaveCurrent(): Promise<void> {
    const val = parseFloat(editCurrent);
    if (!isNaN(val)) {
      await onUpdate(goal.id, { current: val });
    }
    setIsEditing(false);
  }

  return (
    <div
      className={`
        bg-surface/80 backdrop-blur-sm rounded-xl border border-border
        hover:border-opacity-60 transition-all duration-300
        ${goal.status === 'completed' ? 'ring-1 ring-amber-500/30' : ''}
        ${goal.status === 'paused' ? 'opacity-60' : ''}
      `}
    >
      {/* Main card - clickable */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 focus:outline-none"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-semibold text-foreground truncate">{goal.title}</h3>
              {goal.status === 'completed' && <span className="text-amber-400 text-sm">✓</span>}
              {goal.status === 'active' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              )}
              {goal.status === 'paused' && (
                <span className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
              )}
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
              {goal.category}
            </span>
          </div>

          {/* Percentage circle */}
          <div className="flex-shrink-0 relative w-14 h-14">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${pct * 0.975} 97.5`}
                strokeLinecap="round"
                className={colors.text}
                style={{ filter: `drop-shadow(0 0 6px currentColor)` }}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colors.text}`}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 bg-border/50 rounded-full overflow-visible mb-3">
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
            style={{ width: `${pct}%`, boxShadow: `0 0 12px var(--tw-shadow-color, rgba(139,92,246,0.3))` }}
          />
          {/* Milestone markers */}
          {goal.milestones.map((ms) => {
            const msPct = Math.min((ms.value / goal.target) * 100, 100);
            return (
              <div
                key={ms.label}
                className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background transition-colors ${
                  ms.reached ? colors.text.replace('text-', 'bg-') : 'bg-border'
                }`}
                style={{ left: `${msPct}%`, marginLeft: '-5px' }}
                title={ms.label}
              />
            );
          })}
        </div>

        {/* Value display */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">
            {formatValue(goal.current, goal.unit)} / {formatValue(goal.target, goal.unit)}
          </span>
          {deadlineDays !== null && (
            <span className={`text-xs ${deadlineDays < 14 ? 'text-rose-400' : 'text-text-muted'}`}>
              {deadlineDays > 0 ? `${deadlineDays}d left` : deadlineDays === 0 ? 'Due today' : `${Math.abs(deadlineDays)}d overdue`}
            </span>
          )}
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
          {goal.description && (
            <p className="text-sm text-text-muted">{goal.description}</p>
          )}

          {/* Milestones list */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Milestones</p>
            {goal.milestones.map((ms) => (
              <div key={ms.label} className="flex items-center gap-2 text-sm">
                <span className={ms.reached ? 'text-emerald-400' : 'text-text-muted'}>
                  {ms.reached ? '✓' : '○'}
                </span>
                <span className={ms.reached ? 'text-foreground' : 'text-text-muted'}>{ms.label}</span>
                <span className="text-xs text-text-muted ml-auto">{formatValue(ms.value, goal.unit)}</span>
              </div>
            ))}
          </div>

          {/* Quick update */}
          <div className="flex items-center gap-2 pt-2">
            {isEditing ? (
              <>
                <input
                  type="number"
                  value={editCurrent}
                  onChange={(e) => setEditCurrent(e.target.value)}
                  className="w-24 px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:border-accent focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCurrent(); if (e.key === 'Escape') setIsEditing(false); }}
                  autoFocus
                />
                <button onClick={handleSaveCurrent} className="px-2 py-1.5 text-xs bg-accent/20 text-accent rounded hover:bg-accent/30">Save</button>
                <button onClick={() => setIsEditing(false)} className="px-2 py-1.5 text-xs text-text-muted hover:text-foreground">Cancel</button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditCurrent(goal.current.toString()); }}
                className="px-3 py-1.5 text-xs bg-surface-raised border border-border rounded hover:border-accent/30 text-text-muted hover:text-foreground transition-colors"
              >
                Update Progress
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
