import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Activity types that count toward streak
const STREAK_TYPES = new Set(['Running', 'Hiking']);

// Confirmed streak override — fully verified through RunKeeper + ClickUp + memory
// Jun 12-14 2021: Aaron's memory | Jun 15-18: RunKeeper | Jun 19: ClickUp only (TomTom, never synced) | Jun 20 - Jun 17 2022: RunKeeper
const CONFIRMED_STREAK = {
  days: 371,
  start: '2021-06-12',
  end: '2022-06-17',
};

interface Activity {
  date: string;
  type: string;
  distance_miles: number;
  duration_min: number;
  pace_min_mile: number;
  elev_gain_ft: number;
}

interface WeeklyStat {
  week: string;
  runs: number;
  miles: number;
  avgPace: number;
}

interface MonthlyStat {
  month: string;
  runs: number;
  miles: number;
}

/** Parse MM:SS or H:MM:SS → decimal minutes */
function parseDuration(s: string): number {
  if (!s?.trim()) return 0;
  const parts = s.trim().split(':').map(Number);
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  return 0;
}

/** Parse native RunKeeper cardioActivities.csv */
function parseNativeCSV(csvText: string): Activity[] {
  const lines = csvText.trim().split('\n');
  const activities: Activity[] = [];
  // Header: Activity Id,Date,Type,Route Name,Distance (mi),Duration,Average Pace,Average Speed (mph),Calories Burned,Climb (ft),...
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 6) continue;

    const dateStr = parts[1]?.trim();
    const type = parts[2]?.trim();
    if (!dateStr || !type) continue;

    // Date stored as local time — just take the date portion (first 10 chars)
    const date = dateStr.slice(0, 10);
    const dist = parseFloat(parts[4]) || 0;
    const dur = parseDuration(parts[5]);

    // Pace: parse MM:SS, clamp to reasonable range (4–30 min/mile)
    let pace = parseDuration(parts[6] || '');
    if (pace < 4 || pace > 30) pace = dist > 0 && dur > 0 ? dur / dist : 0;

    const climb = parseFloat(parts[9]) || 0;

    activities.push({ date, type, distance_miles: dist, duration_min: dur, pace_min_mile: pace, elev_gain_ft: climb });
  }
  return activities;
}

function computeStreaks(activities: Activity[]): {
  longest: number; longestStart: string; longestEnd: string;
  current: number; lastActivity: string; daysSinceLast: number;
} {
  // Only Running + Hiking count toward streak
  const dateSet = new Set(
    activities.filter(a => STREAK_TYPES.has(a.type)).map(a => a.date)
  );

  // Inject Jun 12-14 2021 (memory-confirmed, not in any export)
  ['2021-06-12', '2021-06-13', '2021-06-14'].forEach(d => dateSet.add(d));
  // Inject Jun 19 2021 (ClickUp-confirmed, never synced to RunKeeper)
  dateSet.add('2021-06-19');

  const dates = [...dateSet].sort();
  if (dates.length === 0) return { longest: 0, longestStart: '', longestEnd: '', current: 0, lastActivity: '', daysSinceLast: 0 };

  let best = 1, bestStart = dates[0], bestEnd = dates[0];
  let cur = 1, curStart = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i] + 'T00:00:00').getTime() - new Date(dates[i - 1] + 'T00:00:00').getTime()) / 86400000;
    if (diff === 1) {
      cur++;
      if (cur > best) { best = cur; bestStart = curStart; bestEnd = dates[i]; }
    } else {
      cur = 1; curStart = dates[i];
    }
  }

  // Use confirmed override if it matches what data shows
  if (bestStart <= '2021-06-15' && bestEnd >= '2022-06-15') {
    best = CONFIRMED_STREAK.days;
    bestStart = CONFIRMED_STREAK.start;
    bestEnd = CONFIRMED_STREAK.end;
  }

  // Current streak (trailing consecutive days)
  let currentStreak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const diff = (new Date(dates[i] + 'T00:00:00').getTime() - new Date(dates[i - 1] + 'T00:00:00').getTime()) / 86400000;
    if (diff === 1) currentStreak++;
    else break;
  }

  const lastDate = new Date(dates[dates.length - 1] + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
  if (daysSince > 1) currentStreak = 0;

  return { longest: best, longestStart: bestStart, longestEnd: bestEnd, current: currentStreak, lastActivity: dates[dates.length - 1], daysSinceLast: daysSince };
}

function computeMonthlyStats(activities: Activity[]): MonthlyStat[] {
  const map = new Map<string, { runs: number; miles: number }>();
  for (const a of activities.filter(a => a.type === 'Running')) {
    const month = a.date.slice(0, 7);
    const entry = map.get(month) || { runs: 0, miles: 0 };
    entry.runs++;
    entry.miles += a.distance_miles;
    map.set(month, entry);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, s]) => ({ month, runs: s.runs, miles: Math.round(s.miles * 10) / 10 }));
}

function computeWeeklyStats(activities: Activity[]): WeeklyStat[] {
  const map = new Map<string, { runs: number; miles: number; totalPace: number; paceCount: number }>();
  for (const a of activities.filter(a => a.type === 'Running')) {
    const d = new Date(a.date + 'T00:00:00');
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const weekKey = mon.toISOString().slice(0, 10);
    const entry = map.get(weekKey) || { runs: 0, miles: 0, totalPace: 0, paceCount: 0 };
    entry.runs++;
    entry.miles += a.distance_miles;
    if (a.pace_min_mile > 0) { entry.totalPace += a.pace_min_mile; entry.paceCount++; }
    map.set(weekKey, entry);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, s]) => ({
      week, runs: s.runs,
      miles: Math.round(s.miles * 10) / 10,
      avgPace: s.paceCount > 0 ? Math.round((s.totalPace / s.paceCount) * 100) / 100 : 0,
    }));
}

export async function GET(): Promise<NextResponse> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'health');
    const summaryRaw = fs.readFileSync(path.join(dataDir, 'runkeeper-summary.json'), 'utf-8');
    const summary = JSON.parse(summaryRaw);

    // Use native RunKeeper export (includes Running + Hiking + Walking etc.)
    const csvRaw = fs.readFileSync(path.join(dataDir, 'cardioActivities.csv'), 'utf-8');
    const activities = parseNativeCSV(csvRaw);

    const sortedActivities = [...activities]
      .filter(a => a.type === 'Running')
      .sort((a, b) => b.date.localeCompare(a.date));

    const streaks = computeStreaks(activities);
    const monthlyStats = computeMonthlyStats(activities);
    const weeklyStats = computeWeeklyStats(activities);

    return NextResponse.json({
      summary,
      activities: sortedActivities,
      streaks,
      monthlyStats,
      weeklyStats,
      confirmedStreak: CONFIRMED_STREAK,
    });
  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json({ error: 'Failed to load health data' }, { status: 500 });
  }
}
