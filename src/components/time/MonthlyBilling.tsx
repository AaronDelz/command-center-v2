'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmberButton } from '@/components/ui/EmberButton';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { BillingPeriod, BillingPaymentStatus, Client, BillingData } from '@/lib/types';

// ─── Payment Status Config ─────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<BillingPaymentStatus, { label: string; color: string; bg: string; next: string }> = {
  pending:     { label: 'Pending',      color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', next: 'Invoice Sent' },
  invoiceSent: { label: 'Invoice Sent', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)',  next: 'Received' },
  received:    { label: 'Received',     color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)',   next: 'Completed' },
  completed:   { label: 'Completed',    color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)',   next: '' },
};

// ─── Payment Status Pill ────────────────────────────────────────

function PaymentStatusPill({ status, onClick, disabled }: { status: BillingPaymentStatus; onClick: () => void; disabled?: boolean }) {
  const cfg = PAYMENT_STATUS_CONFIG[status];
  const isLast = status === 'completed';

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLast}
      title={isLast ? 'Completed' : `Click to advance → ${cfg.next}`}
      style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        borderRadius: '999px',
        padding: '3px 12px',
        cursor: isLast ? 'default' : 'pointer',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        transition: `all ${animation.duration.normal}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {cfg.label} {!isLast && '→'}
    </button>
  );
}

// ─── Types ──────────────────────────────────────────────────────

interface MonthlyBillingProps {
  entries?: unknown[]; // kept for backward compat, not used
  clients?: Client[];
}

// ─── Main Component ─────────────────────────────────────────────

export function MonthlyBilling({ clients: propClients }: MonthlyBillingProps): React.ReactElement {
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [clients, setClients] = useState<Client[]>(propClients || []);
  const [isLoading, setIsLoading] = useState(true);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [rotateMsg, setRotateMsg] = useState<string | null>(null);

  // Month navigation
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth - 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewMonth, viewYear]);

  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [billingRes, clientsRes] = await Promise.all([
        fetch(`/api/billing?month=${viewMonth}&year=${viewYear}`),
        propClients ? Promise.resolve(null) : fetch('/api/clients'),
      ]);

      if (!billingRes.ok) throw new Error('Failed to fetch billing');
      const billingData = await billingRes.json() as BillingData;
      setBillingPeriods(billingData.billingPeriods);

      if (clientsRes) {
        const clientsData = await clientsRes.json() as { clients: Client[] };
        setClients(clientsData.clients);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [viewMonth, viewYear, propClients]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // Advance payment status
  const advanceStatus = useCallback(async (periodId: string) => {
    setAdvancing(periodId);
    try {
      const res = await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: periodId, advanceStatus: true }),
      });
      if (!res.ok) throw new Error('Failed to advance status');
      const updated = await res.json() as BillingPeriod;
      setBillingPeriods(prev => prev.map(p => p.id === periodId ? updated : p));
    } catch (error) {
      console.error('Error advancing status:', error);
    } finally {
      setAdvancing(null);
    }
  }, []);

  // Navigate months
  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Get client name from ID
  const getClientName = useCallback((clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || clientId;
  }, [clients]);

  // Summary calculations
  const summary = useMemo(() => {
    const outstanding = billingPeriods
      .filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'invoiceSent')
      .reduce((s, p) => s + p.monthlyTotal, 0);
    const received = billingPeriods
      .filter(p => p.paymentStatus === 'received')
      .reduce((s, p) => s + p.monthlyTotal, 0);
    const completed = billingPeriods
      .filter(p => p.paymentStatus === 'completed')
      .reduce((s, p) => s + p.monthlyTotal, 0);
    const total = billingPeriods.reduce((s, p) => s + p.monthlyTotal, 0);
    return { outstanding, received, completed, total };
  }, [billingPeriods]);

  // Sort: pending first, then invoiceSent, received, completed
  const sortedPeriods = useMemo(() => {
    const order: Record<string, number> = { pending: 0, invoiceSent: 1, received: 2, completed: 3 };
    return [...billingPeriods].sort((a, b) => {
      const diff = order[a.paymentStatus] - order[b.paymentStatus];
      if (diff !== 0) return diff;
      return b.monthlyTotal - a.monthlyTotal;
    });
  }, [billingPeriods]);

  // Rotate: create billing periods for active clients
  const handleRotate = useCallback(async () => {
    setRotating(true);
    setRotateMsg(null);
    try {
      const res = await fetch('/api/billing/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: viewMonth, year: viewYear }),
      });
      if (!res.ok) throw new Error('Failed to rotate');
      const result = await res.json() as { created: string[]; skipped: string[] };
      const msg = result.created.length > 0
        ? `Created ${result.created.length} periods`
        : 'All periods already exist';
      setRotateMsg(msg);
      if (result.created.length > 0) fetchData();
      setTimeout(() => setRotateMsg(null), 3000);
    } catch (error) {
      console.error('Error rotating billing:', error);
      setRotateMsg('Rotate failed');
      setTimeout(() => setRotateMsg(null), 3000);
    } finally {
      setRotating(false);
    }
  }, [viewMonth, viewYear, fetchData]);

  // Export billing periods as CSV
  const handleExportCSV = useCallback(() => {
    if (sortedPeriods.length === 0) return;

    const headers = ['Client', 'Month', 'Year', 'Tracked', 'Retainer', 'Project', 'Total', 'Payment Status', 'Invoice Sent', 'Payment Received'];
    const rows = sortedPeriods.map(p => [
      getClientName(p.clientId),
      String(p.month),
      String(p.year),
      p.incomeTracked.toFixed(2),
      p.incomeRetainer.toFixed(2),
      p.incomeProject.toFixed(2),
      p.monthlyTotal.toFixed(2),
      PAYMENT_STATUS_CONFIG[p.paymentStatus].label,
      p.invoiceSentDate ?? '',
      p.paymentReceivedDate ?? '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => {
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `billing-${viewYear}-${String(viewMonth).padStart(2, '0')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedPeriods, viewMonth, viewYear, getClientName]);

  const fmt = (n: number) => n === 0 ? '—' : `$${Math.round(n).toLocaleString()}`;

  return (
    <GlassCard>
      {/* Header with month navigation + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <SectionHeading title="Monthly Billing" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={prevMonth}
            style={{
              background: 'none', border: `1px solid ${color.glass.border}`, borderRadius: radius.sm,
              color: color.text.secondary, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem',
            }}
          >
            ← Prev
          </button>
          <span style={{
            fontSize: typography.fontSize.body,
            fontWeight: typography.fontWeight.semibold,
            color: isCurrentMonth ? color.ember.flame : color.text.primary,
            minWidth: '140px', textAlign: 'center',
          }}>
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            style={{
              background: 'none', border: `1px solid ${color.glass.border}`, borderRadius: radius.sm,
              color: color.text.secondary, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem',
            }}
          >
            Next →
          </button>
          <EmberButton size="sm" variant="primary" onClick={handleRotate} disabled={rotating}>
            {rotating ? 'Creating...' : 'New Month'}
          </EmberButton>
          <EmberButton size="sm" variant="ghost" onClick={handleExportCSV} disabled={sortedPeriods.length === 0}>
            Export CSV
          </EmberButton>
          {rotateMsg && (
            <span style={{ fontSize: typography.fontSize.caption, color: color.status.healthy }}>
              {rotateMsg}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Total', value: summary.total, clr: color.ember.flame },
          { label: 'Outstanding', value: summary.outstanding, clr: '#f59e0b' },
          { label: 'Received', value: summary.received, clr: '#10b981' },
          { label: 'Completed', value: summary.completed, clr: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: 'center', padding: '8px',
            background: 'rgba(255,255,255,0.02)', borderRadius: radius.md,
            border: `1px solid ${color.glass.border}`,
          }}>
            <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.clr, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(s.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: color.text.dim }}>Loading billing data...</div>
      ) : sortedPeriods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: color.text.dim, fontSize: typography.fontSize.body }}>
          No billing periods for {monthLabel}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Client', 'Tracked', 'Retainer', 'Project', 'Total', 'Status'].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === 'Client' ? 'left' : 'right',
                      padding: '8px 12px',
                      fontSize: typography.fontSize.caption,
                      fontWeight: typography.fontWeight.medium,
                      color: color.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: `1px solid ${color.glass.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPeriods.map(period => (
                <tr key={period.id} style={{ borderBottom: `1px solid ${color.glass.border}` }}>
                  <td style={{
                    padding: '10px 12px', fontSize: typography.fontSize.body,
                    fontWeight: typography.fontWeight.medium, color: color.text.primary,
                  }}>
                    {getClientName(period.clientId)}
                  </td>
                  <td style={{
                    padding: '10px 12px', textAlign: 'right', fontSize: typography.fontSize.body,
                    color: period.incomeTracked > 0 ? color.status.healthy : color.text.dim,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmt(period.incomeTracked)}
                  </td>
                  <td style={{
                    padding: '10px 12px', textAlign: 'right', fontSize: typography.fontSize.body,
                    color: period.incomeRetainer > 0 ? color.ember.flame : color.text.dim,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmt(period.incomeRetainer)}
                  </td>
                  <td style={{
                    padding: '10px 12px', textAlign: 'right', fontSize: typography.fontSize.body,
                    color: period.incomeProject > 0 ? color.ember.DEFAULT : color.text.dim,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmt(period.incomeProject)}
                  </td>
                  <td style={{
                    padding: '10px 12px', textAlign: 'right', fontSize: typography.fontSize.body,
                    fontWeight: typography.fontWeight.semibold, color: color.ember.flame,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    ${Math.round(period.monthlyTotal).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <PaymentStatusPill
                      status={period.paymentStatus}
                      onClick={() => advanceStatus(period.id)}
                      disabled={advancing === period.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals */}
            <tfoot>
              <tr>
                <td style={{ padding: '10px 12px', fontSize: typography.fontSize.body, fontWeight: 700, color: color.text.accent }}>
                  Total
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.status.healthy, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(sortedPeriods.reduce((s, p) => s + p.incomeTracked, 0))}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.ember.flame, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(sortedPeriods.reduce((s, p) => s + p.incomeRetainer, 0))}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.ember.DEFAULT, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(sortedPeriods.reduce((s, p) => s + p.incomeProject, 0))}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: color.ember.flame, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 12px rgba(255, 179, 71, 0.3)` }}>
                  ${Math.round(summary.total).toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
