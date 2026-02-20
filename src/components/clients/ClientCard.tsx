'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { Client, ClientStatus } from '@/lib/types';

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; glow: string }> = {
  active:    { label: 'ACTIVE',    color: '#4ade80', glow: 'rgba(74, 222, 128, 0.4)' },
  pipeline:  { label: 'PIPELINE',  color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)' },
  paused:    { label: 'PAUSED',    color: '#8a8494', glow: 'rgba(138, 132, 148, 0.3)' },
  closed:    { label: 'CLOSED',    color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)' },
};

interface ClientCardProps {
  client: Client;
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
}

export function ClientCard({ client, onUpdate }: ClientCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(client.notes);
  const statusCfg = STATUS_CONFIG[client.status];

  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(client.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysUntilDue = client.dueDate
    ? Math.ceil((new Date(client.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  async function handleStatusCycle(): Promise<void> {
    const order: ClientStatus[] = ['pipeline', 'active', 'paused', 'closed'];
    const currentIdx = order.indexOf(client.status);
    const next = order[(currentIdx + 1) % order.length];
    await onUpdate(client.id, { status: next });
  }

  async function saveNotes(): Promise<void> {
    await onUpdate(client.id, { notes });
    setEditing(false);
  }

  return (
    <GlassCard padding="none" hover>
      {/* Status bar — left edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: statusCfg.color,
          borderRadius: `${radius.xl} 0 0 ${radius.xl}`,
          boxShadow: `0 0 12px ${statusCfg.glow}`,
        }}
      />

      {/* Main content */}
      <div style={{ padding: '20px 20px 20px 24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{
                fontSize: typography.fontSize.cardTitle,
                fontWeight: typography.fontWeight.semibold,
                color: color.text.primary,
                margin: 0,
              }}>
                {client.name}
              </h3>
              <button
                onClick={handleStatusCycle}
                style={{
                  fontSize: '0.6rem',
                  fontWeight: typography.fontWeight.bold,
                  color: statusCfg.color,
                  background: `${statusCfg.color}15`,
                  border: `1px solid ${statusCfg.color}30`,
                  borderRadius: radius.full,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  transition: `all ${animation.duration.normal}`,
                }}
              >
                {statusCfg.label}
              </button>
            </div>
            <p style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              margin: 0,
            }}>
              {client.contact} · {client.business}
            </p>
          </div>

          {/* Revenue indicator */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: typography.fontSize.cardTitle,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
            }}>
              {client.rate}
            </div>
            {client.revenueModel === 'hourly' && client.avgMonthly ? (
              <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
                ~${client.avgMonthly}/mo avg
              </div>
            ) : null}
          </div>
        </div>

        {/* Tags row */}
        {client.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {client.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.6rem',
                  color: color.text.secondary,
                  background: color.bg.overlay,
                  borderRadius: radius.full,
                  padding: '1px 7px',
                  letterSpacing: '0.03em',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: typography.fontSize.metadata,
          color: color.text.dim,
        }}>
          <span>Since {new Date(client.since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          <span style={{
            color: daysSinceActivity > 7 ? color.status.warning : color.text.dim,
          }}>
            {daysSinceActivity === 0 ? 'Active today' : `${daysSinceActivity}d since activity`}
          </span>
          {daysUntilDue !== null && (
            <span style={{
              color: daysUntilDue <= 7 ? color.status.error : daysUntilDue <= 14 ? color.status.warning : color.text.dim,
            }}>
              {daysUntilDue > 0 ? `${daysUntilDue}d until due` : daysUntilDue === 0 ? 'Due today!' : `${Math.abs(daysUntilDue)}d overdue`}
            </span>
          )}
        </div>

        {/* Expandable notes */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: color.text.dim,
            fontSize: typography.fontSize.metadata,
            cursor: 'pointer',
            padding: '4px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: `transform ${animation.duration.normal}`,
            display: 'inline-block',
          }}>
            ▸
          </span>
          Notes
        </button>

        {expanded && (
          <div style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: color.bg.overlay,
            borderRadius: radius.md,
            fontSize: typography.fontSize.caption,
            color: color.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
          }}>
            {editing ? (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    background: color.bg.surface,
                    border: `1px solid ${color.glass.borderFocus}`,
                    borderRadius: radius.sm,
                    color: color.text.primary,
                    fontSize: typography.fontSize.caption,
                    padding: '8px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button
                    onClick={saveNotes}
                    style={{
                      fontSize: typography.fontSize.metadata,
                      background: color.ember.DEFAULT,
                      color: color.text.inverse,
                      border: 'none',
                      borderRadius: radius.sm,
                      padding: '3px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setNotes(client.notes); }}
                    style={{
                      fontSize: typography.fontSize.metadata,
                      background: 'none',
                      color: color.text.dim,
                      border: `1px solid ${color.glass.border}`,
                      borderRadius: radius.sm,
                      padding: '3px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditing(true)}
                style={{ cursor: 'pointer' }}
                title="Click to edit"
              >
                {client.notes || 'No notes — click to add'}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
