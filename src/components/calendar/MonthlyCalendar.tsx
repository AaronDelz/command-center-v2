'use client';

import { useMemo } from 'react';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { CalendarEvent } from '@/lib/types';

interface MonthlyCalendarProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function MonthlyCalendar({ year, month, events, selectedDate, onSelectDate }: MonthlyCalendarProps): React.ReactElement {
  const { days, eventsByDate } = useMemo(() => {
    // Build event lookup
    const eventsByDate: Record<string, CalendarEvent[]> = {};
    for (const evt of events) {
      if (!eventsByDate[evt.date]) eventsByDate[evt.date] = [];
      eventsByDate[evt.date].push(evt);
    }

    // Build calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: Array<{ date: number; key: string; isCurrentMonth: boolean }> = [];

    // Previous month fill
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const m = month - 1 < 0 ? 11 : month - 1;
      const y = month - 1 < 0 ? year - 1 : year;
      days.push({ date: d, key: toDateKey(y, m, d), isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: d, key: toDateKey(year, month, d), isCurrentMonth: true });
    }

    // Next month fill (to complete 6 rows max)
    const remaining = 42 - days.length;
    const nextM = month + 1 > 11 ? 0 : month + 1;
    const nextY = month + 1 > 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, key: toDateKey(nextY, nextM, d), isCurrentMonth: false });
    }

    return { days, eventsByDate };
  }, [year, month, events]);

  const today = toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              fontWeight: typography.fontWeight.semibold,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: radius.md }}>
        {days.map((day, i) => {
          const isToday = day.key === today;
          const isSelected = day.key === selectedDate;
          const dayEvents = eventsByDate[day.key] || [];
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(day.key)}
              style={{
                background: isSelected
                  ? 'rgba(255, 107, 53, 0.12)'
                  : isToday
                  ? 'rgba(255, 107, 53, 0.06)'
                  : 'rgba(13, 13, 20, 0.5)',
                border: isSelected
                  ? `1px solid rgba(255, 107, 53, 0.4)`
                  : isToday
                  ? `1px solid rgba(255, 107, 53, 0.2)`
                  : '1px solid transparent',
                borderRadius: radius.sm,
                padding: '8px 4px 6px',
                minHeight: '52px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: `all ${animation.duration.fast} ${animation.easing.default}`,
                outline: 'none',
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.caption,
                  fontWeight: isToday ? typography.fontWeight.bold : typography.fontWeight.regular,
                  color: !day.isCurrentMonth
                    ? color.text.dim
                    : isToday
                    ? color.ember.DEFAULT
                    : color.text.primary,
                }}
              >
                {day.date}
              </span>

              {/* Event dots */}
              {hasEvents && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((evt, j) => (
                    <div
                      key={j}
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: evt.color || color.ember.DEFAULT,
                        boxShadow: `0 0 4px ${evt.color || color.ember.DEFAULT}40`,
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span style={{ fontSize: '8px', color: color.text.dim }}>+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
