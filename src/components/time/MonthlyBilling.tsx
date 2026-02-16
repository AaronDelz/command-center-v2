'use client';

import { useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassPill } from '@/components/ui/GlassPill';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius } from '@/styles/tokens';
import type { TimeEntry } from '@/lib/types';

interface MonthlyBillingProps {
  entries: TimeEntry[];
}

interface ClientMonth {
  clientId: string;
  clientName: string;
  month: string;       // "2026-02"
  monthLabel: string;  // "Feb 2026"
  hours: number;
  value: number;
  entryCount: number;
  status: 'pending' | 'invoiced' | 'sent' | 'received';
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const statusColors: Record<string, { variant: 'default' | 'warning' | 'info' | 'success'; label: string }> = {
  pending:  { variant: 'warning', label: 'Pending' },
  invoiced: { variant: 'info', label: 'Invoiced' },
  sent:     { variant: 'info', label: 'Sent' },
  received: { variant: 'success', label: 'Received' },
};

export function MonthlyBilling({ entries }: MonthlyBillingProps): React.ReactElement {
  const [selectedMonth, setSelectedMonth] = useState<string | 'all'>('all');

  const { rows, months } = useMemo(() => {
    const buckets: Record<string, ClientMonth> = {};
    const monthSet = new Set<string>();

    for (const entry of entries) {
      if (!entry.duration || entry.isRunning || !entry.billable) continue;
      const date = new Date(entry.startTime);
      const monthKey = getMonthKey(date);
      monthSet.add(monthKey);
      const key = `${entry.clientId}::${monthKey}`;

      if (!buckets[key]) {
        buckets[key] = {
          clientId: entry.clientId,
          clientName: entry.clientName,
          month: monthKey,
          monthLabel: getMonthLabel(monthKey),
          hours: 0,
          value: 0,
          entryCount: 0,
          status: 'pending',
        };
      }
      buckets[key].hours += entry.duration / 60;
      buckets[key].value += entry.rate ? (entry.duration / 60) * entry.rate : 0;
      buckets[key].entryCount += 1;
    }

    const sortedMonths = Array.from(monthSet).sort().reverse();
    const sortedRows = Object.values(buckets).sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month);
      return b.value - a.value;
    });

    return { rows: sortedRows, months: sortedMonths };
  }, [entries]);

  const filteredRows = selectedMonth === 'all'
    ? rows
    : rows.filter(r => r.month === selectedMonth);

  const totalValue = filteredRows.reduce((s, r) => s + r.value, 0);
  const totalHours = filteredRows.reduce((s, r) => s + r.hours, 0);

  return (
    <GlassCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <SectionHeading>Monthly Billing</SectionHeading>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <GlassPill
            size="xs"
            variant="ember"
            active={selectedMonth === 'all'}
            onClick={() => setSelectedMonth('all')}
          >
            All
          </GlassPill>
          {months.slice(0, 6).map(m => (
            <GlassPill
              key={m}
              size="xs"
              variant="ember"
              active={selectedMonth === m}
              onClick={() => setSelectedMonth(m)}
            >
              {getMonthLabel(m)}
            </GlassPill>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Client', 'Month', 'Hours', 'Value', 'Entries', 'Status'].map(h => (
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
            {filteredRows.map((row) => {
              const sc = statusColors[row.status];
              return (
                <tr
                  key={`${row.clientId}-${row.month}`}
                  style={{ borderBottom: `1px solid ${color.glass.border}` }}
                >
                  <td style={{
                    padding: '10px 12px',
                    fontSize: typography.fontSize.body,
                    fontWeight: typography.fontWeight.medium,
                    color: color.text.primary,
                  }}>
                    {row.clientName}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: typography.fontSize.caption,
                    color: color.text.secondary,
                  }}>
                    {row.monthLabel}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: typography.fontSize.body,
                    color: color.text.primary,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {row.hours.toFixed(1)}h
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: typography.fontSize.body,
                    fontWeight: typography.fontWeight.semibold,
                    color: color.ember.flame,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    ${Math.round(row.value).toLocaleString()}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: typography.fontSize.caption,
                    color: color.text.dim,
                  }}>
                    {row.entryCount}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <GlassPill size="xs" variant={sc.variant}>
                      {sc.label}
                    </GlassPill>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr>
              <td style={{
                padding: '10px 12px',
                fontSize: typography.fontSize.body,
                fontWeight: typography.fontWeight.bold,
                color: color.text.accent,
              }}>
                Total
              </td>
              <td />
              <td style={{
                padding: '10px 12px',
                textAlign: 'right',
                fontSize: typography.fontSize.body,
                fontWeight: typography.fontWeight.bold,
                color: color.text.primary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {totalHours.toFixed(1)}h
              </td>
              <td style={{
                padding: '10px 12px',
                textAlign: 'right',
                fontSize: typography.fontSize.body,
                fontWeight: typography.fontWeight.bold,
                color: color.ember.flame,
                fontVariantNumeric: 'tabular-nums',
              }}>
                ${Math.round(totalValue).toLocaleString()}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {filteredRows.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: color.text.dim,
          fontSize: typography.fontSize.body,
        }}>
          No billable entries for this period
        </div>
      )}
    </GlassCard>
  );
}
