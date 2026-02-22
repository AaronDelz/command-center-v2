'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius } from '@/styles/tokens';

interface Activity {
  date: string;
  activity: string;
  distance_miles: number;
  duration_min: number;
  pace_min_mile: number;
  elev_gain_ft: number;
}

interface ActivityTimelineProps {
  activities: Activity[];
  limit?: number;
}

const typeIcons: Record<string, string> = {
  Running: '🏃',
  Walking: '🚶',
  Hiking: '🥾',
  Cycling: '🚴',
  Other: '💪',
};

function formatPace(pace: number): string {
  if (!pace || pace === 0) return '—';
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ActivityTimeline({ activities, limit = 30 }: ActivityTimelineProps): React.ReactElement {
  const shown = activities.slice(0, limit);

  return (
    <GlassCard padding="md">
      <SectionHeading icon="📜" title="RECENT ACTIVITIES" badge={activities.length} size="md" />
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div className="space-y-1">
          {shown.map((a, i) => (
            <div
              key={`${a.date}-${i}`}
              className="flex items-center gap-3"
              style={{
                padding: '8px 10px',
                borderRadius: radius.sm,
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              }}
            >
              <div style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.metadata,
                color: color.text.dim,
                width: '72px',
                flexShrink: 0,
              }}>
                {a.date}
              </div>
              <div style={{ fontSize: '0.9rem', width: '20px', flexShrink: 0, textAlign: 'center' }}>
                {typeIcons[a.activity] || '💪'}
              </div>
              <div style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.caption,
                color: color.ember.flame,
                width: '55px',
                flexShrink: 0,
                textAlign: 'right',
              }}>
                {a.distance_miles.toFixed(1)} mi
              </div>
              <div style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.caption,
                color: color.text.secondary,
                width: '50px',
                flexShrink: 0,
                textAlign: 'right',
              }}>
                {formatDuration(a.duration_min)}
              </div>
              <div style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.caption,
                color: a.pace_min_mile > 0 && a.pace_min_mile < 8 ? color.status.healthy : color.text.secondary,
                width: '50px',
                flexShrink: 0,
                textAlign: 'right',
              }}>
                {formatPace(a.pace_min_mile)}/mi
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
