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
    <div className="flex flex-col gap-8">
      {/* Quick Drops — newest first */}
      <section>
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
      {parkedConversations.length > 0 && (
        <section>
          <SectionHeading
            title="Parked Conversations"
            icon={<span>🗣️</span>}
            badge={parkedConversations.length}
          />
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
        </section>
      )}

      {/* Open Questions */}
      {openQuestions.length > 0 && (
        <section>
          <SectionHeading
            title="Open Questions"
            icon={<span>❓</span>}
            badge={openQuestions.length}
          />
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
        </section>
      )}
    </div>
  );
}
