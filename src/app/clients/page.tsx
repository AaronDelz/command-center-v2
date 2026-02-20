'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientTable } from '@/components/clients/ClientTable';
import { BillingTable } from '@/components/clients/BillingTable';
import { GlassCard, GlassModal, GlassInput, GlassSelect, GlassPill, EmberButton } from '@/components/ui';
import { QuickTimeWidget } from '@/components/time/QuickTimeWidget';
import { A2PPipeline } from '@/components/clients/A2PPipeline';
import { ClientDetailDrawer } from '@/components/clients/ClientDetailDrawer';
import { color, typography, radius, animation, shadow, glass } from '@/styles/tokens';
import type { Client, ClientStatus, ClientsData, PaymentStatus, PaymentType, InvoiceStatus } from '@/lib/types';

// ─── Add/Edit Client Modal ──────────────────────────────────────

interface ClientFormData {
  name: string;
  businessName: string;
  contact: string;
  email: string;
  phone: string;
  business: string;
  status: ClientStatus;
  paymentType: PaymentType;
  hourlyRate: number;
  retainerAmount: number;
  projectAmount: number;
  startDate: string;
  invoiceStatus: InvoiceStatus;
  notes: string;
  tags: string;
}

function ClientFormModal({
  onClose,
  onSave,
  initial,
  title,
}: {
  onClose: () => void;
  onSave: (data: ClientFormData) => void;
  initial?: ClientFormData;
  title: string;
}) {
  const [form, setForm] = useState<ClientFormData>(
    initial || {
      name: '',
      businessName: '',
      contact: '',
      email: '',
      phone: '',
      business: '',
      status: 'pipeline',
      paymentType: 'hourly',
      hourlyRate: 100,
      retainerAmount: 0,
      projectAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      invoiceStatus: 'unpaid',
      notes: '',
      tags: '',
    }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  const set = (field: keyof ClientFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <GlassModal open={true} onClose={onClose} title={title} width="lg" footer={
      <div className="flex gap-2">
        <EmberButton variant="ghost" size="sm" onClick={onClose}>Cancel</EmberButton>
        <EmberButton variant="primary" size="sm" onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}>
          {initial ? 'Save Changes' : 'Create Client'}
        </EmberButton>
      </div>
    }>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <GlassInput label="Client / Contact Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Name" size="sm" autoFocus />
          <GlassInput label="Business Name" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Company" size="sm" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <GlassInput label="Email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" size="sm" />
          <GlassInput label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555-0000" size="sm" />
          <GlassInput label="Primary Contact" value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Contact person" size="sm" />
        </div>
        <GlassInput label="Business Description" value={form.business} onChange={(e) => set('business', e.target.value)} placeholder="What they do" size="sm" />

        <div className="grid grid-cols-3 gap-3">
          <GlassSelect label="Status" value={form.status} onChange={(e) => set('status', e.target.value)} options={[
            { value: 'pipeline', label: 'Pipeline' },
            { value: 'active', label: 'Active' },
            { value: 'paused', label: 'Paused' },
            { value: 'closed', label: 'Closed' },
          ]} size="sm" />
          <GlassSelect label="Payment Type" value={form.paymentType} onChange={(e) => set('paymentType', e.target.value)} options={[
            { value: 'hourly', label: 'Hourly' },
            { value: 'retainer', label: 'Retainer' },
            { value: 'one-off', label: 'One-Off Project' },
          ]} size="sm" />
          <GlassSelect label="Invoice Status" value={form.invoiceStatus} onChange={(e) => set('invoiceStatus', e.target.value)} options={[
            { value: 'unpaid', label: 'Unpaid' },
            { value: 'sent', label: 'Sent' },
            { value: 'paid', label: 'Paid' },
          ]} size="sm" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {form.paymentType === 'hourly' && (
            <GlassInput label="Hourly Rate ($)" type="number" value={form.hourlyRate || ''} onChange={(e) => set('hourlyRate', Number(e.target.value))} size="sm" />
          )}
          {form.paymentType === 'retainer' && (
            <GlassInput label="Retainer Amount ($)" type="number" value={form.retainerAmount || ''} onChange={(e) => set('retainerAmount', Number(e.target.value))} size="sm" />
          )}
          {form.paymentType === 'one-off' && (
            <GlassInput label="Project Amount ($)" type="number" value={form.projectAmount || ''} onChange={(e) => set('projectAmount', Number(e.target.value))} size="sm" />
          )}
          <GlassInput label="Start Date" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} size="sm" />
        </div>

        <GlassInput label="Tags (comma separated)" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="highlevel, make" size="sm" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 500, color: color.text.secondary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notes..." style={{
            width: '100%', minHeight: '60px', background: color.bg.surface,
            border: `1.5px solid ${color.glass.border}`, borderRadius: radius.lg,
            color: color.text.primary, padding: '8px 12px', fontSize: '0.8rem',
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }} />
        </div>
      </form>
    </GlassModal>
  );
}

// ─── Client Card ────────────────────────────────────────────────

const PAYMENT_TYPE_COLORS: Record<PaymentType, { color: string; bg: string; label: string }> = {
  hourly: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', label: 'Hourly' },
  retainer: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', label: 'Retainer' },
  'one-off': { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)', label: 'One-Off' },
};

const STATUS_COLORS: Record<ClientStatus, { color: string; bg: string; label: string; icon: string }> = {
  active: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', label: 'Active', icon: '🟢' },
  pipeline: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', label: 'Pipeline', icon: '🟡' },
  paused: { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.12)', label: 'Paused', icon: '⏸' },
  closed: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)', label: 'Closed', icon: '⬛' },
};

const INVOICE_COLORS: Record<InvoiceStatus, { color: string; bg: string; label: string }> = {
  unpaid: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Unpaid' },
  sent: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', label: 'Sent' },
  paid: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', label: 'Paid' },
};

function ClientCRMCard({
  client,
  onClick,
  onStatusChange,
  onInvoiceChange,
}: {
  client: Client;
  onClick: () => void;
  onStatusChange: (status: ClientStatus) => void;
  onInvoiceChange: (status: InvoiceStatus) => void;
}) {
  const paymentType = (client.paymentType || client.revenueModel) as PaymentType;
  const ptConfig = PAYMENT_TYPE_COLORS[paymentType] || PAYMENT_TYPE_COLORS.hourly;
  const statusConfig = STATUS_COLORS[client.status] || STATUS_COLORS.active;
  const invoiceStatus = (client.invoiceStatus || 'unpaid') as InvoiceStatus;
  const invoiceConfig = INVOICE_COLORS[invoiceStatus];

  const rateDisplay = (() => {
    if (paymentType === 'hourly') return `$${client.hourlyRate}/hr`;
    if (paymentType === 'retainer') return `$${(client.retainerAmount || client.monthlyRetainer || 0).toLocaleString()}/mo`;
    return `$${(client.projectAmount || client.projectValue || 0).toLocaleString()}`;
  })();

  function cycleInvoice(e: React.MouseEvent) {
    e.stopPropagation();
    const order: InvoiceStatus[] = ['unpaid', 'sent', 'paid'];
    const idx = order.indexOf(invoiceStatus);
    onInvoiceChange(order[(idx + 1) % order.length]);
  }

  function cycleStatus(e: React.MouseEvent) {
    e.stopPropagation();
    const order: ClientStatus[] = ['pipeline', 'active', 'paused', 'closed'];
    const idx = order.indexOf(client.status);
    onStatusChange(order[(idx + 1) % order.length]);
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: color.bg.surface,
        backdropFilter: glass.blur.card,
        WebkitBackdropFilter: glass.blur.card,
        border: `1.5px solid ${color.glass.border}`,
        borderRadius: radius.xl,
        padding: '16px',
        cursor: 'pointer',
        transition: `all ${animation.duration.normal} ${animation.easing.default}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color.glass.borderHover;
        e.currentTarget.style.transform = animation.hover.lift;
        e.currentTarget.style.boxShadow = shadow.cardHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = color.glass.border;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top row: Name + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: typography.fontSize.cardTitle,
            fontWeight: typography.fontWeight.semibold,
            color: color.text.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {client.name}
          </div>
          {client.businessName && client.businessName !== client.name && (
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              marginTop: '2px',
            }}>
              {client.businessName}
            </div>
          )}
        </div>
        <button onClick={cycleStatus} style={{
          fontSize: '0.6rem', fontWeight: typography.fontWeight.bold,
          color: statusConfig.color, background: statusConfig.bg,
          border: `1px solid ${statusConfig.color}30`, borderRadius: radius.full,
          padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
          letterSpacing: '0.05em', transition: `all ${animation.duration.fast}`,
          flexShrink: 0, marginLeft: '8px',
        }}>
          {statusConfig.label}
        </button>
      </div>

      {/* Business description */}
      {client.business && (
        <div style={{
          fontSize: typography.fontSize.caption,
          color: color.text.secondary,
          marginBottom: '10px',
          lineHeight: typography.lineHeight.normal,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {client.business}
        </div>
      )}

      {/* Rate + Payment type pills */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: typography.fontWeight.bold,
          color: ptConfig.color, background: ptConfig.bg,
          border: `1px solid ${ptConfig.color}30`, borderRadius: radius.full,
          padding: '2px 8px', letterSpacing: '0.04em',
        }}>
          {ptConfig.label}
        </span>
        <span style={{
          fontSize: typography.fontSize.caption,
          fontWeight: typography.fontWeight.semibold,
          color: color.ember.flame,
          fontFamily: typography.fontFamily.mono,
        }}>
          {rateDisplay}
        </span>
      </div>

      {/* Bottom row: invoice status + monthly total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={cycleInvoice} style={{
          fontSize: '0.55rem', fontWeight: typography.fontWeight.bold,
          color: invoiceConfig.color, background: invoiceConfig.bg,
          border: `1px solid ${invoiceConfig.color}30`, borderRadius: radius.full,
          padding: '2px 8px', cursor: 'pointer', letterSpacing: '0.06em',
          transition: `all ${animation.duration.fast}`,
        }}>
          {invoiceConfig.label}
        </button>
        {(client.monthlyTotal || 0) > 0 && (
          <span style={{
            fontSize: typography.fontSize.caption,
            fontWeight: typography.fontWeight.bold,
            color: color.ember.flame,
            fontFamily: typography.fontFamily.mono,
          }}>
            ${(client.monthlyTotal || 0).toLocaleString()}
          </span>
        )}
      </div>

      {/* Contact line at bottom */}
      {client.contact && (
        <div style={{
          fontSize: typography.fontSize.metadata,
          color: color.text.dim,
          marginTop: '8px',
          borderTop: `1px solid ${color.glass.border}`,
          paddingTop: '8px',
        }}>
          👤 {client.contact}
        </div>
      )}
    </div>
  );
}

// ─── Status Filters ─────────────────────────────────────────────

const STATUS_FILTERS: Array<{ key: ClientStatus | 'all'; label: string; icon: string }> = [
  { key: 'all', label: 'All', icon: '' },
  { key: 'active', label: 'Active', icon: '🟢' },
  { key: 'pipeline', label: 'Pipeline', icon: '🟡' },
  { key: 'paused', label: 'Paused', icon: '⏸' },
  { key: 'closed', label: 'Closed', icon: '⬛' },
];

// ─── Page Component ─────────────────────────────────────────────

type ClientTab = 'command' | 'billing' | 'a2p';

export default function ClientsPage(): React.ReactElement {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ClientStatus | 'all'>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<ClientTab>('command');
  const searchParams = useSearchParams();

  // Handle ?highlight=ClientName — auto-open that client's drawer
  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight && clients.length > 0) {
      const match = clients.find(c => c.name === highlight || c.id === highlight);
      if (match) {
        setSelectedClient(match);
        setShowDrawer(true);
      }
    }
  }, [searchParams, clients]);

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
    // Update selected client if it's the one being edited
    if (selectedClient?.id === id) {
      setSelectedClient(updated);
    }
  }

  async function handleCreateClient(formData: ClientFormData): Promise<void> {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: formData.name.trim(),
      businessName: formData.businessName.trim(),
      contact: formData.contact.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      business: formData.business.trim(),
      status: formData.status,
      rate: '',
      revenueModel: formData.paymentType === 'one-off' ? 'project' : formData.paymentType === 'retainer' ? 'retainer' : 'hourly',
      paymentType: formData.paymentType,
      hourlyRate: formData.hourlyRate,
      retainerAmount: formData.retainerAmount,
      projectAmount: formData.projectAmount,
      monthlyRetainer: formData.paymentType === 'retainer' ? formData.retainerAmount : 0,
      projectValue: formData.paymentType === 'one-off' ? formData.projectAmount : 0,
      since: formData.startDate,
      startDate: formData.startDate,
      lastActivity: new Date().toISOString().split('T')[0],
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: formData.notes.trim(),
      paymentStatus: 'pending',
      invoiceStatus: formData.invoiceStatus,
      monthlyTotal: 0,
    };

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient),
    });
    if (!res.ok) throw new Error('Failed to add');
    const added = await res.json() as Client;
    setClients((prev) => [...prev, added]);
    setShowFormModal(false);
  }

  const filtered = filter === 'all'
    ? clients.filter((c) => c.status !== 'closed')
    : clients.filter((c) => c.status === filter);

  // Summary stats
  const activeClients = clients.filter((c) => c.status === 'active');
  const pipelineClients = clients.filter((c) => c.status === 'pipeline');
  const monthlyRecurring = activeClients.reduce((sum, c) => sum + (c.monthlyRetainer || c.retainerAmount || 0), 0);
  const totalMonthly = activeClients.reduce((sum, c) => sum + (c.monthlyTotal || 0), 0);

  const stats = [
    { label: 'Active', value: String(activeClients.length), accent: color.status.healthy },
    { label: 'Pipeline', value: String(pipelineClients.length), accent: color.status.warning },
    { label: 'MRR', value: `$${monthlyRecurring.toLocaleString()}`, accent: color.ember.flame },
    { label: 'This Month', value: `$${Math.round(totalMonthly).toLocaleString()}`, accent: color.ember.DEFAULT },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Client Command" subtitle="Your client roster — relationships, revenue, results" />
        <div style={{ padding: '60px', textAlign: 'center', color: color.text.dim }}>Loading clients...</div>
      </div>
    );
  }

  const TAB_OPTIONS: Array<{ key: ClientTab; label: string; icon: string }> = [
    { key: 'command', label: 'Client Command', icon: '👥' },
    { key: 'billing', label: 'Billing', icon: '💰' },
    { key: 'a2p', label: 'A2P Pipeline', icon: '📡' },
  ];

  return (
    <div>
      <PageHeader
        title="Client Command"
        subtitle={
          activeTab === 'command' ? 'Your CRM — manage clients, rates, invoices, everything'
          : activeTab === 'billing' ? 'Track time, bill clients, get paid — one view'
          : 'A2P & Toll-Free registration tracker'
        }
        actions={
          activeTab === 'command' ? (
            <EmberButton variant="primary" size="sm" onClick={() => setShowFormModal(true)}>
              + New Client
            </EmberButton>
          ) : undefined
        }
      />

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {TAB_OPTIONS.map((tab) => (
          <GlassPill
            key={tab.key}
            variant="default"
            size="sm"
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </GlassPill>
        ))}
      </div>

      {/* Billing Tab */}
      {activeTab === 'billing' && <BillingTable clients={clients} onRefresh={fetchClients} />}

      {/* A2P Pipeline Tab */}
      {activeTab === 'a2p' && <A2PPipeline />}

      {/* Client Command Tab */}
      {activeTab === 'command' && (
        <>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {stats.map((stat) => (
              <GlassCard key={stat.label} padding="sm" hover={false}>
                <div style={{ textAlign: 'center', padding: '6px 4px' }}>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: typography.fontWeight.bold,
                    color: stat.accent,
                    textShadow: `0 0 20px ${stat.accent}40`,
                    marginBottom: '2px',
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
              const count = f.key === 'all'
                ? clients.filter((c) => c.status !== 'closed').length
                : clients.filter((c) => c.status === f.key).length;
              return (
                <GlassPill
                  key={f.key}
                  variant="default"
                  size="sm"
                  active={filter === f.key}
                  onClick={() => setFilter(f.key)}
                >
                  {f.icon} {f.label}
                  <span style={{ marginLeft: '4px', opacity: 0.6 }}>{count}</span>
                </GlassPill>
              );
            })}
          </div>

          {/* Client Card Grid */}
          {filtered.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}>
              {filtered.map((client) => (
                <ClientCRMCard
                  key={client.id}
                  client={client}
                  onClick={() => { setSelectedClient(client); setShowDrawer(true); }}
                  onStatusChange={(status) => handleUpdate(client.id, { status })}
                  onInvoiceChange={(invoiceStatus) => handleUpdate(client.id, { invoiceStatus })}
                />
              ))}
            </div>
          ) : (
            <div style={{
              padding: '40px', textAlign: 'center', color: color.text.dim,
              background: color.bg.surface, borderRadius: radius.xl,
              border: `1px solid ${color.glass.border}`,
            }}>
              No clients in this category
            </div>
          )}

          {/* Detail Drawer */}
          {showDrawer && selectedClient && (
            <ClientDetailDrawer
              client={selectedClient}
              onClose={() => { setShowDrawer(false); setSelectedClient(null); }}
              onUpdate={handleUpdate}
            />
          )}

          {/* Create Client Modal */}
          {showFormModal && (
            <ClientFormModal
              title="New Client"
              onClose={() => setShowFormModal(false)}
              onSave={handleCreateClient}
            />
          )}
        </>
      )}
    </div>
  );
}
