'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, animation, radius } from '@/styles/tokens';

interface YearData {
  year: string;
  count: number;
  miles: number;
}

interface YearlyHeatmapProps {
  byYear: Record<string, { count: number; miles: number }>;
}

export function YearlyHeatmap({ byYear }: YearlyHeatmapProps): React.ReactElement {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const years: YearData[] = Object.entries(byYear)
    .map(([year, data]) => ({ year, ...data }))
    .sort((a, b) => b.year.localeCompare(a.year));

  const maxMiles = Math.max(...years.map(y => y.miles));

  // Color intensity based on miles
  const getBarColor = (miles: number): string => {
    const ratio = miles / maxMiles;
    if (ratio > 0.7) return color.ember.flame;
    if (ratio > 0.4) return color.ember.DEFAULT;
    if (ratio > 0.15) return color.blue.DEFAULT;
    return color.text.dim;
  };

  const getBarGlow = (miles: number): string => {
    const ratio = miles / maxMiles;
    if (ratio > 0.7) return `0 0 12px rgba(255,179,71,0.4)`;
    if (ratio > 0.4) return `0 0 8px rgba(255,107,53,0.3)`;
    return 'none';
  };

  return (
    <GlassCard padding="md">
      <SectionHeading icon="📊" title="MILES BY YEAR" size="md" />
      <div className="space-y-2">
        {years.map((y) => {
          const pct = (y.miles / maxMiles) * 100;
          const isSelected = selectedYear === y.year;
          const barColor = getBarColor(y.miles);
          return (
            <div
              key={y.year}
              className="cursor-pointer"
              onClick={() => setSelectedYear(isSelected ? null : y.year)}
              style={{
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
                opacity: selectedYear && !isSelected ? 0.4 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  width: '40px',
                  fontFamily: typography.fontFamily.mono,
                  fontSize: typography.fontSize.caption,
                  color: isSelected ? color.ember.flame : color.text.secondary,
                  fontWeight: isSelected ? typography.fontWeight.bold : typography.fontWeight.regular,
                  flexShrink: 0,
                  textAlign: 'right',
                }}>
                  {y.year}
                </div>
                <div className="flex-1" style={{ position: 'relative', height: '22px' }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: radius.sm,
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${Math.max(pct, 1.5)}%`,
                    background: barColor,
                    borderRadius: radius.sm,
                    boxShadow: getBarGlow(y.miles),
                    transition: `width ${animation.duration.slow} ${animation.easing.default}`,
                  }} />
                </div>
                <div style={{
                  width: '70px',
                  textAlign: 'right',
                  fontFamily: typography.fontFamily.mono,
                  fontSize: typography.fontSize.caption,
                  color: barColor,
                  flexShrink: 0,
                }}>
                  {y.miles.toFixed(1)} mi
                </div>
              </div>
              {isSelected && (
                <div style={{
                  marginLeft: '52px',
                  marginTop: '4px',
                  fontSize: typography.fontSize.metadata,
                  color: color.text.secondary,
                  display: 'flex',
                  gap: '12px',
                }}>
                  <span>{y.count} activities</span>
                  <span>{(y.miles / Math.max(y.count, 1)).toFixed(1)} mi avg</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Story callout */}
      <div style={{
        marginTop: '16px',
        padding: '10px 14px',
        background: 'rgba(255,107,53,0.05)',
        borderRadius: radius.md,
        borderLeft: `3px solid ${color.ember.DEFAULT}`,
        fontSize: typography.fontSize.caption,
        color: color.text.secondary,
        lineHeight: typography.lineHeight.relaxed,
      }}>
        <strong style={{ color: color.ember.flame }}>Peak era:</strong> 2021–22 saw 419 activities and 658 miles.{' '}
        <span style={{ color: color.text.dim }}>Then 2023 dropped to 42 miles. The data doesn&apos;t lie.</span>
      </div>
    </GlassCard>
  );
}
