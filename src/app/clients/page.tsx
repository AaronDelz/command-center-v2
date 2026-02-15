'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientTable } from '@/components/clients/ClientTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, radius, animation, shadow } from '@/styles/tokens';
import type { Client, ClientStatus, ClientsData } from '@/lib/types';

// ─── Add Client Modal ───────────────────────────────────────────

function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (client: Client) => void }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    business: '',
    status: 'pipeline' as ClientStatus,
    rate: '',
    revenueModel: 'project' as 'hourly' | 'project' | 'retainer',
    avgMonthly: 0,
    projectValue: 0,
    monthlyRetainer: 0,
    notes: '',
    tags: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: form.name.trim(),
      contact: form.contact.trim(),
      business: form.business.trim(),
      status: form.status,
      rate: form.rate.trim(),
      revenueModel: form.revenueModel,
      avgMonthly: form.avgMonthly || undefined,
      projectValue: form.projectValue || undefined,
      monthlyRetainer: form.monthlyRetainer || undefined,
      since: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: form.notes.trim(),
    };
    onAdd(newClient);
  }

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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: color.bg.base,
          border: `1.5px solid ${color.glass.border}`,
          borderRadius: radius['2xl'],
          boxShadow: shadow.modal,
          padding: '28px',
          width: '480px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{
          fontSize: typography.fontSize.pageTitle,
          fontWeight: typography.fontWeight.semibold,
          color: color.text.primary,
          marginBottom: '20px',
          marginTop: 0,
        }}>
          Add Client
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Client name"
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Contact</label>
              <input
                style={inputStyle}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Primary contact"
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Business</label>
            <input
              style={inputStyle}
              value={form.business}
              onChange={(e) => setForm({ ...form, business: e.target.value })}
              placeholder="What they do"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
              >
                <option value="pipeline">Pipeline</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Rate</label>
              <input
                style={inputStyle}
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="$100/hr"
              />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.revenueModel}
                onChange={(e) => setForm({ ...form, revenueModel: e.target.value as 'hourly' | 'project' | 'retainer' })}
              >
                <option value="hourly">Hourly</option>
                <option value="project">Project</option>
                <option value="retainer">Retainer</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Avg Monthly ($)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.avgMonthly || ''}
                onChange={(e) => setForm({ ...form, avgMonthly: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Project Value ($)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.projectValue || ''}
                onChange={(e) => setForm({ ...form, projectValue: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Retainer ($)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.monthlyRetainer || ''}
                onChange={(e) => setForm({ ...form, monthlyRetainer: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input
              style={inputStyle}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="highlevel, make, openai"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Initial notes..."
            />
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
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                background: color.ember.DEFAULT,
                border: 'none',
                borderRadius: radius.md,
                color: color.text.inverse,
                cursor: 'pointer',
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.body,
                boxShadow: `0 0 12px rgba(255, 107, 53, 0.3)`,
              }}
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Status Filters ─────────────────────────────────────────────

const STATUS_FILTERS: Array<{ key: ClientStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: '🟢 Active' },
  { key: 'pipeline', label: '🟡 Pipeline' },
  { key: 'paused', label: '⏸ Paused' },
  { key: 'completed', label: '✅ Complete' },
];

// ─── Page Component ─────────────────────────────────────────────

export default function ClientsPage(): React.ReactElement {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ClientStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as ClientsData;
      setClients(data.clients);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function handleUpdate(id: string, updates: Partial<Client>): Promise<void> {
    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error('Failed to update');
    const updated = await res.json() as Client;
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function handleAddClient(client: Client): Promise<void> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error('Failed to add');
    const added = await res.json() as Client;
    setClients((prev) => [...prev, added]);
    setShowAddModal(false);
  }

  const filtered = filter === 'all' ? clients : clients.filter((c) => c.status === filter);

  // Summary stats
  const activeClients = clients.filter((c) => c.status === 'active');
  const pipelineClients = clients.filter((c) => c.status === 'pipeline');
  const monthlyRecurring = clients.reduce((sum, c) => {
    if (c.status !== 'active') return sum;
    return sum + (c.avgMonthly || 0) + (c.monthlyRetainer || 0);
  }, 0);
  const projectPipeline = clients.reduce((sum, c) => {
    if (c.status === 'completed') return sum;
    return sum + (c.projectValue || 0);
  }, 0);

  const stats = [
    { label: 'Active Clients', value: String(activeClients.length), accent: color.status.healthy },
    { label: 'Pipeline', value: String(pipelineClients.length), accent: color.status.warning },
    { label: 'Monthly Recurring', value: `$${monthlyRecurring.toLocaleString()}`, accent: color.ember.flame },
    { label: 'Project Pipeline', value: `$${projectPipeline.toLocaleString()}`, accent: color.ember.DEFAULT },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Client Command" subtitle="Your client roster — relationships, revenue, results" />
        <div style={{ padding: '60px', textAlign: 'center', color: color.text.dim }}>
          Loading clients...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Client Command"
        subtitle="Your client roster — relationships, revenue, results"
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              background: color.ember.DEFAULT,
              border: 'none',
              borderRadius: radius.md,
              color: color.text.inverse,
              cursor: 'pointer',
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.caption,
              boxShadow: `0 0 12px rgba(255, 107, 53, 0.25)`,
              transition: `all ${animation.duration.normal}`,
            }}
          >
            + Add Client
          </button>
        }
      />

      {/* Summary Stats — Centered */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {stats.map((stat) => (
          <GlassCard key={stat.label} padding="sm" hover={false}>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: typography.fontWeight.bold,
                color: stat.accent,
                textShadow: `0 0 20px ${stat.accent}40`,
                marginBottom: '4px',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: typography.fontSize.metadata,
                color: color.text.dim,
                letterSpacing: typography.letterSpacing.wider,
                textTransform: 'uppercase' as const,
              }}>
                {stat.label}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontSize: typography.fontSize.caption,
                fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.regular,
                color: isActive ? color.text.primary : color.text.secondary,
                background: isActive ? color.bg.overlay : 'transparent',
                border: `1px solid ${isActive ? color.glass.borderHover : color.glass.border}`,
                borderRadius: radius.full,
                padding: '5px 14px',
                cursor: 'pointer',
                transition: `all ${animation.duration.normal}`,
              }}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: '4px', opacity: 0.6 }}>
                  {clients.filter((c) => c.status === f.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Client Table */}
      {filtered.length > 0 ? (
        <ClientTable
          clients={filtered}
          onUpdate={handleUpdate}
          onAdd={() => setShowAddModal(true)}
        />
      ) : (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: color.text.dim,
          background: color.bg.surface,
          borderRadius: radius.xl,
          border: `1px solid ${color.glass.border}`,
        }}>
          No clients in this category
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddClient}
        />
      )}
    </div>
  );
}
