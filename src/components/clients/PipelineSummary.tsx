'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { Client } from '@/lib/types';

interface PipelineSummaryProps {
  clients: Client[];
}

export function PipelineSummary({ clients }: PipelineSummaryProps): React.ReactElement {
  const active = clients.filter((c) => c.status === 'active');
  const pipeline = clients.filter((c) => c.status === 'pipeline');

  // Revenue calculations
  const monthlyRecurring = clients.reduce((sum, c) => {
    if (c.status !== 'active') return sum;
    return sum + (c.avgMonthly || 0) + (c.monthlyRetainer || 0);
  }, 0);

  const projectPipeline = clients.reduce((sum, c) => {
    if (c.status === 'closed') return sum;
    return sum + (c.projectValue || 0);
  }, 0);

  const stats = [
    { label: 'Active Clients', value: String(active.length), accent: color.status.healthy },
    { label: 'Pipeline', value: String(pipeline.length), accent: color.status.warning },
    { label: 'Monthly Recurring', value: `$${monthlyRecurring.toLocaleString()}`, accent: color.ember.flame },
    { label: 'Project Pipeline', value: `$${projectPipeline.toLocaleString()}`, accent: color.ember.DEFAULT },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
      {stats.map((stat) => (
        <GlassCard key={stat.label} padding="sm" hover={false}>
          <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: typography.fontWeight.bold,
              color: stat.accent,
              textShadow: `0 0 20px ${stat.accent}40`,
              marginBottom: '4px',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              letterSpacing: typography.letterSpacing.wider,
              textTransform: 'uppercase' as const,
            }}>
              {stat.label}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
