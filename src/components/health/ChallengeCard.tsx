'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { color, typography, shadow } from '@/styles/tokens';

interface ChallengeStat {
  label: string;
  value: string;
  sub?: string;
  icon: string;
}

const STATS: ChallengeStat[] = [
  { icon: '📅', label: 'Duration', value: '365 days', sub: 'Jun 12, 2021 → Jun 11, 2022' },
  { icon: '🏃', label: 'Total Miles', value: '551.06 mi', sub: '1.51 mi/day avg' },
  { icon: '⏱️', label: 'Total Time', value: '84 hours', sub: 'Of pure commitment' },
  { icon: '💨', label: 'Avg Pace', value: '8:37 /mi', sub: 'Per mile average' },
  { icon: '⚡', label: 'Fastest Mile', value: '6:55 /mi', sub: 'Peak performance' },
  { icon: '🎯', label: 'Days Logged', value: '365 / 365', sub: 'Zero missed. Zero excuses.' },
];

export function ChallengeCard(): React.ReactElement {
  return (
    <GlassCard padding="lg" style={{
      background: `linear-gradient(135deg, rgba(255,107,53,0.06), rgba(255,179,71,0.02), rgba(120,60,20,0.04))`,
      border: `1.5px solid rgba(255,179,71,0.2)`,
      boxShadow: shadow.emberGlow,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>🔥</div>
        <div style={{
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize.pageTitle,
          fontWeight: typography.fontWeight.bold,
          color: color.ember.flame,
          textShadow: '0 0 20px rgba(255,179,71,0.3)',
          letterSpacing: typography.letterSpacing.tight,
        }}>
          The 365-Day Challenge
        </div>
        <div style={{
          fontSize: typography.fontSize.caption,
          color: color.text.secondary,
          marginTop: '6px',
          fontStyle: 'italic',
        }}>
          &ldquo;I made a commitment to running at least 1 mile-a-day for 1 full year. Today that commitment was completed.&rdquo;
        </div>
        <div style={{
          fontSize: typography.fontSize.metadata,
          color: color.text.dim,
          marginTop: '4px',
        }}>
          — Aaron Delezenski, Facebook · Jun 11, 2022
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
      }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,179,71,0.1)',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.fontSize.cardTitle,
              fontWeight: typography.fontWeight.bold,
              color: color.ember.DEFAULT,
              lineHeight: 1.1,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: typography.fontSize.metadata,
              color: color.text.accent,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
              marginTop: '4px',
              fontWeight: typography.fontWeight.semibold,
            }}>
              {stat.label}
            </div>
            {stat.sub && (
              <div style={{
                fontSize: typography.fontSize.metadata,
                color: color.text.dim,
                marginTop: '3px',
                fontStyle: 'italic',
              }}>
                {stat.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid rgba(255,179,71,0.1)',
        textAlign: 'center',
        fontSize: typography.fontSize.metadata,
        color: color.text.dim,
        fontStyle: 'italic',
      }}>
        Continued running 6 more days after completion — 371 total consecutive days 🏆 · Inspired by Will Stimeling
      </div>
    </GlassCard>
  );
}
