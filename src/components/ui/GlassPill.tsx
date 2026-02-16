'use client';

import { useState } from 'react';
import { color, shadow, animation, radius, typography } from '@/styles/tokens';

type PillVariant = 'default' | 'ember' | 'success' | 'warning' | 'error' | 'info' | 'ghost';
type PillSize = 'xs' | 'sm' | 'md';

interface GlassPillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  size?: PillSize;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  removable?: boolean;
  onRemove?: () => void;
}

const sizeStyles: Record<PillSize, React.CSSProperties> = {
  xs: { padding: '2px 8px', fontSize: typography.fontSize.metadata, gap: '4px' },
  sm: { padding: '4px 10px', fontSize: typography.fontSize.caption, gap: '5px' },
  md: { padding: '6px 14px', fontSize: typography.fontSize.body, gap: '6px' },
};

function getVariantColors(variant: PillVariant, active: boolean) {
  const base = {
    default: {
      bg: active ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.04)',
      border: active ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.08)',
      text: active ? color.text.primary : color.text.secondary,
    },
    ember: {
      bg: active ? 'rgba(255, 107, 53, 0.18)' : 'rgba(255, 107, 53, 0.08)',
      border: active ? 'rgba(255, 107, 53, 0.40)' : 'rgba(255, 107, 53, 0.15)',
      text: active ? color.ember.flame : color.ember.DEFAULT,
    },
    success: {
      bg: active ? 'rgba(74, 222, 128, 0.18)' : 'rgba(74, 222, 128, 0.08)',
      border: active ? 'rgba(74, 222, 128, 0.40)' : 'rgba(74, 222, 128, 0.15)',
      text: color.status.healthy,
    },
    warning: {
      bg: active ? 'rgba(251, 191, 36, 0.18)' : 'rgba(251, 191, 36, 0.08)',
      border: active ? 'rgba(251, 191, 36, 0.40)' : 'rgba(251, 191, 36, 0.15)',
      text: color.status.warning,
    },
    error: {
      bg: active ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.08)',
      border: active ? 'rgba(239, 68, 68, 0.40)' : 'rgba(239, 68, 68, 0.15)',
      text: color.status.error,
    },
    info: {
      bg: active ? 'rgba(96, 165, 250, 0.18)' : 'rgba(96, 165, 250, 0.08)',
      border: active ? 'rgba(96, 165, 250, 0.40)' : 'rgba(96, 165, 250, 0.15)',
      text: color.status.info,
    },
    ghost: {
      bg: active ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
      border: 'transparent',
      text: active ? color.text.primary : color.text.dim,
    },
  };
  return base[variant];
}

export function GlassPill({
  children,
  variant = 'default',
  size = 'sm',
  active = false,
  onClick,
  icon,
  className = '',
  removable = false,
  onRemove,
}: GlassPillProps): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const colors = getVariantColors(variant, active || hovered);

  return (
    <span
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...sizeStyles[size],
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.full,
        color: colors.text,
        fontWeight: typography.fontWeight.medium,
        letterSpacing: typography.letterSpacing.wide,
        transition: `all ${animation.duration.normal} ${animation.easing.default}`,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          className="flex-shrink-0 ml-1 opacity-50 hover:opacity-100"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: 'inherit',
            lineHeight: 1,
            transition: `opacity ${animation.duration.fast} ${animation.easing.default}`,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
