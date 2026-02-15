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

// Content Types

export interface ContentMetric {
  actual: number;
  target: number;
}

export interface ContentTask {
  text: string;
  done: boolean;
}

export interface ContentDaySchedule {
  day: string;
  theme: string;
  tasks: ContentTask[];
}

export interface ContentData {
  streak: { current: number; best: number; lastPostDate: string };
  weeklyScorecard: {
    weekOf: string;
    xPosts: ContentMetric;
    communityPosts: ContentMetric;
    youtubeVideos: ContentMetric;
    youtubeLive: ContentMetric;
    emailNewsletter: ContentMetric;
    callsHeld: ContentMetric;
  };
  schedule: Record<string, ContentDaySchedule>;
  platforms: {
    xFollowers: number;
    communityMembers: number;
    eliteMembers: number;
    youtubeSubscribers: number;
  };
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
  dueDate?: string;
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

// Goal Types

export type GoalCategory = 'financial' | 'health' | 'business' | 'personal' | 'technical';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface GoalMilestone {
  label: string;
  value: number;
  reached: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
  milestones: GoalMilestone[];
  created: string;
  status: GoalStatus;
}

export interface GoalsData {
  goals: Goal[];
  lastUpdated: string;
}
