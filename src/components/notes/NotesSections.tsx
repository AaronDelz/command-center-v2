'use client';

import { useMemo } from 'react';
import { SectionHeading, GlassCard } from '@/components/ui';
import { color, typography } from '@/styles/tokens';
import { DropCard } from './DropCard';
import type { UnifiedItem } from './DropCard';

interface NotesSectionsProps {
  items: UnifiedItem[];
  onPromote: (item: UnifiedItem) => void;
  onArchive: (item: UnifiedItem) => void;
}

export function NotesSections({ items, onPromote, onArchive }: NotesSectionsProps): React.ReactElement {
  const { quickDrops, parkedConversations, openQuestions } = useMemo(() => {
    const quickDrops: UnifiedItem[] = [];
    const parkedConversations: UnifiedItem[] = [];
    const openQuestions: UnifiedItem[] = [];

    for (const item of items) {
      // Open Questions: question type or has discuss tag with question marks
      if (item.type === 'question' || (item.tags?.includes('discuss') && item.content.includes('?'))) {
        openQuestions.push(item);
      }
      // Parked Conversations: has discuss tag
      else if (item.tags?.includes('discuss')) {
        parkedConversations.push(item);
      }
      // Everything else goes to Quick Drops
      else {
        quickDrops.push(item);
      }
    }

    return { quickDrops, parkedConversations, openQuestions };
  }, [items]);

  const EmptyState = ({ message }: { message: string }) => (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        color: color.text.dim,
        fontSize: typography.fontSize.caption,
      }}
    >
      {message}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {/* Quick Drops */}
      <section className="min-h-[200px]">
        <SectionHeading
          title="Quick Drops"
          icon={<span>⚡</span>}
          badge={quickDrops.length}
        />
        {quickDrops.length === 0 ? (
          <EmptyState message="No drops yet. Drop something in!" />
        ) : (
          <div className="flex flex-col gap-3">
            {quickDrops.map((item) => (
              <DropCard
                key={item.id}
                item={item}
                onPromote={onPromote}
                onArchive={onArchive}
              />
            ))}
          </div>
        )}
      </section>

      {/* Parked Conversations */}
      <section className="min-h-[200px]">
        <SectionHeading
          title="Parked Conversations"
          icon={<span>🗣️</span>}
          badge={parkedConversations.length}
        />
        {parkedConversations.length === 0 ? (
          <EmptyState message="No parked conversations yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {parkedConversations.map((item) => (
              <DropCard
                key={item.id}
                item={item}
                onPromote={onPromote}
                onArchive={onArchive}
              />
            ))}
          </div>
        )}
      </section>

      {/* Open Questions */}
      <section className="min-h-[200px]">
        <SectionHeading
          title="Open Questions"
          icon={<span>❓</span>}
          badge={openQuestions.length}
        />
        {openQuestions.length === 0 ? (
          <EmptyState message="No open questions." />
        ) : (
          <div className="flex flex-col gap-3">
            {openQuestions.map((item) => (
              <DropCard
                key={item.id}
                item={item}
                onPromote={onPromote}
                onArchive={onArchive}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
