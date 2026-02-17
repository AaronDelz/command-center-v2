'use client';

import { useMemo } from 'react';
import { GlassCard, SectionHeading } from '@/components/ui';
import { color, typography, radius } from '@/styles/tokens';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDays(): { label: string; date: number; month: string; isToday: boolean; dayOfWeek: number }[] {
  const now = new Date();
  const today = now.getDate();
  // Get Monday of current week
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      label: DAY_LABELS[i],
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: d.getDate() === today && d.getMonth() === now.getMonth(),
      dayOfWeek: i,
    });
  }
  return days;
}

export function MiniCalendar(): React.ReactElement {
  const weekDays = useMemo(getWeekDays, []);

  return (
    <GlassCard padding="md">
      <SectionHeading title="This Week" icon={<span>📅</span>} size="sm" />

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day.dayOfWeek}
            className="flex flex-col items-center py-2 rounded-lg"
            style={{
              background: day.isToday ? `rgba(255, 107, 53, 0.12)` : 'transparent',
              border: day.isToday ? `1px solid rgba(255, 107, 53, 0.3)` : '1px solid transparent',
              borderRadius: radius.md,
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.metadata,
                color: day.isToday ? color.ember.flame : color.text.dim,
                fontWeight: day.isToday ? typography.fontWeight.semibold : typography.fontWeight.regular,
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              {day.label}
            </span>
            <span
              style={{
                fontSize: typography.fontSize.cardTitle,
                color: day.isToday ? color.ember.DEFAULT : color.text.primary,
                fontWeight: day.isToday ? typography.fontWeight.bold : typography.fontWeight.medium,
                marginTop: '2px',
              }}
            >
              {day.date}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
