'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { CronJobCard } from '@/components/calendar/CronJobCard';
import type { CronJob } from '@/lib/types';

export default function CalendarPage(): React.ReactElement {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/cron');
      if (!res.ok) throw new Error('Failed to fetch cron jobs');
      const data = await res.json() as { jobs: CronJob[] };
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      console.error('Error fetching cron jobs:', err);
      setError('Failed to load cron jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Get upcoming jobs sorted by next run time
  const upcomingJobs = jobs
    .filter((job) => job.enabled)
    .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Calendar
        </h1>
        <p className="text-text-muted mt-1 text-sm md:text-base">
          {jobs.filter((j) => j.enabled).length} active job{jobs.filter((j) => j.enabled).length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      ) : (
        <>
          {/* Weekly Calendar Grid */}
          <CalendarView jobs={jobs} />

          {/* Next Up Section */}
          <div className="bg-surface-raised/50 rounded-xl border border-border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-accent">&#9650;</span>
              Next Up
            </h2>
            
            {upcomingJobs.length === 0 ? (
              <p className="text-text-muted text-sm">No upcoming jobs</p>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingJobs.map((job) => (
                  <CronJobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>

          {/* Disabled Jobs */}
          {jobs.filter((j) => !j.enabled).length > 0 && (
            <div className="bg-surface-raised/30 rounded-xl border border-border/50 p-4 md:p-6">
              <h2 className="text-sm font-medium text-text-muted mb-3">
                Disabled Jobs
              </h2>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.filter((j) => !j.enabled).map((job) => (
                  <CronJobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
