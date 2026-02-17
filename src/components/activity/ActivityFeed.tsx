'use client';

import { useState } from 'react';
import type { ActivityEntry } from '@/lib/types';
import { GlassCard, GlassPill } from '@/components/ui';

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

const TYPE_ICONS: Record<string, string> = {
  thinking: '🧠',
  working: '⚡',
  idle: '💤',
  tool: '🔧',
  file: '📄',
  message: '💬',
  exec: '⌨️',
  activity: '📌',
  state: '🔄',
};

const TYPE_COLORS: Record<string, string> = {
  thinking: 'border-purple-500 bg-purple-500/20',
  working: 'border-green-500 bg-green-500/20',
  idle: 'border-gray-500 bg-gray-500/20',
  tool: 'border-blue-500 bg-blue-500/20',
  file: 'border-yellow-500 bg-yellow-500/20',
  message: 'border-cyan-500 bg-cyan-500/20',
  exec: 'border-orange-500 bg-orange-500/20',
  activity: 'border-accent bg-accent/20',
  state: 'border-accent bg-accent/20',
};

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] ?? '📌';
}

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? 'border-accent bg-accent/20';
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ActivityFeed({ entries }: ActivityFeedProps): React.ReactElement {
  const [filter, setFilter] = useState<string | null>(null);

  const uniqueTypes = [...new Set(entries.map((e) => e.type))].sort();
  
  const filteredEntries = (filter
    ? entries.filter((e) => e.type === filter)
    : entries
  ).slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <span className="text-4xl mb-4">📊</span>
        <p>No activity yet</p>
        <p className="text-sm mt-1">Activity will appear here as it happens</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Pills */}
      {uniqueTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 -mx-4 px-4 overflow-x-auto pb-2 md:mx-0 md:px-0">
          <GlassPill
            variant="default"
            active={filter === null}
            onClick={() => setFilter(null)}
          >
            All
          </GlassPill>
          {uniqueTypes.map((type) => (
            <GlassPill
              key={type}
              variant="default"
              active={filter === type}
              onClick={() => setFilter(type)}
            >
              <span>{getTypeIcon(type)}</span>
              <span className="capitalize">{type}</span>
            </GlassPill>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-accent/50 to-transparent" />

        {/* Entries */}
        <ul className="space-y-4">
          {filteredEntries.map((entry, index) => {
            const prevEntry = filteredEntries[index - 1];
            const showDateHeader = !prevEntry || 
              formatDate(entry.timestamp) !== formatDate(prevEntry.timestamp);

            return (
              <li key={entry.id}>
                {showDateHeader && (
                  <div className="ml-10 mb-3 mt-2 first:mt-0">
                    <span className="text-xs font-medium text-accent uppercase tracking-wider">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`
                      relative z-10 w-6 h-6 rounded-full border-2 
                      flex items-center justify-center text-xs
                      ${getTypeColor(entry.type)}
                    `}
                  >
                    {getTypeIcon(entry.type)}
                  </div>

                  {/* Content */}
                  <GlassCard className="flex-1 min-w-0" padding="sm">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-foreground break-words">
                        {entry.description}
                      </p>
                      <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    {entry.details && (
                      <p className="text-sm text-text-muted mt-2">
                        {entry.details}
                      </p>
                    )}
                  </GlassCard>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
