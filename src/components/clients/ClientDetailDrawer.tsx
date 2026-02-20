'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GlassInput, GlassSelect, EmberButton } from '@/components/ui';
import { color, typography, radius, animation, shadow, glass, zIndex } from '@/styles/tokens';
import type { Client, ClientStatus, PaymentType, InvoiceStatus, TimeEntry, TimeEntriesData } from '@/lib/types';

// ─── Configs ────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'active', label: '🟢 Active' },
  { value: 'pipeline', label: '🟡 Pipeline' },
  { value: 'paused', label: '⏸ Paused' },
  { value: 'closed', label: '⬛ Closed' },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'one-off', label: 'One-Off Project' },
];

const INVOICE_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'sent', label: 'Invoice Sent' },
  { value: 'paid', label: 'Paid' },
];

// ─── Inline Editable Field ─────────────────────────────────────

function InlineField({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    if (draft !== value) onSave(draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={labelStyle}>{label}</div>
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          placeholder={placeholder}
          style={{
            width: '100%', background: color.bg.elevated,
            border: `1px solid ${color.glass.borderFocus}`, borderRadius: radius.sm,
            color: color.text.primary, fontSize: typography.fontSize.body,
            padding: '6px 10px', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => { setDraft(value); setEditing(true); }}>
      <div style={labelStyle}>{label}</div>
      <div style={{
        fontSize: typography.fontSize.body,
        color: value ? color.text.primary : color.text.dim,
        padding: '4px 0',
        borderBottom: `1px dashed ${color.glass.border}`,
        transition: `border-color ${animation.duration.fast}`,
      }}>
        {value || placeholder || 'Click to edit'}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.metadata,
  fontWeight: typography.fontWeight.semibold,
  color: color.text.accent,
  textTransform: 'uppercase',
  letterSpacing: typography.letterSpacing.widest,
  marginBottom: '4px',
};

// ─── Main Drawer ────────────────────────────────────────────────

interface Props {
  client: Client;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
}

export function ClientDetailDrawer({ client, onClose, onUpdate }: Props): React.ReactElement {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingTime, setLoadingTime] = useState(true);
  const [notes, setNotes] = useState(client.notes);
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => {
    setNotes(client.notes);
  }, [client.notes]);

  const fetchTime = useCallback(async () => {
    try {
      const res = await fetch(`/api/time-entries?clientId=${client.id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as TimeEntriesData;
      setTimeEntries(
        data.entries
          .filter((e) => e.clientId === client.id)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .slice(0, 10)
      );
    } catch { /* ignore */ }
    finally { setLoadingTime(false); }
  }, [client.id]);

  useEffect(() => { fetchTime(); }, [fetchTime]);

  function save(field: string, value: unknown) {
    onUpdate(client.id, { [field]: value });
  }

  async function saveNotes() {
    await onUpdate(client.id, { notes });
    setEditingNotes(false);
  }

  const paymentType = (client.paymentType || client.revenueModel || 'hourly') as PaymentType;

  // Calculate hours this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEntries = timeEntries.filter((e) => new Date(e.startTime) >= monthStart);
  const totalMinutes = thisMonthEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const trackedValue = (totalMinutes / 60) * (client.hourlyRate || 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: zIndex.modalOverlay, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '520px', maxWidth: '90vw',
        background: color.bg.base,
        borderLeft: `1px solid ${color.glass.border}`,
        boxShadow: shadow.modal,
        zIndex: zIndex.modal,
        overflowY: 'auto',
        animation: 'slide-in-right 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, background: color.bg.base,
          borderBottom: `1px solid ${color.glass.border}`,
          padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 2,
        }}>
          <div>
            <div style={{
              fontSize: typography.fontSize.pageTitle,
              fontWeight: typography.fontWeight.bold,
              color: color.text.primary,
            }}>
              {client.name}
            </div>
            {client.businessName && client.businessName !== client.name && (
              <div style={{ fontSize: typography.fontSize.caption, color: color.text.secondary }}>
                {client.businessName}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: color.text.dim,
            fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px',
          }}>✕</button>
        </div>

        {/* Quick Stats Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1px', background: color.glass.border,
          borderBottom: `1px solid ${color.glass.border}`,
        }}>
          {[
            { label: 'Hours (Month)', value: `${totalHours}h`, accent: color.text.primary },
            { label: 'Tracked Value', value: `$${Math.round(trackedValue).toLocaleString()}`, accent: color.status.healthy },
            { label: 'Monthly Total', value: `$${(client.monthlyTotal || 0).toLocaleString()}`, accent: color.ember.flame },
          ].map((s) => (
            <div key={s.label} style={{ background: color.bg.base, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{
                fontSize: '1.1rem', fontWeight: typography.fontWeight.bold,
                color: s.accent, fontFamily: typography.fontFamily.mono,
              }}>{s.value}</div>
              <div style={{
                fontSize: typography.fontSize.metadata, color: color.text.dim,
                textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wider,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Status + Payment Type + Invoice */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <div style={labelStyle}>STATUS</div>
              <select
                value={client.status}
                onChange={(e) => save('status', e.target.value)}
                style={selectStyle}
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>PAYMENT TYPE</div>
              <select
                value={paymentType}
                onChange={(e) => {
                  const pt = e.target.value as PaymentType;
                  save('paymentType', pt);
                  save('revenueModel', pt === 'one-off' ? 'project' : pt);
                }}
                style={selectStyle}
              >
                {PAYMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>INVOICE</div>
              <select
                value={client.invoiceStatus || 'unpaid'}
                onChange={(e) => save('invoiceStatus', e.target.value)}
                style={selectStyle}
              >
                {INVOICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Editable fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <InlineField label="Name" value={client.name} onSave={(v) => save('name', v)} />
            <InlineField label="Business Name" value={client.businessName || ''} onSave={(v) => save('businessName', v)} />
            <InlineField label="Contact" value={client.contact} onSave={(v) => save('contact', v)} />
            <InlineField label="Email" value={client.email || ''} onSave={(v) => save('email', v)} type="email" placeholder="email@example.com" />
            <InlineField label="Phone" value={client.phone || ''} onSave={(v) => save('phone', v)} type="tel" placeholder="+1 555-0000" />
            <InlineField label="Start Date" value={client.startDate || client.since} onSave={(v) => { save('startDate', v); save('since', v); }} type="date" />
          </div>

          {/* Rate fields based on payment type */}
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {paymentType === 'hourly' && (
              <InlineField label="Hourly Rate ($)" value={String(client.hourlyRate || 0)} onSave={(v) => save('hourlyRate', Number(v))} type="number" />
            )}
            {paymentType === 'retainer' && (
              <InlineField label="Retainer Amount ($)" value={String(client.retainerAmount || client.monthlyRetainer || 0)} onSave={(v) => { save('retainerAmount', Number(v)); save('monthlyRetainer', Number(v)); }} type="number" />
            )}
            {paymentType === 'one-off' && (
              <InlineField label="Project Amount ($)" value={String(client.projectAmount || client.projectValue || 0)} onSave={(v) => { save('projectAmount', Number(v)); save('projectValue', Number(v)); }} type="number" />
            )}
          </div>

          {/* Notes */}
          <div style={{ marginTop: '16px' }}>
            <div style={labelStyle}>NOTES</div>
            {editingNotes ? (
              <div>
                <textarea
                  autoFocus
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%', minHeight: '100px', background: color.bg.elevated,
                    border: `1px solid ${color.glass.borderFocus}`, borderRadius: radius.sm,
                    color: color.text.primary, fontSize: typography.fontSize.caption,
                    padding: '10px', resize: 'vertical', fontFamily: 'inherit',
                    lineHeight: typography.lineHeight.relaxed, outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <EmberButton variant="primary" size="sm" onClick={saveNotes}>Save</EmberButton>
                  <EmberButton variant="ghost" size="sm" onClick={() => { setNotes(client.notes); setEditingNotes(false); }}>Cancel</EmberButton>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingNotes(true)}
                style={{
                  fontSize: typography.fontSize.caption, cursor: 'pointer',
                  color: client.notes ? color.text.secondary : color.text.dim,
                  lineHeight: typography.lineHeight.relaxed, padding: '6px 0',
                  borderBottom: `1px dashed ${color.glass.border}`,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {client.notes || 'No notes — click to add'}
              </div>
            )}
          </div>

          {/* Tags */}
          {(client.tags?.length > 0) && (
            <div style={{ marginTop: '16px' }}>
              <div style={labelStyle}>TAGS</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {client.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: '0.6rem', color: color.text.secondary,
                    background: color.bg.overlay, borderRadius: radius.full,
                    padding: '3px 10px', letterSpacing: '0.03em',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Time Entries section */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={labelStyle}>RECENT TIME ENTRIES</div>
              <button
                onClick={() => window.location.href = `/time?client=${encodeURIComponent(client.name)}`}
                style={{
                  fontSize: typography.fontSize.metadata, color: color.ember.DEFAULT,
                  background: 'none', border: 'none', cursor: 'pointer',
                  textDecoration: 'underline', textUnderlineOffset: '2px',
                }}
              >
                View All in Time Forge →
              </button>
            </div>
            {loadingTime ? (
              <div style={{ color: color.text.dim, fontSize: typography.fontSize.caption, padding: '10px 0' }}>Loading...</div>
            ) : timeEntries.length === 0 ? (
              <div style={{ color: color.text.dim, fontSize: typography.fontSize.caption, padding: '10px 0' }}>No time entries yet</div>
            ) : (
              <div>
                {timeEntries.slice(0, 5).map((entry, i) => {
                  const d = new Date(entry.startTime);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const dur = entry.duration ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m` : (entry.isRunning ? '⏱ Live' : '—');
                  return (
                    <div key={entry.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: i < Math.min(timeEntries.length, 5) - 1 ? `1px solid ${color.glass.border}` : 'none',
                    }}>
                      <div>
                        <span style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.semibold, color: color.text.primary }}>{dateStr}</span>
                        <span style={{ fontSize: typography.fontSize.caption, color: color.text.dim, marginLeft: '8px' }}>
                          {entry.description && entry.description !== 'Quick timer session' ? entry.description : 'No notes'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.semibold,
                        color: entry.isRunning ? color.ember.DEFAULT : color.text.accent,
                        fontFamily: typography.fontFamily.mono,
                      }}>{dur}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{
            marginTop: '24px', paddingTop: '16px',
            borderTop: `1px solid ${color.glass.border}`,
            display: 'flex', gap: '8px',
          }}>
            {client.status !== 'paused' && client.status !== 'closed' && (
              <EmberButton variant="ghost" size="sm" onClick={() => save('status', 'paused')}>
                ⏸ Pause
              </EmberButton>
            )}
            {client.status === 'paused' && (
              <EmberButton variant="ghost" size="sm" onClick={() => save('status', 'active')}>
                ▶ Reactivate
              </EmberButton>
            )}
            {client.status !== 'closed' && (
              <EmberButton variant="ghost" size="sm" onClick={() => save('status', 'closed')}>
                Archive
              </EmberButton>
            )}
            {client.status === 'closed' && (
              <EmberButton variant="ghost" size="sm" onClick={() => save('status', 'pipeline')}>
                Restore
              </EmberButton>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: color.bg.elevated,
  border: `1px solid ${color.glass.border}`,
  borderRadius: radius.sm,
  color: color.text.primary,
  fontSize: typography.fontSize.caption,
  padding: '6px 8px',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
