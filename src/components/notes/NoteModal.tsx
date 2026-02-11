'use client';

import { useState, useRef, useEffect } from 'react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, tags?: string[]) => Promise<void>;
}

export function NoteModal({ isOpen, onClose, onSubmit }: NoteModalProps): React.ReactElement | null {
  const [text, setText] = useState('');
  const [discuss, setDiscuss] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim(), discuss ? ['discuss'] : undefined);
      setText('');
      setDiscuss(false);
      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-surface-raised/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl shadow-accent/5 max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
            Add Note
          </h2>

          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="
                w-full bg-surface/60 border border-border rounded-xl p-4
                text-foreground placeholder:text-text-muted text-base
                resize-none focus:outline-none focus:border-accent/50
                transition-colors
              "
            />

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => setDiscuss(!discuss)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200 border
                  ${discuss
                    ? 'bg-accent/15 border-accent/40 text-accent'
                    : 'bg-surface/60 border-border text-text-muted hover:border-accent/30 hover:text-foreground'
                  }
                `}
              >
                🗣️ Mark for Discussion
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="
                  px-4 py-2.5 min-h-[44px] rounded-lg text-text-muted
                  hover:bg-surface hover:text-foreground active:scale-95
                  transition-all duration-200
                "
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className="
                  px-4 py-2.5 min-h-[44px] rounded-lg bg-accent text-background font-medium
                  hover:bg-accent-dim active:scale-95 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isSubmitting ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
