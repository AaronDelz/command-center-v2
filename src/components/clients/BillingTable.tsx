'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { Client, BillingPeriod, BillingPaymentStatus, TimeEntry, TimeEntriesData } from '@/lib/types';

// ─── Config ─────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<BillingPaymentStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',      color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)' },
  invoiceSent: { label: 'Sent',         color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  received:    { label: 'Received',     color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  completed:   { label: 'Completed',    color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
};

const PAYMENT_OPTIONS: BillingPaymentStatus[] = ['pending', 'invoiceSent', 'received', 'completed'];

const GROUP_ORDER = ['current', 'past', 'next', 'completed'] as const;
type GroupKey = typeof GROUP_ORDER[number];

const GROUP_LABELS: Record<GroupKey, string> = {
  next: '📅 Next Month',
  current: '🔥 Current Month',
  past: '📋 Past Month',
  completed: '✅ Completed',
};

// ─── Types ──────────────────────────────────────────────────────

interface BillingRow extends BillingPeriod {
  client?: Client;
  trackedHours: number;
  trackedMinutes: number;
  isTimerRunning: boolean;
  runningEntryId?: string;
  runningStartTime?: string;
}

interface BillingTableProps {
  clients: Client[];
  onRefresh?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────

function fmt$(n: number): string {
  if (n === 0) return '—';
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtTime(minutes: number): string {
  if (minutes === 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function getMonthLabel(month: number, year: number): string {
  const d = new Date(year, month - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── Payment Dropdown ───────────────────────────────────────────

function PaymentDropdown({
  status,
  onChange,
  disabled,
}: {
  status: BillingPaymentStatus;
  onChange: (s: BillingPaymentStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const cfg = PAYMENT_STATUS_CONFIG[status];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: cfg.color,
          background: cfg.bg,
          border: `1px solid ${cfg.color}30`,
          borderRadius: '999px',
          padding: '3px 10px 3px 10px',
          cursor: disabled ? 'default' : 'pointer',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          transition: `all ${animation.duration.normal}`,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {cfg.label}
        <span style={{ fontSize: '0.5rem', opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: color.bg.elevated,
            border: `1px solid ${color.glass.border}`,
            borderRadius: radius.lg,
            padding: '4px',
            zIndex: 50,
            minWidth: '120px',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          }}
        >
          {PAYMENT_OPTIONS.map((opt) => {
            const optCfg = PAYMENT_STATUS_CONFIG[opt];
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontSize: '0.7rem',
                  fontWeight: opt === status ? 700 : 500,
                  color: optCfg.color,
                  background: opt === status ? optCfg.bg : 'transparent',
                  border: 'none',
                  borderRadius: radius.md,
                  cursor: 'pointer',
                  transition: `background ${animation.duration.fast}`,
                }}
                onMouseEnter={(e) => { if (opt !== status) (e.target as HTMLElement).style.background = `${optCfg.bg}`; }}
                onMouseLeave={(e) => { if (opt !== status) (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                {optCfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Inline Timer ───────────────────────────────────────────────

function InlineTimer({
  isRunning,
  totalMinutes,
  runningStartTime,
  onStart,
  onStop,
  disabled,
}: {
  isRunning: boolean;
  totalMinutes: number;
  runningStartTime?: string;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || !runningStartTime) { setElapsed(0); return; }
    const update = () => {
      const ms = Date.now() - new Date(runningStartTime).getTime();
      setElapsed(Math.floor(ms / 60000));
    };
    update();
    const interval = setInterval(update, 10000); // update every 10s
    return () => clearInterval(interval);
  }, [isRunning, runningStartTime]);

  const displayMinutes = totalMinutes + (isRunning ? elapsed : 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <button
        onClick={isRunning ? onStop : onStart}
        disabled={disabled}
        title={isRunning ? 'Stop timer' : 'Start timer'}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: `1.5px solid ${isRunning ? '#ef4444' : color.ember.flame}`,
          background: isRunning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.1)',
          color: isRunning ? '#ef4444' : color.ember.flame,
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.6rem',
          padding: 0,
          transition: `all ${animation.duration.normal}`,
          flexShrink: 0,
        }}
      >
        {isRunning ? '⏹' : '▶'}
      </button>
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: isRunning ? 700 : 500,
          color: isRunning ? color.ember.flame : color.text.primary,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '36px',
        }}
      >
        {displayMinutes > 0 ? fmtTime(displayMinutes) : '—'}
      </span>
    </div>
  );
}

// ─── Editable Cell ──────────────────────────────────────────────

function EditableCell({
  value,
  onSave,
  prefix = '$',
  type = 'number',
}: {
  value: number;
  onSave: (v: number) => void;
  prefix?: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(String(value)); setEditing(true); }}
        style={{
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: radius.sm,
          transition: `background ${animation.duration.fast}`,
        }}
        onMouseEnter={(e) => (e.target as HTMLElement).style.background = color.bg.surface}
        onMouseLeave={(e) => (e.target as HTMLElement).style.background = 'transparent'}
        title="Click to edit"
      >
        {value > 0 ? `${prefix}${value.toLocaleString()}` : '—'}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { onSave(parseFloat(draft) || 0); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { onSave(parseFloat(draft) || 0); setEditing(false); }
        if (e.key === 'Escape') setEditing(false);
      }}
      style={{
        width: '70px',
        fontSize: '0.75rem',
        padding: '2px 6px',
        background: color.bg.surface,
        border: `1.5px solid ${color.ember.flame}`,
        borderRadius: radius.sm,
        color: color.text.primary,
        outline: 'none',
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}

// ─── Expanded Row Detail ────────────────────────────────────────

function RowDetail({
  row,
  onClose,
}: {
  row: BillingRow;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/time-entries?clientId=${row.clientId}`);
        if (!res.ok) throw new Error();
        const data = await res.json() as TimeEntriesData;
        // Filter to this month/year
        const filtered = data.entries.filter((e) => {
          const d = new Date(e.startTime);
          return d.getMonth() + 1 === row.month && d.getFullYear() === row.year;
        }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setEntries(filtered);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [row.clientId, row.month, row.year]);

  return (
    <tr>
      <td colSpan={8} style={{ padding: 0, border: 'none' }}>
        <div style={{
          background: color.bg.elevated,
          borderTop: `1px solid ${color.glass.border}`,
          borderBottom: `1px solid ${color.glass.border}`,
          padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: color.text.secondary,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              Time Entries — {row.client?.name || row.clientId}
            </span>
            <button
              onClick={onClose}
              style={{
                fontSize: '0.7rem',
                color: color.text.dim,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>

          {loading ? (
            <div style={{ fontSize: '0.75rem', color: color.text.dim, padding: '8px 0' }}>Loading...</div>
          ) : entries.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: color.text.dim, padding: '8px 0' }}>
              No time entries for this period. Start a timer to begin tracking.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Description', 'Duration', 'Value', 'Notes'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: color.text.dim,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderBottom: `1px solid ${color.glass.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const d = new Date(entry.startTime);
                  const mins = entry.duration || 0;
                  const hrs = mins / 60;
                  const val = entry.billable && entry.rate ? hrs * entry.rate : 0;
                  return (
                    <tr key={entry.id}>
                      <td style={tdDetailStyle}>
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td style={tdDetailStyle}>{entry.description || '(no description)'}</td>
                      <td style={tdDetailStyle}>
                        {entry.isRunning ? '⏱ Running' : fmtTime(mins)}
                      </td>
                      <td style={tdDetailStyle}>{val > 0 ? fmt$(Math.round(val)) : '—'}</td>
                      <td style={{ ...tdDetailStyle, color: color.text.dim }}>{entry.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </td>
    </tr>
  );
}

const tdDetailStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  padding: '6px 8px',
  color: color.text.primary,
  borderBottom: `1px solid ${color.glass.border}20`,
};

// ─── Main Component ─────────────────────────────────────────────

export function BillingTable({ clients, onRefresh }: BillingTableProps): React.ReactElement {
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['completed']));
  const [startingTimer, setStartingTimer] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [billingRes, timeRes] = await Promise.all([
        fetch('/api/billing'),
        fetch('/api/time-entries'),
      ]);
      if (!billingRes.ok || !timeRes.ok) throw new Error();
      const billingData = await billingRes.json();
      const timeData = await timeRes.json() as TimeEntriesData;
      setBillingPeriods(billingData.billingPeriods);
      setTimeEntries(timeData.entries);
    } catch (e) {
      console.error('BillingTable fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build rows grouped by period
  const groupedRows = useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    
    const rows: BillingRow[] = billingPeriods.map((bp) => {
      const client = clientMap.get(bp.clientId);
      // Calculate tracked time from time entries for this client+month
      const monthEntries = timeEntries.filter((e) => {
        const d = new Date(e.startTime);
        return e.clientId === bp.clientId && d.getMonth() + 1 === bp.month && d.getFullYear() === bp.year;
      });
      const totalMinutes = monthEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
      const runningEntry = monthEntries.find((e) => e.isRunning);

      return {
        ...bp,
        client,
        trackedHours: Math.floor(totalMinutes / 60),
        trackedMinutes: totalMinutes,
        isTimerRunning: !!runningEntry,
        runningEntryId: runningEntry?.id,
        runningStartTime: runningEntry?.startTime,
      };
    });

    // Group by period
    const groups: Record<string, BillingRow[]> = {};
    for (const row of rows) {
      const key = row.period || 'current';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    // Sort within groups: by client name
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const nameA = a.client?.name || a.clientId;
        const nameB = b.client?.name || b.clientId;
        return nameA.localeCompare(nameB);
      });
    }

    return groups;
  }, [billingPeriods, timeEntries, clients]);

  // Timer handlers
  async function handleStartTimer(row: BillingRow) {
    setStartingTimer(row.id);
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: row.clientId,
          clientName: row.client?.name || row.clientId,
          description: '',
          billable: true,
          rate: row.client?.hourlyRate || 0,
          tags: [],
        }),
      });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error('Start timer error:', e);
    } finally {
      setStartingTimer(null);
    }
  }

  async function handleStopTimer(row: BillingRow) {
    if (!row.runningEntryId) return;
    try {
      const res = await fetch('/api/time-entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.runningEntryId, action: 'stop' }),
      });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error('Stop timer error:', e);
    }
  }

  // Payment status update
  async function handlePaymentChange(row: BillingRow, status: BillingPaymentStatus) {
    try {
      await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, paymentStatus: status }),
      });
      await fetchData();
    } catch (e) {
      console.error('Payment update error:', e);
    }
  }

  // Inline field edits
  async function handleFieldUpdate(row: BillingRow, field: string, value: number) {
    try {
      await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, [field]: value }),
      });
      await fetchData();
    } catch (e) {
      console.error('Field update error:', e);
    }
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: color.text.dim, fontSize: '0.8rem' }}>
        Loading billing data...
      </div>
    );
  }

  return (
    <div>
      {GROUP_ORDER.map((groupKey) => {
        const rows = groupedRows[groupKey];
        if (!rows || rows.length === 0) return null;

        const isCollapsed = collapsedGroups.has(groupKey);
        const groupTotal = rows.reduce((sum, r) => sum + r.monthlyTotal, 0);
        const monthLabel = rows.length > 0 ? getMonthLabel(rows[0].month, rows[0].year) : '';

        return (
          <div key={groupKey} style={{ marginBottom: '16px' }}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(groupKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                background: color.bg.surface,
                border: `1px solid ${color.glass.border}`,
                borderRadius: isCollapsed ? radius.lg : `${radius.lg} ${radius.lg} 0 0`,
                cursor: 'pointer',
                transition: `all ${animation.duration.normal}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: color.text.dim, transition: `transform ${animation.duration.normal}`, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: color.text.primary }}>
                  {GROUP_LABELS[groupKey]}
                </span>
                <span style={{ fontSize: '0.7rem', color: color.text.dim }}>
                  — {monthLabel}
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  color: color.text.dim,
                  background: color.bg.elevated,
                  padding: '2px 8px',
                  borderRadius: radius.full,
                }}>
                  {rows.length} {rows.length === 1 ? 'client' : 'clients'}
                </span>
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: groupKey === 'current' ? color.ember.flame : color.text.primary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fmt$(Math.round(groupTotal))}
              </span>
            </button>

            {/* Table */}
            {!isCollapsed && (
              <div style={{
                border: `1px solid ${color.glass.border}`,
                borderTop: 'none',
                borderRadius: `0 0 ${radius.lg} ${radius.lg}`,
                overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: color.bg.elevated }}>
                      {[
                        { label: 'Client', width: '22%' },
                        { label: 'Timer', width: '10%' },
                        { label: '$ Tracked', width: '11%' },
                        { label: '$/Hr', width: '8%' },
                        { label: 'Retainer', width: '11%' },
                        { label: 'Project', width: '11%' },
                        { label: 'Monthly Total', width: '13%' },
                        { label: 'Payment', width: '14%' },
                      ].map((col) => (
                        <th key={col.label} style={{
                          textAlign: col.label === 'Client' ? 'left' : 'right',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          color: color.text.dim,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '8px 10px',
                          borderBottom: `1px solid ${color.glass.border}`,
                          width: col.width,
                        }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isExpanded = expandedRow === row.id;
                      return (
                        <React.Fragment key={row.id}>
                          <tr
                            style={{
                              background: isExpanded ? color.bg.surface : 'transparent',
                              cursor: 'pointer',
                              transition: `background ${animation.duration.fast}`,
                            }}
                            onMouseEnter={(e) => {
                              if (!isExpanded) (e.currentTarget as HTMLElement).style.background = `${color.bg.surface}80`;
                            }}
                            onMouseLeave={(e) => {
                              if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            {/* Client Name */}
                            <td
                              onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                              style={{
                                padding: '8px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: color.text.primary,
                                borderBottom: `1px solid ${color.glass.border}20`,
                              }}
                            >
                              {row.client?.name || row.clientId}
                            </td>

                            {/* Inline Timer */}
                            <td style={{ padding: '8px 10px', borderBottom: `1px solid ${color.glass.border}20` }}>
                              {(row.client?.hourlyRate || 0) > 0 ? (
                                <InlineTimer
                                  isRunning={row.isTimerRunning}
                                  totalMinutes={row.trackedMinutes}
                                  runningStartTime={row.runningStartTime}
                                  onStart={() => handleStartTimer(row)}
                                  onStop={() => handleStopTimer(row)}
                                  disabled={startingTimer === row.id}
                                />
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: color.text.dim }}>—</span>
                              )}
                            </td>

                            {/* $ Tracked */}
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              <EditableCell
                                value={Math.round(row.incomeTracked)}
                                onSave={(v) => handleFieldUpdate(row, 'incomeTracked', v)}
                              />
                            </td>

                            {/* $/Hr */}
                            <td style={{ ...tdStyle, textAlign: 'right', color: color.text.secondary }}>
                              {(row.client?.hourlyRate || 0) > 0 ? `$${row.client!.hourlyRate}` : '—'}
                            </td>

                            {/* Retainer */}
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              <EditableCell
                                value={Math.round(row.incomeRetainer)}
                                onSave={(v) => handleFieldUpdate(row, 'incomeRetainer', v)}
                              />
                            </td>

                            {/* Single Project */}
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              <EditableCell
                                value={Math.round(row.incomeProject)}
                                onSave={(v) => handleFieldUpdate(row, 'incomeProject', v)}
                              />
                            </td>

                            {/* Monthly Total */}
                            <td style={{
                              ...tdStyle,
                              textAlign: 'right',
                              fontWeight: 700,
                              color: row.monthlyTotal > 0 ? color.text.primary : color.text.dim,
                            }}>
                              {fmt$(Math.round(row.monthlyTotal))}
                            </td>

                            {/* Payment Status */}
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              <PaymentDropdown
                                status={row.paymentStatus}
                                onChange={(s) => handlePaymentChange(row, s)}
                              />
                            </td>
                          </tr>

                          {/* Expanded Detail */}
                          {isExpanded && (
                            <RowDetail row={row} onClose={() => setExpandedRow(null)} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(groupedRows).length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: color.text.dim,
          background: color.bg.surface,
          borderRadius: radius.xl,
          border: `1px solid ${color.glass.border}`,
          fontSize: '0.8rem',
        }}>
          No billing periods found. They'll be created automatically for active clients.
        </div>
      )}
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: '0.75rem',
  color: color.text.primary,
  borderBottom: `1px solid ${color.glass.border}20`,
  fontVariantNumeric: 'tabular-nums',
};
