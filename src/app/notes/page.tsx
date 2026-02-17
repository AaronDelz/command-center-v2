'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeading, GlassPill, EmberButton } from '@/components/ui';
import { NotesSections } from '@/components/notes/NotesSections';
import { PromoteToKanban } from '@/components/notes/PromoteToKanban';
import { color, typography } from '@/styles/tokens';
import type { Drop, Note, DropType, JournalTag } from '@/lib/types';
import type { UnifiedItem } from '@/components/notes/DropCard';

type FilterType = 'all' | 'note' | 'idea' | 'link' | 'task' | 'file' | 'question';
type JournalFilterType = 'all' | JournalTag;

function unifyItems(drops: Drop[], notes: Note[]): UnifiedItem[] {
  const items: UnifiedItem[] = [];

  for (const drop of drops) {
    items.push({
      id: drop.id,
      shortId: drop.shortId,
      type: drop.type === 'unsorted' ? 'unsorted' : drop.type,
      content: drop.content,
      url: drop.url,
      files: drop.files,
      status: drop.status,
      createdAt: drop.createdAt,
      source: 'drop',
      promotedTo: drop.promotedTo,
      journalTag: drop.journalTag,
      archived: drop.archived,
      archivedAt: drop.archivedAt,
      replies: drop.replies,
    });
  }

  for (const note of notes) {
    let type: UnifiedItem['type'] = 'note';
    if (note.text.includes('?') && note.text.split('?').length > 3) type = 'question';

    items.push({
      id: note.id,
      type,
      content: note.text,
      status: note.done ? 'archived' : 'new',
      createdAt: note.createdAt || new Date().toISOString(),
      tags: note.tags,
      source: 'note',
      done: note.done,
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

export default function NotesPage(): React.ReactElement {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [journalFilter, setJournalFilter] = useState<JournalFilterType>('all');
  const [promoteItem, setPromoteItem] = useState<UnifiedItem | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dropsRes, notesRes] = await Promise.all([
        fetch('/api/drops?backfill=shortIds'),
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

  // Archive filtering
  const activeItems = allItems.filter(i => !i.archived);
  const archivedItems = allItems.filter(i => i.archived);
  const displayItems = showArchive ? archivedItems : activeItems;

  // Type/journal filtering
  let filteredItems = filter === 'all' ? displayItems : displayItems.filter((item) => item.type === filter);
  if (journalFilter !== 'all') {
    filteredItems = filteredItems.filter((item) => item.journalTag === journalFilter);
  }

  const typeCounts = activeItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalNew = activeItems.filter((i) => i.status === 'new').length;

  async function handlePromote(item: UnifiedItem, title: string, column: string, priority: string) {
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

    const targetCol = kanbanData.columns.find((c: { id: string }) => c.id === column);
    if (targetCol) targetCol.cards.unshift(newCard);

    await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kanbanData),
    });

    if (item.source === 'drop') {
      await fetch('/api/drops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: 'promoted', promotedTo: newCard.id }),
      });
    }

    await fetchData();
  }

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

  function handleUpdate() {
    fetchData();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleMerge() {
    if (selectedIds.size < 2 || isMerging) return;
    setIsMerging(true);
    try {
      const res = await fetch('/api/drops/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error('Merge failed');
      setSelectedIds(new Set());
      setSelectionMode(false);
      await fetchData();
    } catch (err) {
      console.error('Merge error:', err);
    } finally {
      setIsMerging(false);
    }
  }

  const JOURNAL_FILTER_OPTIONS: { key: JournalFilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All Tags', icon: '' },
    { key: 'discussed', label: 'Discussed', icon: '📋' },
    { key: 'decisions', label: 'Decisions', icon: '⚡' },
    { key: 'built', label: 'Built', icon: '🔨' },
    { key: 'insight', label: 'Insight', icon: '💡' },
    { key: 'open', label: 'Open', icon: '❓' },
  ];

  const FILTER_OPTIONS: { key: FilterType; label: string; icon: string; variant: 'default' | 'ember' }[] = [
    { key: 'all', label: 'All', icon: '', variant: 'default' },
    { key: 'note', label: 'Notes', icon: '📝', variant: 'default' },
    { key: 'idea', label: 'Ideas', icon: '💡', variant: 'ember' },
    { key: 'link', label: 'Links', icon: '🔗', variant: 'default' },
    { key: 'task', label: 'Tasks', icon: '✅', variant: 'default' },
    { key: 'file', label: 'Files', icon: '📎', variant: 'default' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SectionHeading
            title={showArchive ? 'Archive' : 'Brain Inbox'}
            icon={<span>{showArchive ? '📦' : '🧠'}</span>}
            badge={`${(showArchive ? archivedItems : activeItems).length} items${!showArchive && totalNew > 0 ? ` • ${totalNew} new` : ''}`}
          />
        </div>
        <EmberButton
          variant={showArchive ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowArchive(!showArchive)}
        >
          {showArchive ? '🧠 Back to Inbox' : `📦 Archive${archivedItems.length > 0 ? ` (${archivedItems.length})` : ''}`}
        </EmberButton>
        <EmberButton
          variant={selectionMode ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedIds(new Set()); }}
        >
          {selectionMode ? '✕ Cancel' : '☑️ Select'}
        </EmberButton>
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: typography.fontSize.caption, color: color.text.secondary, margin: '-8px 0 16px 0' }}>
        {showArchive ? 'Archived items. Unarchive to bring them back.' : 'Everything lands here. Process, promote, or park it.'}
      </p>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTER_OPTIONS.map(({ key, label, icon, variant }) => (
          <GlassPill key={key} variant={variant} size="sm" active={filter === key} onClick={() => setFilter(key)}>
            {icon && <span className="mr-1">{icon}</span>}
            {label}
            {key !== 'all' && typeCounts[key] ? <span className="ml-1 opacity-60">{typeCounts[key]}</span> : null}
          </GlassPill>
        ))}
      </div>

      {/* Journal Tag Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span style={{ fontSize: typography.fontSize.caption, color: color.text.dim, marginRight: '4px' }}>Journal:</span>
        {JOURNAL_FILTER_OPTIONS.map(({ key, label, icon }) => (
          <GlassPill key={key} variant="default" size="xs" active={journalFilter === key} onClick={() => setJournalFilter(key)}>
            {icon && <span className="mr-1">{icon}</span>}
            {label}
          </GlassPill>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">{error}</div>
      ) : (
        <NotesSections
          items={filteredItems}
          onPromote={(item) => setPromoteItem(item)}
          onArchive={handleArchive}
          onUpdate={handleUpdate}
          showArchiveView={showArchive}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}

      {/* Floating Merge Bar */}
      {selectionMode && selectedIds.size >= 2 && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px',
          background: 'rgba(13, 13, 20, 0.95)', backdropFilter: 'blur(20px)',
          border: `1.5px solid ${color.glass.borderHover}`, borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 107, 53, 0.15)',
        }}>
          <span style={{ fontSize: typography.fontSize.caption, color: color.text.secondary }}>{selectedIds.size} selected</span>
          <EmberButton size="sm" onClick={handleMerge} disabled={isMerging}>
            {isMerging ? '⏳ Merging...' : `🔗 Merge Selected (${selectedIds.size})`}
          </EmberButton>
        </div>
      )}

      <PromoteToKanban item={promoteItem} isOpen={!!promoteItem} onClose={() => setPromoteItem(null)} onPromote={handlePromote} />
    </div>
  );
}
