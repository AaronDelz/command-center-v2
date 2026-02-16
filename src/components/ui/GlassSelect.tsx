'use client';

import { useState, forwardRef } from 'react';
import { color, glass, animation, radius, typography, shadow } from '@/styles/tokens';

interface GlassSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface GlassSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  options: GlassSelectOption[];
  placeholder?: string;
}

const sizeStyles = {
  sm: { padding: '8px 32px 8px 12px', fontSize: typography.fontSize.caption },
  md: { padding: '10px 36px 10px 14px', fontSize: typography.fontSize.body },
  lg: { padding: '14px 40px 14px 16px', fontSize: typography.fontSize.cardTitle },
};

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  function GlassSelect(
    { label, error, hint, size = 'md', options, placeholder, className = '', style, ...rest },
    ref
  ) {
    const [focused, setFocused] = useState(false);

    const borderColor = error
      ? color.status.error
      : focused
      ? color.glass.borderFocus
      : color.glass.border;

    const glowShadow = error
      ? '0 0 12px rgba(239, 68, 68, 0.15)'
      : focused
      ? '0 0 12px rgba(255, 107, 53, 0.12)'
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
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
            {...rest}
            style={{
              ...sizeStyles[size],
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              background: color.bg.surface,
              backdropFilter: glass.blur.card,
              WebkitBackdropFilter: glass.blur.card,
              border: `1.5px solid ${borderColor}`,
              borderRadius: radius.lg,
              color: rest.value || !placeholder ? color.text.primary : color.text.dim,
              fontFamily: typography.fontFamily.body,
              outline: 'none',
              boxShadow: `${shadow.innerShine}, ${glowShadow}`,
              cursor: 'pointer',
              transition: `all ${animation.duration.normal} ${animation.easing.default}`,
            }}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <div
            className="pointer-events-none absolute"
            style={{
              right: '12px',
              top: '50%',
              transform: `translateY(-50%) ${focused ? 'rotate(180deg)' : 'rotate(0deg)'}`,
              transition: `transform ${animation.duration.normal} ${animation.easing.default}`,
              color: focused ? color.ember.flame : color.text.dim,
              fontSize: '10px',
            }}
          >
            ▾
          </div>
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
