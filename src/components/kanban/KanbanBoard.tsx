'use client';

import { useState, useEffect, useCallback } from 'react';
import type { KanbanData, KanbanCard } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import { CardModal } from './CardModal';

interface ModalState {
  isOpen: boolean;
  card: KanbanCard | null;
  columnId: string;
  isNew: boolean;
}

type OwnerFilter = 'all' | 'aaron' | 'orion';

export function KanbanBoard(): React.ReactElement {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    card: null,
    columnId: '',
    isNew: false,
  });

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/kanban');
      if (!response.ok) {
        throw new Error('Failed to fetch kanban data');
      }
      const kanbanData = await response.json() as KanbanData;
      setData(kanbanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCardClick = (cardId: string, columnId: string) => {
    if (!data) return;
    const column = data.columns.find((c) => c.id === columnId);
    const card = column?.cards.find((c) => c.id === cardId);
    if (card) {
      setModal({ isOpen: true, card, columnId, isNew: false });
    }
  };

  const handleAddCard = () => {
    const defaultColumnId = data?.columns[0]?.id ?? 'ideas';
    setModal({ isOpen: true, card: null, columnId: defaultColumnId, isNew: true });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, card: null, columnId: '', isNew: false });
  };

  const handleSaveCard = async (card: KanbanCard, newColumnId: string) => {
    if (!data) return;
    setSaving(true);

    try {
      const response = await fetch('/api/kanban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card,
          fromColumnId: modal.columnId,
          toColumnId: newColumnId,
          isNew: modal.isNew,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save card');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error saving card:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string, columnId: string) => {
    if (!data) return;
    setSaving(true);

    try {
      const response = await fetch('/api/kanban', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, columnId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error deleting card:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveCard = async (cardId: string, fromColumnId: string, toColumnId: string) => {
    if (!data || fromColumnId === toColumnId) return;
    setSaving(true);

    try {
      // Find the card
      const fromColumn = data.columns.find((c) => c.id === fromColumnId);
      const card = fromColumn?.cards.find((c) => c.id === cardId);
      if (!card) return;

      const response = await fetch('/api/kanban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card,
          fromColumnId,
          toColumnId,
          isNew: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move card');
      }

      await fetchData();
    } catch (err) {
      console.error('Error moving card:', err);
      setError(err instanceof Error ? err.message : 'Failed to move');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading kanban...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-text-muted text-center py-8">
        No kanban data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Kanban Board</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Owner Filter */}
          <div className="flex items-center gap-1 bg-surface-raised/60 rounded-lg p-1">
            {(['all', 'aaron', 'orion'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setOwnerFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  ownerFilter === filter
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button
            onClick={handleAddCard}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Card
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
        {data.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            ownerFilter={ownerFilter}
            onCardClick={handleCardClick}
            onMoveCard={handleMoveCard}
          />
        ))}
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <CardModal
          card={modal.card}
          columns={data.columns}
          currentColumnId={modal.columnId}
          isNew={modal.isNew}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
