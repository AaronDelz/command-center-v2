import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { listVaultFiles, readVaultFile } from '@/lib/vault';

const VAULT_DIR = '/Users/Orion/Documents/vault';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const category = searchParams.get('category') || undefined;

    if (fileId) {
      // Parse id: "category/filename"
      const parts = fileId.split('/');
      if (parts.length < 2) {
        return NextResponse.json(
          { error: 'Invalid file ID format. Use category/filename' },
          { status: 400 }
        );
      }

      const cat = parts[0];
      const filename = parts.slice(1).join('/') + '.md';
      const content = await readVaultFile(cat, filename);

      if (!content) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ id: fileId, content });
    }

    // List all vault files, optionally filtered by category
    const files = await listVaultFiles(category);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vault files' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { id: string; content: string };
    const { id, content } = body;

    if (!id || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing id or content' }, { status: 400 });
    }

    const parts = id.split('/');
    if (parts.length < 2) {
      return NextResponse.json({ error: 'Invalid file ID format' }, { status: 400 });
    }

    const cat = parts[0];
    const filename = parts.slice(1).join('/') + '.md';
    const filePath = path.join(VAULT_DIR, cat, filename);

    // Safety: ensure path is within vault
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(VAULT_DIR))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    await fs.writeFile(filePath, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/reports error:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
