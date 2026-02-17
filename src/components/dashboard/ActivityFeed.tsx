'use client';

import { useState, useEffect } from 'react';
import { GlassCard, SectionHeading } from '@/components/ui';
import { color, typography } from '@/styles/tokens';

interface ActivityLog {
  time: string;
  action: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  return (
    <GlassCard padding="md">
      <SectionHeading title="Activity" icon={<span>⚡</span>} size="sm" />

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
                  {formatTime(log.time)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
