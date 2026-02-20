'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui';
import { color, typography, radius } from '@/styles/tokens';

// ─── Types ──────────────────────────────────────────────────────

interface SystemInfo {
  nodeVersion: string;
  nextVersion: string;
  uptime: string;
  dataDir: string;
}

interface ApiHealth {
  endpoint: string;
  label: string;
  status: 'ok' | 'error' | 'loading';
  latencyMs?: number;
}

// ─── Section Component ──────────────────────────────────────────

function SettingsSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <GlassCard style={{ padding: '24px', marginBottom: '16px' }}>
      <h3 style={{
        fontSize: typography.fontSize.sectionHeader,
        fontWeight: typography.fontWeight.semibold,
        color: color.text.primary,
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </GlassCard>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: `1px solid ${color.glass.border}`,
    }}>
      <span style={{ color: color.text.secondary, fontSize: '0.85rem' }}>{label}</span>
      <span style={{
        color: color.text.primary,
        fontSize: '0.85rem',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>{value}</span>
    </div>
  );
}

function StatusDot({ status }: { status: 'ok' | 'error' | 'loading' }) {
  const colors = { ok: '#34d399', error: '#f87171', loading: '#fbbf24' };
  return (
    <span style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: colors[status],
      marginRight: '8px',
      boxShadow: status === 'ok' ? '0 0 6px rgba(52,211,153,0.5)' : undefined,
    }} />
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function SettingsPage() {
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([]);
  const [checking, setChecking] = useState(true);

  const endpoints: { endpoint: string; label: string }[] = [
    { endpoint: '/api/status', label: 'Status API' },
    { endpoint: '/api/kanban', label: 'Kanban API' },
    { endpoint: '/api/notes', label: 'Notes API' },
    { endpoint: '/api/calendar', label: 'Calendar API' },
    { endpoint: '/api/vault', label: 'Vault API' },
    { endpoint: '/api/goals', label: 'Goals API' },
    { endpoint: '/api/content', label: 'Content API' },
    { endpoint: '/api/clients', label: 'Clients API' },
    { endpoint: '/api/time-entries', label: 'Time Entries API' },
  ];

  useEffect(() => {
    async function checkAll() {
      setChecking(true);
      const results = await Promise.all(
        endpoints.map(async ({ endpoint, label }) => {
          const start = Date.now();
          try {
            const res = await fetch(endpoint, { cache: 'no-store' });
            return {
              endpoint,
              label,
              status: res.ok ? 'ok' as const : 'error' as const,
              latencyMs: Date.now() - start,
            };
          } catch {
            return { endpoint, label, status: 'error' as const, latencyMs: Date.now() - start };
          }
        })
      );
      setApiHealth(results);
      setChecking(false);
    }
    checkAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const healthyCount = apiHealth.filter(h => h.status === 'ok').length;
  const totalCount = endpoints.length;

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="System configuration & diagnostics"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
        {/* Left Column */}
        <div>
          <SettingsSection title="System Info" icon="🖥️">
            <InfoRow label="Application" value="The Forge v2" />
            <InfoRow label="Framework" value="Next.js 15 (App Router)" />
            <InfoRow label="Data Storage" value="JSON files + Markdown vault" />
            <InfoRow label="Port" value="3000" mono />
            <InfoRow label="Agent" value="Orion (OpenClaw)" />
            <InfoRow label="Owner" value="Aaron Delz" />
          </SettingsSection>

          <SettingsSection title="Data Paths" icon="📁">
            <InfoRow label="Kanban" value="data/kanban.json" mono />
            <InfoRow label="Notes" value="data/notes.json" mono />
            <InfoRow label="Status" value="data/status.json" mono />
            <InfoRow label="Calendar" value="data/calendar.json" mono />
            <InfoRow label="Goals" value="data/goals.json" mono />
            <InfoRow label="Clients" value="data/clients.json" mono />
            <InfoRow label="Content" value="data/content.json" mono />
            <InfoRow label="Time Entries" value="data/time-entries.json" mono />
            <InfoRow label="Vault" value="~/Documents/vault/" mono />
          </SettingsSection>

          <SettingsSection title="Keyboard Shortcuts" icon="⌨️">
            <InfoRow label="Global Search" value="⌘ K (coming soon)" />
            <InfoRow label="Toggle Compact Mode" value="Battle Board toolbar" />
          </SettingsSection>
        </div>

        {/* Right Column */}
        <div>
          <SettingsSection title="API Health Check" icon="🔌">
            {checking ? (
              <div style={{ color: color.text.secondary, fontSize: '0.85rem', padding: '12px 0' }}>
                Checking endpoints...
              </div>
            ) : (
              <>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: radius.md,
                  background: healthyCount === totalCount
                    ? 'rgba(52,211,153,0.08)'
                    : 'rgba(248,113,113,0.08)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  color: healthyCount === totalCount ? '#34d399' : '#f87171',
                  fontWeight: 600,
                }}>
                  {healthyCount === totalCount
                    ? `✓ All ${totalCount} endpoints healthy`
                    : `⚠ ${totalCount - healthyCount} of ${totalCount} endpoints failing`}
                </div>
                {apiHealth.map(h => (
                  <div key={h.endpoint} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: `1px solid ${color.glass.border}`,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', color: color.text.primary, fontSize: '0.85rem' }}>
                      <StatusDot status={h.status} />
                      {h.label}
                    </span>
                    <span style={{ color: color.text.secondary, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {h.latencyMs}ms
                    </span>
                  </div>
                ))}
              </>
            )}
          </SettingsSection>

          <SettingsSection title="Pages" icon="📑">
            {[
              { name: 'Dashboard', path: '/', icon: '🏠' },
              { name: 'The Helm', path: '/helm', icon: '🧭' },
              { name: 'Battle Board', path: '/kanban', icon: '⚔️' },
              { name: 'The Anvil', path: '/notes', icon: '🔨' },
              { name: 'Calendar', path: '/calendar', icon: '📅' },
              { name: 'Vault', path: '/vault', icon: '🏛️' },
              { name: 'Content Hub', path: '/content', icon: '📢' },
              { name: 'Clients', path: '/clients', icon: '💼' },
              { name: 'Time Forge', path: '/time', icon: '⏱️' },
            ].map(p => (
              <a
                key={p.path}
                href={p.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  borderBottom: `1px solid ${color.glass.border}`,
                  color: color.text.primary,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <span>{p.icon}</span> {p.name}
                <span style={{ marginLeft: 'auto', color: color.text.secondary, fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.path}</span>
              </a>
            ))}
          </SettingsSection>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center', color: color.text.secondary, fontSize: '0.8rem', paddingBottom: '32px' }}>
        The Forge — Built by Aaron & Orion · 2026
      </div>
    </div>
  );
}
