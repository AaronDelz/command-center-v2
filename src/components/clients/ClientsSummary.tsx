'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, radius } from '@/styles/tokens';
import type { Client, ClientsData } from '@/lib/types';

export function ClientsSummary(): React.ReactElement {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data: ClientsData) => setClients(data.clients))
      .catch(() => {});
  }, []);

  const active = clients.filter((c) => c.status === 'active');
  const pipeline = clients.filter((c) => c.status === 'pipeline');

  const monthlyRecurring = clients.reduce((sum, c) => {
    if (c.status !== 'active') return sum;
    return sum + (c.avgMonthly || 0) + (c.monthlyRetainer || 0);
  }, 0);

  return (
    <Link href="/clients" style={{ textDecoration: 'none' }}>
      <GlassCard padding="md">
        <div style={{
          fontSize: typography.fontSize.sectionHeader,
          fontWeight: typography.fontWeight.semibold,
          color: color.text.accent,
          textTransform: 'uppercase' as const,
          letterSpacing: typography.letterSpacing.widest,
          marginBottom: '12px',
        }}>
          👥 CLIENT COMMAND
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: typography.fontWeight.bold,
              color: color.status.healthy,
            }}>
              {active.length}
            </div>
            <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
              Active
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: typography.fontWeight.bold,
              color: color.status.warning,
            }}>
              {pipeline.length}
            </div>
            <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
              Pipeline
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
            }}>
              ${monthlyRecurring.toLocaleString()}
            </div>
            <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
              /mo recurring
            </div>
          </div>
        </div>

        {/* Upcoming deadlines */}
        {active.filter((c) => c.dueDate).length > 0 && (
          <div style={{ marginTop: '10px', borderTop: `1px solid ${color.glass.border}`, paddingTop: '8px' }}>
            {active
              .filter((c) => c.dueDate)
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .slice(0, 2)
              .map((c) => {
                const daysLeft = Math.ceil(
                  (new Date(c.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={c.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: typography.fontSize.metadata,
                    color: color.text.secondary,
                    marginBottom: '2px',
                  }}>
                    <span>{c.name}</span>
                    <span style={{
                      color: daysLeft <= 7 ? color.status.error : daysLeft <= 14 ? color.status.warning : color.text.dim,
                    }}>
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Due!'}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </GlassCard>
    </Link>
  );
}
