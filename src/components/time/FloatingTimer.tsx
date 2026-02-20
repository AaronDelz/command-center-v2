'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { color, radius, typography, shadow, animation } from '@/styles/tokens';
import type { TimeEntriesData, TimeEntry } from '@/lib/types';

// Notes modal shown after stopping timer from floating widget
function StopNotesModal({
  isOpen,
  onClose,
  onSave,
  timeSpent,
  clientName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  timeSpent: string;
  clientName: string;
}) {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = () => { onSave(notes); setNotes(''); };
  const handleSkip = () => { onSave(''); setNotes(''); };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: color.bg.base,
          border: `1.5px solid ${color.glass.border}`,
          borderRadius: radius['2xl'],
          boxShadow: shadow.modal,
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
        }}
      >
        <h3 style={{ fontSize: typography.fontSize.pageTitle, fontWeight: typography.fontWeight.semibold, color: color.text.primary, marginBottom: '8px', marginTop: 0 }}>
          Timer Stopped
        </h3>
        <div style={{ fontSize: typography.fontSize.body, color: color.text.secondary, marginBottom: '16px' }}>
          <div style={{ color: color.ember.flame, fontWeight: typography.fontWeight.semibold }}>
            {timeSpent} worked on {clientName}
          </div>
        </div>
        <label style={{ fontSize: typography.fontSize.caption, color: color.text.secondary, marginBottom: '6px', display: 'block' }}>
          What did you work on? (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Brief description of what you accomplished..."
          autoFocus
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px 12px',
            background: color.bg.surface,
            border: `1px solid ${color.glass.border}`,
            borderRadius: radius.md,
            color: color.text.primary,
            fontSize: typography.fontSize.body,
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSave(); }
          }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSkip}
            style={{ padding: '8px 18px', background: 'none', border: `1px solid ${color.glass.border}`, borderRadius: radius.md, color: color.text.secondary, cursor: 'pointer', fontSize: typography.fontSize.body }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 18px', background: `linear-gradient(135deg, ${color.ember.DEFAULT}, ${color.ember.flame})`, border: 'none', borderRadius: radius.md, color: color.text.inverse, cursor: 'pointer', fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold }}
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}

export function FloatingTimer(): React.ReactElement | null {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [stoppedEntry, setStoppedEntry] = useState<{ entryId: string; clientName: string; timeSpent: string } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Poll for active timer
  const checkActiveTimer = useCallback(async () => {
    try {
      const response = await fetch('/api/time-entries');
      if (!response.ok) return;
      const data = await response.json() as TimeEntriesData;
      
      const running = data.entries.find(e => e.isRunning) || null;
      setActiveEntry(running);
      
      if (data.activeTimer) {
        startTimeRef.current = new Date(data.activeTimer.startedAt).getTime();
      } else {
        startTimeRef.current = null;
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Poll every 10 seconds for timer state changes
  useEffect(() => {
    checkActiveTimer();
    pollRef.current = setInterval(checkActiveTimer, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkActiveTimer]);

  // Tick the timer every second
  useEffect(() => {
    if (startTimeRef.current) {
      const tick = () => {
        if (startTimeRef.current) {
          setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsedSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeEntry]);

  // Format elapsed for display in modal
  const formatTimeDisplay = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Stop timer — shows notes modal before clearing
  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeEntry) return;
    try {
      await fetch('/api/time-entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeEntry.id, action: 'stop' }),
      });
      // Capture entry info for notes modal before clearing
      setStoppedEntry({
        entryId: activeEntry.id,
        clientName: activeEntry.clientName,
        timeSpent: formatTimeDisplay(elapsedSeconds),
      });
      setShowNotesModal(true);
      setActiveEntry(null);
      startTimeRef.current = null;
    } catch {
      // Silent fail
    }
  };

  // Save notes after stopping
  const handleSaveNotes = async (notes: string) => {
    if (stoppedEntry && notes.trim()) {
      try {
        await fetch('/api/time-entries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: stoppedEntry.entryId, notes: notes.trim() }),
        });
      } catch {
        // Silent fail
      }
    }
    setShowNotesModal(false);
    setStoppedEntry(null);
  };

  // Show notes modal even after timer is stopped
  if (!activeEntry && showNotesModal && stoppedEntry) {
    return (
      <StopNotesModal
        isOpen={showNotesModal}
        onClose={() => { setShowNotesModal(false); setStoppedEntry(null); }}
        onSave={handleSaveNotes}
        timeSpent={stoppedEntry.timeSpent}
        clientName={stoppedEntry.clientName}
      />
    );
  }

  // Don't render if no active timer
  if (!activeEntry) return null;

  // Hide on /time page (redundant with full timer there)
  if (pathname === '/time') return null;

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: radius.full,
          background: `linear-gradient(135deg, ${color.ember.DEFAULT}, ${color.ember.flame})`,
          border: 'none',
          color: color.text.inverse,
          fontSize: '1.1rem',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: `0 4px 20px rgba(255, 107, 53, 0.4)`,
          transition: `all ${animation.duration.normal}`,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          animation: 'floating-timer-pulse 2s ease-in-out infinite',
        }}
        title={`${activeEntry.clientName} — ${formatTime(elapsedSeconds)}`}
      >
        ⏱️
      </button>
    );
  }

  return (
    <>
      {/* Notes modal — rendered alongside widget when needed */}
      {showNotesModal && stoppedEntry && (
        <StopNotesModal
          isOpen={showNotesModal}
          onClose={() => { setShowNotesModal(false); setStoppedEntry(null); }}
          onSave={handleSaveNotes}
          timeSpent={stoppedEntry.timeSpent}
          clientName={stoppedEntry.clientName}
        />
      )}
      <style>{`
        @keyframes floating-timer-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3); }
          50% { box-shadow: 0 4px 28px rgba(255, 107, 53, 0.55); }
        }
      `}</style>
      <div
        onClick={() => router.push('/time')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          background: 'rgba(13, 13, 20, 0.92)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isHovered ? color.ember.flame + '60' : color.glass.border}`,
          borderRadius: radius.lg,
          padding: '12px 16px',
          cursor: 'pointer',
          zIndex: 1000,
          minWidth: '220px',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 107, 53, 0.15)`,
          transition: `all ${animation.duration.normal}`,
          transform: isHovered ? 'translateY(-2px)' : 'none',
          animation: 'floating-timer-pulse 2s ease-in-out infinite',
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}>
          <span style={{
            fontSize: typography.fontSize.caption,
            color: color.ember.flame,
            fontWeight: typography.fontWeight.semibold,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: color.ember.flame,
              display: 'inline-block',
              animation: 'floating-timer-pulse 1s ease-in-out infinite',
            }} />
            TIMER ACTIVE
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
              style={{
                background: 'none',
                border: 'none',
                color: color.text.dim,
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '2px 4px',
                borderRadius: radius.sm,
              }}
              title="Minimize"
            >
              ▾
            </button>
            <button
              onClick={handleStop}
              style={{
                background: `rgba(239, 68, 68, 0.15)`,
                border: `1px solid rgba(239, 68, 68, 0.3)`,
                color: color.status.error,
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: radius.sm,
                fontWeight: typography.fontWeight.semibold,
              }}
              title="Stop Timer"
            >
              ⏹ STOP
            </button>
          </div>
        </div>

        {/* Timer display */}
        <div style={{
          fontSize: '1.5rem',
          fontWeight: typography.fontWeight.bold,
          fontFamily: 'monospace',
          color: color.text.primary,
          textShadow: `0 0 12px ${color.ember.flame}30`,
          marginBottom: '4px',
        }}>
          {formatTime(elapsedSeconds)}
        </div>

        {/* Client + description */}
        <div style={{
          fontSize: typography.fontSize.caption,
          color: color.text.secondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          <strong style={{ color: color.text.primary }}>{activeEntry.clientName}</strong>
          {activeEntry.description && ` — ${activeEntry.description}`}
        </div>

        {/* Live earnings */}
        {activeEntry.rate && activeEntry.rate > 0 && (
          <div style={{
            fontSize: typography.fontSize.caption,
            color: color.status.healthy,
            fontWeight: typography.fontWeight.semibold,
            marginTop: '2px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            ${(activeEntry.rate * (elapsedSeconds / 3600)).toFixed(2)} earned · ${activeEntry.rate}/hr
          </div>
        )}
      </div>
    </>
  );
}
