'use client';

import { useState } from 'react';
import { color, typography, radius, animation, shadow } from '@/styles/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Post {
  id: string;
  title: string;
  content: string;
  pillar: string;
  platforms: string[];
  publishedAt: string;
}

interface Draft {
  id: string;
  title: string;
  content: string;
  pillar: string;
  platforms: string[];
  status: string;
  scheduledFor: string | null;
}

interface WeekScheduleDay {
  theme: string;
  pillar: string | null;
}

interface Pillars {
  [key: string]: { label: string; target: number; color: string };
}

interface WeekCalendarProps {
  posts: Post[];
  drafts: Draft[];
  weekSchedule: Record<string, WeekScheduleDay>;
  pillars: Pillars;
  onDraftClick?: (draft: Draft) => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  x: '𝕏',
  facebook: 'f',
  youtube: '▶',
  community: '👥',
  linkedin: 'in',
  instagram: '📷',
};

function getWeekDates(): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function WeekCalendar({ posts, drafts, weekSchedule, pillars, onDraftClick }: WeekCalendarProps): React.ReactElement {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const weekDates = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <GlassCard padding="md">
      <SectionHeading title="This Week" icon="📅" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          const dayKey = DAY_KEYS[i];
          const schedule = weekSchedule[dayKey];
          const dateStr = date.toISOString().split('T')[0];

          // Find posts/drafts for this day
          const dayPosts = posts.filter(p => {
            const pd = new Date(p.publishedAt);
            return isSameDay(pd, date);
          });
          const dayDrafts = drafts.filter(d => d.scheduledFor === dateStr);
          const hasContent = dayPosts.length > 0 || dayDrafts.length > 0;
          const isExpanded = expandedDay === i;

          return (
            <div
              key={i}
              onClick={() => setExpandedDay(isExpanded ? null : i)}
              style={{
                cursor: 'pointer',
                padding: '12px 8px',
                borderRadius: radius.lg,
                border: `1px solid ${isToday ? color.ember.DEFAULT + '60' : color.glass.border}`,
                background: isToday
                  ? 'rgba(255, 107, 53, 0.08)'
                  : hasContent
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'transparent',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
                minHeight: isExpanded ? '200px' : '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
              }}
            >
              {/* Day name */}
              <div
                style={{
                  fontSize: typography.fontSize.metadata,
                  color: isToday ? color.ember.flame : color.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: typography.letterSpacing.widest,
                  fontWeight: isToday ? typography.fontWeight.semibold : typography.fontWeight.regular,
                }}
              >
                {DAY_NAMES[i]}
              </div>

              {/* Date number */}
              <div
                style={{
                  fontSize: typography.fontSize.cardTitle,
                  fontWeight: typography.fontWeight.semibold,
                  color: isToday ? color.ember.flame : color.text.primary,
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.full,
                  background: isToday ? 'rgba(255, 107, 53, 0.2)' : 'transparent',
                }}
              >
                {date.getDate()}
              </div>

              {/* Theme */}
              {schedule && (
                <div
                  style={{
                    fontSize: '9px',
                    color: color.text.dim,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {schedule.theme}
                </div>
              )}

              {/* Content indicators */}
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                {dayPosts.map(p => (
                  <div
                    key={p.id}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: pillars[p.pillar]?.color || color.ember.DEFAULT,
                      boxShadow: `0 0 4px ${pillars[p.pillar]?.color || color.ember.DEFAULT}`,
                    }}
                    title={p.title}
                  />
                ))}
                {dayDrafts.map(d => (
                  <div
                    key={d.id}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      border: `1px solid ${pillars[d.pillar]?.color || color.text.dim}`,
                      background: 'transparent',
                    }}
                    title={`Draft: ${d.title}`}
                  />
                ))}
              </div>

              {/* Expanded content */}
              {isExpanded && (dayPosts.length > 0 || dayDrafts.length > 0) && (
                <div
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {dayPosts.map(p => (
                    <div
                      key={p.id}
                      style={{
                        fontSize: '10px',
                        color: color.text.primary,
                        padding: '4px 6px',
                        borderRadius: radius.sm,
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderLeft: `2px solid ${pillars[p.pillar]?.color || color.ember.DEFAULT}`,
                        lineHeight: 1.3,
                      }}
                    >
                      <div style={{ fontWeight: typography.fontWeight.medium }}>{p.title}</div>
                      <div style={{ color: color.text.dim, marginTop: '2px' }}>
                        {p.platforms.map(pl => PLATFORM_ICONS[pl] || pl).join(' ')}
                      </div>
                    </div>
                  ))}
                  {dayDrafts.map(d => (
                    <div
                      key={d.id}
                      onClick={(e) => { e.stopPropagation(); onDraftClick?.(d); }}
                      style={{
                        fontSize: '10px',
                        color: color.text.secondary,
                        padding: '4px 6px',
                        borderRadius: radius.sm,
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderLeft: `2px dashed ${pillars[d.pillar]?.color || color.text.dim}`,
                        lineHeight: 1.3,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: typography.fontWeight.medium }}>📝 {d.title}</div>
                      <div style={{ color: color.text.dim, marginTop: '2px' }}>
                        {d.status} · {d.platforms.map(pl => PLATFORM_ICONS[pl] || pl).join(' ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
