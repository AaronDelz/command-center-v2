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

export interface KanbanSubtask {
  id: string;
  text: string;
  completed: boolean;
}

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
  subtasks?: KanbanSubtask[];
  source?: string;
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

// Client Types

export type ClientStatus = 'active' | 'pipeline' | 'paused' | 'closed';
export type PaymentStatus = 'pending' | 'invoiceSent' | 'received' | 'completed';
export type PaymentType = 'retainer' | 'hourly' | 'one-off';
export type InvoiceStatus = 'unpaid' | 'sent' | 'paid';

export interface Client {
  id: string;
  name: string;
  businessName?: string;
  contact: string;
  email?: string;
  phone?: string;
  business: string;
  status: ClientStatus;
  rate: string;
  revenueModel: 'hourly' | 'project' | 'retainer';
  paymentType?: PaymentType;
  avgMonthly?: number;
  projectValue?: number;
  monthlyRetainer?: number;
  retainerAmount?: number;
  projectAmount?: number;
  since: string;
  startDate?: string;
  lastActivity: string;
  tags: string[];
  notes: string;
  link?: string;
  dueDate?: string;
  paymentStatus: PaymentStatus;
  invoiceStatus?: InvoiceStatus;
  hourlyRate: number;
  monthlyTotal?: number;
}

export interface ClientsData {
  clients: Client[];
  lastUpdated: string;
}

// Time Tracking Types

export interface TimeEntry {
  id: string;
  clientId: string;
  clientName: string;
  description: string;
  startTime: string;  // ISO 8601
  endTime?: string;   // undefined when timer is running
  duration?: number;  // minutes, calculated when ended
  isRunning: boolean;
  tags: string[];
  billable: boolean;
  rate?: number;      // hourly rate for this entry
  createdAt: string;
  updatedAt?: string;
  notes?: string;     // Optional notes for the time entry
}

export interface TimeTrackingSummary {
  totalMinutes: number;
  billableMinutes: number;
  totalValue: number;
  entriesCount: number;
}

export interface ClientTimeStats extends TimeTrackingSummary {
  clientId: string;
  clientName: string;
  lastEntry?: string;
}

export interface TimeEntriesData {
  entries: TimeEntry[];
  activeTimer?: {
    entryId: string;
    startedAt: string;
  };
  lastUpdated: string;
}

// Drop Types

export type DropType = 'note' | 'idea' | 'link' | 'task' | 'file' | 'unsorted';
export type DropStatus = 'new' | 'triaged' | 'promoted' | 'archived';
export type JournalTag = 'discussed' | 'decisions' | 'built' | 'insight' | 'open';

export interface Reply {
  id: string;
  content: string;
  author: 'aaron' | 'orion';
  createdAt: string;
}

export interface Drop {
  id: string;
  shortId?: string;
  type: DropType;
  title?: string;
  content: string;
  url?: string;
  files?: string[];
  status: DropStatus;
  promotedTo?: string; // Kanban card ID if promoted to task
  journalTag?: JournalTag;
  archived?: boolean;
  archivedAt?: string;
  seen?: boolean;
  seenAt?: string;
  replies?: Reply[];
  createdAt: string;
  updatedAt?: string;
}

export interface DropsData {
  drops: Drop[];
  lastUpdated: string;
}

// A2P Registration Types

export type A2PStatus = 'to_submit' | 'submitted' | 'rejected' | 'rejected_resubmitted' | 'brand_approved' | 'fully_approved';
export type A2PRegistrationType = 'a2p' | 'toll_free';
export type A2PBusinessType = 'business' | 'sole_prop';

export interface A2PRegistration {
  id: string;
  businessName: string;
  status: A2PStatus;
  registrationType: A2PRegistrationType;
  businessType: A2PBusinessType;
  dateCreated: string;
  dateSubmitted: string;
  dateBrandApproved: string;
  dateFullyApproved: string;
  approvalDays: number | null;
  notes: string;
  clientId?: string;  // Link to client in clients.json
}

export interface A2PData {
  registrations: A2PRegistration[];
  lastUpdated: string;
}

// Billing Period Types

export type BillingPeriodStatus = 'current' | 'past' | 'completed';
export type BillingPaymentStatus = 'pending' | 'invoiceSent' | 'received' | 'completed';

export interface BillingPeriod {
  id: string;
  clientId: string;
  month: number;
  year: number;
  period: BillingPeriodStatus;
  incomeTracked: number;
  incomeRetainer: number;
  incomeProject: number;
  monthlyTotal: number;
  paymentStatus: BillingPaymentStatus;
  invoiceSentDate: string | null;
  paymentReceivedDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillingData {
  billingPeriods: BillingPeriod[];
  lastUpdated: string;
}

// Webhook Types

export interface WebhookEvent {
  id: string;
  source: string;
  event?: string;
  payload: Record<string, unknown>;
  receivedAt: string;
  seen: boolean;
}

export interface WebhooksData {
  events: WebhookEvent[];
  lastUpdated: string;
}

// Calendar Types

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  time?: string;       // HH:MM (24h)
  endTime?: string;    // HH:MM (24h)
  color?: string;      // hex color
  description?: string;
  recurring?: 'daily' | 'weekly' | 'monthly';
}

export interface CalendarData {
  events: CalendarEvent[];
  lastUpdated: string;
}
