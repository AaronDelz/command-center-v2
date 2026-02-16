'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberButton } from '@/components/ui/EmberButton';
import { color, typography, radius, animation, shadow } from '@/styles/tokens';
import type { TimeEntry, TimeEntriesData, Client } from '@/lib/types';

interface TimeTrackerProps {
  clients: Client[];
}

// Timer Component
function Timer({ 
  activeEntry, 
  elapsedSeconds, 
  onStop 
}: { 
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  onStop: () => void;
}) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeEntry) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: color.text.dim, 
        padding: '40px',
        fontSize: typography.fontSize.body,
      }}>
        No active timer
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '2.5rem',
        fontWeight: typography.fontWeight.bold,
        color: color.ember.flame,
        textShadow: `0 0 20px ${color.ember.flame}40`,
        marginBottom: '12px',
        fontFamily: 'monospace',
      }}>
        {formatTime(elapsedSeconds)}
      </div>
      
      <div style={{
        color: color.text.primary,
        fontWeight: typography.fontWeight.semibold,
        marginBottom: '8px',
      }}>
        {activeEntry.clientName}
      </div>
      
      <div style={{
        color: color.text.secondary,
        fontSize: typography.fontSize.body,
        marginBottom: '20px',
        maxWidth: '300px',
        margin: '0 auto 20px',
      }}>
        {activeEntry.description}
      </div>
      
      <button
        onClick={onStop}
        style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${color.status.error}, #ff6b6b)`,
          color: color.text.primary,
          border: 'none',
          borderRadius: radius.lg,
          fontWeight: typography.fontWeight.semibold,
          fontSize: typography.fontSize.body,
          cursor: 'pointer',
          transition: `all ${animation.duration.normal}`,
          boxShadow: `0 0 12px rgba(239, 68, 68, 0.3)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.15)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'none';
          e.currentTarget.style.transform = 'none';
        }}
      >
        ⏹ Stop Timer
      </button>
    </div>
  );
}

// Start Timer Form Component
function StartTimerForm({
  clients,
  onStart,
}: {
  clients: Client[];
  onStart: (entry: Partial<TimeEntry>) => void;
}) {
  const [form, setForm] = useState({
    clientId: '',
    description: '',
    tags: '',
    billable: true,
    rate: '',
  });

  const selectedClient = clients.find(c => c.id === form.clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.description.trim()) return;
    
    const client = clients.find(c => c.id === form.clientId);
    if (!client) return;
    
    onStart({
      clientId: form.clientId,
      clientName: client.name,
      description: form.description.trim(),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      billable: form.billable,
      rate: form.rate ? parseFloat(form.rate) : undefined,
      isRunning: true,
    });
    
    // Reset form
    setForm({
      clientId: '',
      description: '',
      tags: '',
      billable: true,
      rate: '',
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
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.caption,
    color: color.text.secondary,
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>Client *</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.clientId}
            onChange={(e) => {
              const client = clients.find(c => c.id === e.target.value);
              setForm({ 
                ...form, 
                clientId: e.target.value,
                // Auto-fill rate from client if available
                rate: client?.rate?.match(/\$(\d+)/)?.[1] || form.rate
              });
            }}
            required
          >
            <option value="">Choose client...</option>
            {clients
              .filter(c => c.status === 'active')
              .map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.rate})
                </option>
              ))}
          </select>
        </div>
        
        <div>
          <label style={labelStyle}>Rate ($/hr)</label>
          <input
            type="number"
            style={inputStyle}
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
            placeholder="Auto-filled"
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Description *</label>
        <input
          style={inputStyle}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What are you working on?"
          required
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Tags (optional)</label>
          <input
            style={inputStyle}
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="api, troubleshooting, setup"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={form.billable}
              onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              style={{ accentColor: color.ember.DEFAULT }}
            />
            <span style={{ fontSize: typography.fontSize.caption, color: color.text.secondary }}>
              Billable
            </span>
          </label>
        </div>
      </div>
      
      <EmberButton type="submit">
        ▶️ Start Timer
      </EmberButton>
    </form>
  );
}

// Time Entry Row Component
function TimeEntryRow({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: TimeEntry;
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateValue = (): string => {
    if (!entry.billable || !entry.rate || !entry.duration) return '$0';
    const hours = entry.duration / 60;
    return `$${(hours * entry.rate).toFixed(2)}`;
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 80px 80px 100px auto',
      gap: '12px',
      alignItems: 'center',
      padding: '12px',
      background: entry.isRunning ? 'rgba(255, 107, 53, 0.05)' : color.bg.surface,
      border: `1px solid ${entry.isRunning ? color.glass.borderHover : color.glass.border}`,
      borderRadius: radius.md,
      marginBottom: '8px',
    }}>
      <div>
        <div style={{ 
          fontWeight: typography.fontWeight.semibold, 
          color: color.text.primary,
          marginBottom: '2px',
        }}>
          {entry.clientName}
        </div>
        <div style={{ 
          color: color.text.secondary, 
          fontSize: typography.fontSize.body,
          marginBottom: '4px',
        }}>
          {entry.description}
        </div>
        {entry.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {entry.tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: typography.fontSize.metadata,
                  color: color.text.dim,
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 6px',
                  borderRadius: radius.sm,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: typography.fontSize.caption, color: color.text.dim }}>
        {formatDate(entry.startTime)}
      </div>

      <div style={{ 
        textAlign: 'center', 
        fontWeight: typography.fontWeight.semibold,
        color: entry.duration ? color.text.primary : color.text.dim,
      }}>
        {entry.duration ? formatDuration(entry.duration) : (entry.isRunning ? '⏱️' : '0m')}
      </div>

      <div style={{ 
        textAlign: 'center',
        color: entry.billable ? color.status.healthy : color.text.dim,
      }}>
        {entry.billable ? '💰' : '—'}
      </div>

      <div style={{ 
        textAlign: 'right', 
        fontWeight: typography.fontWeight.semibold,
        color: entry.billable && entry.rate ? color.ember.flame : color.text.dim,
      }}>
        {calculateValue()}
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            background: 'none',
            border: 'none',
            color: color.text.secondary,
            cursor: 'pointer',
            fontSize: typography.fontSize.metadata,
          }}
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          style={{
            background: 'none',
            border: 'none',
            color: color.status.error,
            cursor: 'pointer',
            fontSize: typography.fontSize.metadata,
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// Main TimeTracker Component
export function TimeTracker({ clients }: TimeTrackerProps): React.ReactElement {
  const [timeData, setTimeData] = useState<TimeEntriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  // Timer logic
  useEffect(() => {
    if (timeData?.activeTimer) {
      const startTime = new Date(timeData.activeTimer.startedAt).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      };
      
      updateTimer(); // Initial calculation
      intervalRef.current = setInterval(updateTimer, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedSeconds(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
        body: JSON.stringify({ 
          id: timeData.activeTimer.entryId, 
          action: 'stop' 
        }),
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
      const response = await fetch(`/api/time-entries?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete entry');
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: color.text.dim 
      }}>
        Loading time tracker...
      </div>
    );
  }

  const activeEntry = timeData?.entries.find(e => e.isRunning) || null;
  const recentEntries = timeData?.entries
    .filter(e => !e.isRunning)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Timer */}
      <GlassCard>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{
            margin: '0 0 8px 0',
            color: color.ember.flame,
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
          }}>
            Active Timer
          </h3>
        </div>
        <Timer
          activeEntry={activeEntry}
          elapsedSeconds={elapsedSeconds}
          onStop={handleStopTimer}
        />
      </GlassCard>

      {/* Start New Timer */}
      {!activeEntry && (
        <GlassCard>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              color: color.text.primary,
              fontSize: typography.fontSize.pageTitle,
              fontWeight: typography.fontWeight.semibold,
            }}>
              Start Timer
            </h3>
          </div>
          <StartTimerForm
            clients={clients}
            onStart={handleStartTimer}
          />
        </GlassCard>
      )}

      {/* Recent Time Entries */}
      <GlassCard>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{
            margin: '0 0 8px 0',
            color: color.text.primary,
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
          }}>
            Recent Entries
          </h3>
        </div>
        
        {recentEntries.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: color.text.dim, 
            padding: '20px' 
          }}>
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
    </div>
  );
}