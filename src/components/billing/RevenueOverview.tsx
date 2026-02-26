'use client';

import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, radius } from '@/styles/tokens';
import type { BillingPeriod } from '@/lib/types';

interface RevenueOverviewProps {
  allPeriods: BillingPeriod[];
  viewMonth: number;
  viewYear: number;
}

export function RevenueOverview({ allPeriods, viewMonth, viewYear }: RevenueOverviewProps): React.ReactElement {
  const stats = useMemo(() => {
    const thisMonth = allPeriods
      .filter(p => p.month === viewMonth && p.year === viewYear)
      .reduce((s, p) => s + p.monthlyTotal, 0);

    // Previous month
    const pm = viewMonth === 1 ? 12 : viewMonth - 1;
    const py = viewMonth === 1 ? viewYear - 1 : viewYear;
    const lastMonth = allPeriods
      .filter(p => p.month === pm && p.year === py)
      .reduce((s, p) => s + p.monthlyTotal, 0);

    const ytd = allPeriods
      .filter(p => p.year === viewYear)
      .reduce((s, p) => s + p.monthlyTotal, 0);

    const allTime = allPeriods.reduce((s, p) => s + p.monthlyTotal, 0);

    // Delta calculation
    const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;

    return { thisMonth, lastMonth, ytd, allTime, delta };
  }, [allPeriods, viewMonth, viewYear]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const cards = [
    { label: 'This Month', value: stats.thisMonth, accent: color.ember.DEFAULT, delta: stats.delta },
    { label: 'Last Month', value: stats.lastMonth, accent: color.text.secondary },
    { label: `${viewYear} YTD`, value: stats.ytd, accent: color.ember.flame },
    { label: 'All Time', value: stats.allTime, accent: color.category.systems },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
      {cards.map((card) => (
        <GlassCard key={card.label} padding="sm" hover={false}>
          <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: typography.fontWeight.bold,
              color: card.accent,
              textShadow: `0 0 20px ${card.accent}40`,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '4px',
            }}>
              {fmt(card.value)}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              letterSpacing: typography.letterSpacing.wider,
              textTransform: 'uppercase',
            }}>
              {card.label}
            </div>
            {card.delta !== undefined && (
              <div style={{
                fontSize: typography.fontSize.metadata,
                color: card.delta >= 0 ? color.status.healthy : color.status.error,
                marginTop: '4px',
                fontWeight: typography.fontWeight.semibold,
              }}>
                {card.delta >= 0 ? '▲' : '▼'} {Math.abs(Math.round(card.delta))}% vs last month
              </div>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
