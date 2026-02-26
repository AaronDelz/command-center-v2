'use client';

import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { TimeEntry, TimeEntriesData } from '@/lib/types';

interface TimeEntriesSectionProps {
  viewMonth: number;
  viewYear: number;
}

interface ClientGroup {
  clientName: string;
  clientId: string;
  entries: TimeEntry[];
  totalMinutes: number;
  totalValue: number;
}

export function TimeEntriesSection({ viewMonth, viewYear }: TimeEntriesSectionProps): React.ReactElement {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/time-entries')
      .then(res => res.json())
      .then((data: TimeEntriesData) => setEntries(data.entries || []))
      .catch(() => setEntries([]));
  }, []);

  const filteredGroups = useMemo((): ClientGroup[] => {
    const monthEntries = entries.filter(e => {
      const d = new Date(e.startTime);
      return d.getMonth() + 1 === viewMonth && d.getFullYear() === viewYear && !e.isRunning;
    });

    const byClient = new Map<string, TimeEntry[]>();
    for (const e of monthEntries) {
      const key = e.clientId || 'unknown';
      if (!byClient.has(key)) byClient.set(key, []);
      byClient.get(key)!.push(e);
    }

    return Array.from(byClient.entries())
      .map(([clientId, clientEntries]) => ({
        clientId,
        clientName: clientEntries[0]?.clientName || clientId,
        entries: clientEntries.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
        totalMinutes: clientEntries.reduce((s, e) => s + (e.duration || 0), 0),
        totalValue: clientEntries.reduce((s, e) => s + (e.billable && e.rate ? (e.duration || 0) / 60 * e.rate : 0), 0),
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [entries, viewMonth, viewYear]);

  const totalHours = filteredGroups.reduce((s, g) => s + g.totalMinutes, 0) / 60;
  const totalValue = filteredGroups.reduce((s, g) => s + g.totalValue, 0);

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const fmtDur = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <GlassCard>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <SectionHeading title="Time Entries" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: typography.fontSize.caption, color: color.text.dim }}>
            {totalHours.toFixed(1)}h · ${Math.round(totalValue).toLocaleString()}
          </span>
          <span style={{ color: color.text.secondary, fontSize: '0.75rem', transition: `transform ${animation.duration.normal}`, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
          <a href="/time" style={{ fontSize: typography.fontSize.caption, color: color.ember.flame, textDecoration: 'none' }}
            onClick={e => e.stopPropagation()}>
            Open Time Forge →
          </a>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px' }}>
          {filteredGroups.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: color.text.dim }}>
              No time entries for this month
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredGroups.map(group => (
                <div key={group.clientId}>
                  <div
                    onClick={() => toggleClient(group.clientId)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', cursor: 'pointer', borderRadius: radius.sm,
                      background: 'rgba(255,255,255,0.02)',
                      transition: `background ${animation.duration.normal}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.65rem', color: color.text.dim,
                        transform: expandedClients.has(group.clientId) ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: `transform ${animation.duration.fast}`, display: 'inline-block',
                      }}>▶</span>
                      <span style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.medium, color: color.text.primary }}>
                        {group.clientName}
                      </span>
                      <span style={{ fontSize: typography.fontSize.caption, color: color.text.dim }}>
                        ({group.entries.length} entries)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: typography.fontSize.body, color: color.text.secondary, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtDur(group.totalMinutes)}
                      </span>
                      <span style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, color: color.ember.flame, fontVariantNumeric: 'tabular-nums', minWidth: '60px', textAlign: 'right' }}>
                        ${Math.round(group.totalValue).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {expandedClients.has(group.clientId) && (
                    <div style={{ marginLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {group.entries.map(entry => (
                        <div key={entry.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 12px', fontSize: typography.fontSize.caption,
                          borderLeft: `2px solid ${color.glass.border}`,
                        }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <span style={{ color: color.text.dim, flexShrink: 0 }}>{fmtDate(entry.startTime)}</span>
                            <span style={{ color: color.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.description || '(no description)'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                            <span style={{ color: color.text.dim }}>{entry.duration ? fmtDur(entry.duration) : '—'}</span>
                            {entry.billable && entry.rate ? (
                              <span style={{ color: color.status.healthy, fontVariantNumeric: 'tabular-nums' }}>
                                ${Math.round((entry.duration || 0) / 60 * entry.rate)}
                              </span>
                            ) : (
                              <span style={{ color: color.text.dim, fontStyle: 'italic' }}>non-bill</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
