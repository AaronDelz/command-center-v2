import { NextRequest, NextResponse } from 'next/server';
import { readTimeEntriesData, writeTimeEntriesData } from '@/lib/data';
import type { TimeEntry, TimeEntriesData } from '@/lib/types';

// GET /api/time-entries - Fetch all time entries (supports ?clientId=xxx filter)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await readTimeEntriesData();
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    
    // Filter by clientId if provided
    if (clientId) {
      const filteredEntries = data.entries.filter(entry => entry.clientId === clientId);
      return NextResponse.json({
        ...data,
        entries: filteredEntries
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/time-entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
}

// POST /api/time-entries - Create new time entry or start timer
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await readTimeEntriesData();
    const body = await request.json() as Partial<TimeEntry>;
    
    // Validate required fields
    if (!body.clientId || !body.clientName || !body.description) {
      return NextResponse.json({ 
        error: 'clientId, clientName, and description are required' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}`,
      clientId: body.clientId,
      clientName: body.clientName,
      description: body.description,
      startTime: body.startTime || now,
      endTime: body.endTime,
      duration: body.duration,
      isRunning: body.isRunning ?? true, // Default to running if not specified
      tags: body.tags || [],
      billable: body.billable ?? true,
      rate: body.rate,
      createdAt: now,
    };

    data.entries.push(newEntry);
    
    // If starting a timer, set active timer
    if (newEntry.isRunning && !newEntry.endTime) {
      data.activeTimer = {
        entryId: newEntry.id,
        startedAt: newEntry.startTime,
      };
    }
    
    data.lastUpdated = now;
    await writeTimeEntriesData(data);
    
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('POST /api/time-entries error:', error);
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
  }
}

// PATCH /api/time-entries - Update existing time entry (stop timer, edit entry)
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { id: string; [key: string]: unknown };
    
    if (!body.id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const data = await readTimeEntriesData();
    const entryIndex = data.entries.findIndex((e) => e.id === body.id);
    
    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    const entry = { ...data.entries[entryIndex] };
    const now = new Date().toISOString();

    // Special handling for stopping a timer
    if (body.action === 'stop' && entry.isRunning) {
      entry.endTime = now;
      entry.isRunning = false;
      
      // Calculate duration in minutes
      const startTime = new Date(entry.startTime);
      const endTime = new Date(now);
      entry.duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      // Clear active timer if this is the active one
      if (data.activeTimer?.entryId === entry.id) {
        delete data.activeTimer;
      }
    } else {
      // Regular field updates
      const allowedFields = ['clientId', 'clientName', 'description', 'startTime', 'endTime', 
        'duration', 'isRunning', 'tags', 'billable', 'rate', 'notes'];
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          (entry as Record<string, unknown>)[field] = body[field];
        }
      }
      
      // Recalculate duration if start/end times changed
      if ((body.startTime || body.endTime) && entry.endTime) {
        const startTime = new Date(entry.startTime);
        const endTime = new Date(entry.endTime);
        entry.duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }
    }

    entry.updatedAt = now;
    data.entries[entryIndex] = entry;
    data.lastUpdated = now;
    
    await writeTimeEntriesData(data);
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('PATCH /api/time-entries error:', error);
    return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 });
  }
}

// DELETE /api/time-entries?id=xxx - Delete time entry
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const data = await readTimeEntriesData();
    const entryIndex = data.entries.findIndex((e) => e.id === id);
    
    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    // Remove the entry
    const deleted = data.entries.splice(entryIndex, 1)[0];
    
    // Clear active timer if this entry was active
    if (data.activeTimer?.entryId === id) {
      delete data.activeTimer;
    }
    
    data.lastUpdated = new Date().toISOString();
    await writeTimeEntriesData(data);
    
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('DELETE /api/time-entries error:', error);
    return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 });
  }
}