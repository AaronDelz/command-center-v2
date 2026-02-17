'use client';

import { useMemo } from 'react';
import { SectionHeading } from '@/components/ui';
import { color, typography } from '@/styles/tokens';
import { DropCard } from './DropCard';
import type { UnifiedItem } from './DropCard';

interface NotesSectionsProps {
  items: UnifiedItem[];
  onPromote: (item: UnifiedItem) => void;
  onArchive: (item: UnifiedItem) => void;
  onUpdate?: (item: UnifiedItem) => void;
  showArchiveView?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function NotesSections({ items, onPromote, onArchive, onUpdate, showArchiveView, selectionMode, selectedIds, onToggleSelect }: NotesSectionsProps): React.ReactElement {
  const { quickDrops, parkedConversations, openQuestions } = useMemo(() => {
    const quickDrops: UnifiedItem[] = [];
    const parkedConversations: UnifiedItem[] = [];
    const openQuestions: UnifiedItem[] = [];

    for (const item of items) {
      if (item.type === 'question' || (item.tags?.includes('discuss') && item.content.includes('?'))) {
        openQuestions.push(item);
      } else if (item.tags?.includes('discuss')) {
        parkedConversations.push(item);
      } else {
        quickDrops.push(item);
      }
    }

    return { quickDrops, parkedConversations, openQuestions };
  }, [items]);

  const EmptyState = ({ message }: { message: string }) => (
    <div style={{ padding: '24px', textAlign: 'center', color: color.text.dim, fontSize: typography.fontSize.caption }}>
      {message}
    </div>
  );

  const renderCards = (cardItems: UnifiedItem[]) => (
    <div className="flex flex-col gap-3">
      {cardItems.map((item) => (
        <DropCard
          key={item.id}
          item={item}
          onPromote={onPromote}
          onArchive={onArchive}
          onUpdate={onUpdate}
          showArchiveView={showArchiveView}
          selectionMode={selectionMode}
          selected={selectedIds?.has(item.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <section className="min-h-[200px]">
        <SectionHeading title="Quick Drops" icon={<span>⚡</span>} badge={quickDrops.length} />
        {quickDrops.length === 0 ? <EmptyState message="No drops yet. Drop something in!" /> : renderCards(quickDrops)}
      </section>

      <section className="min-h-[200px]">
        <SectionHeading title="Parked Conversations" icon={<span>🗣️</span>} badge={parkedConversations.length} />
        {parkedConversations.length === 0 ? <EmptyState message="No parked conversations yet." /> : renderCards(parkedConversations)}
      </section>

      <section className="min-h-[200px]">
        <SectionHeading title="Open Questions" icon={<span>❓</span>} badge={openQuestions.length} />
        {openQuestions.length === 0 ? <EmptyState message="No open questions." /> : renderCards(openQuestions)}
      </section>
    </div>
  );
}
