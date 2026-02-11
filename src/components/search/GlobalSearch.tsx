'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'card' | 'note' | 'doc';
  id: string;
  title: string;
  snippet: string;
  columnId?: string;
  docPath?: string;
}

interface SearchResponse {
  query: string;
  results: {
    cards: SearchResult[];
    notes: SearchResult[];
    docs: SearchResult[];
  };
  total: number;
}

export function GlobalSearch(): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as SearchResponse;
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');

    switch (result.type) {
      case 'card':
        router.push(`/?card=${result.id}`);
        break;
      case 'note':
        router.push('/notes');
        break;
      case 'doc': {
        const docId = result.docPath ?? result.id;
        const ts = Date.now(); // Force re-render on repeated navigations
        // Vault docs have category/ prefix (e.g. reports/some-report), workspace files don't
        if (docId.includes('/')) {
          router.push(`/docs?vault=${encodeURIComponent(docId)}&t=${ts}`);
        } else {
          router.push(`/docs?file=${encodeURIComponent(docId)}&t=${ts}`);
        }
        break;
      }
    }
  }, [router]);

  const hasResults = results && results.total > 0;
  const showDropdown = isOpen && (hasResults || isLoading || query.length >= 2);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full pl-10 pr-10 py-2.5 min-h-[44px] bg-surface-raised border border-border rounded-lg
                     text-foreground placeholder-text-muted text-base
                     focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                     transition-colors"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-text-muted text-sm">
              Searching...
            </div>
          )}

          {!isLoading && !hasResults && query.length >= 2 && (
            <div className="p-4 text-center text-text-muted text-sm">
              No results found
            </div>
          )}

          {!isLoading && hasResults && (
            <>
              {/* Cards */}
              {results.results.cards.length > 0 && (
                <ResultSection
                  title="Cards"
                  icon="◉"
                  results={results.results.cards}
                  query={query}
                  onResultClick={handleResultClick}
                />
              )}

              {/* Notes */}
              {results.results.notes.length > 0 && (
                <ResultSection
                  title="Notes"
                  icon="✎"
                  results={results.results.notes}
                  query={query}
                  onResultClick={handleResultClick}
                />
              )}

              {/* Docs */}
              {results.results.docs.length > 0 && (
                <ResultSection
                  title="Docs"
                  icon="📄"
                  results={results.results.docs}
                  query={query}
                  onResultClick={handleResultClick}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface ResultSectionProps {
  title: string;
  icon: string;
  results: SearchResult[];
  query: string;
  onResultClick: (result: SearchResult) => void;
}

function ResultSection({ title, icon, results, query, onResultClick }: ResultSectionProps): React.ReactElement {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="px-3 py-2 bg-surface-raised text-xs font-medium text-text-muted uppercase tracking-wide">
        {icon} {title}
      </div>
      <div>
        {results.slice(0, 5).map((result) => (
          <button
            key={result.id}
            onClick={() => onResultClick(result)}
            className="w-full px-3 py-3 min-h-[44px] text-left hover:bg-surface-raised active:bg-surface-raised/80 transition-colors flex flex-col gap-1"
          >
            <span className="text-sm font-medium text-foreground">
              <HighlightText text={result.title} query={query} />
            </span>
            <span className="text-xs text-text-muted line-clamp-2">
              <HighlightText text={result.snippet} query={query} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface HighlightTextProps {
  text: string;
  query: string;
}

function HighlightText({ text, query }: HighlightTextProps): React.ReactElement {
  if (!query) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
