import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Files go to Documents/inbox/ for Orion to triage
const INBOX_DIR = path.join(process.env.HOME || '/Users/Orion', 'Documents', 'inbox');

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Ensure inbox directory exists
    if (!existsSync(INBOX_DIR)) {
      await mkdir(INBOX_DIR, { recursive: true });
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      if (file.size === 0) continue;

      // Keep original filename — add timestamp prefix only if file already exists
      let fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = path.join(INBOX_DIR, fileName);
      
      if (existsSync(filePath)) {
        const timestamp = Date.now();
        const ext = path.extname(fileName);
        const base = path.basename(fileName, ext);
        fileName = `${base}-${timestamp}${ext}`;
      }

      // Read file as buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Write file to inbox
      await writeFile(path.join(INBOX_DIR, fileName), buffer);

      // Store the inbox path for reference
      uploadedFiles.push(`~/Documents/inbox/${fileName}`);
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error('POST /api/drops/upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}