'use client';

import { useState, useMemo } from 'react';
import { color, typography, radius, animation } from '@/styles/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassSelect } from '@/components/ui/GlassSelect';
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
  const [monthFilter, setMonthFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');

  // Build month options from post dates
  const monthOptions = useMemo(() => {
    const months = new Map<string, string>();
    posts.forEach(p => {
      const d = new Date(p.publishedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.set(key, label);
    });
    // Sort descending
    return Array.from(months.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, label]) => ({ value, label }));
  }, [posts]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...posts];
    if (monthFilter !== 'all') {
      result = result.filter(p => {
        const d = new Date(p.publishedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === monthFilter;
      });
    }
    if (pillarFilter !== 'all') {
      result = result.filter(p => p.pillar === pillarFilter);
    }
    return result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [posts, monthFilter, pillarFilter]);

  return (
    <GlassCard padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <SectionHeading title="Post History" icon="📰" badge={filtered.length} />

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Pillar filter buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <FilterPill
              label="All"
              active={pillarFilter === 'all'}
              onClick={() => setPillarFilter('all')}
            />
            {Object.entries(pillars).map(([key, p]) => (
              <FilterPill
                key={key}
                label={p.label}
                active={pillarFilter === key}
                color={p.color}
                onClick={() => setPillarFilter(pillarFilter === key ? 'all' : key)}
              />
            ))}
          </div>

          {/* Month dropdown */}
          <GlassSelect
            size="sm"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            options={[{ value: 'all', label: 'All Months' }, ...monthOptions]}
            style={{ minWidth: '150px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((post) => {
          const pillarConf = pillars[post.pillar];
          const isExpanded = expandedId === post.id;
          const date = new Date(post.publishedAt);
          const totalViews = Object.values(post.metrics).reduce((s, m) => s + (m.views || 0), 0);
          const totalLikes = Object.values(post.metrics).reduce((s, m) => s + (m.likes || 0), 0);
          const totalReplies = Object.values(post.metrics).reduce((s, m) => s + (m.replies || 0) + (m.comments || 0), 0);

          return (
            <div
              key={post.id}
              onClick={() => setExpandedId(isExpanded ? null : post.id)}
              style={{
                padding: '12px 16px',
                borderRadius: radius.lg,
                background: isExpanded ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isExpanded ? color.glass.borderHover : color.glass.border}`,
                cursor: 'pointer',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color.glass.borderHover;
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) e.currentTarget.style.borderColor = color.glass.border;
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
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {pillarConf?.label || post.pillar} · {post.type}
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
                  <MetricCell value={totalViews} label="views" />
                  <MetricCell value={totalLikes} label="likes" />
                  <MetricCell value={totalReplies} label="replies" />
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
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {Object.entries(post.metrics).map(([platform, m]) => {
                        const pd = PLATFORM_DISPLAY[platform];
                        const hasData = (m.views || 0) > 0 || (m.likes || 0) > 0;
                        return (
                          <div
                            key={platform}
                            style={{
                              padding: '8px 12px',
                              borderRadius: radius.md,
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: `1px solid ${color.glass.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: typography.fontSize.metadata,
                              color: color.text.secondary,
                            }}
                          >
                            <span style={{ color: pd?.color, fontWeight: typography.fontWeight.bold, fontSize: '12px' }}>
                              {pd?.icon || platform}
                            </span>
                            <span>{m.views || 0} views</span>
                            <span style={{ color: color.text.dim }}>·</span>
                            <span>{m.likes || 0} ❤️</span>
                            {m.replies != null && <><span style={{ color: color.text.dim }}>·</span><span>{m.replies} 💬</span></>}
                            {m.comments != null && <><span style={{ color: color.text.dim }}>·</span><span>{m.comments} 💬</span></>}
                            {m.reposts != null && m.reposts > 0 && <><span style={{ color: color.text.dim }}>·</span><span>{m.reposts} 🔄</span></>}
                            {m.shares != null && m.shares > 0 && <><span style={{ color: color.text.dim }}>·</span><span>{m.shares} 📤</span></>}
                            {!hasData && <span style={{ color: color.text.dim, fontStyle: 'italic' }}>No data yet</span>}
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

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: color.text.dim, fontSize: typography.fontSize.body }}>
            {posts.length === 0 ? 'No posts yet. Time to start creating!' : 'No posts match the current filters.'}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function MetricCell({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.medium, color: color.text.primary }}>
        {value > 0 ? value.toLocaleString() : '—'}
      </div>
      <div style={{ fontSize: '9px', color: color.text.dim }}>{label}</div>
    </div>
  );
}

function FilterPill({ label, active, color: pillColor, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: radius.full,
        fontSize: typography.fontSize.metadata,
        fontWeight: active ? typography.fontWeight.medium : typography.fontWeight.regular,
        cursor: 'pointer',
        border: `1px solid ${active ? (pillColor || color.ember.DEFAULT) + '60' : color.glass.border}`,
        background: active ? (pillColor || color.ember.DEFAULT) + '20' : 'transparent',
        color: active ? (pillColor || color.ember.flame) : color.text.dim,
        transition: `all ${animation.duration.fast}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
}
