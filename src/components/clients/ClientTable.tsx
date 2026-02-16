'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { color, typography, radius, animation, shadow, glass } from '@/styles/tokens';
import type { Client, ClientStatus, PaymentStatus, TimeEntriesData, TimeEntry } from '@/lib/types';

// ─── Status Config ──────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',      color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
  sent:     { label: 'Sent for Payment', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  received: { label: 'Received',     color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
};

// ─── Types ──────────────────────────────────────────────────────

interface ClientTableProps {
  clients: Client[];
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
  onAdd: () => void;
}

interface ClientRowData extends Client {
  monthlyTrackedTime: number; // minutes
  isTimerRunning: boolean;
  trackedValue: number; // calculated from tracked hours × hourly rate
}

// ─── Helpers ────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n === 0) return '—';
  return `$${n.toLocaleString()}`;
}

function formatTime(minutes: number): string {
  if (minutes === 0) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

function formatElapsedTime(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function extractHourlyRate(rateString: string): number {
  const match = rateString.match(/\$(\d+)/);
  return match ? parseFloat(match[1]) : 0;
}

function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// ─── Expanded Row ───────────────────────────────────────────────

function ExpandedDetails({
  client,
  onUpdate,
}: {
  client: ClientRowData;
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'intel' | 'timelog'>('intel');
  const [notes, setNotes] = useState(client.notes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingTimeEntries, setLoadingTimeEntries] = useState(false);

  // Fetch time entries for this client
  const fetchTimeEntries = useCallback(async () => {
    if (activeTab !== 'timelog') return;
    
    setLoadingTimeEntries(true);
    try {
      const response = await fetch(`/api/time-entries?clientId=${client.id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json() as TimeEntriesData;
      // Filter and sort by most recent first
      const clientEntries = data.entries
        .filter(entry => entry.clientId === client.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setTimeEntries(clientEntries);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoadingTimeEntries(false);
    }
  }, [client.id, activeTab]);

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  async function saveNotes() {
    setSaving(true);
    await onUpdate(client.id, { notes });
    setEditingNotes(false);
    setSaving(false);
  }

  async function handlePaymentStatusCycle() {
    const order: PaymentStatus[] = ['pending', 'sent', 'received'];
    const idx = order.indexOf(client.paymentStatus);
    const next = order[(idx + 1) % order.length];
    await onUpdate(client.id, { paymentStatus: next });
  }

  const daysUntilDue = client.dueDate
    ? Math.ceil((new Date(client.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const daysSinceActivity = Math.floor((Date.now() - new Date(client.lastActivity).getTime()) / (1000 * 60 * 60 * 24));

  // Format time entry display
  function formatTimeEntry(entry: TimeEntry): { dateStr: string; timeRange: string; duration: string } {
    const startDate = new Date(entry.startTime);
    const dateStr = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    let endTimeStr = 'Now';
    if (!entry.isRunning && entry.endTime) {
      endTimeStr = new Date(entry.endTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    const timeRange = `${startTime} – ${endTimeStr}`;

    let duration: string;
    if (entry.isRunning) {
      const elapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60));
      const hours = Math.floor(elapsed / 60);
      const minutes = elapsed % 60;
      duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else if (entry.duration) {
      const hours = Math.floor(entry.duration / 60);
      const minutes = entry.duration % 60;
      duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else {
      duration = '—';
    }

    return { dateStr, timeRange, duration };
  }

  return (
    <tr>
      <td colSpan={8} style={{ padding: 0, border: 'none' }}>
        <div
          style={{
            background: color.bg.elevated,
            borderTop: `1px solid ${color.glass.border}`,
          }}
        >
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            borderBottom: `1px solid ${color.glass.border}`,
            padding: '0 20px'
          }}>
            {[
              { key: 'intel' as const, label: 'Intel' },
              { key: 'timelog' as const, label: 'Time Log' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  fontSize: typography.fontSize.caption,
                  fontWeight: activeTab === tab.key ? typography.fontWeight.semibold : typography.fontWeight.regular,
                  color: activeTab === tab.key ? color.ember.flame : color.text.secondary,
                  background: 'none',
                  border: 'none',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: `all ${animation.duration.normal}`,
                  borderBottom: activeTab === tab.key ? `2px solid ${color.ember.flame}` : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '16px 20px 20px' }}>
            {activeTab === 'intel' ? (
              // Existing details content
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                {/* Col 1: Details */}
                <div>
                  <div style={sectionLabelStyle}>CONTACT & DETAILS</div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Contact</span>
                    <span style={detailValueStyle}>{client.contact}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Business</span>
                    <span style={detailValueStyle}>{client.business}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Since</span>
                    <span style={detailValueStyle}>
                      {new Date(client.since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Activity</span>
                    <span style={{
                      ...detailValueStyle,
                      color: daysSinceActivity > 7 ? color.status.warning : daysSinceActivity === 0 ? color.status.healthy : color.text.primary,
                    }}>
                      {daysSinceActivity === 0 ? 'Today' : `${daysSinceActivity}d ago`}
                    </span>
                  </div>
                  {daysUntilDue !== null && (
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}>Due Date</span>
                      <span style={{
                        ...detailValueStyle,
                        color: daysUntilDue <= 7 ? color.status.error : daysUntilDue <= 14 ? color.status.warning : color.text.primary,
                      }}>
                        {new Date(client.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' '}({daysUntilDue > 0 ? `${daysUntilDue}d left` : daysUntilDue === 0 ? 'Today!' : `${Math.abs(daysUntilDue)}d overdue`})
                      </span>
                    </div>
                  )}
                </div>

                {/* Col 2: Tags & Payment */}
                <div>
                  <div style={sectionLabelStyle}>PAYMENT & TAGS</div>
                  <div style={{ marginBottom: '10px' }}>
                    <button
                      onClick={handlePaymentStatusCycle}
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: typography.fontWeight.bold,
                        color: PAYMENT_STATUS_CONFIG[client.paymentStatus].color,
                        background: PAYMENT_STATUS_CONFIG[client.paymentStatus].bg,
                        border: `1px solid ${PAYMENT_STATUS_CONFIG[client.paymentStatus].color}30`,
                        borderRadius: radius.full,
                        padding: '3px 12px',
                        cursor: 'pointer',
                        letterSpacing: '0.08em',
                        transition: `all ${animation.duration.normal}`,
                      }}
                    >
                      {PAYMENT_STATUS_CONFIG[client.paymentStatus].label} ↻
                    </button>
                  </div>
                  {client.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {client.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.6rem',
                            color: color.text.secondary,
                            background: color.bg.overlay,
                            borderRadius: radius.full,
                            padding: '2px 8px',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {client.link && (
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href={client.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: typography.fontSize.metadata,
                          color: color.blue.DEFAULT,
                          textDecoration: 'none',
                        }}
                      >
                        📄 View docs →
                      </a>
                    </div>
                  )}
                </div>

                {/* Col 3: Notes */}
                <div>
                  <div style={sectionLabelStyle}>NOTES</div>
                  {editingNotes ? (
                    <div>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          background: color.bg.surface,
                          border: `1px solid ${color.glass.borderFocus}`,
                          borderRadius: radius.sm,
                          color: color.text.primary,
                          fontSize: typography.fontSize.caption,
                          padding: '8px',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          lineHeight: typography.lineHeight.relaxed,
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button onClick={saveNotes} disabled={saving} style={saveBtnStyle}>
                          {saving ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingNotes(false); setNotes(client.notes); }}
                          style={cancelBtnStyle}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingNotes(true)}
                      style={{
                        cursor: 'pointer',
                        fontSize: typography.fontSize.caption,
                        color: client.notes ? color.text.secondary : color.text.dim,
                        lineHeight: typography.lineHeight.relaxed,
                        padding: '4px 0',
                      }}
                      title="Click to edit"
                    >
                      {client.notes || 'No notes — click to add'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Time Log tab content
              <div>
                {loadingTimeEntries ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: color.text.dim, 
                    padding: '20px' 
                  }}>
                    Loading time entries...
                  </div>
                ) : timeEntries.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: color.text.dim, 
                    padding: '20px' 
                  }}>
                    No time entries yet
                  </div>
                ) : (
                  <div>
                    {timeEntries.slice(0, 5).map((entry, index) => {
                      const { dateStr, timeRange, duration } = formatTimeEntry(entry);
                      const hasRealDescription = entry.description && entry.description !== 'Quick timer session';
                      return (
                        <div
                          key={entry.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '240px 1fr 80px',
                            gap: '12px',
                            alignItems: 'center',
                            maxWidth: '850px',
                            padding: '10px 0',
                            borderBottom: index < Math.min(timeEntries.length, 5) - 1 
                              ? `1px solid ${color.glass.border}` 
                              : 'none',
                          }}
                        >
                          {/* Date + Time Range — single line */}
                          <div style={{
                            fontSize: typography.fontSize.caption,
                            color: color.text.primary,
                          }}>
                            <span style={{ fontWeight: typography.fontWeight.semibold }}>
                              {dateStr}
                            </span>
                            <span style={{ color: color.text.dim, marginLeft: '8px' }}>
                              {timeRange}
                            </span>
                          </div>
                          
                          {/* Description / Notes */}
                          <div style={{
                            fontSize: typography.fontSize.caption,
                            color: hasRealDescription ? color.text.secondary : color.text.dim,
                            fontStyle: hasRealDescription ? 'normal' : 'italic',
                            lineHeight: typography.lineHeight.relaxed,
                          }}>
                            {hasRealDescription ? entry.description : 'No notes'}
                            {entry.isRunning && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '0.6rem',
                                color: color.ember.DEFAULT,
                                background: `rgba(255, 107, 53, 0.15)`,
                                padding: '1px 6px',
                                borderRadius: radius.full,
                                fontWeight: typography.fontWeight.bold,
                              }}>
                                LIVE
                              </span>
                            )}
                          </div>
                          
                          {/* Duration — positioned left, not far right */}
                          <div style={{
                            fontSize: typography.fontSize.caption,
                            color: duration === '—' ? color.text.dim : color.text.accent,
                            fontWeight: typography.fontWeight.semibold,
                            fontFamily: typography.fontFamily.mono,
                            textAlign: 'left',
                          }}>
                            {duration}
                          </div>
                        </div>
                      );
                    })}
                    
                    {timeEntries.length > 5 && (
                      <div style={{ 
                        textAlign: 'center', 
                        marginTop: '12px' 
                      }}>
                        <button
                          onClick={() => window.location.href = '/time'}
                          style={{
                            fontSize: typography.fontSize.caption,
                            color: color.ember.DEFAULT,
                            background: 'none',
                            border: `1px solid ${color.ember.DEFAULT}40`,
                            borderRadius: radius.md,
                            padding: '4px 12px',
                            cursor: 'pointer',
                            transition: `all ${animation.duration.normal}`,
                          }}
                        >
                          Show All ({timeEntries.length} entries)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Shared Styles ──────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.metadata,
  fontWeight: typography.fontWeight.semibold,
  color: color.text.accent,
  textTransform: 'uppercase',
  letterSpacing: typography.letterSpacing.widest,
  marginBottom: '8px',
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: typography.fontSize.caption,
  marginBottom: '4px',
};

const detailLabelStyle: React.CSSProperties = {
  color: color.text.dim,
};

const detailValueStyle: React.CSSProperties = {
  color: color.text.primary,
};

const saveBtnStyle: React.CSSProperties = {
  fontSize: typography.fontSize.metadata,
  background: color.ember.DEFAULT,
  color: color.text.inverse,
  border: 'none',
  borderRadius: radius.sm,
  padding: '3px 10px',
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  fontSize: typography.fontSize.metadata,
  background: 'none',
  color: color.text.dim,
  border: `1px solid ${color.glass.border}`,
  borderRadius: radius.sm,
  padding: '3px 10px',
  cursor: 'pointer',
};

// ─── Main Table Component ───────────────────────────────────────

export function ClientTable({ clients, onUpdate, onAdd }: ClientTableProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [timeData, setTimeData] = useState<TimeEntriesData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch time data for calculations
  const fetchTimeData = useCallback(async () => {
    try {
      const response = await fetch('/api/time-entries');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json() as TimeEntriesData;
      setTimeData(data);
    } catch (error) {
      console.error('Error fetching time data:', error);
    }
  }, []);

  // Update timer every second
  useEffect(() => {
    fetchTimeData();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchTimeData]);

  // Transform clients to include time tracking data
  const enrichedClients: ClientRowData[] = clients.map(client => {
    const { start, end } = getCurrentMonthRange();
    
    // Get this month's entries for this client
    const monthEntries = timeData?.entries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entry.clientId === client.id && 
             entryDate >= start && 
             entryDate <= end;
    }) || [];

    // Calculate monthly tracked time
    const monthlyTrackedTime = monthEntries.reduce((sum, entry) => {
      if (entry.isRunning) {
        // Calculate live time for running entries
        const elapsed = Math.floor((currentTime.getTime() - new Date(entry.startTime).getTime()) / (1000 * 60));
        return sum + elapsed;
      }
      return sum + (entry.duration || 0);
    }, 0);

    // Check if timer is currently running
    const isTimerRunning = monthEntries.some(entry => entry.isRunning);

    // Calculate tracked value
    const hourlyRate = client.hourlyRate || extractHourlyRate(client.rate);
    const trackedValue = (monthlyTrackedTime / 60) * hourlyRate;

    // Calculate monthly total (existing logic or set default)
    const monthlyTotal = client.monthlyTotal || 
                        (client.monthlyRetainer || 0) + 
                        (client.avgMonthly || 0) + 
                        (client.projectValue || 0);

    return {
      ...client,
      monthlyTrackedTime,
      isTimerRunning,
      trackedValue,
      monthlyTotal,
      // Ensure default values for new fields
      paymentStatus: client.paymentStatus || 'pending',
      hourlyRate: hourlyRate,
    };
  });

  // Get most recent time entry for inline display
  function getMostRecentTimeEntry(clientId: string): { display: string; duration: string } | null {
    if (!timeData) return null;
    
    const clientEntries = timeData.entries
      .filter(entry => entry.clientId === clientId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    if (clientEntries.length === 0) return null;
    
    const entry = clientEntries[0];
    const entryDate = new Date(entry.startTime);
    const dateStr = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    let duration: string;
    if (entry.isRunning) {
      const elapsed = Math.floor((currentTime.getTime() - entryDate.getTime()) / (1000 * 60));
      const hours = Math.floor(elapsed / 60);
      const minutes = elapsed % 60;
      duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else if (entry.duration) {
      const hours = Math.floor(entry.duration / 60);
      const minutes = entry.duration % 60;
      duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else {
      duration = '—';
    }
    
    return {
      display: `${dateStr} · ${duration} · ${entry.description}`,
      duration
    };
  }

  // Sort: active → pipeline → paused → completed
  const sortOrder: Record<ClientStatus, number> = { active: 0, pipeline: 1, paused: 2, completed: 3 };
  const sorted = [...enrichedClients].sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);

  // Calculate totals
  const totalMonthlyAmount = sorted.reduce((s, c) => s + (c.status === 'active' ? (c.monthlyTotal || 0) : 0), 0);
  const totalTrackedValue = sorted.reduce((s, c) => s + (c.status === 'active' ? c.trackedValue : 0), 0);
  const totalRetainer = sorted.reduce((s, c) => s + (c.status === 'active' ? (c.monthlyRetainer || 0) : 0), 0);
  const totalProject = sorted.reduce((s, c) => s + (c.status !== 'completed' ? (c.projectValue || 0) : 0), 0);
  const activeCount = sorted.filter((c) => c.status === 'active').length;

  const columnHeaders = [
    { label: 'CLIENT', align: 'left' as const, width: undefined },
    { label: 'MONTHLY TOTAL', align: 'right' as const, width: '120px' },
    { label: 'TIME TRACKED', align: 'right' as const, width: '120px' },
    { label: 'PAYMENT STATUS', align: 'center' as const, width: '140px' },
    { label: 'FORGED', align: 'right' as const, width: '110px' },
    { label: '$/HR', align: 'right' as const, width: '80px' },
    { label: 'RETAINER', align: 'right' as const, width: '100px' },
    { label: 'CONTRACT', align: 'right' as const, width: '120px' },
  ];

  return (
    <div
      style={{
        background: color.bg.surface,
        backdropFilter: glass.blur.card,
        WebkitBackdropFilter: glass.blur.card,
        border: `1.5px solid ${color.glass.border}`,
        borderRadius: radius.xl,
        boxShadow: shadow.card,
        overflow: 'hidden',
      }}
    >
      {/* Inner shine */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          boxShadow: shadow.innerShine,
          pointerEvents: 'none',
        }}
      />

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: typography.fontFamily.body,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <thead>
          <tr>
            {columnHeaders.map((col) => (
              <th
                key={col.label}
                style={{
                  fontSize: typography.fontSize.metadata,
                  fontWeight: typography.fontWeight.semibold,
                  color: color.text.accent,
                  textTransform: 'uppercase',
                  letterSpacing: typography.letterSpacing.widest,
                  textAlign: col.align,
                  padding: '14px 16px 10px',
                  borderBottom: `1px solid ${color.glass.border}`,
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {sorted.map((client) => {
            const isExpanded = expandedId === client.id;
            const isHovered = hoveredId === client.id;
            const paymentCfg = PAYMENT_STATUS_CONFIG[client.paymentStatus];

            return (
              <React.Fragment key={client.id}>
                <tr
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                  onMouseEnter={() => setHoveredId(client.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    cursor: 'pointer',
                    background: isExpanded
                      ? color.bg.elevated
                      : isHovered
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'transparent',
                    transition: `background ${animation.duration.fast}`,
                  }}
                >
                  {/* Client Name */}
                  <td style={{ ...cellStyle, paddingLeft: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: `transform ${animation.duration.normal}`,
                            display: 'inline-block',
                            fontSize: '0.6rem',
                            color: color.text.dim,
                          }}
                        >
                          ▸
                        </span>
                        <span style={{
                          fontWeight: typography.fontWeight.semibold,
                          color: color.text.primary,
                        }}>
                          {client.name}
                        </span>
                      </div>
                      {(() => {
                        const recentEntry = getMostRecentTimeEntry(client.id);
                        return recentEntry ? (
                          <div style={{
                            fontSize: typography.fontSize.metadata,
                            color: color.text.dim,
                            marginTop: '2px',
                            marginLeft: '16px', // Align with client name after the arrow
                          }}>
                            {recentEntry.display}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </td>

                  {/* Monthly Total */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <span style={{ color: (client.monthlyTotal || 0) > 0 ? color.ember.flame : color.text.dim }}>
                      {formatCurrency(client.monthlyTotal || 0)}
                    </span>
                  </td>

                  {/* Time Tracked */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span style={{ color: client.monthlyTrackedTime > 0 ? color.text.primary : color.text.dim }}>
                        {formatTime(client.monthlyTrackedTime)}
                      </span>
                      {client.isTimerRunning && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: color.ember.DEFAULT,
                          animation: 'pulse 1.5s ease-in-out infinite',
                          boxShadow: `0 0 8px ${color.ember.DEFAULT}`,
                        }} />
                      )}
                    </div>
                  </td>

                  {/* Payment Status */}
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: typography.fontWeight.bold,
                        color: paymentCfg.color,
                        background: paymentCfg.bg,
                        border: `1px solid ${paymentCfg.color}30`,
                        borderRadius: radius.full,
                        padding: '3px 10px',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {paymentCfg.label}
                    </span>
                  </td>

                  {/* $ (Tracked) */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <span style={{ color: client.trackedValue > 0 ? color.status.healthy : color.text.dim }}>
                      {formatCurrency(Math.round(client.trackedValue))}
                    </span>
                  </td>

                  {/* $/Hr */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <span style={{ color: client.hourlyRate > 0 ? color.text.primary : color.text.dim }}>
                      {client.hourlyRate > 0 ? `$${client.hourlyRate}` : '—'}
                    </span>
                  </td>

                  {/* Retainer */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <span style={{ color: (client.monthlyRetainer || 0) > 0 ? color.ember.flame : color.text.dim }}>
                      {formatCurrency(client.monthlyRetainer || 0)}
                    </span>
                  </td>

                  {/* Single Project */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <span style={{ color: (client.projectValue || 0) > 0 ? color.ember.DEFAULT : color.text.dim }}>
                      {formatCurrency(client.projectValue || 0)}
                    </span>
                  </td>
                </tr>

                {/* Expanded details */}
                {isExpanded && (
                  <ExpandedDetails
                    client={client}
                    onUpdate={onUpdate}
                  />
                )}
              </React.Fragment>
            );
          })}
        </tbody>

        {/* Footer — Totals Row */}
        <tfoot>
          <tr
            style={{
              borderTop: `1px solid ${color.glass.border}`,
              background: 'rgba(255, 107, 53, 0.03)',
            }}
          >
            <td style={{ ...cellStyle, paddingLeft: '16px' }}>
              <span style={{
                fontWeight: typography.fontWeight.bold,
                color: color.text.accent,
                fontSize: typography.fontSize.caption,
                letterSpacing: typography.letterSpacing.wider,
              }}>
                TOTALS ({activeCount} active)
              </span>
            </td>
            
            {/* Monthly Total */}
            <td style={{
              ...cellStyle,
              textAlign: 'right',
              fontFamily: typography.fontFamily.mono,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
              textShadow: `0 0 12px rgba(255, 179, 71, 0.3)`,
            }}>
              {formatCurrency(totalMonthlyAmount)}
            </td>
            
            {/* Time Tracked */}
            <td style={cellStyle} />
            
            {/* Payment Status */}
            <td style={cellStyle} />
            
            {/* $ (Tracked) */}
            <td style={{
              ...cellStyle,
              textAlign: 'right',
              fontFamily: typography.fontFamily.mono,
              fontWeight: typography.fontWeight.bold,
              color: color.status.healthy,
              textShadow: `0 0 12px rgba(16, 185, 129, 0.3)`,
            }}>
              {formatCurrency(Math.round(totalTrackedValue))}
            </td>
            
            {/* $/Hr */}
            <td style={cellStyle} />
            
            {/* Retainer */}
            <td style={{
              ...cellStyle,
              textAlign: 'right',
              fontFamily: typography.fontFamily.mono,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
              textShadow: `0 0 12px rgba(255, 179, 71, 0.3)`,
            }}>
              {formatCurrency(totalRetainer)}
            </td>
            
            {/* Single Project */}
            <td style={{
              ...cellStyle,
              textAlign: 'right',
              fontFamily: typography.fontFamily.mono,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.DEFAULT,
              textShadow: `0 0 12px rgba(255, 107, 53, 0.3)`,
            }}>
              {formatCurrency(totalProject)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Cell Style ─────────────────────────────────────────────────

const cellStyle: React.CSSProperties = {
  fontSize: typography.fontSize.body,
  padding: '12px 16px',
  borderBottom: `1px solid rgba(255, 255, 255, 0.03)`,
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
