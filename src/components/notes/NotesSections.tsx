'use client';

import { useMemo, useState } from 'react';
import { SectionHeading } from '@/components/ui';
import { color, typography, radius } from '@/styles/tokens';
import { DropCard } from './DropCard';
import type { UnifiedItem } from './DropCard';

const ITEMS_PER_PAGE = 8;

interface NotesSectionsProps {
  items: UnifiedItem[];
  onPromote: (item: UnifiedItem) => void;
  onArchive: (item: UnifiedItem) => void;
  onDelete?: (item: UnifiedItem) => void;
  onUpdate?: (item: UnifiedItem) => void;
  showArchiveView?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function NotesSections({ items, onPromote, onArchive, onDelete, onUpdate, showArchiveView, selectionMode, selectedIds, onToggleSelect }: NotesSectionsProps): React.ReactElement {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div style={{ padding: '24px', textAlign: 'center', color: color.text.dim, fontSize: typography.fontSize.caption }}>
      {message}
    </div>
  );

  const renderCards = (cardItems: UnifiedItem[], sectionKey: string) => {
    const isExpanded = expandedSections.has(sectionKey);
    const visibleItems = isExpanded ? cardItems : cardItems.slice(0, ITEMS_PER_PAGE);
    const remaining = cardItems.length - ITEMS_PER_PAGE;

    return (
      <div className="flex flex-col gap-3">
        {visibleItems.map((item) => (
          <DropCard
            key={item.id}
            item={item}
            onPromote={onPromote}
            onArchive={onArchive}
            onDelete={onDelete}
            onUpdate={onUpdate}
            showArchiveView={showArchiveView}
            selectionMode={selectionMode}
            selected={selectedIds?.has(item.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
        {remaining > 0 && (
          <button
            onClick={() => toggleSection(sectionKey)}
            style={{
              padding: '10px 16px',
              background: `${color.glass.border}40`,
              border: `1px dashed ${color.glass.border}`,
              borderRadius: radius.lg,
              color: color.text.secondary,
              fontSize: typography.fontSize.caption,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${color.glass.borderHover}40`;
              e.currentTarget.style.color = color.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${color.glass.border}40`;
              e.currentTarget.style.color = color.text.secondary;
            }}
          >
            {isExpanded ? '▲ Show less' : `▼ Show ${remaining} more`}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start w-full">
      <section className="min-h-[200px]">
        <SectionHeading title="Quick Drops" icon={<span>⚡</span>} badge={quickDrops.length} />
        {quickDrops.length === 0 ? <EmptyState message="No drops yet. Drop something in!" /> : renderCards(quickDrops, 'quickDrops')}
      </section>

      <section className="min-h-[200px]">
        <SectionHeading title="Parked Conversations" icon={<span>🗣️</span>} badge={parkedConversations.length} />
        {parkedConversations.length === 0 ? <EmptyState message="No parked conversations yet." /> : renderCards(parkedConversations, 'parkedConversations')}
      </section>

      <section className="min-h-[200px]">
        <SectionHeading title="Open Questions" icon={<span>❓</span>} badge={openQuestions.length} />
        {openQuestions.length === 0 ? <EmptyState message="No open questions." /> : renderCards(openQuestions, 'openQuestions')}
      </section>
    </div>
  );
}
