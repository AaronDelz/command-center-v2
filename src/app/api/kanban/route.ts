import { NextResponse } from 'next/server';
import { readKanbanData, writeKanbanData } from '@/lib/data';
import type { KanbanData, KanbanCard } from '@/lib/types';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await readKanbanData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/kanban error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kanban data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as KanbanData;
    
    // Update lastUpdated timestamp
    body.lastUpdated = new Date().toISOString();
    
    await writeKanbanData(body);
    return NextResponse.json({ success: true, lastUpdated: body.lastUpdated });
  } catch (error) {
    console.error('POST /api/kanban error:', error);
    return NextResponse.json(
      { error: 'Failed to save kanban data' },
      { status: 500 }
    );
  }
}

interface PatchRequest {
  card: KanbanCard;
  fromColumnId: string;
  toColumnId: string;
  isNew: boolean;
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as PatchRequest;
    const { card, fromColumnId, toColumnId, isNew } = body;

    const data = await readKanbanData();

    if (isNew) {
      // Add new card to target column
      const targetColumn = data.columns.find((c) => c.id === toColumnId);
      if (!targetColumn) {
        return NextResponse.json(
          { error: 'Target column not found' },
          { status: 400 }
        );
      }
      targetColumn.cards.push(card);
    } else {
      // Update existing card
      const fromColumn = data.columns.find((c) => c.id === fromColumnId);
      const toColumn = data.columns.find((c) => c.id === toColumnId);

      if (!fromColumn || !toColumn) {
        return NextResponse.json(
          { error: 'Column not found' },
          { status: 400 }
        );
      }

      // Remove card from source column
      const cardIndex = fromColumn.cards.findIndex((c) => c.id === card.id);
      if (cardIndex === -1) {
        return NextResponse.json(
          { error: 'Card not found' },
          { status: 404 }
        );
      }
      fromColumn.cards.splice(cardIndex, 1);

      // Add updated card to target column
      toColumn.cards.push(card);
    }

    data.lastUpdated = new Date().toISOString();
    await writeKanbanData(data);

    return NextResponse.json({ success: true, lastUpdated: data.lastUpdated });
  } catch (error) {
    console.error('PATCH /api/kanban error:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

interface DeleteRequest {
  cardId: string;
  columnId: string;
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as DeleteRequest;
    const { cardId, columnId } = body;

    const data = await readKanbanData();

    const column = data.columns.find((c) => c.id === columnId);
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 400 }
      );
    }

    const cardIndex = column.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    column.cards.splice(cardIndex, 1);
    data.lastUpdated = new Date().toISOString();
    await writeKanbanData(data);

    return NextResponse.json({ success: true, lastUpdated: data.lastUpdated });
  } catch (error) {
    console.error('DELETE /api/kanban error:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}
