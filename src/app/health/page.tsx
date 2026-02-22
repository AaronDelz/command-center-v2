'use client';

import { useState, useEffect } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { HealthHero } from '@/components/health/HealthHero';
import { StreakDisplay } from '@/components/health/StreakDisplay';
import { YearlyHeatmap } from '@/components/health/YearlyHeatmap';
import { ActivityTimeline } from '@/components/health/ActivityTimeline';
import { PaceChart } from '@/components/health/PaceChart';
import { HealthGoals } from '@/components/health/HealthGoals';
import { ChallengeCard } from '@/components/health/ChallengeCard';
import { color, typography, animation, layout } from '@/styles/tokens';

interface HealthData {
  summary: {
    total_miles: number;
    total_hours: number;
    total_activities: number;
    by_type: Record<string, { count: number; miles: number }>;
    by_year: Record<string, { count: number; miles: number }>;
    running: {
      total_runs: number;
      total_miles: number;
      avg_pace_min_mile: number;
      fastest_pace: number;
      longest_run_miles: number;
    };
  };
  activities: Array<{
    date: string;
    activity: string;
    distance_miles: number;
    duration_min: number;
    pace_min_mile: number;
    elev_gain_ft: number;
  }>;
  streaks: {
    longest: number;
    longestStart: string;
    longestEnd: string;
    personalRecord?: number;
    current: number;
    lastActivity: string;
    daysSinceLast: number;
  };
}

type ViewMode = 'overview' | 'history' | 'trends';

export default function HealthPage(): React.ReactElement {
  const [data, setData] = useState<HealthData | null>(null);
  const [view, setView] = useState<ViewMode>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: layout.pageGutter, maxWidth: layout.maxContentWidth, margin: '0 auto' }}>
        <div style={{ color: color.text.secondary, textAlign: 'center', padding: '80px 0' }}>
          Loading health data...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: layout.pageGutter, maxWidth: layout.maxContentWidth, margin: '0 auto' }}>
        <div style={{ color: color.status.error, textAlign: 'center', padding: '80px 0' }}>
          Failed to load health data
        </div>
      </div>
    );
  }

  const views: { key: ViewMode; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'history', label: 'History' },
    { key: 'trends', label: 'Trends' },
  ];

  return (
    <div style={{ padding: layout.pageGutter, maxWidth: layout.maxContentWidth, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 style={{
            fontFamily: typography.fontFamily.display,
            fontSize: typography.fontSize.masthead,
            color: color.text.primary,
            letterSpacing: typography.letterSpacing.widest,
            margin: 0,
          }}>
            🏋️ THE CRUCIBLE
          </h1>
          <p style={{
            fontSize: typography.fontSize.caption,
            color: color.text.secondary,
            marginTop: '4px',
            fontStyle: 'italic',
          }}>
            Where iron meets truth — {data.summary.total_activities} activities since 2009
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1" style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '3px',
        }}>
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.caption,
                fontWeight: view === v.key ? typography.fontWeight.semibold : typography.fontWeight.regular,
                color: view === v.key ? color.ember.flame : color.text.secondary,
                background: view === v.key ? 'rgba(255,107,53,0.1)' : 'transparent',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview View */}
      {view === 'overview' && (
        <div className="space-y-6">
          <HealthHero
            totalMiles={data.summary.total_miles}
            totalRuns={data.summary.running.total_runs}
            avgPace={data.summary.running.avg_pace_min_mile}
            longestRun={data.summary.running.longest_run_miles}
            totalHours={data.summary.total_hours}
            fastestPace={data.summary.running.fastest_pace}
          />
          <StreakDisplay {...data.streaks} />
          <ChallengeCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <YearlyHeatmap byYear={data.summary.by_year} />
            <HealthGoals />
          </div>
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div className="space-y-6">
          <HealthHero
            totalMiles={data.summary.total_miles}
            totalRuns={data.summary.running.total_runs}
            avgPace={data.summary.running.avg_pace_min_mile}
            longestRun={data.summary.running.longest_run_miles}
            totalHours={data.summary.total_hours}
            fastestPace={data.summary.running.fastest_pace}
          />
          <ActivityTimeline activities={data.activities} limit={50} />
        </div>
      )}

      {/* Trends View */}
      {view === 'trends' && (
        <div className="space-y-6">
          <PaceChart activities={data.activities} />
          <YearlyHeatmap byYear={data.summary.by_year} />
        </div>
      )}
    </div>
  );
}
