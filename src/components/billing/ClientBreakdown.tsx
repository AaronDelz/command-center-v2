'use client';

import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius } from '@/styles/tokens';
import type { BillingPeriod, Client } from '@/lib/types';

interface ClientBreakdownProps {
  periods: BillingPeriod[];
  clients: Client[];
}

// Generate consistent color from string
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

interface ClientRow {
  name: string;
  total: number;
  pct: number;
  clr: string;
}

export function ClientBreakdown({ periods, clients }: ClientBreakdownProps): React.ReactElement {
  const rows = useMemo((): ClientRow[] => {
    const grandTotal = periods.reduce((s, p) => s + p.monthlyTotal, 0);
    if (grandTotal === 0) return [];

    const byClient = new Map<string, number>();
    for (const p of periods) {
      if (p.monthlyTotal > 0) {
        byClient.set(p.clientId, (byClient.get(p.clientId) || 0) + p.monthlyTotal);
      }
    }

    return Array.from(byClient.entries())
      .map(([clientId, total]) => {
        const name = clients.find(c => c.id === clientId)?.name || clientId;
        return { name, total, pct: (total / grandTotal) * 100, clr: hashColor(name) };
      })
      .sort((a, b) => b.total - a.total);
  }, [periods, clients]);

  if (rows.length === 0) {
    return (
      <GlassCard>
        <SectionHeading title="Client Breakdown" />
        <div style={{ padding: '24px', textAlign: 'center', color: color.text.dim }}>
          No revenue this month
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeading title="Client Breakdown" />
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '12px', borderRadius: radius.full, overflow: 'hidden', marginTop: '16px', marginBottom: '16px' }}>
        {rows.map(r => (
          <div key={r.name} title={`${r.name}: $${Math.round(r.total).toLocaleString()} (${Math.round(r.pct)}%)`}
            style={{ width: `${r.pct}%`, background: r.clr, transition: 'width 0.3s ease', minWidth: r.pct > 0 ? '2px' : 0 }}
          />
        ))}
      </div>
      {/* Client list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rows.map(r => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.clr, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: typography.fontSize.body, color: color.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.name}
            </span>
            <span style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, color: color.ember.flame, fontVariantNumeric: 'tabular-nums', fontFamily: typography.fontFamily.mono }}>
              ${Math.round(r.total).toLocaleString()}
            </span>
            <span style={{ fontSize: typography.fontSize.caption, color: color.text.dim, width: '40px', textAlign: 'right' }}>
              {Math.round(r.pct)}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
