'use client';

import { useState, useRef, useCallback } from 'react';

type DropType = 'idea' | 'link' | 'task' | 'note';

const DROP_TYPES: Array<{ key: DropType; label: string; icon: string }> = [
  { key: 'note', label: 'Note', icon: '📝' },
  { key: 'idea', label: 'Idea', icon: '💡' },
  { key: 'link', label: 'Link', icon: '🔗' },
  { key: 'task', label: 'Task', icon: '✅' },
];

export function DropBox(): React.ReactElement {
  const [text, setText] = useState('');
  const [type, setType] = useState<DropType>('note');
  const [isSending, setIsSending] = useState(false);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      // Create note with tag indicating type
      const noteText = type === 'note' ? trimmed : `[${type}] ${trimmed}`;
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText, tags: [type] }),
      });

      if (res.ok) {
        setText('');
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
        inputRef.current?.focus();
      }
    } catch {
      // Fail silently
    } finally {
      setIsSending(false);
    }
  }, [text, type, isSending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div
      className={`
        bg-surface/80 backdrop-blur-sm rounded-xl border transition-all duration-300
        ${flash ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-border'}
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📥</span>
            <h2 className="text-sm font-semibold text-foreground">Drop Box</h2>
          </div>
          {/* Type selector */}
          <div className="flex items-center gap-1">
            {DROP_TYPES.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`
                  px-2 py-1 rounded text-xs font-medium transition-all duration-200
                  ${type === key
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-text-muted hover:text-foreground border border-transparent'
                  }
                `}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              type === 'link'
                ? 'Paste a link...'
                : type === 'idea'
                ? 'Drop an idea...'
                : type === 'task'
                ? 'Quick task...'
                : 'Drop anything...'
            }
            rows={1}
            className="
              w-full px-3 py-2.5 bg-background/60 border border-border rounded-lg
              text-sm text-foreground placeholder-text-muted/50
              focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20
              resize-none transition-all duration-200
            "
            style={{ minHeight: '42px', maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          {text.trim() && (
            <button
              onClick={handleSubmit}
              disabled={isSending}
              className="
                absolute right-2 bottom-2 px-2.5 py-1 rounded-md text-xs font-medium
                bg-accent/20 text-accent hover:bg-accent/30 active:scale-95
                transition-all duration-200 disabled:opacity-50
              "
            >
              {isSending ? '...' : '⏎'}
            </button>
          )}
        </div>

        {text.trim() && (
          <p className="text-[10px] text-text-muted mt-1.5 text-right">⌘+Enter to send</p>
        )}
      </div>
    </div>
  );
}
