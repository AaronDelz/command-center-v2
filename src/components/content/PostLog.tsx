'use client';

import { useState } from 'react';
import { color, typography, radius, animation } from '@/styles/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface PostMetrics {
  views?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  comments?: number;
  shares?: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  pillar: string;
  type: string;
  platforms: string[];
  publishedAt: string;
  metrics: Record<string, PostMetrics>;
}

interface Pillars {
  [key: string]: { label: string; target: number; color: string };
}

interface PostLogProps {
  posts: Post[];
  pillars: Pillars;
}

const PLATFORM_DISPLAY: Record<string, { icon: string; color: string }> = {
  x: { icon: '𝕏', color: '#1DA1F2' },
  facebook: { icon: 'f', color: '#1877F2' },
  youtube: { icon: '▶', color: '#FF0000' },
  community: { icon: '👥', color: '#4ade80' },
  linkedin: { icon: 'in', color: '#0A66C2' },
  instagram: { icon: '📷', color: '#E4405F' },
};

export function PostLog({ posts, pillars }: PostLogProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = [...posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <GlassCard padding="md">
      <SectionHeading title="Recent Posts" icon="📰" badge={posts.length} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((post) => {
          const pillarConf = pillars[post.pillar];
          const isExpanded = expandedId === post.id;
          const date = new Date(post.publishedAt);
          const totalViews = Object.values(post.metrics).reduce((s, m) => s + (m.views || 0), 0);
          const totalLikes = Object.values(post.metrics).reduce((s, m) => s + (m.likes || 0), 0);

          return (
            <div
              key={post.id}
              onClick={() => setExpandedId(isExpanded ? null : post.id)}
              style={{
                padding: '12px 16px',
                borderRadius: radius.lg,
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${color.glass.border}`,
                cursor: 'pointer',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color.glass.borderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = color.glass.border;
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Pillar dot */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: pillarConf?.color || color.text.dim,
                    boxShadow: `0 0 6px ${pillarConf?.color || color.text.dim}`,
                    flexShrink: 0,
                  }}
                />

                {/* Title + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.cardTitle,
                      fontWeight: typography.fontWeight.medium,
                      color: color.text.primary,
                    }}
                  >
                    {post.title}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.metadata,
                      color: color.text.dim,
                      marginTop: '2px',
                    }}
                  >
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {pillarConf?.label || post.pillar}
                  </div>
                </div>

                {/* Platform icons */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {post.platforms.map(p => {
                    const pd = PLATFORM_DISPLAY[p];
                    return (
                      <div
                        key={p}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: radius.full,
                          background: `${pd?.color || color.text.dim}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: typography.fontWeight.bold,
                          color: pd?.color || color.text.secondary,
                        }}
                        title={p}
                      >
                        {pd?.icon || p[0]}
                      </div>
                    );
                  })}
                </div>

                {/* Metrics summary */}
                <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.medium, color: color.text.primary }}>
                      {totalViews > 0 ? totalViews.toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: '9px', color: color.text.dim }}>views</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.medium, color: color.text.primary }}>
                      {totalLikes > 0 ? totalLikes.toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: '9px', color: color.text.dim }}>likes</div>
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${color.glass.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: typography.fontSize.body,
                      color: color.text.secondary,
                      lineHeight: typography.lineHeight.relaxed,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {post.content}
                  </div>

                  {/* Per-platform metrics */}
                  {Object.keys(post.metrics).length > 0 && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {Object.entries(post.metrics).map(([platform, m]) => {
                        const pd = PLATFORM_DISPLAY[platform];
                        return (
                          <div
                            key={platform}
                            style={{
                              padding: '6px 10px',
                              borderRadius: radius.md,
                              background: 'rgba(255, 255, 255, 0.03)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: typography.fontSize.metadata,
                              color: color.text.secondary,
                            }}
                          >
                            <span style={{ color: pd?.color, fontWeight: typography.fontWeight.bold, fontSize: '11px' }}>
                              {pd?.icon || platform}
                            </span>
                            <span>{m.views || 0} views</span>
                            <span>·</span>
                            <span>{m.likes || 0} ❤️</span>
                            {m.replies != null && <><span>·</span><span>{m.replies} 💬</span></>}
                            {m.comments != null && <><span>·</span><span>{m.comments} 💬</span></>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: color.text.dim, fontSize: typography.fontSize.body }}>
            No posts yet. Time to start creating!
          </div>
        )}
      </div>
    </GlassCard>
  );
}
