'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius } from '@/styles/tokens';

interface Goal {
  icon: string;
  label: string;
  target: string;
  status: 'active' | 'paused' | 'future';
}

const goals: Goal[] = [
  { icon: '🏋️', label: 'Gym', target: '4x/week', status: 'active' },
  { icon: '🏃', label: 'Running', target: 'Reignite the streak', status: 'active' },
  { icon: '🥗', label: 'Nutrition', target: 'Clean eating, protein focus', status: 'active' },
  { icon: '😴', label: 'Sleep', target: '7+ hours consistently', status: 'active' },
  { icon: '🧘', label: 'Mobility', target: 'Daily stretching', status: 'future' },
];

const statusColors: Record<string, string> = {
  active: color.status.healthy,
  paused: color.status.warning,
  future: color.text.dim,
};

export function HealthGoals(): React.ReactElement {
  return (
    <GlassCard padding="md">
      <SectionHeading icon="🎯" title="HEALTH GOALS" size="md" />
      <div className="space-y-2">
        {goals.map((g) => (
          <div key={g.label} className="flex items-center gap-3" style={{ padding: '6px 0' }}>
            <span style={{ fontSize: '1.1rem' }}>{g.icon}</span>
            <div className="flex-1">
              <div style={{
                fontSize: typography.fontSize.body,
                color: color.text.primary,
                fontWeight: typography.fontWeight.medium,
              }}>
                {g.label}
              </div>
              <div style={{
                fontSize: typography.fontSize.caption,
                color: color.text.secondary,
              }}>
                {g.target}
              </div>
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: statusColors[g.status],
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
              fontWeight: typography.fontWeight.semibold,
            }}>
              {g.status}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
