'use client';

import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography } from '@/styles/tokens';
import type { TimeEntry } from '@/lib/types';

interface RevenueSummaryProps {
  entries: TimeEntry[];
}

interface MonthBucket {
  label: string;
  value: number;
  hours: number;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function RevenueSummary({ entries }: RevenueSummaryProps): React.ReactElement {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthKey = getMonthKey(now);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonthKey = getMonthKey(lastMonth);

    // Group by month
    const months: Record<string, MonthBucket> = {};

    for (const entry of entries) {
      if (!entry.duration || entry.isRunning) continue;
      const date = new Date(entry.startTime);
      const key = getMonthKey(date);
      if (!months[key]) {
        months[key] = { label: getMonthLabel(key), value: 0, hours: 0 };
      }
      months[key].hours += entry.duration / 60;
      if (entry.billable && entry.rate) {
        months[key].value += (entry.duration / 60) * entry.rate;
      }
    }

    const thisMonth = months[thisMonthKey] || { value: 0, hours: 0 };
    const lastMonthData = months[lastMonthKey] || { value: 0, hours: 0 };

    // YTD
    const yearStart = `${now.getFullYear()}-01`;
    const ytdMonths = Object.entries(months).filter(([k]) => k >= yearStart);
    const ytdValue = ytdMonths.reduce((sum, [, m]) => sum + m.value, 0);
    const ytdHours = ytdMonths.reduce((sum, [, m]) => sum + m.hours, 0);

    // Average (all months with data)
    const monthValues = Object.values(months).filter(m => m.value > 0);
    const avgValue = monthValues.length > 0
      ? monthValues.reduce((sum, m) => sum + m.value, 0) / monthValues.length
      : 0;

    // Change from last month
    const change = lastMonthData.value > 0
      ? ((thisMonth.value - lastMonthData.value) / lastMonthData.value) * 100
      : thisMonth.value > 0 ? 100 : 0;

    return {
      thisMonth: { value: thisMonth.value, hours: thisMonth.hours },
      lastMonth: { value: lastMonthData.value, hours: lastMonthData.hours },
      ytd: { value: ytdValue, hours: ytdHours },
      average: { value: avgValue },
      change,
    };
  }, [entries]);

  const cards = [
    {
      label: 'This Month',
      value: `$${Math.round(stats.thisMonth.value).toLocaleString()}`,
      sub: `${stats.thisMonth.hours.toFixed(1)}h tracked`,
      color: color.ember.flame,
      change: stats.change,
    },
    {
      label: 'Last Month',
      value: `$${Math.round(stats.lastMonth.value).toLocaleString()}`,
      sub: `${stats.lastMonth.hours.toFixed(1)}h tracked`,
      color: color.text.primary,
    },
    {
      label: 'YTD Revenue',
      value: `$${Math.round(stats.ytd.value).toLocaleString()}`,
      sub: `${stats.ytd.hours.toFixed(1)}h total`,
      color: color.status.healthy,
    },
    {
      label: 'Monthly Avg',
      value: `$${Math.round(stats.average.value).toLocaleString()}`,
      sub: 'across all months',
      color: color.blue.DEFAULT,
    },
  ];

  return (
    <div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      {cards.map((card) => (
        <GlassCard key={card.label} padding="sm">
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '6px',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: typography.fontWeight.bold,
              color: card.color,
              lineHeight: 1.2,
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              marginTop: '4px',
            }}>
              {card.sub}
            </div>
            {card.change !== undefined && card.change !== 0 && (
              <div style={{
                fontSize: typography.fontSize.metadata,
                color: card.change > 0 ? color.status.healthy : color.status.error,
                marginTop: '2px',
                fontWeight: typography.fontWeight.medium,
              }}>
                {card.change > 0 ? '↑' : '↓'} {Math.abs(Math.round(card.change))}% vs last month
              </div>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
    <div style={{ textAlign: 'right', marginBottom: '12px' }}>
      <a href="/billing" style={{
        fontSize: typography.fontSize.caption,
        color: color.ember.flame,
        textDecoration: 'none',
        fontWeight: typography.fontWeight.medium,
      }}>
        View full billing →
      </a>
    </div>
    </div>
  );
}
