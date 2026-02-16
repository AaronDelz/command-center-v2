'use client';

import { useState, forwardRef } from 'react';
import { color, glass, animation, radius, typography, shadow } from '@/styles/tokens';

interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const sizeStyles = {
  sm: { padding: '8px 12px', fontSize: typography.fontSize.caption },
  md: { padding: '10px 14px', fontSize: typography.fontSize.body },
  lg: { padding: '14px 16px', fontSize: typography.fontSize.cardTitle },
};

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput(
    { label, error, hint, size = 'md', icon, className = '', style, ...rest },
    ref
  ) {
    const [focused, setFocused] = useState(false);

    const borderColor = error
      ? color.status.error
      : focused
      ? color.glass.borderFocus
      : color.glass.border;

    const glowShadow = error
      ? `0 0 12px rgba(239, 68, 68, 0.15)`
      : focused
      ? `0 0 12px rgba(255, 107, 53, 0.12)`
      : 'none';

    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
        {label && (
          <label
            style={{
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
              color: color.text.secondary,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase' as const,
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                color: focused ? color.ember.flame : color.text.dim,
                transition: `color ${animation.duration.normal} ${animation.easing.default}`,
                pointerEvents: 'none',
                display: 'flex',
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
            {...rest}
            style={{
              ...sizeStyles[size],
              paddingLeft: icon ? '36px' : sizeStyles[size].padding.split(' ')[1],
              width: '100%',
              background: color.bg.surface,
              backdropFilter: glass.blur.card,
              WebkitBackdropFilter: glass.blur.card,
              border: `1.5px solid ${borderColor}`,
              borderRadius: radius.lg,
              color: color.text.primary,
              fontFamily: typography.fontFamily.body,
              outline: 'none',
              boxShadow: `${shadow.innerShine}, ${glowShadow}`,
              transition: `all ${animation.duration.normal} ${animation.easing.default}`,
            }}
          />
        </div>
        {(error || hint) && (
          <span
            style={{
              fontSize: typography.fontSize.metadata,
              color: error ? color.status.error : color.text.dim,
            }}
          >
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);
