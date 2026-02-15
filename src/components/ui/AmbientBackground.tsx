'use client';

import { useEffect, useState } from 'react';
import { color, zIndex, limits } from '@/styles/tokens';

export function AmbientBackground(): React.ReactElement {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: zIndex.background,
        background: color.bg.base,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* Orb 1: Top-right ember */}
      <div
        className="ambient-orb absolute"
        style={{
          top: '10%',
          right: '15%',
          width: '40vw',
          height: '40vw',
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color.ambient.ember}, transparent 70%)`,
          filter: 'blur(60px)',
          animationDelay: '0s',
        }}
      />

      {/* Orb 2: Bottom-left gold */}
      <div
        className="ambient-orb absolute"
        style={{
          bottom: '5%',
          left: '10%',
          width: '35vw',
          height: '35vw',
          maxWidth: 500,
          maxHeight: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color.ambient.gold}, transparent 70%)`,
          filter: 'blur(60px)',
          animationDelay: '1.5s',
        }}
      />

      {/* Orb 3: Center-left coal */}
      {limits.maxAmbientOrbs >= 3 && (
        <div
          className="ambient-orb absolute"
          style={{
            top: '40%',
            left: '25%',
            width: '30vw',
            height: '30vw',
            maxWidth: 450,
            maxHeight: 450,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color.ambient.coal}, transparent 70%)`,
            filter: 'blur(60px)',
            animationDelay: '3s',
          }}
        />
      )}

      {/* Mouse-reactive gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 107, 53, 0.04), transparent 50%)`,
          opacity: 0.3,
        }}
      />
    </div>
  );
}
