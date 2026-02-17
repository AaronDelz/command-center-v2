'use client';

import { useState } from 'react';
import { color, shadow, animation, radius } from '@/styles/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface EmberButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '0.75rem' },
  md: { padding: '10px 20px', fontSize: '0.875rem' },
  lg: { padding: '14px 28px', fontSize: '1rem' },
};

function getVariantStyle(variant: Variant, hovered: boolean, pressed: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: radius.lg,
    fontWeight: 600,
    letterSpacing: '0.025em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    transition: `all ${animation.duration.normal} ${animation.easing.default}`,
  };

  const transform = pressed ? animation.hover.press : hovered ? 'scale(1.02)' : 'none';

  switch (variant) {
    case 'primary':
      return {
        ...base,
        background: `linear-gradient(135deg, ${color.ember.DEFAULT}, ${color.ember.flame})`,
        color: color.text.inverse,
        border: 'none',
        boxShadow: hovered ? shadow.emberGlowLg : shadow.emberGlow,
        filter: hovered ? 'brightness(1.15)' : 'none',
        transform,
      };
    case 'secondary':
      return {
        ...base,
        background: color.bg.surface,
        color: color.text.primary,
        border: `1.5px solid ${hovered ? color.glass.borderHover : color.glass.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: hovered ? shadow.cardHover : 'none',
        transform,
      };
    case 'ghost':
      return {
        ...base,
        background: hovered ? 'rgba(255, 107, 53, 0.08)' : 'transparent',
        color: hovered ? color.ember.flame : color.text.secondary,
        border: '1.5px solid transparent',
        transform,
      };
  }
}

export function EmberButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: EmberButtonProps): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        ...getVariantStyle(variant, hovered && !disabled, pressed && !disabled),
        ...sizeStyles[size],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
