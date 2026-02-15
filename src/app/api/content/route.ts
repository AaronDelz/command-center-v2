import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_PATH = path.join(process.cwd(), 'data', 'content.json');

interface ContentData {
  streak: { current: number; best: number; lastPostDate: string };
  weeklyScorecard: {
    weekOf: string;
    [key: string]: { actual: number; target: number } | string;
  };
  schedule: Record<string, {
    day: string;
    theme: string;
    tasks: Array<{ text: string; done: boolean }>;
  }>;
  platforms: Record<string, number>;
  lastUpdated: string;
}

async function readContentData(): Promise<ContentData> {
  const content = await fs.readFile(CONTENT_PATH, 'utf-8');
  return JSON.parse(content) as ContentData;
}

async function writeContentData(data: ContentData): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(CONTENT_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(): Promise<NextResponse> {
  try {
    const data = await readContentData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content data' }, { status: 500 });
  }
}

interface PatchBody {
  action: 'updateScorecard' | 'updateStreak' | 'toggleTask' | 'updatePlatforms';
  metric?: string;
  actual?: number;
  streak?: { current: number; best: number; lastPostDate: string };
  date?: string;
  taskIndex?: number;
  platforms?: Record<string, number>;
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as PatchBody;
    const data = await readContentData();

    switch (body.action) {
      case 'updateScorecard': {
        if (body.metric && typeof body.actual === 'number') {
          const scorecard = data.weeklyScorecard as Record<string, unknown>;
          const metric = scorecard[body.metric] as { actual: number; target: number } | undefined;
          if (metric && typeof metric === 'object') {
            metric.actual = body.actual;
          }
        }
        break;
      }
      case 'updateStreak': {
        if (body.streak) {
          data.streak = body.streak;
        }
        break;
      }
      case 'toggleTask': {
        if (body.date && typeof body.taskIndex === 'number') {
          const day = data.schedule[body.date];
          if (day && day.tasks[body.taskIndex] !== undefined) {
            day.tasks[body.taskIndex].done = !day.tasks[body.taskIndex].done;
          }
        }
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

    await writeContentData(data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/content error:', error);
    return NextResponse.json({ error: 'Failed to update content data' }, { status: 500 });
  }
}
