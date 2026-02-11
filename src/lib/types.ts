// Note Types

export interface NoteReply {
  from: string;
  text: string;
  at: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  updatedAt?: string;
  replies?: NoteReply[];
  tags?: string[];
}

// Report Types

export interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  path: string;
}

export interface ReportsData {
  reports: Report[];
  lastUpdated: string;
}

export interface NotesData {
  notes: Note[];
  lastUpdated: string;
}

// Cron Job Types

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  enabled: boolean;
  type?: 'task' | 'briefing' | 'notes' | 'memory' | 'audit' | 'system' | 'reminder';
  model?: string;
  description?: string;
  lastStatus?: 'ok' | 'error';
  sessionTarget?: string;
}

export interface CronData {
  jobs: CronJob[];
  lastUpdated: string;
}

// Activity Types

export interface ActivityEntry {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  details?: string;
}

export interface ActivityData {
  entries: ActivityEntry[];
  lastUpdated: string;
}

// Kanban Types

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  owner: string;
  priority?: 'none' | 'low' | 'medium' | 'high';
  tags: string[];
  notes: string;
  created: string;
  completed?: string;
  acknowledged?: boolean;
  client?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  maxCards?: number;
}

export interface KanbanData {
  columns: KanbanColumn[];
  lastUpdated: string;
}
