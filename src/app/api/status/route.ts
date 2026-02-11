import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';

// Primary: V2 data folder (bridge writes here)
const STATUS_FILE = '/Users/Orion/Documents/projects/command-center-v2/data/status.json';
// Fallback: V1 location
const STATUS_FILE_V1 = '/Users/Orion/Documents/projects/orion-dashboard/src/status.json';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  try {
    let raw: string;
    try {
      raw = await fs.readFile(STATUS_FILE, 'utf-8');
    } catch {
      raw = await fs.readFile(STATUS_FILE_V1, 'utf-8');
    }
    const data = JSON.parse(raw);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('GET /api/status error:', error);
    return NextResponse.json(
      { state: 'idle', stateDescription: 'Status unavailable', currentTask: null, activityLog: [], subAgents: [] },
      { status: 200 }
    );
  }
}
