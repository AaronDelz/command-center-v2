'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { color, typography, shadow } from '@/styles/tokens';

interface StreakDisplayProps {
  longest: number;
  longestStart: string;
  longestEnd: string;
  current: number;
  lastActivity: string;
  daysSinceLast: number;
}

export function StreakDisplay({ longest, longestStart, longestEnd, current, lastActivity, daysSinceLast }: StreakDisplayProps): React.ReactElement {
  const isDormant = daysSinceLast > 30;
  const isWarning = daysSinceLast > 7 && daysSinceLast <= 30;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Longest Streak — the crown jewel */}
      <GlassCard padding="lg" glow style={{
        background: `linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,179,71,0.04))`,
        border: `1.5px solid rgba(255,107,53,0.25)`,
        boxShadow: shadow.emberGlow,
      }}>
        <div className="text-center">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👑</div>
          <div style={{
            fontFamily: typography.fontFamily.display,
            fontSize: '3.5rem',
            fontWeight: typography.fontWeight.bold,
            color: color.ember.flame,
            lineHeight: 1,
            textShadow: '0 0 30px rgba(255,179,71,0.4)',
          }}>
            {longest}
          </div>
          <div style={{
            fontSize: typography.fontSize.sectionHeader,
            color: color.text.accent,
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.widest,
            marginTop: '8px',
            fontWeight: typography.fontWeight.semibold,
          }}>
            Longest Streak (Days)
          </div>
          <div style={{
            fontSize: typography.fontSize.caption,
            color: color.text.secondary,
            marginTop: '6px',
          }}>
            {longestStart} → {longestEnd}
          </div>
          <div style={{
            fontSize: typography.fontSize.metadata,
            color: color.text.dim,
            marginTop: '4px',
            fontStyle: 'italic',
          }}>
            53 consecutive days of showing up
          </div>
        </div>
      </GlassCard>

      {/* Current Status — the mirror */}
      <GlassCard padding="lg" style={{
        border: isDormant ? `1.5px solid rgba(239,68,68,0.25)` : undefined,
        boxShadow: isDormant ? `0 0 20px rgba(239,68,68,0.15)` : undefined,
      }}>
        <div className="text-center">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
            {isDormant ? '💀' : isWarning ? '⚠️' : '🔥'}
          </div>
          <div style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: '3.5rem',
            fontWeight: typography.fontWeight.bold,
            color: isDormant ? color.status.error : isWarning ? color.status.warning : color.status.healthy,
            lineHeight: 1,
            textShadow: isDormant ? '0 0 20px rgba(239,68,68,0.3)' : undefined,
          }}>
            {daysSinceLast}
          </div>
          <div style={{
            fontSize: typography.fontSize.sectionHeader,
            color: color.text.accent,
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.widest,
            marginTop: '8px',
            fontWeight: typography.fontWeight.semibold,
          }}>
            Days Since Last Run
          </div>
          <div style={{
            fontSize: typography.fontSize.caption,
            color: color.text.secondary,
            marginTop: '6px',
          }}>
            Last activity: {lastActivity}
          </div>
          {isDormant && (
            <div style={{
              fontSize: typography.fontSize.body,
              color: color.ember.flame,
              marginTop: '12px',
              fontWeight: typography.fontWeight.medium,
              fontStyle: 'italic',
            }}>
              🔥 Time to reignite the forge
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
