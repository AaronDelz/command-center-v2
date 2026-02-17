import { NextRequest, NextResponse } from 'next/server';
import { readDropsData, writeDropsData } from '@/lib/data';
import type { Drop, DropType, JournalTag } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as DropType | null;
    const limit = searchParams.get('limit');

    const data = await readDropsData();
    let drops = data.drops;

    // Filter by type if provided
    if (type) {
      drops = drops.filter((drop) => drop.type === type);
    }

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        drops = drops.slice(0, limitNum);
      }
    }

    // Sort by createdAt descending (newest first)
    drops.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ drops, lastUpdated: data.lastUpdated });
  } catch (error) {
    console.error('GET /api/drops error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drops' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      type: DropType;
      content: string;
      url?: string;
      files?: string[];
      journalTag?: JournalTag;
    };

    if (!body.type || !body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Type and content are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: DropType[] = ['note', 'idea', 'link', 'task', 'file', 'unsorted'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid drop type' },
        { status: 400 }
      );
    }

    const data = await readDropsData();

    const newDrop: Drop = {
      id: `drop-${Date.now()}`,
      type: body.type,
      content: body.content.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    // Add optional fields
    if (body.url) newDrop.url = body.url;
    if (body.files && body.files.length > 0) newDrop.files = body.files;
    if (body.journalTag) {
      const validTags: JournalTag[] = ['discussed', 'decisions', 'built', 'insight', 'open'];
      if (validTags.includes(body.journalTag)) {
        newDrop.journalTag = body.journalTag;
      }
    }

    // Add to the beginning of the drops array
    const updatedDrops = [newDrop, ...data.drops];
    
    await writeDropsData({
      drops: updatedDrops,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json(newDrop, { status: 201 });
  } catch (error) {
    console.error('POST /api/drops error:', error);
    return NextResponse.json(
      { error: 'Failed to create drop' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      id: string;
      type?: DropType;
      content?: string;
      status?: Drop['status'];
      promotedTo?: string;
      journalTag?: JournalTag | null;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: 'Drop ID is required' },
        { status: 400 }
      );
    }

    const data = await readDropsData();
    const dropIndex = data.drops.findIndex((d) => d.id === body.id);

    if (dropIndex === -1) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    const updatedDrop: Drop = { ...data.drops[dropIndex] };

    // Update fields if provided
    if (body.type) {
      const validTypes: DropType[] = ['note', 'idea', 'link', 'task', 'file', 'unsorted'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Invalid drop type' },
          { status: 400 }
        );
      }
      updatedDrop.type = body.type;
    }

    if (body.content) {
      updatedDrop.content = body.content.trim();
    }

    if (body.status) {
      const validStatuses: Drop['status'][] = ['new', 'triaged', 'promoted', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updatedDrop.status = body.status;
    }

    if (body.promotedTo) {
      updatedDrop.promotedTo = body.promotedTo;
    }

    if (body.journalTag !== undefined) {
      if (body.journalTag === null) {
        delete updatedDrop.journalTag;
      } else {
        const validTags: JournalTag[] = ['discussed', 'decisions', 'built', 'insight', 'open'];
        if (validTags.includes(body.journalTag)) {
          updatedDrop.journalTag = body.journalTag;
        }
      }
    }

    updatedDrop.updatedAt = new Date().toISOString();

    data.drops[dropIndex] = updatedDrop;
    
    await writeDropsData({
      ...data,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json(updatedDrop);
  } catch (error) {
    console.error('PATCH /api/drops error:', error);
    return NextResponse.json(
      { error: 'Failed to update drop' },
      { status: 500 }
    );
  }
}