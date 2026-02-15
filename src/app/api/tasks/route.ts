import { NextRequest, NextResponse } from 'next/server';
import { readKanbanData, writeKanbanData } from '@/lib/data';
import type { KanbanCard } from '@/lib/types';

interface TaskBody {
  title?: string;
  task?: string;
  name?: string;
  Thought?: string;
  description?: string;
  desc?: string;
  details?: string;
  Extra?: string;
  owner?: string;
  column?: string;
  priority?: 'none' | 'low' | 'medium' | 'high';
  Urgency?: string;
  Client?: string;
  tags?: string[];
  dueDate?: string;
  due?: string;
  Due?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: TaskBody;
    const contentType = request.headers.get('content-type') ?? '';
    
    if (contentType.includes('application/json')) {
      body = await request.json() as TaskBody;
    } else if (contentType.includes('form')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as unknown as TaskBody;
    } else {
      // Try JSON first, fall back to text as title
      try {
        body = await request.json() as TaskBody;
      } catch {
        const text = await request.text();
        body = { title: text || 'Untitled Task' };
      }
    }
    
    // Flexible field names for different shortcut formats
    const title = body.title ?? body.task ?? body.name ?? body.Thought ?? 'Untitled Task';
    const description = body.description ?? body.desc ?? body.details ?? body.Extra ?? '';
    const owner = body.owner ?? 'aaron';
    const client = body.Client ?? '';
    const targetColumn = body.column ?? 'todo';
    
    // Map urgency strings to priority
    const urgencyMap: Record<string, 'none' | 'low' | 'medium' | 'high'> = {
      'urgent': 'high',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'no priority': 'none',
    };
    const priority = body.priority ?? urgencyMap[(body.Urgency ?? '').toLowerCase()] ?? 'none';
    
    const tags = body.tags ?? [];
    const dueDate = body.dueDate ?? body.due ?? body.Due ?? '';

    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      title,
      description,
      owner,
      priority,
      tags,
      notes: '',
      created: new Date().toISOString(),
      ...(client ? { client } : {}),
      ...(dueDate ? { dueDate } : {}),
    };

    const data = await readKanbanData();
    
    // Find target column (flexible matching)
    const column = data.columns.find((c) => 
      c.id === targetColumn || 
      c.title.toLowerCase().includes(targetColumn.toLowerCase())
    );

    if (!column) {
      return NextResponse.json(
        { error: `Column "${targetColumn}" not found`, availableColumns: data.columns.map(c => c.id) },
        { status: 400 }
      );
    }

    column.cards.push(newCard);
    data.lastUpdated = new Date().toISOString();
    await writeKanbanData(data);

    return NextResponse.json({ 
      success: true, 
      card: newCard,
      column: column.title,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// GET — list tasks (optional column filter)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const columnFilter = searchParams.get('column');

    const data = await readKanbanData();
    
    if (columnFilter) {
      const column = data.columns.find((c) => 
        c.id === columnFilter || 
        c.title.toLowerCase().includes(columnFilter.toLowerCase())
      );
      if (!column) {
        return NextResponse.json({ tasks: [], column: null });
      }
      return NextResponse.json({ tasks: column.cards, column: column.title });
    }

    // Return all tasks grouped by column
    const all = data.columns.map(c => ({
      column: c.title,
      columnId: c.id,
      tasks: c.cards,
    }));

    return NextResponse.json({ columns: all });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
