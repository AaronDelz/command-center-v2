'use client';

import { useState, useEffect } from 'react';
import { GlassCard, SectionHeading } from '@/components/ui';
import { color, typography } from '@/styles/tokens';

interface ActivityLog {
  time: string;
  action: string;
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isStale(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - d.getTime()) > 6 * 3600000; // >6 hours = stale
}

function getStateDot(action: string): { color: string; label: string } {
  if (action.includes('working')) return { color: color.ember.DEFAULT, label: 'Working' };
  if (action.includes('thinking')) return { color: color.blue.DEFAULT, label: 'Thinking' };
  if (action.includes('idle')) return { color: color.text.dim, label: 'Idle' };
  if (action.includes('alert')) return { color: color.status.error, label: 'Alert' };
  return { color: color.text.secondary, label: 'Activity' };
}

export function ActivityFeed(): React.ReactElement {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then((data) => {
        if (data?.activityLog) {
          setLogs(data.activityLog.slice(0, 8));
        }
      });
  }, []);

  const stale = logs.length > 0 && isStale(logs[0].time);

  return (
    <GlassCard padding="md">
      <SectionHeading title="Activity" icon={<span>⚡</span>} size="sm" />

      {stale && logs.length > 0 && (
        <div style={{
          fontSize: typography.fontSize.metadata,
          color: color.text.dim,
          marginBottom: '8px',
          padding: '6px 10px',
          borderRadius: '6px',
          background: 'rgba(255,255,255,0.03)',
        }}>
          ⏸ Last activity: {formatRelativeTime(logs[0].time)}
        </div>
      )}

      {logs.length === 0 ? (
        <p style={{ fontSize: typography.fontSize.caption, color: color.text.dim, margin: 0 }}>
          No recent activity
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log, i) => {
            const dot = getStateDot(log.action);
            // Extract the description from parentheses if present
            const match = log.action.match(/\(([^)]+)\)/);
            const desc = match ? match[1] : log.action;
            const stateLabel = log.action.split('(')[0].replace('State →', '').trim();

            return (
              <div key={i} className="flex items-start gap-2.5">
                {/* Dot */}
                <div
                  className="flex-shrink-0 mt-1.5"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: dot.color,
                    boxShadow: `0 0 6px ${dot.color}40`,
                  }}
                />
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <span
                    style={{
                      fontSize: typography.fontSize.caption,
                      color: color.text.primary,
                    }}
                  >
                    {stateLabel}
                  </span>
                  {match && (
                    <span
                      style={{
                        fontSize: typography.fontSize.caption,
                        color: color.text.secondary,
                        marginLeft: '6px',
                      }}
                      className="truncate"
                    >
                      — {desc.length > 40 ? desc.slice(0, 37) + '...' : desc}
                    </span>
                  )}
                </div>
                {/* Time */}
                <span
                  className="flex-shrink-0"
                  style={{
                    fontSize: typography.fontSize.metadata,
                    color: color.text.dim,
                  }}
                >
                  {formatRelativeTime(log.time)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
