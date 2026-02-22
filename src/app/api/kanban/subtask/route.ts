import { NextResponse } from 'next/server';
import { readKanbanData, writeKanbanData } from '@/lib/data';

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const { cardId, subtaskId, completed } = await request.json() as {
      cardId: string;
      subtaskId: string;
      completed: boolean;
    };

    const data = await readKanbanData();

    for (const col of data.columns) {
      const card = col.cards.find(c => c.id === cardId);
      if (card && card.subtasks) {
        const sub = card.subtasks.find(s => s.id === subtaskId);
        if (sub) {
          sub.completed = completed;
          data.lastUpdated = new Date().toISOString();
          await writeKanbanData(data);
          return NextResponse.json({ success: true });
        }
      }
    }

    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  } catch (error) {
    console.error('PATCH /api/kanban/subtask error:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}
