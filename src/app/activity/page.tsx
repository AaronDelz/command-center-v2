'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import type { ActivityEntry } from '@/lib/types';

export default function ActivityPage(): React.ReactElement {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fetchActivity = useCallback(async (date?: string) => {
    try {
      const url = date ? `/api/activity?date=${date}` : '/api/activity';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json() as { 
        entries: ActivityEntry[]; 
        lastUpdated: string;
        date: string;
        availableDates: string[];
      };
      setEntries(data.entries);
      setLastUpdated(data.lastUpdated);
      if (!selectedDate) setSelectedDate(data.date);
      setAvailableDates(data.availableDates);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError('Failed to load activity feed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchActivity(selectedDate || undefined);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 15 seconds (only for today)
  useEffect(() => {
    const today = new Date();
    const mst = new Date(today.getTime() - 7 * 60 * 60 * 1000);
    const todayStr = mst.toISOString().split('T')[0];
    
    if (selectedDate && selectedDate !== todayStr) return;

    const interval = setInterval(() => {
      fetchActivity(selectedDate || undefined);
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedDate, fetchActivity]);

  function handleDateChange(date: string): void {
    setSelectedDate(date);
    setIsLoading(true);
    fetchActivity(date);
  }

  function handlePrevDay(): void {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const newDate = d.toISOString().split('T')[0];
    handleDateChange(newDate);
  }

  function handleNextDay(): void {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const newDate = d.toISOString().split('T')[0];
    handleDateChange(newDate);
  }

  function formatDisplayDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const mst = new Date(today.getTime() - 7 * 60 * 60 * 1000);
    const todayStr = mst.toISOString().split('T')[0];
    
    const yesterday = new Date(mst);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatLastUpdated(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  const isToday = (() => {
    const now = new Date();
    const mst = new Date(now.getTime() - 7 * 60 * 60 * 1000);
    return selectedDate === mst.toISOString().split('T')[0];
  })();

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">
            Activity Feed
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            {entries.length} activit{entries.length !== 1 ? 'ies' : 'y'}
            {lastUpdated && isToday && (
              <span className="ml-2">
                • Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            fetchActivity(selectedDate);
          }}
          disabled={isLoading}
          className="
            px-4 py-2.5 min-h-[44px] rounded-lg bg-accent text-background font-medium
            hover:bg-accent-dim active:scale-95 transition-all duration-200
            flex items-center gap-2 flex-shrink-0
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>↻</span>
          )}
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-between mb-6 bg-surface-raised/60 backdrop-blur-sm border border-border rounded-xl p-3">
        <button
          onClick={handlePrevDay}
          className="p-2 min-h-[44px] min-w-[44px] rounded-lg text-text-muted hover:text-foreground hover:bg-surface active:scale-95 transition-all flex items-center justify-center"
          aria-label="Previous day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-foreground font-medium">
            {selectedDate ? formatDisplayDate(selectedDate) : '...'}
          </span>
          {selectedDate && (
            <span className="text-xs text-text-muted">
              {selectedDate}
            </span>
          )}
          {availableDates.length > 0 && (
            <select
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text-muted focus:outline-none focus:border-accent cursor-pointer"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleNextDay}
          disabled={isToday}
          className="p-2 min-h-[44px] min-w-[44px] rounded-lg text-text-muted hover:text-foreground hover:bg-surface active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {isLoading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <span className="text-4xl mb-4">📊</span>
          <p>No activity for {formatDisplayDate(selectedDate)}</p>
          <p className="text-sm mt-1">
            {isToday ? 'Activity will appear here as it happens' : 'Nothing was logged on this day'}
          </p>
        </div>
      ) : (
        <ActivityFeed entries={entries} />
      )}
    </div>
  );
}
