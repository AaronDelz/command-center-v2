# TONIGHT.md — Sunday Feb 22 Build Plan

**Generated:** 12:45 AM · Sunday, February 22, 2026
**Context:** client-time-restructure branch, 107 files changed, ~27K lines added

---

## Part A: Time Forge — Bugs & Enhancements

### Bugs to Fix

1. **Export tab is dead code** — `viewMode` has a `'export'` type but there's no button to reach it (only 'tracker' and 'analytics' in the header). The export CSV button in the header duplicates the export tab's functionality. **Fix:** Remove the `'export'` view mode entirely; the header CSV button is sufficient. Add the JSON export as a second header button.

2. **Active timer subtitle doesn't update** — The `activeTimer` subtitle in PageHeader is computed once on render but won't live-update as the timer ticks. It shows "Timer running: Client — Task" which is fine, but if a timer starts/stops mid-session the subtitle won't refresh until a full data refetch. **Fix:** Have `fetchData` on a 30s interval when a timer is running, or lift the active timer state.

3. **RevenueSummary + TimeSummary receive raw entries but no client rate context** — If entries don't have `rate` embedded, revenue calculations could be wrong. Verify that time-entries API always embeds the rate from the client record.

### Enhancements

4. **Weekly hours bar chart** — TimeSummary (analytics view) should show a simple horizontal bar chart of hours per day for the current week. Use pure CSS bars (no chart library). Color: `color.ember.DEFAULT` with `color.ember.flame` for billable portions.

5. **Client breakdown in analytics** — Add a per-client summary card showing: client name, total hours, billable hours, revenue. Sort by revenue descending. Each row is a GlassCard with the client's color accent.

6. **Quick-start recent timers** — Below the main timer in TimeTracker, show the 3 most recent client+description combos as one-click "restart" pills (GlassPill). Saves re-entering the same task.

7. **Keyboard shortcut** — `Space` to start/stop timer when the Time Forge page is focused (with no input focused). Small quality-of-life win.

---

## Part B: Client Command — Bugs & Enhancements

### Bugs to Fix

1. **MRR calculation only counts retainerAmount** — The `monthlyRecurring` stat sums `monthlyRetainer || retainerAmount` but ignores hourly clients' actual monthly billings. **Fix:** MRR should be retainer amounts only (that's correct for MRR definition), but add a separate "Monthly Revenue" stat that includes hourly billing. Currently `totalMonthly` exists but only sums `monthlyTotal` which may be 0 for new clients. Clarify the two metrics.

2. **Client form modal submit is hacky** — The footer's Save button calls `handleSubmit` with a fake event `{ preventDefault: () => {} }`. **Fix:** Use a proper form ref or just call the save logic directly without the event wrapper.

3. **`revenueModel` vs `paymentType` dual fields** — `handleCreateClient` sets both `revenueModel` and `paymentType` with slightly different mappings ('one-off' → 'project'). The `ClientCRMCard` reads `paymentType || revenueModel`. This is fragile. **Fix:** Normalize to `paymentType` everywhere; deprecate `revenueModel` in the type and migrate existing data.

4. **Search params highlight doesn't clear** — When navigating to `/clients?highlight=Name`, the drawer opens but if the user closes it and the URL still has the param, it won't re-trigger (useEffect dependency on `searchParams` won't fire again). Minor but worth cleaning up with `router.replace('/clients')` on drawer close.

### Enhancements

5. **Client detail drawer — add time log section** — The drawer already fetches time entries. Add a compact recent-activity timeline showing the last 10 time entries for that client, with date, description, and duration. Links to Time Forge filtered by that client.

6. **Drag to reorder pipeline clients** — Pipeline clients should be sortable by drag (priority order). Not critical but would make the pipeline view more useful as a sales tool.

7. **Client health indicator** — On each card, show a subtle dot: green if activity in last 7 days, yellow if 7-30 days, red if 30+ days since last time entry. Helps spot neglected clients at a glance.

8. **Bulk invoice status update** — In the Billing tab, allow selecting multiple clients and marking all as "Sent" or "Paid" in one action.

---

## Part C: The Crucible (Health Dashboard) — New Build

### Overview
The Crucible is Aaron's health & fitness dashboard. Primary data source: RunKeeper (637 activities, 2009-2025, 1,544.6 total miles). Future: Apple Health, weight tracking, sleep.

### Data Source
- **Summary:** `knowledge/aaron/health/runkeeper-summary.json` — aggregated stats by year, by type
- **Activities:** `knowledge/aaron/health/runkeeper-activities.csv` — 637 rows: date, activity, distance_miles, duration_min, pace_min_mile, elev_gain_ft
- **Data path for API:** Copy both files to `data/health/` in the project, or have the API read from the knowledge path directly. Recommend copying to `data/` to keep the project self-contained.

### API: `src/app/api/health/route.ts`

**GET** returns:
```typescript
{
  summary: RunKeeperSummary,       // from runkeeper-summary.json
  activities: Activity[],           // parsed CSV, most recent first
  streaks: {
    current: number,               // consecutive days with activity
    longest: number,
    lastActivity: string,          // ISO date
  },
  weeklyStats: {                   // last 12 weeks
    week: string,
    runs: number,
    miles: number,
    avgPace: number,
  }[],
  monthlyStats: {                  // last 24 months
    month: string,
    runs: number,
    miles: number,
  }[],
}
```

Parse CSV server-side with a simple line-by-line parser (no deps needed).

### Page: `src/app/health/page.tsx`

Layout: PageHeader + view toggle (Overview / History / Trends)

### Components: `src/components/health/`

#### 1. `HealthHero.tsx` — Top Stats Row
Four GlassCards in a grid:
- **Total Miles** — 1,544.6 (large ember number, fire emoji)
- **Total Runs** — 620
- **Avg Pace** — 9:51/mi
- **Longest Run** — 13.18 mi

Use `color.ember.flame` for the numbers, `color.text.dim` for labels. Same pattern as Client Command summary stats.

#### 2. `YearlyHeatmap.tsx` — Activity by Year
Horizontal bar chart showing miles per year (2009-2025). Pure CSS bars inside GlassCard.
- Bar color: gradient from `color.blue.DEFAULT` (low) to `color.ember.DEFAULT` (high)
- Highlight peak years (2015-16, 2021-22) with `color.ember.flame`
- Show the cliff: 2022→2023 (361→42 miles) — this is motivational data
- On hover/click a year bar, show that year's breakdown below

#### 3. `ActivityTimeline.tsx` — Recent Activity Feed
Scrollable list of last 30 activities. Each row:
- Date (left) | Activity type icon | Distance | Duration | Pace
- Use `color.status.healthy` for good paces, `color.text.secondary` for average
- GlassCard wrapper, compact rows

#### 4. `PaceChart.tsx` — Pace Over Time
Show pace trend across all runs. Pure CSS or simple SVG line.
- X axis: time (years), Y axis: pace (min/mi, inverted — faster = higher)
- Dot for each run, connected by a subtle line
- Highlight fastest run (6:54/mi) with `color.ember.molten` glow
- This tells the "fitness journey" story visually

#### 5. `WeeklyStreak.tsx` — Current Streak + Motivation
- Current streak (days since last run vs consecutive active days)
- "Days since last run" counter (will be high — last activity Oct 2025)
- This is intentionally confrontational — The Crucible is about truth
- Show a message: "🔥 Time to reignite" or similar when streak is 0
- Use `color.status.error` glow for the "days since" if > 30

#### 6. `MonthlyVolume.tsx` — Last 24 Months Bar Chart
Monthly miles for the last 2 years. Most bars will be near-zero (decline era), which is the point — visual motivation to fill them up.

### Data Flow
```
knowledge/aaron/health/ files
  → copied to data/health/ (or symlinked)
  → /api/health reads + parses
  → page.tsx fetches + passes to components
```

### Sidebar Addition
Add to Sidebar nav under a new "Forge" or "Personal" group:
- 🏋️ The Crucible → `/health`

### Design Notes
- Follow token system strictly — no hardcoded colors
- Every card is `GlassCard`, every button is `EmberButton`
- The Crucible should feel *intense* — ember glows, the data doesn't lie
- Section headings use `SectionHeading` component with `color.text.accent` (gold)
- Respect performance limits: no more than 10 glass cards visible at once

### Build Order
1. Copy data files to `data/health/`
2. Build API route (GET handler, CSV parser)
3. Build `HealthHero` (quick win, establishes the page)
4. Build `YearlyHeatmap` (most impactful visualization)
5. Build `ActivityTimeline` (useful, straightforward)
6. Build `WeeklyStreak` (motivational centerpiece)
7. Build `PaceChart` (most complex, do last)
8. Build `MonthlyVolume` (simple bars)
9. Wire page.tsx with view toggle
10. Add sidebar nav entry

---

## Priority Order (Tonight)

**Session 1 — The Crucible MVP** (highest value, greenfield)
1. Data setup + API
2. HealthHero + YearlyHeatmap + WeeklyStreak
3. Wire the page, add to sidebar

**Session 2 — Time Forge Polish**
4. Remove dead export view
5. Quick-start recent timers
6. Weekly hours bar chart in analytics

**Session 3 — Client Command Fixes**
7. Normalize paymentType/revenueModel
8. Fix form modal submit
9. Client health indicator dots

**If time remains:**
- ActivityTimeline + PaceChart (Crucible depth)
- Client drawer time log section
- Keyboard shortcut for timer
