'use client';

import React, { useState, useCallback } from 'react';
import { color, typography, radius, animation, shadow, glass } from '@/styles/tokens';
import type { Client, ClientStatus } from '@/lib/types';

// ─── Status Config ──────────────────────────────────────────────

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; glow: string }> = {
  active:    { label: 'ACTIVE',    color: '#4ade80', glow: 'rgba(74, 222, 128, 0.4)' },
  pipeline:  { label: 'PIPELINE',  color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)' },
  paused:    { label: 'PAUSED',    color: '#8a8494', glow: 'rgba(138, 132, 148, 0.3)' },
  completed: { label: 'COMPLETE',  color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)' },
};

// ─── Types ──────────────────────────────────────────────────────

interface ClientTableProps {
  clients: Client[];
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
  onAdd: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────

function getMonthlyValue(c: Client): number {
  if (c.monthlyRetainer) return c.monthlyRetainer;
  if (c.avgMonthly) return c.avgMonthly;
  return 0;
}

function getProjectValue(c: Client): number {
  return c.projectValue || 0;
}

function formatCurrency(n: number): string {
  if (n === 0) return '—';
  return `$${n.toLocaleString()}`;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Expanded Row ───────────────────────────────────────────────

function ExpandedDetails({
  client,
  onUpdate,
}: {
  client: Client;
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
}) {
  const [notes, setNotes] = useState(client.notes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveNotes() {
    setSaving(true);
    await onUpdate(client.id, { notes });
    setEditingNotes(false);
    setSaving(false);
  }

  async function handleStatusCycle() {
    const order: ClientStatus[] = ['pipeline', 'active', 'paused', 'completed'];
    const idx = order.indexOf(client.status);
    const next = order[(idx + 1) % order.length];
    await onUpdate(client.id, { status: next });
  }

  const daysUntilDue = client.dueDate
    ? Math.ceil((new Date(client.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, border: 'none' }}>
        <div
          style={{
            padding: '16px 20px 20px',
            background: color.bg.elevated,
            borderTop: `1px solid ${color.glass.border}`,
            /* expanded row appears inline */
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {/* Col 1: Details */}
            <div>
              <div style={sectionLabelStyle}>DETAILS</div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Contact</span>
                <span style={detailValueStyle}>{client.contact}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Business</span>
                <span style={detailValueStyle}>{client.business}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Since</span>
                <span style={detailValueStyle}>
                  {new Date(client.since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Rate</span>
                <span style={detailValueStyle}>{client.rate}</span>
              </div>
              {daysUntilDue !== null && (
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>Due</span>
                  <span style={{
                    ...detailValueStyle,
                    color: daysUntilDue <= 7 ? color.status.error : daysUntilDue <= 14 ? color.status.warning : color.text.primary,
                  }}>
                    {new Date(client.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' '}({daysUntilDue > 0 ? `${daysUntilDue}d left` : daysUntilDue === 0 ? 'Today!' : `${Math.abs(daysUntilDue)}d overdue`})
                  </span>
                </div>
              )}
            </div>

            {/* Col 2: Tags & Status */}
            <div>
              <div style={sectionLabelStyle}>STATUS & TAGS</div>
              <div style={{ marginBottom: '10px' }}>
                <button
                  onClick={handleStatusCycle}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: typography.fontWeight.bold,
                    color: STATUS_CONFIG[client.status].color,
                    background: `${STATUS_CONFIG[client.status].color}15`,
                    border: `1px solid ${STATUS_CONFIG[client.status].color}30`,
                    borderRadius: radius.full,
                    padding: '3px 12px',
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                    transition: `all ${animation.duration.normal}`,
                  }}
                >
                  {STATUS_CONFIG[client.status].label} ↻
                </button>
              </div>
              {client.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {client.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.6rem',
                        color: color.text.secondary,
                        background: color.bg.overlay,
                        borderRadius: radius.full,
                        padding: '2px 8px',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {client.link && (
                <div style={{ marginTop: '10px' }}>
                  <a
                    href={client.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: typography.fontSize.metadata,
                      color: color.blue.DEFAULT,
                      textDecoration: 'none',
                    }}
                  >
                    📄 View docs →
                  </a>
                </div>
              )}
            </div>

            {/* Col 3: Notes */}
            <div>
              <div style={sectionLabelStyle}>NOTES</div>
              {editingNotes ? (
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      background: color.bg.surface,
                      border: `1px solid ${color.glass.borderFocus}`,
                      borderRadius: radius.sm,
                      color: color.text.primary,
                      fontSize: typography.fontSize.caption,
                      padding: '8px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: typography.lineHeight.relaxed,
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button onClick={saveNotes} disabled={saving} style={saveBtnStyle}>
                      {saving ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingNotes(false); setNotes(client.notes); }}
                      style={cancelBtnStyle}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingNotes(true)}
                  style={{
                    cursor: 'pointer',
                    fontSize: typography.fontSize.caption,
                    color: client.notes ? color.text.secondary : color.text.dim,
                    lineHeight: typography.lineHeight.relaxed,
                    padding: '4px 0',
                  }}
                  title="Click to edit"
                >
                  {client.notes || 'No notes — click to add'}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Shared Styles ──────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.metadata,
  fontWeight: typography.fontWeight.semibold,
  color: color.text.accent,
  textTransform: 'uppercase',
  letterSpacing: typography.letterSpacing.widest,
  marginBottom: '8px',
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: typography.fontSize.caption,
  marginBottom: '4px',
};

const detailLabelStyle: React.CSSProperties = {
  color: color.text.dim,
};

const detailValueStyle: React.CSSProperties = {
  color: color.text.primary,
};

const saveBtnStyle: React.CSSProperties = {
  fontSize: typography.fontSize.metadata,
  background: color.ember.DEFAULT,
  color: color.text.inverse,
  border: 'none',
  borderRadius: radius.sm,
  padding: '3px 10px',
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  fontSize: typography.fontSize.metadata,
  background: 'none',
  color: color.text.dim,
  border: `1px solid ${color.glass.border}`,
  borderRadius: radius.sm,
  padding: '3px 10px',
  cursor: 'pointer',
};

// ─── Main Table Component ───────────────────────────────────────

export function ClientTable({ clients, onUpdate, onAdd }: ClientTableProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort: active → pipeline → paused → completed
  const sortOrder: Record<ClientStatus, number> = { active: 0, pipeline: 1, paused: 2, completed: 3 };
  const sorted = [...clients].sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);

  // Totals
  const totalMonthly = clients.reduce((s, c) => s + (c.status === 'active' ? getMonthlyValue(c) : 0), 0);
  const totalProject = clients.reduce((s, c) => s + (c.status !== 'completed' ? getProjectValue(c) : 0), 0);
  const activeCount = clients.filter((c) => c.status === 'active').length;

  const columnHeaders = [
    { label: 'CLIENT', align: 'left' as const, width: undefined },
    { label: 'STATUS', align: 'center' as const, width: '90px' },
    { label: 'CONTACT', align: 'left' as const, width: '140px' },
    { label: 'RATE', align: 'left' as const, width: '130px' },
    { label: 'MONTHLY', align: 'right' as const, width: '100px' },
    { label: 'PROJECT', align: 'right' as const, width: '100px' },
    { label: 'ACTIVITY', align: 'right' as const, width: '90px' },
  ];

  return (
    <div
      style={{
        background: color.bg.surface,
        backdropFilter: glass.blur.card,
        WebkitBackdropFilter: glass.blur.card,
        border: `1.5px solid ${color.glass.border}`,
        borderRadius: radius.xl,
        boxShadow: shadow.card,
        overflow: 'hidden',
      }}
    >
      {/* Inner shine */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          boxShadow: shadow.innerShine,
          pointerEvents: 'none',
        }}
      />

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: typography.fontFamily.body,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <thead>
          <tr>
            {columnHeaders.map((col) => (
              <th
                key={col.label}
                style={{
                  fontSize: typography.fontSize.metadata,
                  fontWeight: typography.fontWeight.semibold,
                  color: color.text.accent,
                  textTransform: 'uppercase',
                  letterSpacing: typography.letterSpacing.widest,
                  textAlign: col.align,
                  padding: '14px 16px 10px',
                  borderBottom: `1px solid ${color.glass.border}`,
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {sorted.map((client) => {
            const isExpanded = expandedId === client.id;
            const isHovered = hoveredId === client.id;
            const statusCfg = STATUS_CONFIG[client.status];
            const days = daysSince(client.lastActivity);

            return (
              <React.Fragment key={client.id}>
                <tr
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                  onMouseEnter={() => setHoveredId(client.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    cursor: 'pointer',
                    background: isExpanded
                      ? color.bg.elevated
                      : isHovered
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'transparent',
                    transition: `background ${animation.duration.fast}`,
                    borderLeft: `3px solid ${statusCfg.color}`,
                  }}
                >
                  {/* Client Name */}
                  <td style={{ ...cellStyle, paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: `transform ${animation.duration.normal}`,
                          display: 'inline-block',
                          fontSize: '0.6rem',
                          color: color.text.dim,
                        }}
                      >
                        ▸
                      </span>
                      <span style={{
                        fontWeight: typography.fontWeight.semibold,
                        color: color.text.primary,
                      }}>
                        {client.name}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: typography.fontWeight.bold,
                        color: statusCfg.color,
                        background: `${statusCfg.color}12`,
                        border: `1px solid ${statusCfg.color}25`,
                        borderRadius: radius.full,
                        padding: '2px 8px',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Contact */}
                  <td style={{ ...cellStyle, color: color.text.secondary }}>
                    {client.contact}
                  </td>

                  {/* Rate */}
                  <td style={{ ...cellStyle, color: color.text.secondary }}>
                    {client.rate}
                  </td>

                  {/* Monthly */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <span style={{ color: getMonthlyValue(client) > 0 ? color.ember.flame : color.text.dim }}>
                      {formatCurrency(getMonthlyValue(client))}
                    </span>
                  </td>

                  {/* Project */}
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: typography.fontFamily.mono }}>
                    <span style={{ color: getProjectValue(client) > 0 ? color.ember.DEFAULT : color.text.dim }}>
                      {formatCurrency(getProjectValue(client))}
                    </span>
                  </td>

                  {/* Activity */}
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    color: days > 7 ? color.status.warning : days === 0 ? color.status.healthy : color.text.secondary,
                  }}>
                    {days === 0 ? 'Today' : `${days}d ago`}
                  </td>
                </tr>

                {/* Expanded details */}
                {isExpanded && (
                  <ExpandedDetails
                    client={client}
                    onUpdate={onUpdate}
                  />
                )}
              </React.Fragment>
            );
          })}
        </tbody>

        {/* Footer — Totals Row */}
        <tfoot>
          <tr
            style={{
              borderTop: `1px solid ${color.glass.border}`,
              background: 'rgba(255, 107, 53, 0.03)',
            }}
          >
            <td style={{ ...cellStyle, paddingLeft: '16px' }}>
              <span style={{
                fontWeight: typography.fontWeight.bold,
                color: color.text.accent,
                fontSize: typography.fontSize.caption,
                letterSpacing: typography.letterSpacing.wider,
              }}>
                TOTALS ({activeCount} active)
              </span>
            </td>
            <td style={cellStyle} />
            <td style={cellStyle} />
            <td style={cellStyle} />
            <td style={{
              ...cellStyle,
              textAlign: 'right',
              fontFamily: typography.fontFamily.mono,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
              textShadow: `0 0 12px rgba(255, 179, 71, 0.3)`,
            }}>
              {formatCurrency(totalMonthly)}
              <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, fontWeight: 'normal' }}>/mo</div>
            </td>
            <td style={{
              ...cellStyle,
              textAlign: 'right',
              fontFamily: typography.fontFamily.mono,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.DEFAULT,
              textShadow: `0 0 12px rgba(255, 107, 53, 0.3)`,
            }}>
              {formatCurrency(totalProject)}
              <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, fontWeight: 'normal' }}>pipeline</div>
            </td>
            <td style={cellStyle} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Cell Style ─────────────────────────────────────────────────

const cellStyle: React.CSSProperties = {
  fontSize: typography.fontSize.body,
  padding: '12px 16px',
  borderBottom: `1px solid rgba(255, 255, 255, 0.03)`,
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
