'use client';

import { useState, useEffect } from 'react';
import { GlassCard, SectionHeading, GlassPill } from '@/components/ui';
import { color, typography, radius, animation } from '@/styles/tokens';
import type { KanbanColumn, KanbanCard } from '@/lib/types';

const COLUMN_CONFIG: Record<string, { icon: string; color: string }> = {
  'todo': { icon: '📋', color: color.kanban.todo },
  'doing': { icon: '🔥', color: color.kanban.doing },
  'done': { icon: '✅', color: color.kanban.done },
};

function MiniCard({ card }: { card: KanbanCard }): React.ReactElement {
  return (
    <div
      style={{
        fontSize: typography.fontSize.caption,
        color: color.text.primary,
        padding: '6px 10px',
        background: color.bg.surface,
        border: `1px solid ${color.glass.border}`,
        borderRadius: radius.sm,
        lineHeight: typography.lineHeight.tight,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {card.title}
    </div>
  );
}

export function MiniKanban(): React.ReactElement {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  useEffect(() => {
    fetch('/api/kanban')
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then((data) => {
        if (data?.columns) {
          setColumns(data.columns);
        }
      });
  }, []);

  // Show todo, doing, done (or first 3 columns)
  const displayCols = ['todo', 'doing', 'done']
    .map((id) => columns.find((c) => c.id === id))
    .filter(Boolean) as KanbanColumn[];

  // Fallback: just use first 3 columns
  const cols = displayCols.length >= 2 ? displayCols : columns.slice(0, 3);

  return (
    <GlassCard padding="md">
      <SectionHeading
        title="Kanban"
        icon={<span>📌</span>}
        size="sm"
        action={
          <a
            href="/kanban"
            style={{
              fontSize: typography.fontSize.caption,
              color: color.ember.DEFAULT,
              textDecoration: 'none',
              transition: `color ${animation.duration.fast} ${animation.easing.default}`,
            }}
          >
            Full board →
          </a>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {cols.map((col) => {
          const config = COLUMN_CONFIG[col.id] || { icon: '📋', color: color.text.secondary };
          const preview = col.cards.slice(0, 3);
          const remaining = col.cards.length - preview.length;

          return (
            <div key={col.id}>
              {/* Column header */}
              <div className="flex items-center gap-1.5 mb-2">
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: config.color,
                    boxShadow: `0 0 6px ${config.color}40`,
                  }}
                />
                <span
                  style={{
                    fontSize: typography.fontSize.metadata,
                    fontWeight: typography.fontWeight.semibold,
                    color: color.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: typography.letterSpacing.wider,
                  }}
                >
                  {col.title}
                </span>
                <span
                  style={{
                    fontSize: typography.fontSize.metadata,
                    color: color.text.dim,
                    marginLeft: 'auto',
                  }}
                >
                  {col.cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-1.5">
                {preview.map((card) => (
                  <MiniCard key={card.id} card={card} />
                ))}
                {remaining > 0 && (
                  <span
                    style={{
                      fontSize: typography.fontSize.metadata,
                      color: color.text.dim,
                      textAlign: 'center',
                      padding: '2px 0',
                    }}
                  >
                    +{remaining} more
                  </span>
                )}
                {preview.length === 0 && (
                  <span
                    style={{
                      fontSize: typography.fontSize.metadata,
                      color: color.text.dim,
                      fontStyle: 'italic',
                      padding: '4px 0',
                    }}
                  >
                    Empty
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
