import { promises as fs } from 'fs';
import path from 'path';

const VAULT_DIR = '/Users/Orion/Documents/vault';

export interface VaultFile {
  id: string;
  title: string;
  filename: string;
  category: string;
  path: string;
  createdAt: string;
  modifiedAt: string;
  size: number;
  excerpt: string;
}

function extractTitle(content: string, filename: string): string {
  // Check for frontmatter title
  const frontmatterMatch = content.match(/^---\s*\n[\s\S]*?title:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/);
  if (frontmatterMatch) {
    return frontmatterMatch[1].trim();
  }

  // Check for first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fall back to filename
  return filename
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractExcerpt(content: string, maxLength = 200): string {
  // Strip frontmatter
  let text = content.replace(/^---\s*\n[\s\S]*?---\s*\n/, '');
  // Strip H1
  text = text.replace(/^#\s+.+$/m, '');
  // Strip markdown formatting
  text = text.replace(/[#*_`\[\]]/g, '').trim();
  // Get first meaningful line(s)
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const excerpt = lines.slice(0, 3).join(' ').trim();
  return excerpt.length > maxLength ? excerpt.slice(0, maxLength) + '...' : excerpt;
}

export async function listVaultFiles(category?: string): Promise<VaultFile[]> {
  const files: VaultFile[] = [];

  try {
    const categories = category
      ? [category]
      : await fs.readdir(VAULT_DIR);

    for (const cat of categories) {
      const catPath = path.join(VAULT_DIR, cat);

      try {
        const stat = await fs.stat(catPath);
        if (!stat.isDirectory()) continue;
      } catch {
        continue;
      }

      const entries = await fs.readdir(catPath);

      for (const entry of entries) {
        if (!entry.endsWith('.md')) continue;

        const filePath = path.join(catPath, entry);
        const fileStat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');

        files.push({
          id: `${cat}/${entry.replace(/\.md$/, '')}`,
          title: extractTitle(content, entry),
          filename: entry,
          category: cat,
          path: filePath,
          createdAt: fileStat.birthtime.toISOString(),
          modifiedAt: fileStat.mtime.toISOString(),
          size: fileStat.size,
          excerpt: extractExcerpt(content),
        });
      }
    }

    // Sort by modified date, newest first
    files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
  } catch (error) {
    console.error('Error listing vault files:', error);
  }

  return files;
}

export async function readVaultFile(category: string, filename: string): Promise<string | null> {
  try {
    const filePath = path.join(VAULT_DIR, category, filename);
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export async function getVaultCategories(): Promise<string[]> {
  try {
    const entries = await fs.readdir(VAULT_DIR);
    const categories: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(VAULT_DIR, entry);
      const stat = await fs.stat(entryPath);
      if (stat.isDirectory()) {
        categories.push(entry);
      }
    }

    return categories;
  } catch {
    return [];
  }
}
