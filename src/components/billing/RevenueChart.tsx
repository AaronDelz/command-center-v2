'use client';

import { useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius } from '@/styles/tokens';
import type { BillingPeriod } from '@/lib/types';

interface RevenueChartProps {
  allPeriods: BillingPeriod[];
  viewMonth: number;
  viewYear: number;
}

interface MonthData {
  label: string;
  total: number;
  month: number;
  year: number;
}

export function RevenueChart({ allPeriods, viewMonth, viewYear }: RevenueChartProps): React.ReactElement {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const months = useMemo((): MonthData[] => {
    const result: MonthData[] = [];
    // Show 6 months ending at viewMonth/viewYear
    for (let i = 5; i >= 0; i--) {
      let m = viewMonth - i;
      let y = viewYear;
      while (m <= 0) { m += 12; y--; }
      const total = allPeriods
        .filter(p => p.month === m && p.year === y)
        .reduce((s, p) => s + p.monthlyTotal, 0);
      const d = new Date(y, m - 1);
      result.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        total,
        month: m,
        year: y,
      });
    }
    return result;
  }, [allPeriods, viewMonth, viewYear]);

  const maxVal = Math.max(...months.map(m => m.total), 1);
  const chartHeight = 180;
  const barWidth = 48;
  const gap = 16;
  const chartWidth = months.length * (barWidth + gap) - gap;

  return (
    <GlassCard>
      <SectionHeading title="Revenue Trend" />
      <div style={{ marginTop: '16px', overflowX: 'auto' }}>
        <svg width={chartWidth + 60} height={chartHeight + 40} style={{ display: 'block', margin: '0 auto' }}>
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const val = Math.round(maxVal * pct);
            const y = chartHeight - (chartHeight * pct) + 10;
            return (
              <g key={pct}>
                <line x1={50} x2={chartWidth + 55} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                <text x={46} y={y + 4} textAnchor="end" fill={color.text.dim} fontSize={10} fontFamily="monospace">
                  ${val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {months.map((m, i) => {
            const barH = maxVal > 0 ? (m.total / maxVal) * chartHeight : 0;
            const x = 55 + i * (barWidth + gap);
            const y = chartHeight - barH + 10;
            const isHovered = hoveredIdx === i;
            const isCurrent = i === months.length - 1;

            return (
              <g key={`${m.month}-${m.year}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isCurrent ? color.ember.DEFAULT : color.ember.flame} stopOpacity={isHovered ? 1 : 0.8} />
                    <stop offset="100%" stopColor={isCurrent ? color.ember.coal : color.ember.smolder} stopOpacity={isHovered ? 0.9 : 0.6} />
                  </linearGradient>
                </defs>
                <rect
                  x={x} y={y} width={barWidth} height={barH}
                  rx={4} fill={`url(#bar-grad-${i})`}
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Hover value */}
                {isHovered && m.total > 0 && (
                  <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill={color.ember.flame} fontSize={11} fontWeight={700} fontFamily="monospace">
                    ${Math.round(m.total).toLocaleString()}
                  </text>
                )}
                {/* Month label */}
                <text x={x + barWidth / 2} y={chartHeight + 28} textAnchor="middle" fill={isCurrent ? color.ember.flame : color.text.dim} fontSize={11} fontWeight={isCurrent ? 600 : 400}>
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </GlassCard>
  );
}
