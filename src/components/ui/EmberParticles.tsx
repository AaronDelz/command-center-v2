'use client';

import { useState, useEffect } from 'react';
import { color, limits, zIndex } from '@/styles/tokens';

interface EmberParticlesProps {
  count?: number;
  className?: string;
}

interface Particle {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  drift: number;
}

export function EmberParticles({
  count = 15,
  className = '',
}: EmberParticlesProps): React.ReactElement | null {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const particleCount = Math.min(count, limits.maxEmberParticles);
    setParticles(
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 40,
      }))
    );
  }, [count]);

  if (particles.length === 0) return null;

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
