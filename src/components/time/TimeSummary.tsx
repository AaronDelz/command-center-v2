'use client';

import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { TimeEntry, ClientTimeStats, TimeTrackingSummary } from '@/lib/types';

interface TimeSummaryProps {
  entries: TimeEntry[];
}

export function TimeSummary({ entries }: TimeSummaryProps): React.ReactElement {
  const stats = useMemo(() => {
    // Filter out running entries for calculations
    const completedEntries = entries.filter(e => !e.isRunning && e.duration);
    
    // Overall stats
    const overall: TimeTrackingSummary = {
      totalMinutes: completedEntries.reduce((sum, e) => sum + (e.duration || 0), 0),
      billableMinutes: completedEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0),
      totalValue: completedEntries
        .filter(e => e.billable && e.rate)
        .reduce((sum, e) => sum + ((e.duration || 0) / 60) * (e.rate || 0), 0),
      entriesCount: completedEntries.length,
    };

    // This week stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    
    const thisWeekEntries = completedEntries.filter(e => 
      new Date(e.startTime) >= weekStart
    );
    
    const thisWeek: TimeTrackingSummary = {
      totalMinutes: thisWeekEntries.reduce((sum, e) => sum + (e.duration || 0), 0),
      billableMinutes: thisWeekEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0),
      totalValue: thisWeekEntries
        .filter(e => e.billable && e.rate)
        .reduce((sum, e) => sum + ((e.duration || 0) / 60) * (e.rate || 0), 0),
      entriesCount: thisWeekEntries.length,
    };

    // Today stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEntries = completedEntries.filter(e => 
      new Date(e.startTime).toDateString() === new Date().toDateString()
    );
    
    const todayStats: TimeTrackingSummary = {
      totalMinutes: todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0),
      billableMinutes: todayEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0),
      totalValue: todayEntries
        .filter(e => e.billable && e.rate)
        .reduce((sum, e) => sum + ((e.duration || 0) / 60) * (e.rate || 0), 0),
      entriesCount: todayEntries.length,
    };

    // Client stats
    const clientStatsMap = new Map<string, ClientTimeStats>();
    
    completedEntries.forEach(entry => {
      const existing = clientStatsMap.get(entry.clientId) || {
        clientId: entry.clientId,
        clientName: entry.clientName,
        totalMinutes: 0,
        billableMinutes: 0,
        totalValue: 0,
        entriesCount: 0,
      };
      
      existing.totalMinutes += entry.duration || 0;
      if (entry.billable) {
        existing.billableMinutes += entry.duration || 0;
      }
      if (entry.billable && entry.rate) {
        existing.totalValue += ((entry.duration || 0) / 60) * entry.rate;
      }
      existing.entriesCount += 1;
      
      // Track latest entry
      if (!existing.lastEntry || entry.startTime > existing.lastEntry) {
        existing.lastEntry = entry.startTime;
      }
      
      clientStatsMap.set(entry.clientId, existing);
    });
    
    const clientStats = Array.from(clientStatsMap.values())
      .sort((a, b) => b.totalValue - a.totalValue);

    // Weekly hours (last 7 days, per day)
    const weeklyHours: { day: string; total: number; billable: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayEntries = completedEntries.filter(e => {
        const ed = new Date(e.startTime);
        return ed.toDateString() === d.toDateString();
      });
      weeklyHours.push({
        day: dayStr,
        total: dayEntries.reduce((s, e) => s + (e.duration || 0), 0) / 60,
        billable: dayEntries.filter(e => e.billable).reduce((s, e) => s + (e.duration || 0), 0) / 60,
      });
    }

    return { overall, thisWeek, todayStats, clientStats, weeklyHours };
  }, [entries]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatMoney = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Time Period Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {/* Today */}
        <GlassCard padding="sm">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              Today
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
              marginBottom: '4px',
            }}>
              {formatTime(stats.todayStats.totalMinutes)}
            </div>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              marginBottom: '8px',
            }}>
              {formatTime(stats.todayStats.billableMinutes)} billable
            </div>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              color: color.status.healthy,
            }}>
              {formatMoney(stats.todayStats.totalValue)}
            </div>
          </div>
        </GlassCard>

        {/* This Week */}
        <GlassCard padding="sm">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              This Week
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
              marginBottom: '4px',
            }}>
              {formatTime(stats.thisWeek.totalMinutes)}
            </div>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              marginBottom: '8px',
            }}>
              {formatTime(stats.thisWeek.billableMinutes)} billable
            </div>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              color: color.status.healthy,
            }}>
              {formatMoney(stats.thisWeek.totalValue)}
            </div>
          </div>
        </GlassCard>

        {/* All Time */}
        <GlassCard padding="sm">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              All Time
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: typography.fontWeight.bold,
              color: color.ember.flame,
              marginBottom: '4px',
            }}>
              {formatTime(stats.overall.totalMinutes)}
            </div>
            <div style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              marginBottom: '8px',
            }}>
              {stats.overall.entriesCount} entries
            </div>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              color: color.status.healthy,
            }}>
              {formatMoney(stats.overall.totalValue)}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Weekly Hours Bar Chart */}
      <GlassCard>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{
            margin: '0 0 4px 0',
            color: color.text.primary,
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
          }}>
            This Week
          </h3>
          <div style={{ fontSize: typography.fontSize.caption, color: color.text.dim }}>
            Hours per day (last 7 days)
          </div>
        </div>
        {(() => {
          const maxHours = Math.max(...stats.weeklyHours.map(d => d.total), 1);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stats.weeklyHours.map((day) => (
                <div key={day.day} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', fontSize: typography.fontSize.caption,
                    color: color.text.secondary, fontWeight: typography.fontWeight.medium,
                    textAlign: 'right', flexShrink: 0,
                  }}>
                    {day.day}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: radius.sm }}>
                    {/* Total bar */}
                    {day.total > 0 && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0,
                        width: `${(day.total / maxHours) * 100}%`,
                        background: color.ember.DEFAULT,
                        borderRadius: radius.sm,
                        opacity: 0.3,
                        transition: `width ${animation.duration.normal}`,
                      }} />
                    )}
                    {/* Billable bar (overlaid) */}
                    {day.billable > 0 && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0,
                        width: `${(day.billable / maxHours) * 100}%`,
                        background: `linear-gradient(90deg, ${color.ember.DEFAULT}, ${color.ember.flame})`,
                        borderRadius: radius.sm,
                        transition: `width ${animation.duration.normal}`,
                      }} />
                    )}
                  </div>
                  <div style={{
                    width: '42px', fontSize: typography.fontSize.caption,
                    color: day.total > 0 ? color.text.primary : color.text.dim,
                    fontWeight: typography.fontWeight.medium, textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                  }}>
                    {day.total > 0 ? `${day.total.toFixed(1)}h` : '—'}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: typography.fontSize.metadata, color: color.text.dim }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: `linear-gradient(90deg, ${color.ember.DEFAULT}, ${color.ember.flame})` }} />
            Billable
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color.ember.DEFAULT, opacity: 0.3 }} />
            Non-billable
          </div>
        </div>
      </GlassCard>

      {/* Client Breakdown */}
      <GlassCard>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{
            margin: '0 0 8px 0',
            color: color.text.primary,
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
          }}>
            Client Breakdown
          </h3>
        </div>
        
        {stats.clientStats.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: color.text.dim,
            padding: '20px',
          }}>
            No client data yet
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto auto',
              gap: '12px',
              alignItems: 'center',
              padding: '8px 12px',
              fontSize: typography.fontSize.caption,
              color: color.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: `1px solid ${color.glass.border}`,
              marginBottom: '8px',
            }}>
              <div>Client</div>
              <div style={{ textAlign: 'center' }}>Hours</div>
              <div style={{ textAlign: 'center' }}>Billable</div>
              <div style={{ textAlign: 'right' }}>Revenue</div>
              <div style={{ textAlign: 'right' }}>Last Work</div>
            </div>
            
            {/* Client Rows */}
            {stats.clientStats.map(client => (
              <div
                key={client.clientId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  borderRadius: radius.sm,
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div>
                  <div style={{ 
                    fontWeight: typography.fontWeight.semibold, 
                    color: color.text.primary,
                  }}>
                    {client.clientName}
                  </div>
                  <div style={{ 
                    fontSize: typography.fontSize.caption,
                    color: color.text.dim,
                  }}>
                    {client.entriesCount} entries
                  </div>
                </div>

                <div style={{ 
                  textAlign: 'center', 
                  fontWeight: typography.fontWeight.medium,
                  color: color.text.primary,
                }}>
                  {formatTime(client.totalMinutes)}
                </div>

                <div style={{ 
                  textAlign: 'center',
                  color: client.billableMinutes > 0 ? color.status.healthy : color.text.dim,
                }}>
                  {formatTime(client.billableMinutes)}
                </div>

                <div style={{ 
                  textAlign: 'right', 
                  fontWeight: typography.fontWeight.semibold,
                  color: client.totalValue > 0 ? color.ember.flame : color.text.dim,
                }}>
                  {formatMoney(client.totalValue)}
                </div>

                <div style={{ 
                  textAlign: 'right',
                  fontSize: typography.fontSize.caption,
                  color: color.text.secondary,
                }}>
                  {client.lastEntry ? formatDate(client.lastEntry) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}