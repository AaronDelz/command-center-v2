import { NextRequest, NextResponse } from 'next/server';
import { readGoalsData, writeGoalsData } from '@/lib/data';
import type { Goal, GoalsData } from '@/lib/types';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await readGoalsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/goals error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as GoalsData;
    body.lastUpdated = new Date().toISOString();
    await writeGoalsData(body);
    return NextResponse.json(body);
  } catch (error) {
    console.error('POST /api/goals error:', error);
    return NextResponse.json({ error: 'Failed to save goals' }, { status: 500 });
  }
}

interface PatchBody {
  id: string;
  current?: number;
  status?: Goal['status'];
  milestones?: Goal['milestones'];
  title?: string;
  description?: string;
  target?: number;
  unit?: string;
  deadline?: string | null;
  category?: Goal['category'];
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as PatchBody;

    if (!body.id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const data = await readGoalsData();
    const idx = data.goals.findIndex((g) => g.id === body.id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goal = { ...data.goals[idx] };

    if (typeof body.current === 'number') goal.current = body.current;
    if (body.status) goal.status = body.status;
    if (body.milestones) goal.milestones = body.milestones;
    if (body.title) goal.title = body.title;
    if (body.description !== undefined) goal.description = body.description || undefined;
    if (typeof body.target === 'number') goal.target = body.target;
    if (body.unit) goal.unit = body.unit;
    if (body.deadline !== undefined) goal.deadline = body.deadline || undefined;
    if (body.category) goal.category = body.category;

    data.goals[idx] = goal;
    data.lastUpdated = new Date().toISOString();
    await writeGoalsData(data);

    return NextResponse.json(goal);
  } catch (error) {
    console.error('PATCH /api/goals error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
