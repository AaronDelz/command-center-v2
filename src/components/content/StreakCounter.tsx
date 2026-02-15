'use client';

import { color, shadow, animation, radius, typography } from '@/styles/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { useEffect, useState } from 'react';

interface StreakCounterProps {
  current: number;
  best: number;
  lastPostDate: string;
  postsThisMonth: number;
  totalImpressions: number;
}

export function StreakCounter({
  current,
  best,
  lastPostDate,
  postsThisMonth,
  totalImpressions,
}: StreakCounterProps): React.ReactElement {
  const [flames, setFlames] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([]);

  useEffect(() => {
    // Generate flame particles based on streak length
    const count = Math.min(current * 3, 20);
    setFlames(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        delay: Math.random() * 2,
        size: 4 + Math.random() * 8,
      }))
    );
  }, [current]);

  const daysSincePost = Math.floor(
    (Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const streakAlive = daysSincePost <= 1;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
      {/* Streak Card — Hero */}
      <GlassCard hover={false} padding="none">
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '24px',
            textAlign: 'center',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Flame particles */}
          {streakAlive &&
            flames.map((f) => (
              <div
                key={f.id}
                style={{
                  position: 'absolute',
                  bottom: '10%',
                  left: `${f.x}%`,
                  width: `${f.size}px`,
                  height: `${f.size}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${color.ember.flame}, ${color.ember.DEFAULT})`,
                  opacity: 0,
                  animation: `flame-rise 2s ease-out ${f.delay}s infinite`,
                  pointerEvents: 'none',
                }}
              />
            ))}

          {/* Ember glow behind number */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: streakAlive
                ? `radial-gradient(circle, rgba(255, 107, 53, 0.3), transparent 70%)`
                : 'none',
              animation: streakAlive ? `glow-breathe 3s ease-in-out infinite` : 'none',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>
              {streakAlive ? '🔥' : '💀'}
            </div>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: typography.fontWeight.bold,
                color: streakAlive ? color.ember.flame : color.text.secondary,
                lineHeight: 1,
                textShadow: streakAlive ? `0 0 20px rgba(255, 179, 71, 0.5)` : 'none',
              }}
            >
              {current}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.caption,
                color: color.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.widest,
                marginTop: '4px',
              }}
            >
              Day Streak
            </div>
            <div
              style={{
                fontSize: typography.fontSize.metadata,
                color: color.text.dim,
                marginTop: '8px',
              }}
            >
              Best: {best} days
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Posts This Month */}
      <GlassCard hover={false} padding="md">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📝</div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: typography.fontWeight.bold,
              color: color.text.primary,
              lineHeight: 1,
            }}
          >
            {postsThisMonth}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.widest,
              marginTop: '4px',
            }}
          >
            Posts This Month
          </div>
        </div>
      </GlassCard>

      {/* Total Impressions */}
      <GlassCard hover={false} padding="md">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>👁️</div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: typography.fontWeight.bold,
              color: color.text.primary,
              lineHeight: 1,
            }}
          >
            {totalImpressions > 0 ? totalImpressions.toLocaleString() : '—'}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.caption,
              color: color.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.widest,
              marginTop: '4px',
            }}
          >
            Total Impressions
          </div>
        </div>
      </GlassCard>

      <style jsx global>{`
        @keyframes flame-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-60px) scale(0.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
