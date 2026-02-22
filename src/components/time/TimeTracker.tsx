'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberButton } from '@/components/ui/EmberButton';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { TimeEntry, TimeEntriesData, Client } from '@/lib/types';

interface TimeTrackerProps {
  clients: Client[];
}

// ─── Helpers ────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function getBillingLabel(client: Client): string {
  switch (client.revenueModel) {
    case 'hourly': return `$${client.hourlyRate}/hr`;
    case 'retainer': return `$${(client.retainerAmount || client.monthlyRetainer || 0).toLocaleString()}/mo`;
    case 'project': return `$${(client.projectAmount || client.projectValue || 0).toLocaleString()} project`;
    default: return client.rate;
  }
}

function getBillingPill(client: Client): { label: string; bg: string; color: string } {
  switch (client.revenueModel) {
    case 'hourly':
      return { label: 'HOURLY', bg: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' };
    case 'retainer':
      return { label: 'RETAINER', bg: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' };
    case 'project':
      return { label: 'PROJECT', bg: 'rgba(255, 179, 71, 0.15)', color: '#ffb347' };
    default:
      return { label: 'OTHER', bg: 'rgba(255,255,255,0.05)', color: '#8a8494' };
  }
}

// ─── Active Timer Display ───────────────────────────────────────

function ActiveTimer({
  entry,
  elapsedSeconds,
  client,
  onStop,
}: {
  entry: TimeEntry;
  elapsedSeconds: number;
  client: Client | undefined;
  onStop: () => void;
}) {
  const rate = entry.rate || client?.hourlyRate || 0;
  const hours = elapsedSeconds / 3600;
  const earnings = rate * hours;

  return (
    <GlassCard>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Left: timer + info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          {/* Pulsing dot */}
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: color.ember.flame,
            boxShadow: `0 0 12px ${color.ember.flame}80`,
            animation: 'timer-pulse 1.5s ease-in-out infinite',
            flexShrink: 0,
          }} />

          {/* Timer display */}
          <div style={{
            fontSize: '2.5rem',
            fontWeight: typography.fontWeight.bold,
            color: color.ember.flame,
            fontFamily: 'monospace',
            textShadow: `0 0 20px ${color.ember.flame}40`,
            lineHeight: 1,
          }}>
            {formatTime(elapsedSeconds)}
          </div>

          {/* Client + description */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: typography.fontWeight.semibold,
              color: color.text.primary,
              fontSize: typography.fontSize.body,
            }}>
              {entry.clientName}
            </div>
            <div style={{
              color: color.text.secondary,
              fontSize: typography.fontSize.caption,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '250px',
            }}>
              {entry.description}
            </div>
          </div>
        </div>

        {/* Right: rate + earnings + stop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Rate */}
          {rate > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Rate
              </div>
              <div style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, color: color.text.primary }}>
                ${rate}/hr
              </div>
            </div>
          )}

          {/* Live earnings */}
          {rate > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Earning
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: typography.fontWeight.bold,
                color: color.status.healthy,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 0 8px rgba(74, 222, 128, 0.3)`,
              }}>
                {formatMoney(earnings)}
              </div>
            </div>
          )}

          {/* Stop button */}
          <button
            onClick={onStop}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${color.status.error}, #ff6b6b)`,
              color: color.text.primary,
              border: 'none',
              borderRadius: radius.lg,
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.body,
              cursor: 'pointer',
              transition: `all ${animation.duration.normal}`,
              boxShadow: `0 0 16px rgba(239, 68, 68, 0.3)`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.15)';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            ⏹ Stop Timer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes timer-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </GlassCard>
  );
}

// ─── Quick Start: Client Card with Play Button ──────────────────

function ClientPlayCard({
  client,
  isTimerRunning,
  onQuickStart,
}: {
  client: Client;
  isTimerRunning: boolean;
  onQuickStart: (client: Client) => void;
}) {
  const router = useRouter();
  const pill = getBillingPill(client);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: color.bg.surface,
      border: `1px solid ${color.glass.border}`,
      borderRadius: radius.md,
      transition: `all ${animation.duration.normal}`,
    }}>
      {/* Left: name + billing type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontWeight: typography.fontWeight.semibold,
              color: color.text.primary,
              fontSize: typography.fontSize.body,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {client.name}
            </span>
            {/* Link to Client Command */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients?highlight=${encodeURIComponent(client.name)}`);
              }}
              title={`View ${client.name} in Client Command`}
              style={{
                background: 'none',
                border: 'none',
                color: color.text.dim,
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '2px',
                transition: `color ${animation.duration.normal}`,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = color.ember.flame; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = color.text.dim; }}
            >
              ↗
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              color: pill.color,
              background: pill.bg,
              padding: '2px 8px',
              borderRadius: '999px',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}>
              {pill.label}
            </span>
            <span style={{ fontSize: typography.fontSize.caption, color: color.text.secondary }}>
              {getBillingLabel(client)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: play button */}
      <button
        onClick={() => onQuickStart(client)}
        disabled={isTimerRunning}
        title={isTimerRunning ? 'Stop current timer first' : `Start timer for ${client.name}`}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: radius.full,
          background: isTimerRunning
            ? 'rgba(255,255,255,0.03)'
            : `linear-gradient(135deg, ${color.ember.DEFAULT}, ${color.ember.flame})`,
          border: isTimerRunning ? `1px solid ${color.glass.border}` : 'none',
          color: isTimerRunning ? color.text.dim : color.text.inverse,
          cursor: isTimerRunning ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: `all ${animation.duration.normal}`,
          flexShrink: 0,
          opacity: isTimerRunning ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isTimerRunning) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = `0 0 16px rgba(255, 107, 53, 0.4)`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        ▶
      </button>
    </div>
  );
}

// ─── Quick Start Modal (description + details) ──────────────────

function QuickStartModal({
  client,
  onStart,
  onClose,
}: {
  client: Client;
  onStart: (entry: Partial<TimeEntry>) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [billable, setBillable] = useState(true);
  const [rate, setRate] = useState(String(client.hourlyRate || ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onStart({
      clientId: client.id,
      clientName: client.name,
      description: description.trim(),
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      billable,
      rate: rate ? parseFloat(rate) : undefined,
      isRunning: true,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: color.bg.surface,
    border: `1px solid ${color.glass.border}`,
    borderRadius: radius.sm,
    color: color.text.primary,
    fontSize: typography.fontSize.body,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: color.bg.base,
          border: `1.5px solid ${color.glass.border}`,
          borderRadius: radius['2xl'],
          padding: '24px',
          width: '420px',
          maxWidth: '90vw',
        }}
      >
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: typography.fontSize.pageTitle,
          fontWeight: typography.fontWeight.semibold,
          color: color.text.primary,
        }}>
          Start Timer
        </h3>
        <div style={{
          fontSize: typography.fontSize.body,
          color: color.ember.flame,
          fontWeight: typography.fontWeight.medium,
          marginBottom: '16px',
        }}>
          {client.name} — {getBillingLabel(client)}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: typography.fontSize.caption, color: color.text.secondary, marginBottom: '4px', display: 'block' }}>
              What are you working on? *
            </label>
            <input
              style={inputStyle}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. API integration, bug fix..."
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: typography.fontSize.caption, color: color.text.secondary, marginBottom: '4px', display: 'block' }}>
                Tags (optional)
              </label>
              <input
                style={inputStyle}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="api, troubleshooting"
              />
            </div>
            <div>
              <label style={{ fontSize: typography.fontSize.caption, color: color.text.secondary, marginBottom: '4px', display: 'block' }}>
                Rate $/hr
              </label>
              <input
                type="number"
                style={{ ...inputStyle, width: '80px' }}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              style={{ accentColor: color.ember.DEFAULT }}
            />
            <span style={{ fontSize: typography.fontSize.caption, color: color.text.secondary }}>Billable</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                background: 'none',
                border: `1px solid ${color.glass.border}`,
                borderRadius: radius.md,
                color: color.text.secondary,
                cursor: 'pointer',
                fontSize: typography.fontSize.body,
              }}
            >
              Cancel
            </button>
            <EmberButton type="submit">
              ▶ Start
            </EmberButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Time Entry Row ─────────────────────────────────────────────

function TimeEntryRow({
  entry,
  onDelete,
}: {
  entry: TimeEntry;
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void;
  onDelete: (id: string) => void;
}) {
  const calcValue = (): number => {
    if (!entry.billable || !entry.rate || !entry.duration) return 0;
    return (entry.duration / 60) * entry.rate;
  };

  const value = calcValue();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 80px 80px auto',
      gap: '12px',
      alignItems: 'center',
      padding: '10px 12px',
      background: color.bg.surface,
      border: `1px solid ${color.glass.border}`,
      borderRadius: radius.md,
      marginBottom: '6px',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontWeight: typography.fontWeight.semibold,
          color: color.text.primary,
          fontSize: typography.fontSize.body,
          marginBottom: '2px',
        }}>
          {entry.clientName}
        </div>
        <div style={{
          color: color.text.secondary,
          fontSize: typography.fontSize.caption,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {entry.description}
        </div>
        {entry.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            {entry.tags.map(tag => (
              <span key={tag} style={{
                fontSize: typography.fontSize.metadata,
                color: color.text.dim,
                background: 'rgba(255,255,255,0.05)',
                padding: '1px 6px',
                borderRadius: radius.sm,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: typography.fontSize.caption, color: color.text.dim, whiteSpace: 'nowrap' }}>
        {new Date(entry.startTime).toLocaleDateString()} {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div style={{
        textAlign: 'center',
        fontWeight: typography.fontWeight.semibold,
        color: color.text.primary,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {entry.duration ? formatDuration(entry.duration) : '—'}
      </div>

      <div style={{
        textAlign: 'right',
        fontWeight: typography.fontWeight.semibold,
        color: value > 0 ? color.ember.flame : color.text.dim,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value > 0 ? formatMoney(value) : '—'}
      </div>

      <button
        onClick={() => onDelete(entry.id)}
        style={{
          background: 'none',
          border: 'none',
          color: color.text.dim,
          cursor: 'pointer',
          fontSize: typography.fontSize.metadata,
          padding: '4px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = color.status.error; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = color.text.dim; }}
      >
        🗑️
      </button>
    </div>
  );
}

// ─── Main TimeTracker Component ─────────────────────────────────

export function TimeTracker({ clients }: TimeTrackerProps): React.ReactElement {
  const [timeData, setTimeData] = useState<TimeEntriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [quickStartClient, setQuickStartClient] = useState<Client | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeClients = clients.filter(c => c.status === 'active');

  // Fetch time entries
  const fetchTimeEntries = useCallback(async () => {
    try {
      const response = await fetch('/api/time-entries');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json() as TimeEntriesData;
      setTimeData(data);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimeEntries(); }, [fetchTimeEntries]);

  // Timer tick
  useEffect(() => {
    if (timeData?.activeTimer) {
      const startTime = new Date(timeData.activeTimer.startedAt).getTime();
      const tick = () => setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsedSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timeData?.activeTimer]);

  // Start timer
  const handleStartTimer = async (entry: Partial<TimeEntry>) => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error('Failed to start timer');
      setQuickStartClient(null);
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  // Stop timer
  const handleStopTimer = async () => {
    if (!timeData?.activeTimer) return;
    try {
      const response = await fetch('/api/time-entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: timeData.activeTimer.entryId, action: 'stop' }),
      });
      if (!response.ok) throw new Error('Failed to stop timer');
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  // Update entry
  const handleUpdateEntry = async (id: string, updates: Partial<TimeEntry>) => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error('Failed to update entry');
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Delete this time entry?')) return;
    try {
      const response = await fetch(`/api/time-entries?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete entry');
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: color.text.dim }}>Loading time tracker...</div>;
  }

  const activeEntry = timeData?.entries.find(e => e.isRunning) || null;
  const activeClient = activeEntry ? clients.find(c => c.id === activeEntry.clientId) : undefined;
  const isTimerRunning = !!activeEntry;

  const recentEntries = timeData?.entries
    .filter(e => !e.isRunning)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Timer */}
      {activeEntry && (
        <ActiveTimer
          entry={activeEntry}
          elapsedSeconds={elapsedSeconds}
          client={activeClient}
          onStop={handleStopTimer}
        />
      )}

      {/* Quick Restart Recent Timers */}
      {!isTimerRunning && recentEntries.length > 0 && (() => {
        // Deduplicate by clientName + description, take top 3
        const seen = new Set<string>();
        const recentCombos: typeof recentEntries = [];
        for (const entry of recentEntries) {
          const key = `${entry.clientId}::${entry.description}`;
          if (!seen.has(key) && entry.description) {
            seen.add(key);
            recentCombos.push(entry);
            if (recentCombos.length >= 3) break;
          }
        }
        if (recentCombos.length === 0) return null;
        return (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: typography.fontSize.caption, color: color.text.dim, alignSelf: 'center' }}>
              Quick restart:
            </span>
            {recentCombos.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleStartTimer({
                  clientId: entry.clientId,
                  clientName: entry.clientName,
                  description: entry.description,
                  tags: entry.tags,
                  billable: entry.billable,
                  rate: entry.rate,
                  isRunning: true,
                })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: color.bg.surface,
                  border: `1px solid ${color.glass.border}`,
                  borderRadius: radius.full,
                  color: color.text.primary,
                  fontSize: typography.fontSize.caption,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.normal}`,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = color.ember.DEFAULT;
                  e.currentTarget.style.background = `${color.ember.DEFAULT}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = color.glass.border;
                  e.currentTarget.style.background = color.bg.surface;
                }}
              >
                <span style={{ color: color.ember.flame }}>▶</span>
                <span style={{ fontWeight: typography.fontWeight.semibold }}>{entry.clientName}</span>
                <span style={{ color: color.text.dim }}>—</span>
                <span style={{ color: color.text.secondary, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.description}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Client Quick Start Grid */}
      <GlassCard>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{
            margin: 0,
            color: isTimerRunning ? color.text.secondary : color.text.primary,
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
          }}>
            {isTimerRunning ? 'Clients' : 'Start Timer'}
          </h3>
          <div style={{ fontSize: typography.fontSize.caption, color: color.text.dim, marginTop: '4px' }}>
            {isTimerRunning
              ? 'Stop the current timer to start a new one'
              : `${activeClients.length} active clients`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
          {activeClients.map(client => (
            <ClientPlayCard
              key={client.id}
              client={client}
              isTimerRunning={isTimerRunning}
              onQuickStart={(c) => setQuickStartClient(c)}
            />
          ))}
        </div>

        {activeClients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: color.text.dim }}>
            No active clients. Add clients in Client Command first.
          </div>
        )}
      </GlassCard>

      {/* Recent Time Entries */}
      <GlassCard>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{
            margin: 0,
            color: color.text.primary,
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
          }}>
            Recent Entries
          </h3>
        </div>

        {recentEntries.length === 0 ? (
          <div style={{ textAlign: 'center', color: color.text.dim, padding: '20px' }}>
            No time entries yet
          </div>
        ) : (
          <div>
            {recentEntries.map(entry => (
              <TimeEntryRow
                key={entry.id}
                entry={entry}
                onUpdate={handleUpdateEntry}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quick Start Modal */}
      {quickStartClient && (
        <QuickStartModal
          client={quickStartClient}
          onStart={handleStartTimer}
          onClose={() => setQuickStartClient(null)}
        />
      )}
    </div>
  );
}
