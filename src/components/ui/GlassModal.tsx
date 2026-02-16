'use client';

import { useEffect, useCallback, useRef } from 'react';
import { color, shadow, glass, animation, radius, zIndex, typography } from '@/styles/tokens';

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
}

const widthMap = {
  sm: '400px',
  md: '520px',
  lg: '680px',
  xl: '860px',
  full: '95vw',
};

export function GlassModal({
  open,
  onClose,
  title,
  children,
  width = 'md',
  className = '',
  closeOnOverlay = true,
  closeOnEscape = true,
  footer,
}: GlassModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') onClose();
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // Focus trap: focus modal on open
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: zIndex.modalOverlay,
        animation: `${animation.keyframes.fadeIn} ${animation.duration.normal} ${animation.easing.default}`,
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        onClick={closeOnOverlay ? onClose : undefined}
        style={{
          background: 'rgba(0, 0, 0, 0.60)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal Panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative outline-none ${className}`}
        style={{
          width: '90vw',
          maxWidth: widthMap[width],
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: color.bg.elevated,
          backdropFilter: glass.blur.elevated,
          WebkitBackdropFilter: glass.blur.elevated,
          border: `1.5px solid ${color.glass.border}`,
          borderRadius: radius['2xl'],
          boxShadow: shadow.modal,
          zIndex: zIndex.modal,
          animation: `${animation.keyframes.slideUp} ${animation.duration.slow} ${animation.easing.spring}`,
          overflow: 'hidden',
        }}
      >
        {/* Inner top shine */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 'inherit',
            boxShadow: shadow.innerShine,
          }}
        />

        {/* Header */}
        {title && (
          <div
            className="relative flex items-center justify-between flex-shrink-0"
            style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${color.glass.border}`,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: typography.fontSize.cardTitle,
                fontWeight: typography.fontWeight.semibold,
                color: color.text.primary,
                letterSpacing: typography.letterSpacing.wide,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: color.text.dim,
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '4px 8px',
                borderRadius: radius.md,
                transition: `all ${animation.duration.fast} ${animation.easing.default}`,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = color.text.primary;
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = color.text.dim;
                e.currentTarget.style.background = 'none';
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Body (scrollable) */}
        <div
          className="relative flex-1 overflow-y-auto"
          style={{
            padding: '20px 24px',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="relative flex-shrink-0"
            style={{
              padding: '16px 24px 20px',
              borderTop: `1px solid ${color.glass.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
