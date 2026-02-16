'use client';

import { useState, useRef, useEffect } from 'react';
import { GlassModal, EmberButton, GlassPill } from '@/components/ui';
import { color, radius } from '@/styles/tokens';

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
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  return (
    <GlassModal
      open={isOpen}
      onClose={onClose}
      title="Add Note"
      width="md"
      footer={
        <div className="flex items-center gap-3 w-full justify-end">
          <EmberButton variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </EmberButton>
          <EmberButton
            variant="primary"
            size="sm"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </EmberButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          style={{
            width: '100%',
            background: color.bg.surface,
            border: `1.5px solid ${color.glass.border}`,
            borderRadius: radius.lg,
            color: color.text.primary,
            padding: '14px',
            fontSize: '0.95rem',
            resize: 'none',
            outline: 'none',
          }}
        />

        <div className="flex items-center gap-2">
          <GlassPill
            variant="ember"
            size="sm"
            active={discuss}
            onClick={() => setDiscuss(!discuss)}
            icon={<span>🗣️</span>}
          >
            Mark for Discussion
          </GlassPill>
        </div>
      </form>
    </GlassModal>
  );
}
