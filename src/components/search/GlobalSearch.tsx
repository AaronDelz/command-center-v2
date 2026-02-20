'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { color, typography, radius, shadow, glass } from '@/styles/tokens';

interface SearchResult {
  type: 'kanban' | 'client' | 'vault' | 'note';
  title: string;
  subtitle?: string;
  url: string;
  icon: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search logic
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);

    try {
      const [kanbanRes, clientsRes, vaultRes, notesRes, dropsRes] = await Promise.allSettled([
        fetch('/api/kanban').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/vault').then(r => r.json()),
        fetch('/api/notes').then(r => r.json()),
        fetch('/api/drops?limit=100').then(r => r.json()),
      ]);

      const found: SearchResult[] = [];
      const lq = q.toLowerCase();

      // Kanban cards
      if (kanbanRes.status === 'fulfilled') {
        const data = kanbanRes.value;
        const columns = data.columns || [];
        for (const col of columns) {
          for (const card of (col.cards || [])) {
            if (card.title?.toLowerCase().includes(lq) || card.description?.toLowerCase().includes(lq)) {
              found.push({
                type: 'kanban',
                title: card.title,
                subtitle: `${col.title} · Battle Board`,
                url: `/kanban`,
                icon: '⚔️',
              });
            }
          }
        }
      }

      // Clients
      if (clientsRes.status === 'fulfilled') {
        const clients = clientsRes.value.clients || clientsRes.value || [];
        for (const c of clients) {
          if (c.name?.toLowerCase().includes(lq) || c.businessName?.toLowerCase().includes(lq)) {
            found.push({
              type: 'client',
              title: c.name,
              subtitle: c.businessName || c.status,
              url: `/clients?highlight=${encodeURIComponent(c.name)}`,
              icon: '👤',
            });
          }
        }
      }

      // Vault docs
      if (vaultRes.status === 'fulfilled') {
        const docs = vaultRes.value.files || vaultRes.value || [];
        for (const doc of docs) {
          const name = doc.name || doc.title || '';
          if (name.toLowerCase().includes(lq)) {
            found.push({
              type: 'vault',
              title: name,
              subtitle: doc.category || 'Vault',
              url: `/vault?id=${encodeURIComponent(doc.id || doc.path || name)}`,
              icon: '📜',
            });
          }
        }
      }

      // Notes (quick notes)
      if (notesRes.status === 'fulfilled') {
        const notes = notesRes.value.notes || [];
        for (const note of notes) {
          const text = note.text || '';
          if (text.toLowerCase().includes(lq)) {
            found.push({
              type: 'note',
              title: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
              subtitle: 'Quick Note',
              url: '/notes',
              icon: '📝',
            });
          }
        }
      }

      // Drops
      if (dropsRes.status === 'fulfilled') {
        const drops = dropsRes.value.drops || [];
        for (const drop of drops) {
          const text = drop.content || '';
          if (text.toLowerCase().includes(lq)) {
            found.push({
              type: 'note',
              title: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
              subtitle: `Drop · ${drop.type || 'unsorted'}`,
              url: '/notes',
              icon: '📥',
            });
          }
        }
      }

      setResults(found.slice(0, 20));
      setSelectedIndex(0);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  const navigate = (result: SearchResult) => {
    setOpen(false);
    router.push(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 580,
          background: color.bg.elevated,
          border: `1px solid ${color.glass.border}`,
          borderRadius: radius.lg,
          boxShadow: shadow.modal,
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          borderBottom: `1px solid ${color.glass.border}`,
        }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search kanban, clients, vault, notes…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: color.text.primary,
              fontSize: typography.fontSize.body,
              fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            padding: '2px 8px', borderRadius: radius.sm,
            background: 'rgba(255,255,255,0.08)',
            color: color.text.dim,
            fontSize: 11, fontFamily: typography.fontFamily.mono,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: color.text.dim, fontSize: 13 }}>
              Searching…
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: color.text.dim, fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {!loading && !query && (
            <div style={{ padding: '20px', textAlign: 'center', color: color.text.dim, fontSize: 13 }}>
              Type to search across The Forge
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.title}-${i}`}
              onClick={() => navigate(r)}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px',
                background: i === selectedIndex ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: color.text.primary, fontSize: 14, fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.title}</div>
                {r.subtitle && (
                  <div style={{ color: color.text.dim, fontSize: 12, marginTop: 1 }}>{r.subtitle}</div>
                )}
              </div>
              <span style={{
                fontSize: 10, color: color.text.dim, textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: radius.sm,
                background: 'rgba(255,255,255,0.05)',
              }}>{r.type}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 20px',
          borderTop: `1px solid ${color.glass.border}`,
          display: 'flex', gap: 16,
          fontSize: 11, color: color.text.dim,
        }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
