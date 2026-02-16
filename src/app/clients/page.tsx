'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientTable } from '@/components/clients/ClientTable';
import { GlassCard, GlassModal, GlassInput, GlassSelect, GlassPill, EmberButton } from '@/components/ui';
import { QuickTimeWidget } from '@/components/time/QuickTimeWidget';
import { color, typography, radius } from '@/styles/tokens';
import type { Client, ClientStatus, ClientsData, PaymentStatus } from '@/lib/types';

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
    hourlyRate: 100,
    paymentStatus: 'pending' as PaymentStatus,
    monthlyTotal: 0,
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
      paymentStatus: form.paymentStatus,
      hourlyRate: form.hourlyRate,
      monthlyTotal: form.monthlyTotal,
    };
    onAdd(newClient);
  }

  const statusOptions = [
    { value: 'pipeline', label: 'Pipeline' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
  ];

  const modelOptions = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'project', label: 'Project' },
    { value: 'retainer', label: 'Retainer' },
  ];

  const paymentOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent for Payment' },
    { value: 'received', label: 'Received' },
  ];

  return (
    <GlassModal
      open={true}
      onClose={onClose}
      title="Add Client"
      width="lg"
      footer={
        <div className="flex gap-2">
          <EmberButton variant="ghost" size="sm" onClick={onClose}>Cancel</EmberButton>
          <EmberButton variant="primary" size="sm" onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}>
            Add Client
          </EmberButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <GlassInput
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Client name"
            size="sm"
            autoFocus
          />
          <GlassInput
            label="Contact"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="Primary contact"
            size="sm"
          />
        </div>

        <GlassInput
          label="Business"
          value={form.business}
          onChange={(e) => setForm({ ...form, business: e.target.value })}
          placeholder="What they do"
          size="sm"
        />

        <div className="grid grid-cols-3 gap-3">
          <GlassSelect
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
            options={statusOptions}
            size="sm"
          />
          <GlassInput
            label="Rate"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
            placeholder="$100/hr"
            size="sm"
          />
          <GlassSelect
            label="Model"
            value={form.revenueModel}
            onChange={(e) => setForm({ ...form, revenueModel: e.target.value as 'hourly' | 'project' | 'retainer' })}
            options={modelOptions}
            size="sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <GlassInput
            label="Avg Monthly ($)"
            type="number"
            value={form.avgMonthly || ''}
            onChange={(e) => setForm({ ...form, avgMonthly: Number(e.target.value) })}
            placeholder="0"
            size="sm"
          />
          <GlassInput
            label="Project Value ($)"
            type="number"
            value={form.projectValue || ''}
            onChange={(e) => setForm({ ...form, projectValue: Number(e.target.value) })}
            placeholder="0"
            size="sm"
          />
          <GlassInput
            label="Retainer ($)"
            type="number"
            value={form.monthlyRetainer || ''}
            onChange={(e) => setForm({ ...form, monthlyRetainer: Number(e.target.value) })}
            placeholder="0"
            size="sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <GlassInput
            label="Hourly Rate ($)"
            type="number"
            value={form.hourlyRate || ''}
            onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
            placeholder="100"
            size="sm"
          />
          <GlassSelect
            label="Payment Status"
            value={form.paymentStatus}
            onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
            options={paymentOptions}
            size="sm"
          />
          <GlassInput
            label="Monthly Total ($)"
            type="number"
            value={form.monthlyTotal || ''}
            onChange={(e) => setForm({ ...form, monthlyTotal: Number(e.target.value) })}
            placeholder="0"
            size="sm"
          />
        </div>

        <GlassInput
          label="Tags (comma separated)"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="highlevel, make, openai"
          size="sm"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 500, color: color.text.secondary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Initial notes..."
            style={{
              width: '100%',
              minHeight: '60px',
              background: color.bg.surface,
              border: `1.5px solid ${color.glass.border}`,
              borderRadius: radius.lg,
              color: color.text.primary,
              padding: '8px 12px',
              fontSize: '0.8rem',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </form>
    </GlassModal>
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
          <EmberButton variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            + Add Client
          </EmberButton>
        }
      />

      {/* Summary Stats */}
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

      {/* Quick Time Tracking Widget */}
      <div style={{ marginBottom: '20px' }}>
        <QuickTimeWidget
          clients={clients}
          onNavigateToTimeForge={() => window.location.href = '/time'}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <GlassPill
            key={f.key}
            variant="default"
            size="sm"
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== 'all' && (
              <span style={{ marginLeft: '4px', opacity: 0.6 }}>
                {clients.filter((c) => c.status === f.key).length}
              </span>
            )}
          </GlassPill>
        ))}
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
