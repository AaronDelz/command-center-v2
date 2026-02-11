import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { ActivityEntry } from '@/lib/types';

const STATUS_FILE_PATH = path.join(
  process.cwd(),
  '../orion-dashboard/src/status.json'
);

const ACTIVITY_DIR = path.join(process.cwd(), 'data/activity');

interface StatusLogEntry {
  time: string;
  action: string;
}

interface StatusData {
  activityLog?: StatusLogEntry[];
}

function parseActionType(action: string): string {
  if (action.includes('State →')) {
    const stateMatch = action.match(/State → (\w+)/);
    return stateMatch ? stateMatch[1] : 'state';
  }
  if (action.toLowerCase().includes('tool')) return 'tool';
  if (action.toLowerCase().includes('file')) return 'file';
  if (action.toLowerCase().includes('message')) return 'message';
  if (action.toLowerCase().includes('exec')) return 'exec';
  return 'activity';
}

function getTodayDateStr(): string {
  // MST = UTC-7
  const now = new Date();
  const mst = new Date(now.getTime() - 7 * 60 * 60 * 1000);
  return mst.toISOString().split('T')[0];
}

function getDateFilePath(dateStr: string): string {
  return path.join(ACTIVITY_DIR, `${dateStr}.json`);
}

async function readDailyLog(dateStr: string): Promise<ActivityEntry[]> {
  const filePath = getDateFilePath(dateStr);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as ActivityEntry[];
  } catch {
    return [];
  }
}

async function writeDailyLog(dateStr: string, entries: ActivityEntry[]): Promise<void> {
  await fs.mkdir(ACTIVITY_DIR, { recursive: true });
  const filePath = getDateFilePath(dateStr);
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
}

async function syncFromStatusBridge(): Promise<void> {
  try {
    const fileContent = await fs.readFile(STATUS_FILE_PATH, 'utf-8');
    const statusData = JSON.parse(fileContent) as StatusData;
    const activityLog = statusData.activityLog ?? [];
    
    if (activityLog.length === 0) return;

    // Group entries by date (MST)
    const byDate: Record<string, ActivityEntry[]> = {};
    
    for (const entry of activityLog) {
      const entryTime = new Date(entry.time);
      const mstTime = new Date(entryTime.getTime() - 7 * 60 * 60 * 1000);
      const dateStr = mstTime.toISOString().split('T')[0];
      
      if (!byDate[dateStr]) byDate[dateStr] = [];
      
      byDate[dateStr].push({
        id: `activity-${entry.time}-${entry.action.slice(0, 20)}`,
        timestamp: entry.time,
        type: parseActionType(entry.action),
        description: entry.action,
      });
    }

    // Merge into daily files (avoid duplicates by timestamp+description)
    for (const [dateStr, newEntries] of Object.entries(byDate)) {
      const existing = await readDailyLog(dateStr);
      const existingKeys = new Set(existing.map(e => `${e.timestamp}|${e.description}`));
      
      const merged = [...existing];
      for (const entry of newEntries) {
        const key = `${entry.timestamp}|${entry.description}`;
        if (!existingKeys.has(key)) {
          merged.push(entry);
          existingKeys.add(key);
        }
      }
      
      // Sort by timestamp
      merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      await writeDailyLog(dateStr, merged);
    }
  } catch (error) {
    console.error('Error syncing from status bridge:', error);
  }
}

async function getAvailableDates(): Promise<string[]> {
  try {
    const files = await fs.readdir(ACTIVITY_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Sync latest from bridge on every request
    await syncFromStatusBridge();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const dateStr = dateParam ?? getTodayDateStr();

    const entries = await readDailyLog(dateStr);
    const dates = await getAvailableDates();

    return NextResponse.json({
      entries,
      date: dateStr,
      availableDates: dates,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GET /api/activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}
