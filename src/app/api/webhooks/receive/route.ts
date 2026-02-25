import { NextResponse } from 'next/server';
import { readWebhooksData, writeWebhooksData, readKanbanData, writeKanbanData } from '@/lib/data';
import type { WebhookEvent } from '@/lib/types';

const MAX_EVENTS = 100;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate source field
    if (!body.source || typeof body.source !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: source' },
        { status: 400 }
      );
    }

    const id = `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const event: WebhookEvent = {
      id,
      source: body.source,
      event: body.event || undefined,
      payload: body.payload || body,
      receivedAt: new Date().toISOString(),
      seen: false,
    };

    // If payload is the whole body, remove source/event duplication
    if (!body.payload) {
      const { source: _s, event: _e, ...rest } = body;
      event.payload = rest;
    }

    const data = await readWebhooksData();
    data.events.unshift(event);

    // Trim to max
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(0, MAX_EVENTS);
    }

    data.lastUpdated = new Date().toISOString();
    await writeWebhooksData(data);

    // Auto-create kanban card for task_create events
    if (body.event === 'task_create' && body.payload?.title) {
      try {
        const kanban = await readKanbanData();
        const todoCol = kanban.columns.find(c => c.id === 'todo');
        if (todoCol) {
          todoCol.cards.push({
            id: `webhook-${id}`,
            title: body.payload.title,
            description: body.payload.description || `Created via webhook from ${body.source}`,
            owner: body.payload.owner || 'aaron',
            priority: body.payload.priority || 'medium',
            tags: ['webhook', ...(body.payload.tags || [])],
            notes: `Source: ${body.source} | Webhook ID: ${id}`,
            source: 'webhook',
            created: new Date().toISOString(),
          });
          kanban.lastUpdated = new Date().toISOString();
          await writeKanbanData(kanban);
        }
      } catch (err) {
        console.error('Failed to create kanban card from webhook:', err);
      }
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('POST /api/webhooks/receive error:', error);
    return NextResponse.json(
      { ok: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
