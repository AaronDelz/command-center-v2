'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotesList } from '@/components/notes/NotesList';
import { NoteModal } from '@/components/notes/NoteModal';
import { SectionHeading, GlassPill, EmberButton } from '@/components/ui';
import type { Note } from '@/lib/types';

export default function NotesPage(): React.ReactElement {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'discuss' | 'done' | 'active'>('all');

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json() as { notes: Note[] };
      setNotes(data.notes);
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleAddNote(text: string, tags?: string[]): Promise<void> {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...(tags ? { tags } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to create note');
    const newNote = await res.json() as Note;
    setNotes((prev) => [newNote, ...prev]);
  }

  async function handleToggleDone(id: string, done: boolean): Promise<void> {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done }),
    });
    if (!res.ok) throw new Error('Failed to update note');
    setNotes((prev) => prev.map((note) => note.id === id ? { ...note, done } : note));
  }

  async function handleAddReply(noteId: string, text: string): Promise<void> {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId, action: 'addReply', reply: { from: 'aaron', text } }),
    });
    if (!res.ok) throw new Error('Failed to add reply');
    await fetchNotes();
  }

  async function handleEditNote(noteId: string, text: string): Promise<void> {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId, action: 'editNote', text }),
    });
    if (!res.ok) throw new Error('Failed to edit note');
    await fetchNotes();
  }

  async function handleDeleteNote(noteId: string): Promise<void> {
    if (!confirm('Delete this note?')) return;
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId, action: 'deleteNote' }),
    });
    if (!res.ok) throw new Error('Failed to delete note');
    await fetchNotes();
  }

  async function handleDeleteReply(noteId: string, replyIndex: number): Promise<void> {
    if (!confirm('Delete this reply?')) return;
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId, action: 'deleteReply', replyIndex }),
    });
    if (!res.ok) throw new Error('Failed to delete reply');
    await fetchNotes();
  }

  async function handleEditReply(noteId: string, replyIndex: number, text: string): Promise<void> {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId, action: 'editReply', replyIndex, text }),
    });
    if (!res.ok) throw new Error('Failed to edit reply');
    await fetchNotes();
  }

  async function handleToggleTag(noteId: string, tag: string): Promise<void> {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId, action: 'toggleTag', tag }),
    });
    if (!res.ok) throw new Error('Failed to toggle tag');
    await fetchNotes();
  }

  const filteredNotes = notes.filter((note) => {
    switch (filter) {
      case 'discuss': return note.tags?.includes('discuss');
      case 'done': return note.done;
      case 'active': return !note.done;
      default: return true;
    }
  });

  const subtitle = `${notes.length} note${notes.length !== 1 ? 's' : ''}${notes.filter((n) => n.done).length > 0 ? ` • ${notes.filter((n) => n.done).length} done` : ''}`;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Header */}
      <SectionHeading
        title="Quick Notes"
        icon={<span>📝</span>}
        badge={subtitle}
        action={
          <EmberButton variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <span className="text-lg">+</span>
            <span className="hidden sm:inline">Add Note</span>
          </EmberButton>
        }
      />

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {([
          { key: 'all', label: 'All' },
          { key: 'discuss', label: '🗣️ Discuss' },
          { key: 'active', label: 'Active' },
          { key: 'done', label: 'Done' },
        ] as const).map(({ key, label }) => (
          <GlassPill
            key={key}
            variant={key === 'discuss' ? 'ember' : 'default'}
            size="sm"
            active={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
            {key === 'discuss' && (
              <span className="ml-1.5 text-xs opacity-70">
                {notes.filter(n => n.tags?.includes('discuss')).length}
              </span>
            )}
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
        <NotesList
          notes={filteredNotes}
          onToggleDone={handleToggleDone}
          onAddReply={handleAddReply}
          onEditNote={handleEditNote}
          onEditReply={handleEditReply}
          onDeleteNote={handleDeleteNote}
          onDeleteReply={handleDeleteReply}
          onToggleTag={handleToggleTag}
        />
      )}

      {/* Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddNote}
      />
    </div>
  );
}
