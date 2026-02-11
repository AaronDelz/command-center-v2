import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const INBOX_DIR = '/Users/Orion/Documents/inbox/';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for large uploads

// Next.js App Router body size limit
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ensure inbox directory exists
    await fs.mkdir(INBOX_DIR, { recursive: true });

    // Deduplicate filename if needed
    let filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    let destPath = path.join(INBOX_DIR, filename);

    let counter = 1;
    while (true) {
      try {
        await fs.access(destPath);
        filename = `${base}_${counter}${ext}`;
        destPath = path.join(INBOX_DIR, filename);
        counter++;
      } catch {
        break; // File doesn't exist, we can use this name
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(destPath, buffer);

    return NextResponse.json({ success: true, filename, size: buffer.length });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
