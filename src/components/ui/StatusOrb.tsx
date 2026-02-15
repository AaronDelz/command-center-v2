'use client';

import { color, animation } from '@/styles/tokens';

type OrbStatus = 'online' | 'thinking' | 'alert' | 'idle';
type OrbSize = 'sm' | 'md' | 'lg';

interface StatusOrbProps {
  status?: OrbStatus;
  size?: OrbSize;
}

const sizeMap: Record<OrbSize, number> = { sm: 10, md: 16, lg: 24 };

const statusConfig: Record<OrbStatus, { color: string; glow: string }> = {
  online: { color: color.status.healthy, glow: color.statusGlow.healthy },
  thinking: { color: color.status.warning, glow: color.statusGlow.warning },
  alert: { color: color.status.error, glow: color.statusGlow.error },
  idle: { color: color.text.dim, glow: 'transparent' },
};

export function SimpleStatusOrb({ status = 'idle', size = 'md' }: StatusOrbProps): React.ReactElement {
  const px = sizeMap[size];
  const cfg = statusConfig[status];
  const shouldPulse = status === 'thinking' || status === 'alert';

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        backgroundColor: cfg.color,
        boxShadow: `0 0 ${px}px ${cfg.glow}, 0 0 ${px * 2}px ${cfg.glow}`,
        transition: `all ${animation.duration.slow} ${animation.easing.default}`,
        animation: shouldPulse
          ? `orb-breathe ${animation.duration.ambient} ${animation.easing.inOut} infinite`
          : 'none',
      }}
      role="status"
      aria-label={`Status: ${status}`}
    />
  );
}
