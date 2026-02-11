import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { listVaultFiles, readVaultFile } from '@/lib/vault';

const WORKSPACE_DIR = '/Users/Orion/clawd';

interface WorkspaceFile {
  id: string;
  label: string;
  filename: string;
}

const WORKSPACE_FILES: WorkspaceFile[] = [
  { id: 'soul', label: 'Soul', filename: 'SOUL.md' },
  { id: 'identity', label: 'Identity', filename: 'IDENTITY.md' },
  { id: 'user', label: 'User', filename: 'USER.md' },
  { id: 'memory', label: 'Memory', filename: 'MEMORY.md' },
  { id: 'tools', label: 'Tools', filename: 'TOOLS.md' },
  { id: 'heartbeat', label: 'Heartbeat', filename: 'HEARTBEAT.md' },
  { id: 'agents', label: 'Agents', filename: 'AGENTS.md' },
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('file');
  const source = searchParams.get('source') || 'all';

  try {
    // Fetch a specific workspace file
    if (fileId && !fileId.includes('/')) {
      const fileConfig = WORKSPACE_FILES.find((f) => f.id === fileId);
      if (!fileConfig) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      const filePath = path.join(WORKSPACE_DIR, fileConfig.filename);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return NextResponse.json({
          id: fileConfig.id,
          label: fileConfig.label,
          filename: fileConfig.filename,
          content,
        });
      } catch {
        return NextResponse.json({
          id: fileConfig.id,
          label: fileConfig.label,
          filename: fileConfig.filename,
          content: null,
          error: 'File not found on disk',
        });
      }
    }

    // Fetch a specific vault doc
    if (fileId && fileId.includes('/')) {
      const parts = fileId.split('/');
      const cat = parts[0];
      const filename = parts.slice(1).join('/') + '.md';
      const content = await readVaultFile(cat, filename);

      if (!content) {
        return NextResponse.json(
          { error: 'Vault file not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ id: fileId, content });
    }

    // List all files
    const result: Record<string, unknown> = {};

    if (source === 'all' || source === 'workspace') {
      const filesWithStatus = await Promise.all(
        WORKSPACE_FILES.map(async (file) => {
          const filePath = path.join(WORKSPACE_DIR, file.filename);
          let exists = false;
          try {
            await fs.access(filePath);
            exists = true;
          } catch {
            exists = false;
          }
          return { ...file, exists };
        })
      );
      result.workspace = filesWithStatus;
    }

    if (source === 'all' || source === 'vault') {
      const vaultFiles = await listVaultFiles('docs');
      result.vault = vaultFiles;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/docs error:', error);
    return NextResponse.json(
      { error: 'Failed to read files' },
      { status: 500 }
    );
  }
}
