import { NextRequest, NextResponse } from 'next/server';
import { readDropsData, writeDropsData } from '@/lib/data';
import type { Drop } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { ids: string[] };

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 drop IDs are required' },
        { status: 400 }
      );
    }

    const data = await readDropsData();

    // Find all drops to merge
    const toMerge: Drop[] = [];
    for (const id of body.ids) {
      const drop = data.drops.find((d) => d.id === id);
      if (!drop) {
        return NextResponse.json(
          { error: `Drop not found: ${id}` },
          { status: 404 }
        );
      }
      toMerge.push(drop);
    }

    // Sort by createdAt ascending (earliest first)
    toMerge.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Determine type: use first item's type, or 'unsorted' if mixed
    const types = new Set(toMerge.map((d) => d.type));
    const mergedType = types.size === 1 ? toMerge[0].type : 'unsorted';

    // Combine content
    const mergedContent = toMerge.map((d) => d.content).join('\n\n---\n\n');

    // Collect URLs and files
    const urls = toMerge.filter((d) => d.url).map((d) => d.url!);
    const files = toMerge.flatMap((d) => d.files || []);

    // Use first item's journalTag if all same, otherwise omit
    const journalTags = new Set(toMerge.map((d) => d.journalTag).filter(Boolean));
    const mergedJournalTag = journalTags.size === 1 ? toMerge[0].journalTag : undefined;

    const mergedDrop: Drop = {
      id: `drop-${Date.now()}`,
      type: mergedType,
      content: mergedContent,
      status: 'new',
      createdAt: toMerge[0].createdAt, // earliest
      updatedAt: new Date().toISOString(),
    };

    if (urls.length > 0) mergedDrop.url = urls[0];
    if (files.length > 0) mergedDrop.files = files;
    if (mergedJournalTag) mergedDrop.journalTag = mergedJournalTag;

    // Remove originals and add merged
    const mergeIds = new Set(body.ids);
    const remaining = data.drops.filter((d) => !mergeIds.has(d.id));
    const updatedDrops = [mergedDrop, ...remaining];

    await writeDropsData({
      drops: updatedDrops,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json(mergedDrop, { status: 201 });
  } catch (error) {
    console.error('POST /api/drops/merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge drops' },
      { status: 500 }
    );
  }
}
