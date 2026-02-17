import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(): Promise<NextResponse> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'quotes.json');
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/quotes error:', error);
    return NextResponse.json({ quotes: [] }, { status: 500 });
  }
}
