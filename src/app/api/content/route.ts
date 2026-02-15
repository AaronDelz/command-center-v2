import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const CONTENT_PATH = path.join(process.cwd(), 'data', 'content.json');

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
  platforms: Record<string, Record<string, unknown>>;
  pillars: Record<string, { label: string; target: number; color: string }>;
  lastUpdated: string;
}

async function readData(): Promise<ContentData> {
  const content = await fs.readFile(CONTENT_PATH, 'utf-8');
  return JSON.parse(content) as ContentData;
}

async function writeData(data: ContentData): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(CONTENT_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await readData();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'posts') return NextResponse.json(data.posts);
    if (type === 'drafts') return NextResponse.json(data.drafts);
    if (type === 'streak') return NextResponse.json(data.streak);
    if (type === 'platforms') return NextResponse.json(data.platforms);

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content data' }, { status: 500 });
  }
}

interface PostBody {
  action: 'addPost' | 'addDraft' | 'updateDraft' | 'deleteDraft' | 'publishDraft' | 'updateStreak' | 'updateMetrics' | 'updatePlatforms';
  post?: Partial<Post>;
  draft?: Partial<Draft>;
  draftId?: string;
  streak?: ContentData['streak'];
  postId?: string;
  platform?: string;
  metrics?: PostMetrics;
  platforms?: Record<string, Record<string, unknown>>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as PostBody;
    const data = await readData();

    switch (body.action) {
      case 'addPost': {
        if (!body.post) return NextResponse.json({ error: 'Missing post data' }, { status: 400 });
        const newPost: Post = {
          id: `post-${randomUUID().slice(0, 8)}`,
          title: body.post.title || '',
          content: body.post.content || '',
          pillar: body.post.pillar || 'build',
          type: body.post.type || 'tip',
          platforms: body.post.platforms || ['x'],
          publishedAt: body.post.publishedAt || new Date().toISOString(),
          metrics: body.post.metrics || {},
        };
        data.posts.unshift(newPost);
        data.stats.totalPosts = data.posts.length;
        const now = new Date();
        data.stats.postsThisMonth = data.posts.filter(p => {
          const d = new Date(p.publishedAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        break;
      }
      case 'addDraft': {
        if (!body.draft) return NextResponse.json({ error: 'Missing draft data' }, { status: 400 });
        const newDraft: Draft = {
          id: `draft-${randomUUID().slice(0, 8)}`,
          title: body.draft.title || '',
          content: body.draft.content || '',
          pillar: body.draft.pillar || 'build',
          type: body.draft.type || 'tip',
          platforms: body.draft.platforms || ['x'],
          status: body.draft.status || 'idea',
          scheduledFor: body.draft.scheduledFor || null,
          createdAt: new Date().toISOString(),
        };
        data.drafts.push(newDraft);
        break;
      }
      case 'updateDraft': {
        if (!body.draftId || !body.draft) return NextResponse.json({ error: 'Missing draft id or data' }, { status: 400 });
        const idx = data.drafts.findIndex(d => d.id === body.draftId);
        if (idx === -1) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        data.drafts[idx] = { ...data.drafts[idx], ...body.draft };
        break;
      }
      case 'deleteDraft': {
        if (!body.draftId) return NextResponse.json({ error: 'Missing draft id' }, { status: 400 });
        data.drafts = data.drafts.filter(d => d.id !== body.draftId);
        break;
      }
      case 'publishDraft': {
        if (!body.draftId) return NextResponse.json({ error: 'Missing draft id' }, { status: 400 });
        const draftIdx = data.drafts.findIndex(d => d.id === body.draftId);
        if (draftIdx === -1) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        const draft = data.drafts[draftIdx];
        const published: Post = {
          id: `post-${randomUUID().slice(0, 8)}`,
          title: draft.title,
          content: draft.content,
          pillar: draft.pillar,
          type: draft.type,
          platforms: draft.platforms,
          publishedAt: new Date().toISOString(),
          metrics: {},
        };
        data.posts.unshift(published);
        data.drafts.splice(draftIdx, 1);
        data.stats.totalPosts = data.posts.length;
        break;
      }
      case 'updateStreak': {
        if (body.streak) data.streak = body.streak;
        break;
      }
      case 'updateMetrics': {
        if (!body.postId || !body.platform || !body.metrics) {
          return NextResponse.json({ error: 'Missing post id, platform, or metrics' }, { status: 400 });
        }
        const post = data.posts.find(p => p.id === body.postId);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        post.metrics[body.platform] = { ...post.metrics[body.platform], ...body.metrics };
        // Recalc total impressions
        data.stats.totalImpressions = data.posts.reduce((sum, p) => {
          return sum + Object.values(p.metrics).reduce((s, m) => s + (m.views || 0), 0);
        }, 0);
        break;
      }
      case 'updatePlatforms': {
        if (body.platforms) {
          data.platforms = { ...data.platforms, ...body.platforms };
        }
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    await writeData(data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('POST /api/content error:', error);
    return NextResponse.json({ error: 'Failed to update content data' }, { status: 500 });
  }
}

// Keep PATCH for backward compatibility
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return POST(request);
}
