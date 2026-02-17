'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard, GlassPill, GlassModal, GlassInput, GlassSelect, EmberButton, SectionHeading } from '@/components/ui';
import { color, typography, radius } from '@/styles/tokens';
import type { A2PRegistration, A2PStatus, A2PData } from '@/lib/types';

// ─── Status Config ──────────────────────────────────────────────

const STATUS_CONFIG: Record<A2PStatus, { label: string; emoji: string; color: string; order: number }> = {
  to_submit: { label: 'To Submit', emoji: '📋', color: '#94a3b8', order: 0 },
  submitted: { label: 'Submitted', emoji: '📤', color: '#60a5fa', order: 1 },
  rejected: { label: 'Rejected', emoji: '❌', color: '#ef4444', order: 2 },
  rejected_resubmitted: { label: 'Resubmitted', emoji: '🔄', color: '#f59e0b', order: 3 },
  brand_approved: { label: 'Brand Approved', emoji: '✅', color: '#22c55e', order: 4 },
  fully_approved: { label: 'Fully Approved', emoji: '🎉', color: '#10b981', order: 5 },
};

const STATUS_FLOW: A2PStatus[] = ['to_submit', 'submitted', 'brand_approved', 'fully_approved'];

// ─── Stats Bar ──────────────────────────────────────────────────

function PipelineStats({ registrations }: { registrations: A2PRegistration[] }) {
  const total = registrations.length;
  const approved = registrations.filter((r) => r.status === 'fully_approved').length;
  const pending = registrations.filter((r) => !['fully_approved', 'rejected'].includes(r.status)).length;
  const rejected = registrations.filter((r) => r.status === 'rejected' || r.status === 'rejected_resubmitted').length;

  // Average approval time
  const withDays = registrations.filter((r) => r.approvalDays && r.approvalDays > 0);
  const avgDays = withDays.length > 0
    ? Math.round(withDays.reduce((sum, r) => sum + (r.approvalDays || 0), 0) / withDays.length)
    : 0;

  const stats = [
    { label: 'Total', value: String(total), accent: color.text.primary },
    { label: 'Approved', value: String(approved), accent: '#10b981' },
    { label: 'Pending', value: String(pending), accent: '#60a5fa' },
    { label: 'Rejected', value: String(rejected), accent: '#ef4444' },
    { label: 'Avg Days', value: avgDays ? String(avgDays) : '—', accent: color.ember.flame },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
      {stats.map((s) => (
        <GlassCard key={s.label} padding="sm" hover={false}>
          <div style={{ textAlign: 'center', padding: '6px 4px' }}>
            <div style={{
              fontSize: '1.3rem',
              fontWeight: typography.fontWeight.bold,
              color: s.accent,
              textShadow: `0 0 16px ${s.accent}40`,
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              letterSpacing: typography.letterSpacing.wider,
              textTransform: 'uppercase' as const,
            }}>
              {s.label}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ─── Status Badge (Clickable) ───────────────────────────────────

function StatusBadge({ status, onClick }: { status: A2PStatus; onClick?: () => void }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: `${cfg.color}18`,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Status Advancement Modal ───────────────────────────────────

function StatusAdvanceModal({
  reg,
  onClose,
  onAdvance,
}: {
  reg: A2PRegistration;
  onClose: () => void;
  onAdvance: (id: string, newStatus: A2PStatus) => void;
}) {
  const currentOrder = STATUS_CONFIG[reg.status].order;

  // Show all statuses they could move to
  const options = Object.entries(STATUS_CONFIG)
    .filter(([key]) => key !== reg.status)
    .sort(([, a], [, b]) => a.order - b.order);

  return (
    <GlassModal open={true} onClose={onClose} title={`Update Status: ${reg.businessName}`} width="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '0.75rem', color: color.text.secondary, marginBottom: '4px' }}>
          Current: <StatusBadge status={reg.status} />
        </div>
        <div style={{ fontSize: '0.7rem', color: color.text.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          Move to:
        </div>
        {options.map(([key, cfg]) => {
          const isForward = cfg.order > currentOrder;
          return (
            <button
              key={key}
              onClick={() => { onAdvance(reg.id, key as A2PStatus); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: isForward ? `${cfg.color}10` : color.bg.surface,
                border: `1px solid ${cfg.color}30`,
                borderRadius: radius.lg,
                cursor: 'pointer',
                color: cfg.color,
                fontSize: '0.82rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                textAlign: 'left' as const,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{cfg.emoji}</span>
              <span>{cfg.label}</span>
              {isForward && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.6 }}>→</span>}
            </button>
          );
        })}
      </div>
    </GlassModal>
  );
}

// ─── Add Registration Modal ─────────────────────────────────────

function AddRegistrationModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (reg: Partial<A2PRegistration>) => void;
}) {
  const [form, setForm] = useState({
    businessName: '',
    registrationType: 'a2p' as 'a2p' | 'toll_free',
    businessType: 'business' as 'business' | 'sole_prop',
    notes: '',
  });

  return (
    <GlassModal
      open={true}
      onClose={onClose}
      title="New A2P Registration"
      width="sm"
      footer={
        <div style={{ display: 'flex', gap: '8px' }}>
          <EmberButton variant="ghost" size="sm" onClick={onClose}>Cancel</EmberButton>
          <EmberButton
            variant="primary"
            size="sm"
            onClick={() => {
              if (!form.businessName.trim()) return;
              onAdd(form);
              onClose();
            }}
          >
            Add Registration
          </EmberButton>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <GlassInput
          label="Business Name"
          value={form.businessName}
          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          placeholder="Business LLC"
          size="sm"
          autoFocus
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <GlassSelect
            label="Registration Type"
            value={form.registrationType}
            onChange={(e) => setForm({ ...form, registrationType: e.target.value as 'a2p' | 'toll_free' })}
            options={[
              { value: 'a2p', label: 'A2P 10DLC' },
              { value: 'toll_free', label: 'Toll Free' },
            ]}
            size="sm"
          />
          <GlassSelect
            label="Business Type"
            value={form.businessType}
            onChange={(e) => setForm({ ...form, businessType: e.target.value as 'business' | 'sole_prop' })}
            options={[
              { value: 'business', label: 'Business' },
              { value: 'sole_prop', label: 'Sole Proprietor' },
            ]}
            size="sm"
          />
        </div>
        <GlassInput
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional notes..."
          size="sm"
        />
      </div>
    </GlassModal>
  );
}

// ─── Registration Row ───────────────────────────────────────────

function RegistrationRow({
  reg,
  onStatusClick,
  onDelete,
}: {
  reg: A2PRegistration;
  onStatusClick: (reg: A2PRegistration) => void;
  onDelete: (id: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 0.7fr 0.5fr',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        background: color.bg.surface,
        borderRadius: radius.lg,
        border: `1px solid ${color.glass.border}`,
        fontSize: '0.78rem',
        transition: 'all 0.2s',
      }}
    >
      {/* Business Name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: 600, color: color.text.primary }}>{reg.businessName}</span>
        <span style={{ fontSize: '0.65rem', color: color.text.dim }}>
          {reg.registrationType === 'a2p' ? 'A2P 10DLC' : 'Toll Free'}
          {' · '}
          {reg.businessType === 'sole_prop' ? 'Sole Prop' : 'Business'}
        </span>
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={reg.status} onClick={() => onStatusClick(reg)} />
      </div>

      {/* Date Created */}
      <div style={{ color: color.text.secondary, fontSize: '0.72rem' }}>
        {reg.dateCreated || '—'}
      </div>

      {/* Date Approved */}
      <div style={{ color: color.text.secondary, fontSize: '0.72rem' }}>
        {reg.dateFullyApproved || '—'}
      </div>

      {/* Approval Days */}
      <div style={{
        textAlign: 'center',
        color: reg.approvalDays ? color.ember.flame : color.text.dim,
        fontWeight: reg.approvalDays ? 600 : 400,
        fontSize: '0.75rem',
      }}>
        {reg.approvalDays ? `${reg.approvalDays}d` : '—'}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
        {reg.notes && (
          <button
            onClick={() => setShowNotes(!showNotes)}
            title={reg.notes}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              opacity: 0.5,
              padding: '2px',
            }}
          >
            📝
          </button>
        )}
        <button
          onClick={() => onDelete(reg.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            opacity: 0.3,
            padding: '2px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── Visual Pipeline ────────────────────────────────────────────

function PipelineVisual({ registrations }: { registrations: A2PRegistration[] }) {
  const stages = STATUS_FLOW.map((status) => {
    const cfg = STATUS_CONFIG[status];
    const count = registrations.filter((r) => r.status === status).length;
    // Also count rejected variants
    let extra = 0;
    if (status === 'submitted') {
      extra = registrations.filter((r) => r.status === 'rejected' || r.status === 'rejected_resubmitted').length;
    }
    return { ...cfg, status, count, extra };
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
      gap: '4px',
      marginBottom: '20px',
    }}>
      {stages.map((stage, i) => (
        <div key={stage.status} style={{ position: 'relative' }}>
          <div style={{
            background: `${stage.color}15`,
            border: `1px solid ${stage.color}30`,
            borderRadius: radius.lg,
            padding: '12px 8px',
            textAlign: 'center',
            minHeight: '70px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '4px',
          }}>
            <div style={{ fontSize: '1.4rem' }}>{stage.emoji}</div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: typography.fontWeight.bold,
              color: stage.color,
            }}>
              {stage.count}
            </div>
            <div style={{
              fontSize: '0.62rem',
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {stage.label}
            </div>
            {stage.extra > 0 && (
              <div style={{ fontSize: '0.6rem', color: '#ef4444' }}>
                +{stage.extra} rejected
              </div>
            )}
          </div>
          {i < stages.length - 1 && (
            <div style={{
              position: 'absolute',
              right: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: color.text.dim,
              fontSize: '0.9rem',
              zIndex: 1,
            }}>
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function A2PPipeline(): React.ReactElement {
  const [registrations, setRegistrations] = useState<A2PRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<A2PStatus | 'all' | 'active'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [advancingReg, setAdvancingReg] = useState<A2PRegistration | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/a2p');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as A2PData;
      setRegistrations(data.registrations);
    } catch (err) {
      console.error('Error fetching A2P data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAdd(partial: Partial<A2PRegistration>) {
    const res = await fetch('/api/a2p', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (res.ok) {
      const added = await res.json() as A2PRegistration;
      setRegistrations((prev) => [added, ...prev]);
    }
  }

  async function handleStatusAdvance(id: string, newStatus: A2PStatus) {
    const res = await fetch('/api/a2p', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json() as A2PRegistration;
      setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/a2p?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    }
  }

  // Filter logic
  let filtered = registrations;
  if (filter === 'active') {
    filtered = registrations.filter((r) => !['fully_approved'].includes(r.status));
  } else if (filter !== 'all') {
    filtered = registrations.filter((r) => r.status === filter);
  }

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((r) => r.businessName.toLowerCase().includes(q));
  }

  // Sort: active statuses first (by order), then by date
  filtered.sort((a, b) => {
    const orderA = STATUS_CONFIG[a.status].order;
    const orderB = STATUS_CONFIG[b.status].order;
    if (orderA !== orderB) return orderA - orderB;
    return (b.dateCreated || '').localeCompare(a.dateCreated || '');
  });

  const FILTER_OPTIONS: Array<{ key: typeof filter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'active', label: '⚡ Active' },
    { key: 'to_submit', label: '📋 To Submit' },
    { key: 'submitted', label: '📤 Submitted' },
    { key: 'rejected', label: '❌ Rejected' },
    { key: 'brand_approved', label: '✅ Brand' },
    { key: 'fully_approved', label: '🎉 Approved' },
  ];

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: color.text.dim }}>Loading A2P registrations...</div>;
  }

  return (
    <div>
      {/* Pipeline Visual */}
      <PipelineVisual registrations={registrations} />

      {/* Stats */}
      <PipelineStats registrations={registrations} />

      {/* Header + Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTER_OPTIONS.map((f) => (
            <GlassPill
              key={f.key}
              variant="default"
              size="sm"
              active={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== 'all' && f.key !== 'active' && (
                <span style={{ marginLeft: '4px', opacity: 0.5 }}>
                  {registrations.filter((r) => r.status === f.key).length}
                </span>
              )}
            </GlassPill>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: color.bg.surface,
              border: `1px solid ${color.glass.border}`,
              borderRadius: radius.lg,
              color: color.text.primary,
              padding: '5px 10px',
              fontSize: '0.72rem',
              outline: 'none',
              width: '140px',
            }}
          />
          <EmberButton variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            + New
          </EmberButton>
        </div>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 0.7fr 0.5fr',
        gap: '8px',
        padding: '6px 14px',
        fontSize: '0.62rem',
        color: color.text.dim,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 600,
        marginBottom: '6px',
      }}>
        <span>Business</span>
        <span>Status</span>
        <span>Created</span>
        <span>Approved</span>
        <span style={{ textAlign: 'center' }}>Days</span>
        <span></span>
      </div>

      {/* Registrations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filtered.length > 0 ? (
          filtered.map((reg) => (
            <RegistrationRow
              key={reg.id}
              reg={reg}
              onStatusClick={setAdvancingReg}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: color.text.dim,
            background: color.bg.surface,
            borderRadius: radius.xl,
            border: `1px solid ${color.glass.border}`,
          }}>
            No registrations match your filters
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddRegistrationModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
      {advancingReg && (
        <StatusAdvanceModal
          reg={advancingReg}
          onClose={() => setAdvancingReg(null)}
          onAdvance={handleStatusAdvance}
        />
      )}
    </div>
  );
}
