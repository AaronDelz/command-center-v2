'use client';

import type { CronJob } from '@/lib/types';
import { CronJobCard } from './CronJobCard';

interface CalendarViewProps {
  jobs: CronJob[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [0, 4, 8, 12, 16, 20];

// America/Phoenix is UTC-7 always
const PHX_OFFSET = -7;

function getWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
}

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function formatTime(isoString: string): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Phoenix',
  });
}

/** Get Phoenix hour from a UTC ISO string */
function getPhoenixHour(isoString: string): number {
  const d = new Date(isoString);
  let h = d.getUTCHours() + PHX_OFFSET;
  if (h < 0) h += 24;
  if (h >= 24) h -= 24;
  return h;
}

/**
 * Expand cron jobs into virtual entries for each day of the week they'd run.
 * One-shot reminders and disabled jobs just use their nextRun.
 */
function expandJobsForWeek(jobs: CronJob[], weekDates: Date[]): { job: CronJob; date: Date; phxHour: number }[] {
  const entries: { job: CronJob; date: Date; phxHour: number }[] = [];

  for (const job of jobs) {
    if (!job.enabled || !job.schedule) continue;

    // One-shot reminders
    if (job.schedule.startsWith('at ')) {
      if (!job.nextRun) continue;
      const runDate = new Date(job.nextRun);
      for (const wd of weekDates) {
        if (runDate.toDateString() === wd.toDateString()) {
          entries.push({ job, date: wd, phxHour: getPhoenixHour(job.nextRun) });
        }
      }
      continue;
    }

    const parts = job.schedule.split(' ');
    if (parts.length !== 5) continue;
    const [, hourStr, domStr, , dowStr] = parts;
    const cronHour = parseInt(hourStr);

    for (const wd of weekDates) {
      const wdDay = wd.getDay(); // 0=Sun

      // Day of week filter
      if (dowStr !== '*' && parseInt(dowStr) !== wdDay) continue;
      // Day of month filter
      if (domStr !== '*' && parseInt(domStr) !== wd.getDate()) continue;

      // Create a virtual nextRun for this day
      const virtualRun = new Date(job.nextRun); // use as template for time
      // But override the date portion
      entries.push({ job, date: wd, phxHour: cronHour });
    }
  }

  return entries;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Mobile: list view grouped by day
function MobileCalendar({ jobs }: { jobs: CronJob[] }): React.ReactElement {
  const weekDates = getWeekDates();
  const expanded = expandJobsForWeek(jobs, weekDates);

  const daysWithJobs = weekDates
    .map((date) => ({
      date,
      dayJobs: expanded
        .filter((e) => e.date.toDateString() === date.toDateString())
        .sort((a, b) => a.phxHour - b.phxHour)
        .map((e) => e.job),
    }))
    .filter((day) => day.dayJobs.length > 0 || isToday(day.date));

  return (
    <div className="space-y-4">
      {daysWithJobs.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-sm">
          No scheduled jobs this week
        </div>
      ) : (
        daysWithJobs.map(({ date, dayJobs }) => (
          <div key={date.toISOString()} className="bg-surface-raised/50 rounded-xl border border-border overflow-hidden">
            <div className={`px-4 py-3 border-b border-border ${isToday(date) ? 'bg-accent/10' : 'bg-surface'}`}>
              <h3 className={`text-sm font-semibold ${isToday(date) ? 'text-accent' : 'text-foreground'}`}>
                {getDayLabel(date)}
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {dayJobs.length === 0 ? (
                <p className="text-xs text-text-muted py-2 text-center">No jobs scheduled</p>
              ) : (
                dayJobs.map((job, i) => (
                  <div key={`${job.id}-${i}`} className="flex items-center gap-3 py-2">
                    <span className="text-xs text-text-muted font-mono w-16 flex-shrink-0">
                      {formatTime(job.nextRun)}
                    </span>
                    <div className="flex-1">
                      <CronJobCard job={job} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Desktop: full grid view
function DesktopCalendar({ jobs }: { jobs: CronJob[] }): React.ReactElement {
  const weekDates = getWeekDates();
  const expanded = expandJobsForWeek(jobs, weekDates);

  return (
    <div className="bg-surface-raised/50 rounded-xl border border-border overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-2 bg-surface" />
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`p-3 text-center border-l border-border ${isToday(date) ? 'bg-accent/10' : 'bg-surface'}`}
            >
              <div className={`text-xs font-medium ${isToday(date) ? 'text-accent' : 'text-text-muted'}`}>
                {DAYS[i]}
              </div>
              <div className={`text-lg font-semibold ${isToday(date) ? 'text-accent' : 'text-foreground'}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {HOURS.map((hour, slotIndex) => {
          const nextHour = HOURS[slotIndex + 1] ?? 24;
          return (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0"
            >
              <div className="p-2 text-xs text-text-muted text-right pr-3 bg-surface flex items-start justify-end pt-3">
                {formatHour(hour)}
              </div>
              {weekDates.map((date, dayIndex) => {
                const slotJobs = expanded.filter(
                  (e) => e.date.toDateString() === date.toDateString() && e.phxHour >= hour && e.phxHour < nextHour
                );
                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[80px] p-1 border-l border-border ${isToday(date) ? 'bg-accent/5' : ''}`}
                  >
                    <div className="space-y-1">
                      {slotJobs.map((e, i) => (
                        <CronJobCard key={`${e.job.id}-${i}`} job={e.job} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarView({ jobs }: CalendarViewProps): React.ReactElement {
  return (
    <>
      {/* Mobile: list view */}
      <div className="md:hidden">
        <MobileCalendar jobs={jobs} />
      </div>
      {/* Desktop: grid view */}
      <div className="hidden md:block">
        <DesktopCalendar jobs={jobs} />
      </div>
    </>
  );
}
