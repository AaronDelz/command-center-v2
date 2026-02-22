'use client';

import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius } from '@/styles/tokens';

interface Activity {
  date: string;
  activity: string;
  pace_min_mile: number;
  distance_miles: number;
}

interface PaceChartProps {
  activities: Activity[];
}

export function PaceChart({ activities }: PaceChartProps): React.ReactElement {
  // Only runs with valid pace, sorted chronologically
  const runs = useMemo(() =>
    activities
      .filter(a => a.activity === 'Running' && a.pace_min_mile > 0 && a.pace_min_mile < 20)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [activities]
  );

  // Chart dimensions
  const width = 800;
  const height = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Pace range (inverted: lower pace = faster = higher on chart)
  const minPace = Math.min(...runs.map(r => r.pace_min_mile));
  const maxPace = Math.max(...runs.map(r => r.pace_min_mile));
  const paceRange = maxPace - minPace || 1;

  // X: index-based, Y: inverted pace
  const points = runs.map((r, i) => ({
    x: padding.left + (i / Math.max(runs.length - 1, 1)) * chartW,
    y: padding.top + ((r.pace_min_mile - minPace) / paceRange) * chartH,
    pace: r.pace_min_mile,
    date: r.date,
    distance: r.distance_miles,
  }));

  // Find fastest run
  const fastestIdx = runs.reduce((best, r, i) => r.pace_min_mile < runs[best].pace_min_mile ? i : best, 0);

  // Moving average (20-run window)
  const windowSize = 20;
  const avgPoints = points.map((p, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = points.slice(start, i + 1);
    const avgPace = window.reduce((s, w) => s + w.pace, 0) / window.length;
    const y = padding.top + ((avgPace - minPace) / paceRange) * chartH;
    return { x: p.x, y };
  });

  const avgLine = avgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  function formatPace(pace: number): string {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Y-axis labels
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const pace = minPace + (paceRange / (yTicks - 1)) * i;
    return { pace, y: padding.top + (i / (yTicks - 1)) * chartH };
  });

  // Year markers on x-axis
  const yearMarkers: { x: number; year: string }[] = [];
  let lastYear = '';
  runs.forEach((r, i) => {
    const yr = r.date.slice(0, 4);
    if (yr !== lastYear) {
      yearMarkers.push({ x: points[i].x, year: yr });
      lastYear = yr;
    }
  });

  return (
    <GlassCard padding="md">
      <SectionHeading icon="📈" title="PACE TREND" badge={`${runs.length} runs`} size="md" />
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ minWidth: '500px' }}>
          {/* Grid lines */}
          {yLabels.map((yl, i) => (
            <g key={i}>
              <line x1={padding.left} y1={yl.y} x2={width - padding.right} y2={yl.y}
                stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" />
              <text x={padding.left - 6} y={yl.y + 3} textAnchor="end"
                fill={color.text.dim} fontSize="9" fontFamily={typography.fontFamily.mono}>
                {formatPace(yl.pace)}
              </text>
            </g>
          ))}

          {/* Year markers */}
          {yearMarkers.map((ym, i) => (
            <text key={i} x={ym.x} y={height - 5} textAnchor="middle"
              fill={color.text.dim} fontSize="8" fontFamily={typography.fontFamily.mono}>
              {ym.year}
            </text>
          ))}

          {/* Dots (faded) */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={1.5}
              fill={i === fastestIdx ? color.ember.molten : color.blue.DEFAULT}
              opacity={i === fastestIdx ? 1 : 0.2} />
          ))}

          {/* Moving average line */}
          <path d={avgLine} fill="none" stroke={color.ember.flame} strokeWidth={2} opacity={0.8} />

          {/* Fastest run highlight */}
          {points[fastestIdx] && (
            <>
              <circle cx={points[fastestIdx].x} cy={points[fastestIdx].y} r={5}
                fill="none" stroke={color.ember.molten} strokeWidth={1.5} />
              <text x={points[fastestIdx].x + 8} y={points[fastestIdx].y - 6}
                fill={color.ember.molten} fontSize="9" fontFamily={typography.fontFamily.mono}>
                ⚡ {formatPace(runs[fastestIdx].pace_min_mile)}/mi
              </text>
            </>
          )}

          {/* Axis labels */}
          <text x={padding.left - 6} y={padding.top - 2} textAnchor="end"
            fill={color.text.dim} fontSize="7">
            FASTER ↑
          </text>
          <text x={padding.left - 6} y={height - padding.bottom + 8} textAnchor="end"
            fill={color.text.dim} fontSize="7">
            SLOWER ↓
          </text>
        </svg>
      </div>
      <div style={{
        marginTop: '8px',
        fontSize: typography.fontSize.metadata,
        color: color.text.dim,
        textAlign: 'center',
      }}>
        Gold line = 20-run moving average · Dots = individual runs
      </div>
    </GlassCard>
  );
}
