import { promises as fs } from 'fs';
import type { KanbanData, NotesData, Note, ReportsData, GoalsData } from './types';

const DATA_DIR = '/Users/Orion/Documents/projects/command-center-v2/data';
const KANBAN_PATH = `${DATA_DIR}/kanban.json`;
const NOTES_PATH = `${DATA_DIR}/notes.json`;
const REPORTS_PATH = `${DATA_DIR}/reports.json`;
const GOALS_PATH = `${DATA_DIR}/goals.json`;
const CLAWD_DIR = '/Users/Orion/clawd';

export async function readKanbanData(): Promise<KanbanData> {
  try {
    const content = await fs.readFile(KANBAN_PATH, 'utf-8');
    return JSON.parse(content) as KanbanData;
  } catch (error) {
    console.error('Error reading kanban.json:', error);
    throw new Error('Failed to read kanban data');
  }
}

export async function writeKanbanData(data: KanbanData): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(KANBAN_PATH, content, 'utf-8');
  } catch (error) {
    console.error('Error writing kanban.json:', error);
    throw new Error('Failed to write kanban data');
  }
}

// Notes Data Functions

interface RawReply {
  from: string;
  text: string;
  at: string;
  updatedAt?: string;
}

interface RawNote {
  id: string;
  text: string;
  created?: string;
  createdAt?: string;
  processed?: boolean;
  done?: boolean;
  seen?: boolean;
  replies?: RawReply[];
  updatedAt?: string;
  tags?: string[];
}

interface RawNotesData {
  notes: RawNote[];
  lastUpdated: string;
}

function transformNote(raw: RawNote): Note {
  const note: Note = {
    id: raw.id,
    text: raw.text,
    done: raw.processed ?? raw.done ?? false,
    createdAt: raw.created ?? raw.createdAt ?? new Date().toISOString(),
  };
  if (raw.updatedAt) note.updatedAt = raw.updatedAt;
  if (raw.tags && raw.tags.length > 0) note.tags = raw.tags;
  if (raw.replies && raw.replies.length > 0) {
    note.replies = raw.replies.map((r) => ({
      from: r.from,
      text: r.text,
      at: r.at,
      ...(r.updatedAt ? { updatedAt: r.updatedAt } : {}),
    }));
  }
  return note;
}

export async function readNotesData(): Promise<NotesData> {
  try {
    const content = await fs.readFile(NOTES_PATH, 'utf-8');
    const raw = JSON.parse(content) as RawNotesData;
    return {
      notes: raw.notes.map(transformNote),
      lastUpdated: raw.lastUpdated,
    };
  } catch (error) {
    console.error('Error reading notes.json:', error);
    throw new Error('Failed to read notes data');
  }
}

export async function writeNotesData(notes: Note[]): Promise<void> {
  try {
    // Read existing data to preserve extra fields
    const content = await fs.readFile(NOTES_PATH, 'utf-8');
    const raw = JSON.parse(content) as RawNotesData;
    
    // Update notes while preserving extra fields
    const updatedNotes = notes.map((note) => {
      const existing = raw.notes.find((n) => n.id === note.id);
      const base = existing ? { ...existing } : { id: note.id, seen: false };
      
      // Always sync these fields
      const result: Record<string, unknown> = {
        ...base,
        text: note.text,
        processed: note.done,
        created: note.createdAt,
      };

      // Sync replies
      if (note.replies && note.replies.length > 0) {
        result.replies = note.replies.map((r) => ({
          from: r.from,
          text: r.text,
          at: r.at,
          ...(r.updatedAt ? { updatedAt: r.updatedAt } : {}),
        }));
      } else if (existing?.replies) {
        // Keep existing replies if note object doesn't have them
        result.replies = existing.replies;
      }

      // Sync updatedAt
      if (note.updatedAt) result.updatedAt = note.updatedAt;

      // Sync tags
      if (note.tags && note.tags.length > 0) {
        result.tags = note.tags;
      } else if (existing?.tags) {
        result.tags = existing.tags;
      }

      return result;
    });

    const output = {
      notes: updatedNotes,
      lastUpdated: new Date().toISOString(),
    };

    await fs.writeFile(NOTES_PATH, JSON.stringify(output, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing notes.json:', error);
    throw new Error('Failed to write notes data');
  }
}

// Reports Data Functions

export async function readReportsData(): Promise<ReportsData> {
  try {
    const content = await fs.readFile(REPORTS_PATH, 'utf-8');
    return JSON.parse(content) as ReportsData;
  } catch (error) {
    console.error('Error reading reports.json:', error);
    throw new Error('Failed to read reports data');
  }
}

export async function readReportContent(reportPath: string): Promise<string> {
  try {
    // Reports are stored relative to clawd directory
    const fullPath = `${CLAWD_DIR}/${reportPath}`;
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading report file:', error);
    throw new Error('Failed to read report content');
  }
}

// Goals Data Functions

export async function readGoalsData(): Promise<GoalsData> {
  try {
    const content = await fs.readFile(GOALS_PATH, 'utf-8');
    return JSON.parse(content) as GoalsData;
  } catch (error) {
    console.error('Error reading goals.json:', error);
    throw new Error('Failed to read goals data');
  }
}

export async function writeGoalsData(data: GoalsData): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(GOALS_PATH, content, 'utf-8');
  } catch (error) {
    console.error('Error writing goals.json:', error);
    throw new Error('Failed to write goals data');
  }
}
