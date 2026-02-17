'use client';

import { GlassCard } from '@/components/ui';

interface Metric {
  actual: number;
  target: number;
}

interface WeeklyScorecardProps {
  weekOf: string;
  metrics: {
    xPosts: Metric;
    communityPosts: Metric;
    youtubeVideos: Metric;
    youtubeLive: Metric;
    emailNewsletter: Metric;
    callsHeld: Metric;
  };
}

const metricConfig = [
  { key: 'xPosts', label: 'X Posts', icon: '𝕏' },
  { key: 'communityPosts', label: 'Community', icon: '👥' },
  { key: 'youtubeVideos', label: 'YT Videos', icon: '🎬' },
  { key: 'youtubeLive', label: 'YT Live', icon: '🔴' },
  { key: 'emailNewsletter', label: 'Newsletter', icon: '📧' },
  { key: 'callsHeld', label: 'Calls', icon: '📞' },
];

function getStatusColor(actual: number, target: number): string {
  const ratio = actual / target;
  if (ratio >= 0.8) return 'text-green-400';
  if (ratio >= 0.4) return 'text-amber-400';
  return 'text-red-400';
}

function getProgressColor(actual: number, target: number): string {
  const ratio = actual / target;
  if (ratio >= 0.8) return 'stroke-green-400';
  if (ratio >= 0.4) return 'stroke-amber-400';
  return 'stroke-red-400';
}

function ProgressRing({ actual, target }: { actual: number; target: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(actual / target, 1);
  const offset = circumference - ratio * circumference;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="transform -rotate-90">
      <circle cx="26" cy="26" r={radius} fill="none" stroke="#2a2a3a" strokeWidth="3" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        className={getProgressColor(actual, target)}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

export function WeeklyScorecard({ weekOf, metrics }: WeeklyScorecardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Weekly Scorecard</h2>
        <span className="text-sm text-text-muted">Week of {weekOf}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricConfig.map(({ key, label, icon }) => {
          const m = metrics[key as keyof typeof metrics];
          return (
            <GlassCard
              key={key}
              padding="sm"
              className="flex flex-col items-center gap-2"
            >
              <div className="relative">
                <ProgressRing actual={m.actual} target={m.target} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg">{icon}</span>
                </div>
              </div>
              <span className="text-xs text-text-muted font-medium">{label}</span>
              <span className={`text-sm font-bold ${getStatusColor(m.actual, m.target)}`}>
                {m.actual}/{m.target}
              </span>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
