# Overnight Plan — Feb 17→18, 2026

## Schedule (5 sessions, same format as last two nights)

### Session 1: Review & Planning (11 PM)
**Goal:** Audit what's ready, verify build compiles, plan work allocation for Sessions 2-4.
- `npx next build` — verify everything compiles clean after today's heavy session
- Git commit all uncommitted work from today
- Review remaining To Do cards and pick 3-4 for tonight's sessions
- Write specific assignments for each working session

### Session 2: Working Session (12:05 AM — after memory update)
**Assignment: Monthly Billing Rotation Cron**
- Build `/api/billing/rotate` endpoint — advances all billing periods to next month
- Auto-creates new BillingPeriod entries for each active client with status: pending
- Carries forward retainer/tracked amounts from client config
- Set up cron job to run 1st of each month at midnight
- Test with dry-run for March 2026

### Session 3: Working Session (3 AM)
**Assignment: Subscriptions & Expenses Tracker**
- New data file `data/expenses.json` — recurring subscriptions + one-off expenses
- Types: subscription (recurring monthly/annual) + expense (one-time)
- Fields: name, amount, frequency, category, status (active/cancelled), startDate, cancelledDate
- API route: `/api/expenses` (GET/POST/PATCH/DELETE)
- UI component on Monthly Billing or standalone — shows monthly burn rate, upcoming renewals
- Seed with known subs (ClickUp, Zapier, Make, domains, hosting, etc.)

### Session 4: Working Session (4 AM)
**Assignment: A2P Webhook from JotForm + Migration Dry Run**
- Build `/api/webhooks/a2p` — receives JotForm submissions, creates A2P registration entries
- Map JotForm fields to A2PRegistration type
- Auto-set status to "toSubmit", stamp createdAt
- Test the migration script (`scripts/migrate-clickup.js`) in dry-run mode against any existing CSV data
- Document what CSVs Aaron needs to export from ClickUp

### Session 5: Review & Morning Prep (5:30 AM → feeds into 6 AM brief)
**Goal:** Review all overnight work, verify builds, update Battle Board, write audit.
- Run build verification
- Move completed cards to Done with notes
- Write `knowledge/projects/forge-redesign/overnight-audit-feb18.md`
- Stage/commit everything
- Prep notes for morning briefing

## Cards Deferred (Forge features — after ClickUp is closed)
- Floating Timer Widget (medium)
- Dynamic Subtitles (low)
- Helm "Wins This Week" (medium)
- ⌘K Global Search (low)
- Phase 4 Polish (low)

## Notes
- **Priority shift: ClickUp closure.** Target: March 14. Tonight knocks out 3 of the 4 remaining build pieces.
- After tonight, only thing left is Aaron exporting CSVs → running migration → 2-week parallel run.
- Sonnet model name fixed on midday-memory and daily-file-audit cron jobs (were erroring)
- 3 cards moved to Done today: sidebar nav cleanup, payment status flow, Anvil page
