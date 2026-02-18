# ClickUp → Forge Migration

## What CSVs to Export from ClickUp

All CSVs are already exported and live in `~/Documents/inbox/ClickUp/`:

| CSV File | Location | What It Contains |
|----------|----------|-----------------|
| `Time_Tracking_Income.csv` | `1. Time Tracking - Income/` | Monthly billing periods per client — tracked $, retainer, project, payment status |
| `A2P_List.csv` | `2. A2P/` | A2P/Toll-Free registrations with status, business type, approval dates |
| `Tasks_Dump.csv` | `3. Tasks Dump/` | Tasks from Apple Shortcuts + Slack AI detection |
| `Subscriptions.csv` | `CC Dues - Subscriptions - Routines/` | Monthly/yearly subscriptions |
| `CC_Due.csv` | `CC Dues - Subscriptions - Routines/` | Credit card details |

**If re-exporting:** In ClickUp, go to each List → `...` menu → Export → CSV. Make sure "Include custom fields" is checked.

## How to Run

```bash
cd ~/Documents/projects/command-center-v2

# Preview what will happen (no files written)
node scripts/migrate-clickup.js --dry-run --verbose

# Run the migration
node scripts/migrate-clickup.js

# Verbose output
node scripts/migrate-clickup.js --verbose
```

## What It Does

1. **Backs up** existing `data/*.json` files to `data/backups/<timestamp>/`
2. **Income → time.json** — Creates `billingPeriods[]` from the income CSV. Maps client names, month/year, payment status, revenue types (tracked/retainer/project). Preserves existing time entries.
3. **Clients merge** — Any unknown clients from billing periods get stub entries in `clients.json` (tagged `migrated-from-clickup` for review). Existing clients are never overwritten.
4. **A2P → a2p.json** — Creates registrations with status, business type, registration type, approval dates. Merges by business name (no duplicates).
5. **Tasks → drops.json** — Imports tasks as drops. Completed tasks are auto-archived. Deduplicates by title.
6. **Validation report** — Prints counts, revenue totals, and warnings.

## How to Verify

After running:

1. **Check revenue totals** — The report prints total and received revenue. Compare against ClickUp's monthly totals.
2. **Review warnings** — Any unmapped clients or missing data will be listed.
3. **Check new client stubs** — Search `clients.json` for `migrated-from-clickup` tag and fill in details.
4. **Start the dev server** (`npm run dev`) and verify data shows up in the UI.
5. **Restore if needed** — Backups are in `data/backups/<timestamp>/`. Just copy files back.

## Safe to Re-run

The script is idempotent:
- Billing periods are regenerated fresh each time
- A2P registrations deduplicate by business name
- Drops deduplicate by title
- Clients merge by ID (never overwrite existing)
- Backups are timestamped (never overwritten)

## Not Yet Migrated

- **Subscriptions & Credit Cards** — Low priority per spec. CSVs exist and are parsed but not yet written (expenses.json module not built yet).
- **Time entries** (individual timer logs) — ClickUp's time tracking data is embedded in the income CSV as aggregate totals, not individual entries. New time entries are tracked in the Forge going forward.
