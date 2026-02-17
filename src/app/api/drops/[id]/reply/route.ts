import { NextRequest, NextResponse } from 'next/server';
import { readDropsData, writeDropsData } from '@/lib/data';
import type { Reply } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json() as {
      content: string;
      author: 'aaron' | 'orion';
    };

    if (!body.content || !body.author) {
      return NextResponse.json(
        { error: 'Content and author are required' },
        { status: 400 }
      );
    }

    if (!['aaron', 'orion'].includes(body.author)) {
      return NextResponse.json(
        { error: 'Author must be aaron or orion' },
        { status: 400 }
      );
    }

    const data = await readDropsData();
    const dropIndex = data.drops.findIndex((d) => d.id === id);

    if (dropIndex === -1) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    const reply: Reply = {
      id: `reply-${Date.now()}`,
      content: body.content.trim(),
      author: body.author,
      createdAt: new Date().toISOString(),
    };

    if (!data.drops[dropIndex].replies) {
      data.drops[dropIndex].replies = [];
    }
    data.drops[dropIndex].replies!.push(reply);
    data.drops[dropIndex].updatedAt = new Date().toISOString();

    await writeDropsData({
      ...data,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error('POST /api/drops/[id]/reply error:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}
