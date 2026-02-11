'use client';

import { useState } from 'react';
import type { CronJob } from '@/lib/types';

interface CronJobCardProps {
  job: CronJob;
  compact?: boolean;
}

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  task: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  briefing: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  notes: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  memory: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  audit: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  system: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  reminder: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
};

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

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const now = new Date();
  const target = new Date(isoString);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  if (diffDays === 1) return 'tomorrow';
  return `in ${diffDays}d`;
}

function formatScheduleHuman(schedule: string): string {
  if (schedule.startsWith('at ')) {
    const dateStr = schedule.replace('at ', '');
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      timeZone: 'America/Phoenix',
    }) + ' at ' + d.toLocaleTimeString('en-US', { 
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'America/Phoenix',
    }) + ' MST';
  }

  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  const [min, hour, dom, , dow] = parts;
  const h = parseInt(hour);
  const m = parseInt(min);
  const timeStr = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'} MST`;

  if (dom !== '*') return `1st of every month at ${timeStr}`;
  if (dow === '0') return `Every Sunday at ${timeStr}`;
  if (dow === '5') return `Every Friday at ${timeStr}`;
  if (dow !== '*') return `Every ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][parseInt(dow)]} at ${timeStr}`;
  return `Every day at ${timeStr}`;
}

function formatModel(model?: string): string {
  if (!model) return '';
  const map: Record<string, string> = { Opus: 'Claude Opus', Haiku: 'Claude Haiku', Sonnet: 'Claude Sonnet' };
  return map[model] ?? model;
}

function DetailModal({ job, onClose }: { job: CronJob; onClose: () => void }): React.ReactElement {
  const type = job.type ?? 'system';
  const colors = typeColors[type] ?? typeColors.system;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-surface-raised border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className={`text-xl font-bold ${colors.text}`}>{job.name}</h2>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-foreground text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{job.description}</p>
        )}

        {/* Details grid */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Schedule</span>
            <span className="text-foreground text-right">{formatScheduleHuman(job.schedule)}</span>
          </div>

          {job.model && (
            <div className="flex justify-between">
              <span className="text-text-muted">Model</span>
              <span className="text-foreground">{formatModel(job.model)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-text-muted">Type</span>
            <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
              {type}
            </span>
          </div>

          {job.nextRun && (
            <div className="flex justify-between">
              <span className="text-text-muted">Next Run</span>
              <span className="text-foreground">
                {formatTime(job.nextRun)} · {formatRelativeTime(job.nextRun)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-text-muted">Status</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              job.enabled 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}>
              {job.enabled ? 'enabled' : 'disabled'}
            </span>
          </div>

          {job.lastStatus && (
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Last Run</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                job.lastStatus === 'ok'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-red-500/20 text-red-400 border border-red-500/50'
              }`}>
                {job.lastStatus}
              </span>
            </div>
          )}

          {job.schedule && !job.schedule.startsWith('at ') && (
            <div className="flex justify-between">
              <span className="text-text-muted">Cron</span>
              <span className="text-foreground font-mono text-xs">{job.schedule}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CronJobCard({ job, compact = false }: CronJobCardProps): React.ReactElement {
  const [showModal, setShowModal] = useState(false);
  const type = job.type ?? 'system';
  const colors = typeColors[type] ?? typeColors.system;

  if (compact) {
    return (
      <>
        <div 
          className={`
            ${colors.bg} ${colors.border} border rounded-md px-2 py-1
            text-xs truncate ${!job.enabled ? 'opacity-50' : ''} cursor-pointer
          `}
          onClick={() => setShowModal(true)}
        >
          <span className={colors.text}>{job.name}</span>
        </div>
        {showModal && <DetailModal job={job} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div 
        className={`
          ${colors.bg} ${colors.border} border rounded-lg p-3 min-h-[44px]
          transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer
          ${!job.enabled ? 'opacity-50' : ''}
        `}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${colors.text}`}>
              {job.name}
            </h4>
            <p className="text-xs text-text-muted mt-1">
              {formatTime(job.nextRun)}
            </p>
          </div>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {formatRelativeTime(job.nextRun)}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
            {type}
          </span>
          {job.model && (
            <span className="text-[10px] text-text-muted">
              {job.model}
            </span>
          )}
          {!job.enabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/50">
              disabled
            </span>
          )}
        </div>
      </div>
      {showModal && <DetailModal job={job} onClose={() => setShowModal(false)} />}
    </>
  );
}
