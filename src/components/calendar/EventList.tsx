'use client';

import { color, typography, radius } from '@/styles/tokens';
import type { CalendarEvent } from '@/lib/types';

interface EventListProps {
  events: CalendarEvent[];
  selectedDate: string | null;
  onDelete?: (id: string) => void;
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (dateStr === todayKey) return 'Today';

  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function EventList({ events, selectedDate, onDelete }: EventListProps): React.ReactElement {
  // Show events for selected date, or upcoming 5
  const displayEvents = selectedDate
    ? events
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    : events
        .filter((e) => e.date >= new Date().toISOString().split('T')[0])
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
        .slice(0, 5);

  const heading = selectedDate ? formatDateLabel(selectedDate) : 'Upcoming Events';

  return (
    <div>
      <h3
        style={{
          fontSize: typography.fontSize.sectionHeader,
          fontWeight: typography.fontWeight.semibold,
          color: color.text.accent,
          textTransform: 'uppercase',
          letterSpacing: typography.letterSpacing.wider,
          marginBottom: '12px',
        }}
      >
        {heading}
      </h3>

      {displayEvents.length === 0 ? (
        <p style={{ fontSize: typography.fontSize.caption, color: color.text.dim }}>
          {selectedDate ? 'No events on this day' : 'No upcoming events'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {displayEvents.map((evt) => (
            <div
              key={evt.id}
              className="group flex items-start gap-3"
              style={{
                padding: '10px 12px',
                background: color.bg.surface,
                border: `1px solid ${color.glass.border}`,
                borderLeft: `3px solid ${evt.color || color.ember.DEFAULT}`,
                borderRadius: radius.md,
              }}
            >
              {/* Time */}
              <div
                className="flex-shrink-0"
                style={{
                  minWidth: '60px',
                  fontSize: typography.fontSize.caption,
                  color: color.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {evt.time ? formatTime(evt.time) : 'All day'}
                {evt.endTime && (
                  <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
                    → {formatTime(evt.endTime)}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontSize: typography.fontSize.body,
                    color: color.text.primary,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {evt.title}
                </div>
                {evt.description && (
                  <div
                    style={{
                      fontSize: typography.fontSize.caption,
                      color: color.text.secondary,
                      marginTop: '2px',
                    }}
                  >
                    {evt.description}
                  </div>
                )}
                {evt.recurring && (
                  <span
                    style={{
                      fontSize: typography.fontSize.metadata,
                      color: color.text.dim,
                      marginTop: '4px',
                      display: 'inline-block',
                    }}
                  >
                    🔁 {evt.recurring}
                  </span>
                )}
              </div>

              {/* Delete button */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(evt.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: color.text.dim,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.caption,
                    padding: '2px 6px',
                    borderRadius: radius.sm,
                    transition: 'all 150ms',
                  }}
                  title="Delete event"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
