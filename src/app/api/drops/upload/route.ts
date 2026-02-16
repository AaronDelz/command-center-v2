import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

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

    const uploadedFiles: string[] = [];
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    for (const file of files) {
      if (file.size === 0) continue;

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Read file as buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Write file to uploads directory
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      // Store relative path for the drop
      uploadedFiles.push(`/uploads/${fileName}`);
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