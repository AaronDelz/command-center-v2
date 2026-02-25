import { NextRequest, NextResponse } from 'next/server';
import { readWebhooksData, writeWebhooksData } from '@/lib/data';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await readWebhooksData();
    const unseen = request.nextUrl.searchParams.get('unseen');

    let events = data.events;
    if (unseen === 'true') {
      events = events.filter(e => !e.seen);
    }

    return NextResponse.json({ events, lastUpdated: data.lastUpdated });
  } catch (error) {
    console.error('GET /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// PATCH to mark events as seen
export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { id, markAllSeen } = body as { id?: string; markAllSeen?: boolean };

    const data = await readWebhooksData();

    if (markAllSeen) {
      data.events.forEach(e => { e.seen = true; });
    } else if (id) {
      const event = data.events.find(e => e.id === id);
      if (event) event.seen = true;
    }

    data.lastUpdated = new Date().toISOString();
    await writeWebhooksData(data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to update webhooks' },
      { status: 500 }
    );
  }
}
