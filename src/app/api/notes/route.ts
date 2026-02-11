import { NextRequest, NextResponse } from 'next/server';
import { readNotesData, writeNotesData } from '@/lib/data';
import type { Note } from '@/lib/types';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await readNotesData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { text: string; tags?: string[] };
    
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const data = await readNotesData();
    
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: body.text.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      ...(body.tags && body.tags.length > 0 ? { tags: body.tags } : {}),
    };

    // Add new note at the beginning
    const updatedNotes = [newNote, ...data.notes];
    await writeNotesData(updatedNotes);

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

interface PatchBody {
  id: string;
  done?: boolean;
  text?: string;
  action?: 'addReply' | 'editReply' | 'editNote' | 'deleteReply' | 'deleteNote' | 'toggleTag';
  tag?: string;
  reply?: { from: string; text: string };
  replyIndex?: number;
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as PatchBody;
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const data = await readNotesData();
    const noteIndex = data.notes.findIndex((n) => n.id === body.id);

    if (noteIndex === -1) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const updatedNote: Note = { ...data.notes[noteIndex] };

    if (body.action === 'addReply') {
      if (!body.reply?.from || !body.reply?.text) {
        return NextResponse.json(
          { error: 'Reply from and text are required' },
          { status: 400 }
        );
      }
      if (!updatedNote.replies) updatedNote.replies = [];
      updatedNote.replies.push({
        from: body.reply.from,
        text: body.reply.text.trim(),
        at: new Date().toISOString(),
      });
    } else if (body.action === 'editReply') {
      if (typeof body.replyIndex !== 'number' || !body.text) {
        return NextResponse.json(
          { error: 'replyIndex and text are required' },
          { status: 400 }
        );
      }
      if (!updatedNote.replies || !updatedNote.replies[body.replyIndex]) {
        return NextResponse.json(
          { error: 'Reply not found' },
          { status: 404 }
        );
      }
      updatedNote.replies[body.replyIndex] = {
        ...updatedNote.replies[body.replyIndex],
        text: body.text.trim(),
        updatedAt: new Date().toISOString(),
      };
    } else if (body.action === 'deleteReply') {
      if (typeof body.replyIndex !== 'number') {
        return NextResponse.json(
          { error: 'replyIndex is required' },
          { status: 400 }
        );
      }
      if (!updatedNote.replies || !updatedNote.replies[body.replyIndex]) {
        return NextResponse.json(
          { error: 'Reply not found' },
          { status: 404 }
        );
      }
      updatedNote.replies.splice(body.replyIndex, 1);
    } else if (body.action === 'deleteNote') {
      data.notes.splice(noteIndex, 1);
      await writeNotesData(data.notes);
      return NextResponse.json({ success: true });
    } else if (body.action === 'toggleTag') {
      if (!body.tag) {
        return NextResponse.json(
          { error: 'Tag is required' },
          { status: 400 }
        );
      }
      if (!updatedNote.tags) updatedNote.tags = [];
      const tagIndex = updatedNote.tags.indexOf(body.tag);
      if (tagIndex === -1) {
        updatedNote.tags.push(body.tag);
      } else {
        updatedNote.tags.splice(tagIndex, 1);
      }
      if (updatedNote.tags.length === 0) delete updatedNote.tags;
    } else if (body.action === 'editNote') {
      if (!body.text) {
        return NextResponse.json(
          { error: 'Text is required' },
          { status: 400 }
        );
      }
      updatedNote.text = body.text.trim();
      updatedNote.updatedAt = new Date().toISOString();
    } else {
      // Legacy: toggle done / edit text without action
      if (typeof body.done === 'boolean') {
        updatedNote.done = body.done;
      }
      if (typeof body.text === 'string') {
        updatedNote.text = body.text.trim();
      }
    }

    data.notes[noteIndex] = updatedNote;
    await writeNotesData(data.notes);

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('PATCH /api/notes error:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}
