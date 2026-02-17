'use client';

import { useRef, useCallback, useState } from 'react';
import { color, shadow, glass, animation, radius } from '@/styles/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingMap = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '32px',
};

export function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  padding = 'md',
  onClick,
  style: styleProp,
}: GlassCardProps): React.ReactElement {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hover || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [hover]
  );

  const hoverBorder = isHovered && hover ? color.glass.borderHover : color.glass.border;
  const hoverShadow = isHovered && hover ? shadow.cardHover : (glow ? shadow.cardHover : shadow.card);
  const hoverTransform = isHovered && hover ? animation.hover.lift : 'none';

  return (
    <div
      ref={cardRef}
      className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 50, y: 50 }); }}
      style={{
        background: color.bg.surface,
        backdropFilter: glass.blur.card,
        WebkitBackdropFilter: glass.blur.card,
        border: `1.5px solid ${hoverBorder}`,
        borderRadius: radius.xl,
        boxShadow: hoverShadow,
        padding: paddingMap[padding],
        transform: hoverTransform,
        transition: `all ${animation.duration.slow} ${animation.easing.default}`,
        position: 'relative',
        overflow: 'hidden',
        ...styleProp,
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

      {/* Mouse-tracking glow overlay */}
      {hover && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 140, 0, 0.08), transparent 50%)`,
            opacity: isHovered ? 1 : 0,
            transition: `opacity ${animation.duration.slow} ${animation.easing.default}`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
