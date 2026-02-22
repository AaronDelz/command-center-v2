'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, shadow } from '@/styles/tokens';

interface HealthHeroProps {
  totalMiles: number;
  totalRuns: number;
  avgPace: number;
  longestRun: number;
  totalHours: number;
  fastestPace: number;
}

function formatPace(decimalPace: number): string {
  const mins = Math.floor(decimalPace);
  const secs = Math.round((decimalPace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function HealthHero({ totalMiles, totalRuns, avgPace, longestRun, totalHours, fastestPace }: HealthHeroProps): React.ReactElement {
  const stats = [
    { label: 'Total Miles', value: totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 }), icon: '🔥', accent: color.ember.flame },
    { label: 'Total Runs', value: totalRuns.toString(), icon: '🏃', accent: color.ember.DEFAULT },
    { label: 'Hours Logged', value: totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 }), icon: '⏱️', accent: color.blue.DEFAULT },
    { label: 'Avg Pace', value: `${formatPace(avgPace)}/mi`, icon: '📊', accent: color.text.secondary },
    { label: 'Fastest Pace', value: `${formatPace(fastestPace)}/mi`, icon: '⚡', accent: color.status.healthy },
    { label: 'Longest Run', value: `${longestRun} mi`, icon: '🏔️', accent: color.category.health },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <GlassCard key={stat.label} padding="sm" hover>
          <div className="text-center">
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{
              fontFamily: typography.fontFamily.mono,
              fontSize: '1.3rem',
              fontWeight: typography.fontWeight.bold,
              color: stat.accent,
              lineHeight: typography.lineHeight.tight,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
              marginTop: '4px',
            }}>
              {stat.label}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
