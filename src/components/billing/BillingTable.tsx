'use client';

import { useState, useCallback, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberButton } from '@/components/ui/EmberButton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { BillingPeriod, BillingPaymentStatus, Client } from '@/lib/types';

// ─── Payment Status Config ─────────────────────────────────────

const STATUS_CONFIG: Record<BillingPaymentStatus, { label: string; color: string; bg: string; next: string }> = {
  pending:     { label: 'Pending',      color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', next: 'Invoice Sent' },
  invoiceSent: { label: 'Invoice Sent', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)',  next: 'Received' },
  received:    { label: 'Received',     color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)',   next: 'Completed' },
  completed:   { label: 'Completed',    color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)',   next: '' },
};

type SortField = 'client' | 'total' | 'status';
type SortDir = 'asc' | 'desc';

interface BillingTableProps {
  periods: BillingPeriod[];
  clients: Client[];
  viewMonth: number;
  viewYear: number;
  onNavigate: (dir: 'prev' | 'next') => void;
  onRefresh: () => void;
}

export function LedgerBillingTable({ periods, clients, viewMonth, viewYear, onNavigate, onRefresh }: BillingTableProps): React.ReactElement {
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ periodId: string; field: 'incomeTracked' | 'incomeRetainer' | 'incomeProject' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [rotating, setRotating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const now = new Date();
  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth - 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewMonth, viewYear]);

  const getClientName = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || clientId;
  }, [clients]);

  const sortedPeriods = useMemo(() => {
    const statusOrder: Record<string, number> = { pending: 0, invoiceSent: 1, received: 2, completed: 3 };
    return [...periods].sort((a, b) => {
      let diff = 0;
      if (sortField === 'total') diff = a.monthlyTotal - b.monthlyTotal;
      else if (sortField === 'client') diff = getClientName(a.clientId).localeCompare(getClientName(b.clientId));
      else if (sortField === 'status') diff = statusOrder[a.paymentStatus] - statusOrder[b.paymentStatus];
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [periods, sortField, sortDir, getClientName]);

  const summary = useMemo(() => ({
    total: periods.reduce((s, p) => s + p.monthlyTotal, 0),
    tracked: periods.reduce((s, p) => s + p.incomeTracked, 0),
    retainer: periods.reduce((s, p) => s + p.incomeRetainer, 0),
    project: periods.reduce((s, p) => s + p.incomeProject, 0),
  }), [periods]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const advanceStatus = useCallback(async (periodId: string) => {
    setAdvancing(periodId);
    try {
      const res = await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: periodId, advanceStatus: true }),
      });
      if (res.ok) onRefresh();
    } catch (e) { console.error(e); }
    finally { setAdvancing(null); }
  }, [onRefresh]);

  const saveEdit = useCallback(async () => {
    if (!editingCell) return;
    const numVal = parseFloat(editValue) || 0;
    try {
      const res = await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCell.periodId, [editingCell.field]: numVal }),
      });
      if (res.ok) onRefresh();
    } catch (e) { console.error(e); }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, onRefresh]);

  const handleRotate = useCallback(async () => {
    setRotating(true);
    try {
      const res = await fetch('/api/billing/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: viewMonth, year: viewYear }),
      });
      if (res.ok) {
        const result = await res.json() as { created: string[] };
        setActionMsg(result.created.length > 0 ? `Created ${result.created.length} periods` : 'All exist');
        onRefresh();
      }
    } catch (e) { console.error(e); }
    finally { setRotating(false); setTimeout(() => setActionMsg(null), 3000); }
  }, [viewMonth, viewYear, onRefresh]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/billing/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: viewMonth, year: viewYear }),
      });
      if (res.ok) {
        const result = await res.json() as { updated: unknown[] };
        setActionMsg(result.updated.length > 0 ? `Synced ${result.updated.length}` : 'All in sync ✓');
        onRefresh();
      }
    } catch (e) { console.error(e); }
    finally { setSyncing(false); setTimeout(() => setActionMsg(null), 3000); }
  }, [viewMonth, viewYear, onRefresh]);

  const fmt = (n: number) => n === 0 ? '—' : `$${Math.round(n).toLocaleString()}`;

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'desc' ? ' ↓' : ' ↑';
  };

  const thStyle = (align: 'left' | 'right', sortable?: SortField): React.CSSProperties => ({
    textAlign: align,
    padding: '8px 12px',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: sortable && sortField === sortable ? color.ember.flame : color.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: `1px solid ${color.glass.border}`,
    cursor: sortable ? 'pointer' : 'default',
    userSelect: 'none',
  });

  return (
    <GlassCard>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <SectionHeading title="Monthly Billing" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => onNavigate('prev')} style={{
            background: 'none', border: `1px solid ${color.glass.border}`, borderRadius: radius.sm,
            color: color.text.secondary, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem',
          }}>←</button>
          <span style={{
            fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold,
            color: isCurrentMonth ? color.ember.flame : color.text.primary, minWidth: '150px', textAlign: 'center',
          }}>{monthLabel}</span>
          <button onClick={() => onNavigate('next')} style={{
            background: 'none', border: `1px solid ${color.glass.border}`, borderRadius: radius.sm,
            color: color.text.secondary, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem',
          }}>→</button>
          <EmberButton size="sm" variant="primary" onClick={handleRotate} disabled={rotating}>
            {rotating ? '...' : 'New Month'}
          </EmberButton>
          <EmberButton size="sm" variant="ghost" onClick={handleSync} disabled={syncing}>
            {syncing ? '...' : '⟳ Sync'}
          </EmberButton>
          {actionMsg && <span style={{ fontSize: typography.fontSize.caption, color: color.status.healthy }}>{actionMsg}</span>}
        </div>
      </div>

      {/* Table */}
      {sortedPeriods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: color.text.dim }}>
          No billing periods for {monthLabel}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle('left', 'client')} onClick={() => toggleSort('client')}>Client{sortIndicator('client')}</th>
                <th style={thStyle('right')}>Tracked</th>
                <th style={thStyle('right')}>Retainer</th>
                <th style={thStyle('right')}>Project</th>
                <th style={thStyle('right', 'total')} onClick={() => toggleSort('total')}>Total{sortIndicator('total')}</th>
                <th style={thStyle('right', 'status')} onClick={() => toggleSort('status')}>Status{sortIndicator('status')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedPeriods.map(period => (
                <tr key={period.id} style={{ borderBottom: `1px solid ${color.glass.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 12px', fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.medium, color: color.text.primary }}>
                    {getClientName(period.clientId)}
                  </td>
                  {(['incomeTracked', 'incomeRetainer', 'incomeProject'] as const).map(field => {
                    const val = period[field];
                    const isEditing = editingCell?.periodId === period.id && editingCell?.field === field;
                    const fieldColor = field === 'incomeTracked' ? color.status.healthy : field === 'incomeRetainer' ? color.ember.flame : color.ember.DEFAULT;
                    return (
                      <td key={field}
                        onDoubleClick={() => { setEditingCell({ periodId: period.id, field }); setEditValue(String(val || '')); }}
                        style={{ padding: '10px 12px', textAlign: 'right', fontSize: typography.fontSize.body, color: val > 0 ? fieldColor : color.text.dim, fontVariantNumeric: 'tabular-nums', cursor: 'pointer' }}
                        title="Double-click to edit"
                      >
                        {isEditing ? (
                          <input type="number" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); } }}
                            autoFocus
                            style={{ width: '80px', textAlign: 'right', background: 'rgba(255,255,255,0.08)', border: `1px solid ${color.ember.flame}`, borderRadius: radius.sm, color: color.text.primary, padding: '2px 6px', fontSize: typography.fontSize.body, outline: 'none' }}
                          />
                        ) : fmt(val)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: typography.fontWeight.semibold, color: color.ember.flame, fontVariantNumeric: 'tabular-nums' }}>
                    ${Math.round(period.monthlyTotal).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => advanceStatus(period.id)}
                      disabled={advancing === period.id || period.paymentStatus === 'completed'}
                      title={period.paymentStatus === 'completed' ? 'Completed' : `Click → ${STATUS_CONFIG[period.paymentStatus].next}`}
                      style={{
                        fontSize: '0.65rem', fontWeight: 700,
                        color: STATUS_CONFIG[period.paymentStatus].color,
                        background: STATUS_CONFIG[period.paymentStatus].bg,
                        border: `1px solid ${STATUS_CONFIG[period.paymentStatus].color}30`,
                        borderRadius: '999px', padding: '3px 12px',
                        cursor: period.paymentStatus === 'completed' ? 'default' : 'pointer',
                        letterSpacing: '0.06em', whiteSpace: 'nowrap',
                        transition: `all ${animation.duration.normal}`,
                        opacity: advancing === period.id ? 0.5 : 1,
                      }}
                    >
                      {STATUS_CONFIG[period.paymentStatus].label} {period.paymentStatus !== 'completed' && '→'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: color.text.accent }}>Total</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.status.healthy, fontVariantNumeric: 'tabular-nums' }}>{fmt(summary.tracked)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.ember.flame, fontVariantNumeric: 'tabular-nums' }}>{fmt(summary.retainer)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.ember.DEFAULT, fontVariantNumeric: 'tabular-nums' }}>{fmt(summary.project)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.ember.flame, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 12px rgba(255,179,71,0.3)' }}>${Math.round(summary.total).toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
