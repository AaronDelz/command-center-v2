import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { readKanbanData, readNotesData } from '@/lib/data';
import { listVaultFiles, readVaultFile } from '@/lib/vault';

const WORKSPACE_DIR = '/Users/Orion/clawd';

interface SearchResult {
  type: 'card' | 'note' | 'doc';
  id: string;
  title: string;
  snippet: string;
  columnId?: string;
  docPath?: string;
}

interface SearchResponse {
  query: string;
  results: {
    cards: SearchResult[];
    notes: SearchResult[];
    docs: SearchResult[];
  };
  total: number;
}

function getSnippet(text: string, query: string, contextLength = 80): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) {
    return text.slice(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '');
  }
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + query.length + contextLength);
  
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

async function searchKanban(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const data = await readKanbanData();
    
    for (const column of data.columns) {
      for (const card of column.cards) {
        const searchableText = [card.title, card.description, card.notes].join(' ');
        
        if (matchesQuery(searchableText, query)) {
          const matchField = matchesQuery(card.title, query) 
            ? card.title 
            : matchesQuery(card.description, query) 
              ? card.description 
              : card.notes;
          
          results.push({
            type: 'card',
            id: card.id,
            title: card.title,
            snippet: getSnippet(matchField, query),
            columnId: column.id,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error searching kanban:', error);
  }
  
  return results;
}

async function searchNotes(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const data = await readNotesData();
    
    for (const note of data.notes) {
      if (matchesQuery(note.text, query)) {
        results.push({
          type: 'note',
          id: note.id,
          title: note.text.slice(0, 50) + (note.text.length > 50 ? '...' : ''),
          snippet: getSnippet(note.text, query),
        });
      }
    }
  } catch (error) {
    console.error('Error searching notes:', error);
  }
  
  return results;
}

async function searchDocs(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const files = await fs.readdir(WORKSPACE_DIR);
    const mdFiles = files.filter((f) => f.endsWith('.md'));
    
    for (const file of mdFiles) {
      const filePath = path.join(WORKSPACE_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (matchesQuery(content, query) || matchesQuery(file, query)) {
        const title = file.replace('.md', '');
        results.push({
          type: 'doc',
          id: file,
          title: title,
          snippet: getSnippet(content, query),
          docPath: file,
        });
      }
    }
  } catch (error) {
    console.error('Error searching docs:', error);
  }
  
  return results;
}

async function searchVault(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const vaultFiles = await listVaultFiles();
    
    for (const file of vaultFiles) {
      const content = await readVaultFile(file.category, file.filename);
      if (!content) continue;
      
      if (matchesQuery(content, query) || matchesQuery(file.title, query)) {
        results.push({
          type: 'doc',
          id: file.id,
          title: file.title,
          snippet: getSnippet(content, query),
          docPath: file.id,
        });
      }
    }
  } catch (error) {
    console.error('Error searching vault:', error);
  }
  
  return results;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        query: query ?? '',
        results: { cards: [], notes: [], docs: [] },
        total: 0,
      } as SearchResponse);
    }
    
    const [cards, notes, docs, vaultDocs] = await Promise.all([
      searchKanban(query),
      searchNotes(query),
      searchDocs(query),
      searchVault(query),
    ]);
    
    const allDocs = [...docs, ...vaultDocs];
    
    const response: SearchResponse = {
      query,
      results: { cards, notes, docs: allDocs },
      total: cards.length + notes.length + allDocs.length,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
