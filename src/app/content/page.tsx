'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDynamicSubtitle } from '@/lib/subtitles';
import { StreakCounter } from '@/components/content/StreakCounter';
import { WeekCalendar } from '@/components/content/WeekCalendar';
import { DraftQueue } from '@/components/content/DraftQueue';
import { PostLog } from '@/components/content/PostLog';
import { PlatformStats } from '@/components/content/PlatformStats';

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

interface Draft {
  id: string;
  title: string;
  content: string;
  pillar: string;
  type: string;
  platforms: string[];
  status: 'idea' | 'outline' | 'inProgress' | 'ready';
  scheduledFor: string | null;
  createdAt: string;
}

interface ContentData {
  streak: { current: number; best: number; lastPostDate: string; startDate: string };
  stats: { postsThisMonth: number; totalImpressions: number; totalPosts: number; avgEngagement: number };
  posts: Post[];
  drafts: Draft[];
  weekSchedule: Record<string, { theme: string; pillar: string | null }>;
  platforms: Record<string, { followers?: number; subscribers?: number; members?: number; connections?: number; color: string; icon: string }>;
  pillars: Record<string, { label: string; target: number; color: string }>;
  lastUpdated: string;
}

export default function ContentPage(): React.ReactElement {
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/content');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch content data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const apiCall = useCallback(async (body: Record<string, unknown>) => {
    try {
      await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      fetchData();
    } catch (err) {
      console.error('API call failed:', err);
    }
  }, [fetchData]);

  const handleStatusChange = useCallback((draftId: string, newStatus: Draft['status']) => {
    apiCall({ action: 'updateDraft', draftId, draft: { status: newStatus } });
  }, [apiCall]);

  const handleDraftUpdate = useCallback((draftId: string, updates: Partial<Draft>) => {
    apiCall({ action: 'updateDraft', draftId, draft: updates });
  }, [apiCall]);

  const handleDraftDelete = useCallback((draftId: string) => {
    apiCall({ action: 'deleteDraft', draftId });
  }, [apiCall]);

  const handleDraftCreate = useCallback((draft: Partial<Draft>) => {
    apiCall({ action: 'addDraft', draft });
  }, [apiCall]);

  // Extract all post dates for heatmap
  const postDates = useMemo(() => {
    if (!data) return [];
    return data.posts.map(p => p.publishedAt);
  }, [data]);

  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Content Hub" subtitle={getDynamicSubtitle('content')} />
        <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔥</div>
          <p>Loading the forge...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title="Content Hub" subtitle={getDynamicSubtitle('content')} />

      {/* Row 1: Streak + Stats */}
      <StreakCounter
        current={data.streak.current}
        best={data.streak.best}
        lastPostDate={data.streak.lastPostDate}
        postsThisMonth={data.stats.postsThisMonth}
        totalImpressions={data.stats.totalImpressions}
        postDates={postDates}
      />

      {/* Row 2: Week Calendar */}
      <WeekCalendar
        posts={data.posts}
        drafts={data.drafts}
        weekSchedule={data.weekSchedule}
        pillars={data.pillars}
      />

      {/* Row 3: Draft Queue */}
      <DraftQueue
        drafts={data.drafts}
        pillars={data.pillars}
        onStatusChange={handleStatusChange}
        onDraftUpdate={handleDraftUpdate}
        onDraftDelete={handleDraftDelete}
        onDraftCreate={handleDraftCreate}
      />

      {/* Row 4: Platform Stats + Content Mix */}
      <PlatformStats
        platforms={data.platforms}
        posts={data.posts}
        pillars={data.pillars}
        totalPosts={data.stats.totalPosts}
      />

      {/* Row 5: Post History */}
      <PostLog posts={data.posts} pillars={data.pillars} />
    </div>
  );
}
