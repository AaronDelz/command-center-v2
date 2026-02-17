import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'calendar.json');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { events: [], lastUpdated: new Date().toISOString() };
  }
}

function writeData(data: Record<string, unknown>) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  return NextResponse.json(readData());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const newEvent = {
    id: `evt-${Date.now()}`,
    title: body.title || 'Untitled',
    date: body.date,
    time: body.time || undefined,
    endTime: body.endTime || undefined,
    color: body.color || '#ff6b35',
    description: body.description || '',
    recurring: body.recurring || undefined,
  };

  data.events.push(newEvent);
  data.lastUpdated = new Date().toISOString();
  writeData(data);

  return NextResponse.json(newEvent, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const data = readData();
  data.events = data.events.filter((e: { id: string }) => e.id !== id);
  data.lastUpdated = new Date().toISOString();
  writeData(data);

  return NextResponse.json({ ok: true });
}
