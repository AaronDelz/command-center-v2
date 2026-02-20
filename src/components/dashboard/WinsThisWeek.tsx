'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { color, typography } from '@/styles/tokens';

interface KanbanCard {
  id: string;
  title: string;
  owner?: string;
  completed?: string;
  completedAt?: string;
  tags?: string[];
  client?: string;
}

interface WinItem {
  id: string;
  title: string;
  owner: string;
  completedDate: string;
  tags: string[];
  client?: string;
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day;
  const start = new Date(now);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getRelativeDay(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function getOwnerEmoji(owner: string): string {
  if (owner === 'orion') return '🤖';
  if (owner === 'aaron') return '👤';
  return '👥';
}

export function WinsThisWeek(): React.ReactElement {
  const [wins, setWins] = useState<WinItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchWins = async (): Promise<void> => {
      try {
        const res = await fetch('/api/kanban');
        if (!res.ok) return;
        const data = await res.json();
        const doneCol = data.columns?.find((c: { id: string }) => c.id === 'done');
        if (!doneCol) return;

        const weekStart = getWeekStart();
        const thisWeek: WinItem[] = [];

        for (const card of doneCol.cards as KanbanCard[]) {
          const dateStr = card.completed || card.completedAt;
          if (!dateStr) continue;
          const completedDate = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
          if (completedDate >= weekStart) {
            thisWeek.push({
              id: card.id,
              title: card.title.replace(/^(✅\s*|🔧\s*)/, ''),
              owner: card.owner || 'unknown',
              completedDate: dateStr,
              tags: card.tags || [],
              client: card.client,
            });
          }
        }

        // Sort by completion date descending (most recent first)
        thisWeek.sort((a, b) => b.completedDate.localeCompare(a.completedDate));
        setWins(thisWeek);
      } catch { /* silent */ }
    };
    fetchWins();
  }, []);

  const displayWins = expanded ? wins : wins.slice(0, 5);
  const hasMore = wins.length > 5;

  return (
    <GlassCard style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🏆</span>
          <h3 style={{
            fontFamily: typography.fontFamily.heading,
            fontSize: typography.fontSize.cardTitle,
            fontWeight: typography.fontWeight.semibold,
            margin: 0,
            color: color.text.primary,
          }}>
            Wins This Week
          </h3>
          {wins.length > 0 && (
            <span style={{
              fontSize: '0.75rem',
              color: color.ember.flame,
              background: 'rgba(245, 158, 11, 0.12)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 600,
            }}>
              {wins.length}
            </span>
          )}
        </div>
      </div>

      {wins.length === 0 ? (
        <p style={{
          fontSize: typography.fontSize.caption,
          color: color.text.secondary,
          textAlign: 'center',
          padding: '20px 0',
          margin: 0,
        }}>
          No completed cards this week yet. Keep grinding! 🔥
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayWins.map((win) => (
            <div
              key={win.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.04)',
                border: '1px solid rgba(245, 158, 11, 0.08)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(245, 158, 11, 0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(245, 158, 11, 0.04)';
              }}
            >
              <span style={{ fontSize: '0.85rem', marginTop: '1px', flexShrink: 0 }}>
                {getOwnerEmoji(win.owner)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem',
                  color: color.text.primary,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {win.title}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '3px',
                }}>
                  <span style={{
                    fontSize: '0.7rem',
                    color: color.text.dim,
                  }}>
                    {getRelativeDay(win.completedDate)}
                  </span>
                  {win.client && (
                    <span style={{
                      fontSize: '0.65rem',
                      color: color.ember.flame,
                      background: 'rgba(255, 179, 71, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '6px',
                    }}>
                      {win.client}
                    </span>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: '0.9rem',
                flexShrink: 0,
                opacity: 0.6,
              }}>✅</span>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none',
                border: 'none',
                color: color.ember.flame,
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {expanded ? 'Show less ▲' : `+${wins.length - 5} more ▼`}
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}
