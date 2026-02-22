'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDynamicSubtitle } from '@/lib/subtitles';
import { GlassCard, EmberButton, SectionHeading } from '@/components/ui';
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar';
import { EventList } from '@/components/calendar/EventList';
import { AddEventModal } from '@/components/calendar/AddEventModal';
import { color, typography, animation } from '@/styles/tokens';
import type { CalendarEvent } from '@/lib/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage(): React.ReactElement {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {
      console.error('Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDate(null);
  }

  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
  }

  async function handleAddEvent(eventData: { title: string; date: string; time?: string; endTime?: string; color: string; description?: string; recurring?: string }) {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (res.ok) {
      await fetchEvents();
    }
  }

  async function handleDeleteEvent(id: string) {
    const res = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchEvents();
    }
  }

  // Count events this month
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEventCount = events.filter((e) => e.date.startsWith(monthKey)).length;

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle={getDynamicSubtitle('calendar')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar Grid — 2/3 width */}
        <div className="lg:col-span-2">
          <GlassCard padding="md">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  style={{
                    background: 'none',
                    border: `1px solid ${color.glass.border}`,
                    borderRadius: '8px',
                    color: color.text.secondary,
                    cursor: 'pointer',
                    padding: '6px 10px',
                    fontSize: typography.fontSize.body,
                    transition: `all ${animation.duration.fast} ${animation.easing.default}`,
                  }}
                >
                  ‹
                </button>
                <h2
                  style={{
                    margin: 0,
                    fontSize: typography.fontSize.pageTitle,
                    fontWeight: typography.fontWeight.semibold,
                    color: color.text.primary,
                    minWidth: '200px',
                    textAlign: 'center',
                  }}
                >
                  {MONTH_NAMES[month]} {year}
                </h2>
                <button
                  type="button"
                  onClick={nextMonth}
                  style={{
                    background: 'none',
                    border: `1px solid ${color.glass.border}`,
                    borderRadius: '8px',
                    color: color.text.secondary,
                    cursor: 'pointer',
                    padding: '6px 10px',
                    fontSize: typography.fontSize.body,
                    transition: `all ${animation.duration.fast} ${animation.easing.default}`,
                  }}
                >
                  ›
                </button>
              </div>

              <div className="flex items-center gap-2">
                <EmberButton variant="ghost" size="sm" onClick={goToday}>
                  Today
                </EmberButton>
                <EmberButton variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                  + Event
                </EmberButton>
              </div>
            </div>

            {/* Event count */}
            <p
              style={{
                fontSize: typography.fontSize.caption,
                color: color.text.secondary,
                margin: '0 0 12px 0',
              }}
            >
              {monthEventCount} event{monthEventCount !== 1 ? 's' : ''} this month
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MonthlyCalendar
                year={year}
                month={month}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}
          </GlassCard>
        </div>

        {/* Sidebar — Event list */}
        <div>
          <GlassCard padding="md">
            <EventList
              events={events}
              selectedDate={selectedDate}
              onDelete={handleDeleteEvent}
            />
          </GlassCard>
        </div>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddEvent}
        defaultDate={selectedDate || undefined}
      />
    </div>
  );
}
