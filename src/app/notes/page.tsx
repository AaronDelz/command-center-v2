'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeading, GlassPill, EmberButton } from '@/components/ui';
import { NotesSections } from '@/components/notes/NotesSections';
import { PromoteToKanban } from '@/components/notes/PromoteToKanban';
import { color, typography } from '@/styles/tokens';
import type { Drop, Note, DropType } from '@/lib/types';
import type { UnifiedItem } from '@/components/notes/DropCard';

type FilterType = 'all' | 'note' | 'idea' | 'link' | 'task' | 'file' | 'question';

// Convert drops + notes into unified items
function unifyItems(drops: Drop[], notes: Note[]): UnifiedItem[] {
  const items: UnifiedItem[] = [];

  for (const drop of drops) {
    items.push({
      id: drop.id,
      type: drop.type === 'unsorted' ? 'unsorted' : drop.type,
      content: drop.content,
      url: drop.url,
      files: drop.files,
      status: drop.status,
      createdAt: drop.createdAt,
      source: 'drop',
      promotedTo: drop.promotedTo,
    });
  }

  for (const note of notes) {
    // Determine type from content/tags
    let type: UnifiedItem['type'] = 'note';
    if (note.tags?.includes('discuss')) type = 'note';
    if (note.text.includes('?') && note.text.split('?').length > 3) type = 'question';

    items.push({
      id: note.id,
      type,
      content: note.text,
      status: note.done ? 'archived' : 'new',
      createdAt: note.createdAt || (note as Record<string, unknown>).created as string || new Date().toISOString(),
      tags: note.tags,
      source: 'note',
      done: note.done,
    });
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return items;
}

export default function NotesPage(): React.ReactElement {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [promoteItem, setPromoteItem] = useState<UnifiedItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dropsRes, notesRes] = await Promise.all([
        fetch('/api/drops'),
        fetch('/api/notes'),
      ]);

      if (!dropsRes.ok || !notesRes.ok) throw new Error('Failed to fetch data');

      const dropsData = await dropsRes.json();
      const notesData = await notesRes.json();

      setDrops(dropsData.drops || []);
      setNotes(notesData.notes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allItems = unifyItems(drops, notes);

  // Filter items
  const filteredItems = filter === 'all'
    ? allItems
    : allItems.filter((item) => item.type === filter);

  // Count by type
  const typeCounts = allItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalNew = allItems.filter((i) => i.status === 'new').length;

  // Promote to kanban handler
  async function handlePromote(item: UnifiedItem, title: string, column: string, priority: string) {
    // Create kanban card
    const cardRes = await fetch('/api/kanban', { method: 'GET' });
    if (!cardRes.ok) throw new Error('Failed to fetch kanban');
    const kanbanData = await cardRes.json();

    const newCard = {
      id: `card-${Date.now()}`,
      title,
      description: item.content,
      owner: 'aaron',
      priority: priority as 'high' | 'medium' | 'low',
      tags: [item.type],
      notes: `Promoted from ${item.source}: ${item.id}`,
      created: new Date().toISOString(),
    };

    // Find target column
    const targetCol = kanbanData.columns.find(
      (c: { id: string }) => c.id === column
    );
    if (targetCol) {
      targetCol.cards.unshift(newCard);
    }

    // Save kanban
    await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kanbanData),
    });

    // Mark drop as promoted
    if (item.source === 'drop') {
      await fetch('/api/drops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'promoted',
          promotedTo: newCard.id,
        }),
      });
    }

    await fetchData();
  }

  // Archive handler
  async function handleArchive(item: UnifiedItem) {
    if (item.source === 'drop') {
      await fetch('/api/drops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: 'archived' }),
      });
    } else {
      await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, done: true }),
      });
    }
    await fetchData();
  }

  const FILTER_OPTIONS: { key: FilterType; label: string; icon: string; variant: 'default' | 'ember' }[] = [
    { key: 'all', label: 'All', icon: '', variant: 'default' },
    { key: 'note', label: 'Notes', icon: '📝', variant: 'default' },
    { key: 'idea', label: 'Ideas', icon: '💡', variant: 'ember' },
    { key: 'link', label: 'Links', icon: '🔗', variant: 'default' },
    { key: 'task', label: 'Tasks', icon: '✅', variant: 'default' },
    { key: 'file', label: 'Files', icon: '📎', variant: 'default' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Header */}
      <SectionHeading
        title="Brain Inbox"
        icon={<span>🧠</span>}
        badge={`${allItems.length} items${totalNew > 0 ? ` • ${totalNew} new` : ''}`}
      />

      {/* Subtitle */}
      <p
        style={{
          fontSize: typography.fontSize.caption,
          color: color.text.secondary,
          margin: '-8px 0 16px 0',
        }}
      >
        Everything lands here. Process, promote, or park it.
      </p>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTER_OPTIONS.map(({ key, label, icon, variant }) => (
          <GlassPill
            key={key}
            variant={variant}
            size="sm"
            active={filter === key}
            onClick={() => setFilter(key)}
          >
            {icon && <span className="mr-1">{icon}</span>}
            {label}
            {key !== 'all' && typeCounts[key] ? (
              <span className="ml-1 opacity-60">{typeCounts[key]}</span>
            ) : null}
          </GlassPill>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      ) : (
        <NotesSections
          items={filteredItems}
          onPromote={(item) => setPromoteItem(item)}
          onArchive={handleArchive}
        />
      )}

      {/* Promote Modal */}
      <PromoteToKanban
        item={promoteItem}
        isOpen={!!promoteItem}
        onClose={() => setPromoteItem(null)}
        onPromote={handlePromote}
      />
    </div>
  );
}
