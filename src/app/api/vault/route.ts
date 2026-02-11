import { NextRequest, NextResponse } from 'next/server';
import { listVaultFiles, readVaultFile, getVaultCategories } from '@/lib/vault';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const category = searchParams.get('category') || undefined;

    // Get specific file content
    if (fileId) {
      const parts = fileId.split('/');
      if (parts.length < 2) {
        return NextResponse.json(
          { error: 'Invalid file ID. Use category/filename' },
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

    // List files with optional category filter
    const categories = await getVaultCategories();
    const files = await listVaultFiles(category);

    return NextResponse.json({ categories, files });
  } catch (error) {
    console.error('GET /api/vault error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vault data' },
      { status: 500 }
    );
  }
}
