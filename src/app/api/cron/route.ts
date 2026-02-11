import { NextResponse } from 'next/server';
import type { CronData, CronJob } from '@/lib/types';

// America/Phoenix is UTC-7 year-round (no DST)
const PHX_OFFSET = -7;

function nowInPhoenix(): Date {
  const now = new Date();
  // Create a date object representing "now" in Phoenix
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + PHX_OFFSET * 3600000);
}

function phoenixToUTC(year: number, month: number, day: number, hour: number, minute: number): Date {
  // Phoenix time to UTC: subtract the offset (which is negative, so add 7 hours)
  return new Date(Date.UTC(year, month, day, hour - PHX_OFFSET, minute));
}

/**
 * Calculate next run time from a cron expression in America/Phoenix timezone.
 * Supports: minute hour dayOfMonth month dayOfWeek
 */
function getNextRun(cron: string): string {
  const parts = cron.split(' ');
  const minute = parseInt(parts[0]);
  const hour = parseInt(parts[1]);
  const dayOfMonth = parts[2]; // * or number
  const month = parts[3]; // * or number
  const dayOfWeek = parts[4]; // * or number

  const phxNow = nowInPhoenix();
  const nowYear = phxNow.getFullYear();
  const nowMonth = phxNow.getMonth();
  const nowDate = phxNow.getDate();
  const nowDay = phxNow.getDay();
  const nowHour = phxNow.getHours();
  const nowMinute = phxNow.getMinutes();

  // Specific day of week (e.g., 0=Sun, 5=Fri)
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const targetDay = parseInt(dayOfWeek);
    let daysAhead = targetDay - nowDay;
    if (daysAhead < 0) daysAhead += 7;
    if (daysAhead === 0 && (nowHour > hour || (nowHour === hour && nowMinute >= minute))) {
      daysAhead = 7;
    }
    const nextDate = new Date(phxNow);
    nextDate.setDate(nowDate + daysAhead);
    return phoenixToUTC(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), hour, minute).toISOString();
  }

  // Specific day of month (e.g., 1st)
  if (dayOfMonth !== '*') {
    const dom = parseInt(dayOfMonth);
    let targetMonth = nowMonth;
    let targetYear = nowYear;
    if (nowDate > dom || (nowDate === dom && (nowHour > hour || (nowHour === hour && nowMinute >= minute)))) {
      targetMonth++;
      if (targetMonth > 11) { targetMonth = 0; targetYear++; }
    }
    return phoenixToUTC(targetYear, targetMonth, dom, hour, minute).toISOString();
  }

  // Daily: every day at hour:minute
  let candidate = phoenixToUTC(nowYear, nowMonth, nowDate, hour, minute);
  if (candidate.getTime() <= Date.now()) {
    candidate = phoenixToUTC(nowYear, nowMonth, nowDate + 1, hour, minute);
  }
  return candidate.toISOString();
}

function getRealCronJobs(): CronJob[] {
  return [
    // === DAILY TASK WORK (task - orange) ===
    {
      id: '6',
      name: '3pm-task-work',
      schedule: '0 15 * * *',
      nextRun: getNextRun('0 15 * * *'),
      enabled: true,
      type: 'task',
      model: 'Opus',
      description: 'Afternoon task session — works through kanban cards',
    },
    {
      id: '9',
      name: '11pm-task-work',
      schedule: '0 23 * * *',
      nextRun: getNextRun('0 23 * * *'),
      enabled: true,
      type: 'task',
      model: 'Opus',
      description: 'Late night task session — bigger items while Aaron sleeps',
    },

    // === BRIEFINGS (briefing - blue) ===
    {
      id: '2',
      name: 'morning-brief-prep',
      schedule: '30 5 * * *',
      nextRun: getNextRun('30 5 * * *'),
      enabled: true,
      type: 'briefing',
      model: 'Opus',
      description: 'Prepares and delivers morning report: top 3 priorities, overnight work, weather, personal question for Aaron',
    },

    // === NOTES (notes - yellow) ===
    {
      id: '4',
      name: '11am-notes-check-haiku',
      schedule: '0 11 * * *',
      nextRun: getNextRun('0 11 * * *'),
      enabled: true,
      type: 'notes',
      model: 'Haiku',
      description: 'Quick Notes check — reads notes.json, processes unseen notes, flags complex items',
    },
    {
      id: '7',
      name: '4pm-notes-check-haiku',
      schedule: '0 16 * * *',
      nextRun: getNextRun('0 16 * * *'),
      enabled: true,
      type: 'notes',
      model: 'Haiku',
      description: 'Afternoon Quick Notes check',
    },

    // === MEMORY (memory - purple) ===
    {
      id: '5',
      name: 'midday-memory-checkpoint',
      schedule: '0 14 * * *',
      nextRun: getNextRun('0 14 * * *'),
      enabled: true,
      type: 'memory',
      model: 'Haiku',
      description: 'Mid-day memory safety net — captures morning/afternoon events to daily memory file',
    },
    {
      id: '10',
      name: 'nightly-memory-update',
      schedule: '5 0 * * *',
      nextRun: getNextRun('5 0 * * *'),
      enabled: true,
      type: 'memory',
      model: 'Opus',
      description: "Reviews day's conversations, updates daily memory file, checks if facts need updating",
    },
    {
      id: '12',
      name: 'weekly-synthesis',
      schedule: '0 9 * * 0',
      nextRun: getNextRun('0 9 * * 0'),
      enabled: true,
      type: 'memory',
      model: 'Opus',
      description: 'Sunday: reviews weekly facts, updates summaries, distills lessons to MEMORY.md',
    },

    // === AUDIT (audit - cyan) ===
    {
      id: '8',
      name: 'daily-file-audit',
      schedule: '0 21 * * *',
      nextRun: getNextRun('0 21 * * *'),
      enabled: true,
      type: 'audit',
      model: 'Sonnet',
      description: 'Reviews core workspace files (AGENTS, MEMORY, TOOLS, SOUL, etc.) for outdated info, conflicts, improvements',
    },
    {
      id: '13',
      name: 'biweekly-security-audit',
      schedule: '0 10 * * 5',
      nextRun: getNextRun('0 10 * * 5'),
      enabled: true,
      type: 'audit',
      model: 'Opus',
      description: 'Friday: security checklist, Shodan check, exec approval review',
    },

    // === SYSTEM (system - green) ===
    {
      id: '11',
      name: 'weekly-git-commit',
      schedule: '0 8 * * 0',
      nextRun: getNextRun('0 8 * * 0'),
      enabled: true,
      type: 'system',
      model: 'Opus',
      description: 'Sunday: git add -A && git commit in ~/clawd',
    },
    {
      id: '14',
      name: 'monthly-backup-reminder',
      schedule: '0 10 1 * *',
      nextRun: getNextRun('0 10 1 * *'),
      enabled: true,
      type: 'system',
      model: 'Opus',
      description: '1st of month: reminds Aaron to backup clawd folder',
    },

    // === ONE-SHOT REMINDERS (reminder - pink) ===
    {
      id: 'r1',
      name: 'mid-feb-health-chat-reminder',
      schedule: 'at 2026-02-15T09:00',
      nextRun: phoenixToUTC(2026, 1, 15, 9, 0).toISOString(),
      enabled: true,
      type: 'reminder',
      description: 'Remind Aaron to create Health & Fitness group chat',
    },
    {
      id: 'r2',
      name: 'march-money-goals-check',
      schedule: 'at 2026-03-01T09:00',
      nextRun: phoenixToUTC(2026, 2, 1, 9, 0).toISOString(),
      enabled: true,
      type: 'reminder',
      description: 'Check in on February money goals',
    },
    {
      id: 'r3',
      name: 'april-relationships-kickoff',
      schedule: 'at 2026-04-01T09:00',
      nextRun: phoenixToUTC(2026, 3, 1, 9, 0).toISOString(),
      enabled: true,
      type: 'reminder',
      description: 'Start Relationships group chat if ready',
    },

    // === DISABLED ===
    {
      id: 'd1',
      name: '4am-task-work',
      schedule: '0 4 * * *',
      nextRun: '',
      enabled: false,
      description: 'Early morning task session — disabled (11pm handles overnight work)',
    },
    {
      id: 'd2',
      name: '6am-morning-briefing',
      schedule: '0 6 * * *',
      nextRun: '',
      enabled: false,
      description: 'Redundant morning briefing — replaced by 5:30am brief prep',
    },
  ];
}

export async function GET(): Promise<NextResponse> {
  try {
    const jobs = getRealCronJobs();

    const data: CronData = {
      jobs,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/cron error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}
