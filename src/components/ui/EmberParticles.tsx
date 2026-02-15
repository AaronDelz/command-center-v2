'use client';

import { useMemo } from 'react';
import { color, limits, zIndex } from '@/styles/tokens';

interface EmberParticlesProps {
  count?: number;
  className?: string;
}

export function EmberParticles({
  count = 15,
  className = '',
}: EmberParticlesProps): React.ReactElement {
  const particleCount = Math.min(count, limits.maxEmberParticles);

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 40,
      })),
    [particleCount]
  );

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
      style={{ zIndex: zIndex.background + 1 }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="ember-particle absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: '-4px',
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${color.ember.flame}, ${color.ember.DEFAULT})`,
            boxShadow: `0 0 ${p.size * 2}px ${color.ambient.ember}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
