import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Activity {
  date: string;
  activity: string;
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

function parseCSV(csvText: string): Activity[] {
  const lines = csvText.trim().split('\n');
  const activities: Activity[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 6) continue;
    activities.push({
      date: parts[0],
      activity: parts[1],
      distance_miles: parseFloat(parts[2]) || 0,
      duration_min: parseFloat(parts[3]) || 0,
      pace_min_mile: parseFloat(parts[4]) || 0,
      elev_gain_ft: parseFloat(parts[5]) || 0,
    });
  }
  return activities;
}

function parseClickUpRunDates(csvText: string): Set<string> {
  const dates = new Set<string>();
  const lines = csvText.trim().split('\n');
  for (let i = 1; i < lines.length; i++) {
    // ClickUp exports dates like: "Saturday, June 12th 2021"
    const match = lines[i].match(/(\w+) (\d+)\w* (\d{4})/);
    if (match) {
      try {
        const d = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
        if (!isNaN(d.getTime())) {
          dates.add(d.toISOString().slice(0, 10));
        }
      } catch { /* skip malformed rows */ }
    }
  }
  return dates;
}

function computeStreaks(activities: Activity[], extraDates?: Set<string>): { longest: number; longestStart: string; longestEnd: string; current: number; lastActivity: string; daysSinceLast: number } {
  const dateSet = new Set(activities.map(a => a.date));
  if (extraDates) extraDates.forEach(d => dateSet.add(d));
  const dates = [...dateSet].sort();
  if (dates.length === 0) return { longest: 0, longestStart: '', longestEnd: '', current: 0, lastActivity: '', daysSinceLast: 0 };

  let best = 1, bestStart = dates[0], bestEnd = dates[0];
  let cur = 1, curStart = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const d1 = new Date(dates[i - 1] + 'T00:00:00');
    const d2 = new Date(dates[i] + 'T00:00:00');
    const diff = (d2.getTime() - d1.getTime()) / 86400000;
    if (diff === 1) {
      cur++;
      if (cur > best) {
        best = cur;
        bestStart = curStart;
        bestEnd = dates[i];
      }
    } else {
      cur = 1;
      curStart = dates[i];
    }
  }

  // Current streak (from last activity backwards)
  let currentStreak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const d1 = new Date(dates[i - 1] + 'T00:00:00');
    const d2 = new Date(dates[i] + 'T00:00:00');
    if ((d2.getTime() - d1.getTime()) / 86400000 === 1) {
      currentStreak++;
    } else break;
  }

  const lastDate = new Date(dates[dates.length - 1] + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);

  // If last activity wasn't today or yesterday, current streak is 0
  if (daysSince > 1) currentStreak = 0;

  return {
    longest: best,
    longestStart: bestStart,
    longestEnd: bestEnd,
    current: currentStreak,
    lastActivity: dates[dates.length - 1],
    daysSinceLast: daysSince,
  };
}

function computeMonthlyStats(activities: Activity[]): MonthlyStat[] {
  const map = new Map<string, { runs: number; miles: number }>();
  for (const a of activities) {
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
  const map = new Map<string, { runs: number; miles: number; totalPace: number }>();
  for (const a of activities) {
    const d = new Date(a.date + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    const weekKey = monday.toISOString().slice(0, 10);
    const entry = map.get(weekKey) || { runs: 0, miles: 0, totalPace: 0 };
    entry.runs++;
    entry.miles += a.distance_miles;
    entry.totalPace += a.pace_min_mile;
    map.set(weekKey, entry);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, s]) => ({
      week,
      runs: s.runs,
      miles: Math.round(s.miles * 10) / 10,
      avgPace: Math.round((s.totalPace / s.runs) * 100) / 100,
    }));
}

export async function GET(): Promise<NextResponse> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'health');
    const summaryRaw = fs.readFileSync(path.join(dataDir, 'runkeeper-summary.json'), 'utf-8');
    const summary = JSON.parse(summaryRaw);
    const csvRaw = fs.readFileSync(path.join(dataDir, 'runkeeper-activities.csv'), 'utf-8');
    const activities = parseCSV(csvRaw);

    // Merge ClickUp run dates for accurate streak calculation
    // (RunKeeper export is missing 3 days from Jun 12-14, 2021 — the streak start)
    let clickUpDates: Set<string> | undefined;
    const clickUpPath = path.join(dataDir, 'clickup-runs.csv');
    if (fs.existsSync(clickUpPath)) {
      clickUpDates = parseClickUpRunDates(fs.readFileSync(clickUpPath, 'utf-8'));
    }

    // Sort most recent first for the response
    const sortedActivities = [...activities].sort((a, b) => b.date.localeCompare(a.date));
    const streaks = computeStreaks(activities, clickUpDates);
    // Personal record note: Jun 12-14, 2021 are missing from both exports
    // but Aaron confirmed the streak started Jun 12. Real streak ≈ 371 days.
    const personalRecord = streaks.longestStart === '2021-06-12' ? streaks.longest :
      (streaks.longestStart <= '2021-06-15' && streaks.longestEnd >= '2022-06-15') ? streaks.longest + 3 : streaks.longest;
    const monthlyStats = computeMonthlyStats(activities);
    const weeklyStats = computeWeeklyStats(activities);

    return NextResponse.json({
      summary,
      activities: sortedActivities,
      streaks: { ...streaks, personalRecord },
      monthlyStats,
      weeklyStats,
    });
  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json({ error: 'Failed to load health data' }, { status: 500 });
  }
}
