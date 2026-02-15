'use client';

import { color, typography, radius, animation } from '@/styles/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Post {
  pillar: string;
  platforms: string[];
  metrics: Record<string, { views?: number; likes?: number; replies?: number; reposts?: number; comments?: number; shares?: number }>;
}

interface PlatformInfo {
  followers?: number;
  subscribers?: number;
  members?: number;
  connections?: number;
  color: string;
  icon: string;
}

interface Pillars {
  [key: string]: { label: string; target: number; color: string };
}

interface PlatformStatsProps {
  platforms: Record<string, PlatformInfo>;
  posts: Post[];
  pillars: Pillars;
  totalPosts: number;
}

const PLATFORM_NAMES: Record<string, string> = {
  x: 'X (Twitter)',
  facebook: 'Facebook',
  youtube: 'YouTube',
  community: 'Community',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
};

export function PlatformStats({ platforms, posts, pillars, totalPosts }: PlatformStatsProps): React.ReactElement {
  // Calculate per-platform post counts
  const platformCounts: Record<string, number> = {};
  posts.forEach(p => {
    p.platforms.forEach(pl => {
      platformCounts[pl] = (platformCounts[pl] || 0) + 1;
    });
  });

  // Calculate pillar distribution
  const pillarCounts: Record<string, number> = {};
  posts.forEach((p) => {
    if (p.pillar) {
      pillarCounts[p.pillar] = (pillarCounts[p.pillar] || 0) + 1;
    }
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Platform Breakdown */}
      <GlassCard padding="md">
        <SectionHeading title="Platforms" icon="📊" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(platforms).map(([key, platform]) => {
            const audience = platform.followers || platform.subscribers || platform.members || platform.connections || 0;
            const postCount = platformCounts[key] || 0;

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: radius.md,
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                {/* Platform icon */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: radius.md,
                    background: `${platform.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: typography.fontWeight.bold,
                    color: platform.color,
                    flexShrink: 0,
                  }}
                >
                  {platform.icon}
                </div>

                {/* Name + audience */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: typography.fontSize.cardTitle, fontWeight: typography.fontWeight.medium, color: color.text.primary }}>
                    {PLATFORM_NAMES[key] || key}
                  </div>
                  <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
                    {audience > 0 ? `${audience.toLocaleString()} followers` : 'No followers yet'}
                  </div>
                </div>

                {/* Post count */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: typography.fontSize.cardTitle, fontWeight: typography.fontWeight.semibold, color: color.text.primary }}>
                    {postCount}
                  </div>
                  <div style={{ fontSize: '9px', color: color.text.dim }}>posts</div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Content Pillar Distribution */}
      <GlassCard padding="md">
        <SectionHeading title="Content Mix" icon="🎯" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(pillars).map(([key, pillar]) => {
            const count = pillarCounts[key] || 0;
            const actual = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
            const barWidth = totalPosts > 0 ? (count / totalPosts) * 100 : 0;

            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: typography.fontSize.caption, color: color.text.primary, fontWeight: typography.fontWeight.medium }}>
                    {pillar.label}
                  </span>
                  <span style={{ fontSize: typography.fontSize.metadata, color: color.text.dim }}>
                    {actual}% / {pillar.target}% target
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: radius.full,
                    background: 'rgba(255, 255, 255, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Actual fill */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${barWidth}%`,
                      borderRadius: radius.full,
                      background: pillar.color,
                      boxShadow: `0 0 8px ${pillar.color}60`,
                      transition: `width ${animation.duration.slow} ${animation.easing.default}`,
                    }}
                  />
                  {/* Target marker */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: `${pillar.target}%`,
                      width: '2px',
                      height: '10px',
                      background: color.text.dim,
                      borderRadius: '1px',
                    }}
                  />
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: '8px', padding: '8px', borderRadius: radius.md, background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ fontSize: typography.fontSize.metadata, color: color.text.dim, textAlign: 'center' }}>
              {totalPosts} total posts · {Object.keys(pillarCounts).length}/{Object.keys(pillars).length} pillars active
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
