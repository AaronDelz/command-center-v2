# OVERNIGHT BUILD PLAN — Feb 25-26, 2026

**Generated:** 11:30 PM · Session 1 (Review + Planning)
**Status:** Ready for execution

---

## Current State Summary

### Pages (12 total)
| Page | Route | Status |
|------|-------|--------|
| The Helm | `/` | ✅ Built |
| Battle Board | `/kanban` | ✅ Built — has owner filter (buttons), client filter (buttons) |
| The Anvil | `/notes` | ✅ Built |
| Client Command | `/clients` | ✅ Built |
| Time Forge | `/time` | ✅ Built — tracker + analytics views, MonthlyBilling component, RevenueSummary |
| Calendar | `/calendar` | ✅ Built |
| The Crucible | `/health` | ✅ Built |
| Vault | `/vault` | ✅ Built |
| Content Hub | `/content` | ✅ Built — StreakCounter, WeekCalendar, DraftQueue, PostLog, PlatformStats |
| Webhooks | `/webhooks` | ✅ Built |
| Goals | `/goals` | ✅ Built |
| Activity | `/activity` | ✅ Built |
| **Billing** | `/billing` | ❌ NO PAGE — API exists, MonthlyBilling component exists (in time/) |

### Data Files
| File | Records | Notes |
|------|---------|-------|
| `billing.json` | 152 periods, 22 clients, Aug 2023 → Feb 2026 | Full history. Fields: incomeTracked/Retainer/Project, paymentStatus, monthlyTotal |
| `content.json` | 22 posts, 5 drafts, 12-day streak | Streak tracking, week schedule, platform stats |
| `kanban.json` | ~60 done cards | Owner + client filters exist as button rows |
| `time.json` | 12 entries, 9 clients | Jan-Feb 2026 only. Fields: duration, rate, billable, tags |
| `clients.json` | 22 clients | Full client records with rates |

### Existing Billing Infrastructure
- **API:** `/api/billing` — GET (filter by month/year/client), POST (create), PATCH (update)
- **API:** `/api/billing/sync` — POST (recalculate incomeTracked from time entries)
- **API:** `/api/billing/rotate` — POST (auto-create new month's periods)
- **Component:** `MonthlyBilling.tsx` (493 lines) — month nav, payment status pills, inline editing, rotate + sync buttons
- **Component:** `RevenueSummary.tsx` (152 lines) — summary stats from time entries
- **NO dedicated page** — MonthlyBilling currently embedded in Time Forge analytics view

### Design System
- **Tokens:** `src/styles/tokens.ts` — color (ember palette), typography, radius, animation, spacing
- **UI Kit:** GlassCard, EmberButton, GlassInput, GlassSelect, GlassModal, GlassPill, SectionHeading, StatusOrb
- **Layout:** PageHeader (title + dynamic subtitle), Sidebar (nav groups), BottomNav (mobile)
- **Theme:** Dark void background (#07070c), glass morphism, ember accents (#ff6b35), flame highlights (#ffb347)

---

## SESSION 2 — Billing Page Build (2:42 AM)

**Goal:** Create `/billing` as a standalone page with richer views than the embedded MonthlyBilling.

### Files to Create
1. **`src/app/billing/page.tsx`** — New page component

### Files to Modify
1. **`src/components/layout/Sidebar.tsx`** — Add "Billing" nav item to WORK group (after Time Forge)
   - `{ label: 'Billing', href: '/billing', icon: '💰' }`
2. **`src/components/layout/BottomNav.tsx`** — Check if billing should appear in mobile nav (likely not — keep it lean)

### Page Layout Spec

```
┌──────────────────────────────────────────────┐
│ PageHeader: "The Ledger" + dynamic subtitle  │
├──────────────────────────────────────────────┤
│ ┌─ Revenue Overview (3-card row) ──────────┐ │
│ │ This Month: $X,XXX │ YTD: $XX,XXX │ ...  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌─ Month Navigator ───────────────────────┐  │
│ │ ← February 2026 →    [Sync] [Rotate]   │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─ Billing Table (per-client rows) ───────┐  │
│ │ Client | Tracked | Retainer | Project | │  │
│ │        | Total   | Status   |         | │  │
│ │ (inline edit, status pill advance)      │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─ Revenue Chart (bar chart, 6 months) ──┐   │
│ │ Monthly revenue trend                   │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─ Client Breakdown (pie/donut) ─────────┐   │
│ │ Revenue by client for selected month    │  │
│ └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Components to Build

#### 1. `src/components/billing/RevenueOverview.tsx` (~80 lines)
- 3 GlassCards in a row: **This Month**, **Last Month**, **YTD Total**
- Calculate from billingPeriods data filtered by month/year
- Show delta (% change from last month) with ember color for up, dim for down
- Mobile: stack vertically

#### 2. `src/components/billing/BillingTable.tsx` (~200 lines)
- Extract and enhance from MonthlyBilling.tsx (keep MonthlyBilling intact for Time page)
- Table columns: Client Name, Tracked ($), Retainer ($), Project ($), Total ($), Payment Status
- Inline edit on Tracked/Retainer/Project cells (click to edit, blur to save — pattern already exists in MonthlyBilling)
- PaymentStatusPill with click-to-advance (reuse existing pattern)
- Sort by: Total (desc default), Client name, Status
- Row highlight on hover
- Month navigator (← →) with Sync + Rotate buttons

#### 3. `src/components/billing/RevenueChart.tsx` (~120 lines)
- Simple bar chart showing last 6 months of total revenue
- Use inline SVG (no chart library needed — keep it lightweight)
- Each bar = sum of monthlyTotal for that month across all clients
- Hover shows exact amount
- Ember gradient on bars
- X-axis: month labels, Y-axis: dollar amounts

#### 4. `src/components/billing/ClientBreakdown.tsx` (~100 lines)
- Horizontal stacked bar or simple ranked list showing revenue by client for selected month
- Color-coded by client (generate colors from client name hash)
- Show percentage of total
- Only show clients with > $0 for the month

### API Notes
- All APIs already exist — no backend changes needed
- Fetch pattern: `GET /api/billing?month=X&year=Y` for table data
- `GET /api/billing` (no filters) for chart data (all periods)
- `GET /api/clients` for client name resolution

### Dynamic Subtitle
- Add to `src/lib/subtitles.ts`: billing entries like "Show me the money", "Every dollar tracked", "The books don't balance themselves"

### Key Decisions
- **Don't refactor MonthlyBilling.tsx** — it works in Time Forge. Build fresh components for Billing page that share the same API patterns
- **No new dependencies** — SVG charts, inline styles with tokens
- **Mobile first** — cards stack, table scrolls horizontally

---

## SESSION 3 — Content Hub Upgrade (3:18 AM)

**Goal:** Enhance DraftQueue with expandable rows, inline editing, status dropdowns, and add post history depth + streak visual.

### Files to Modify

#### 1. `src/components/content/DraftQueue.tsx` (250 lines → ~400 lines)

**Current state:** Expandable rows (click to show content), status pill click-to-advance, platform icons, pillar color bars. Sorted ready-first.

**Enhancements:**

a) **Inline Title Editing**
- Double-click title → editable input field
- Blur or Enter → save via PATCH `/api/content` (draft update)
- Escape → cancel
- State: `editingDraftId: string | null`

b) **Status Dropdown** (replace click-to-advance pill)
- Click status pill → dropdown with all 4 statuses (idea/outline/inProgress/ready)
- Allow moving backwards (not just forward)
- Dropdown positioned below pill, glass styled
- Click outside or select → close
- Pattern: small absolute-positioned div with status options

c) **Expanded Row Enhancements**
- Show full content (already works)
- Add "Edit Content" button that opens a GlassModal with textarea
- Add platform checkboxes to toggle platforms
- Add scheduled date picker (simple date input)
- Add delete button (with confirm)

d) **Add New Draft Button**
- EmberButton at top: "+ New Draft"
- Opens GlassModal with form: title, pillar (dropdown), type (dropdown), platforms (checkboxes)
- POST to `/api/content` to create

#### 2. `src/components/content/StreakCounter.tsx` — Add Streak Visual

**Enhancement:** Add a mini heatmap or flame visualization
- Show last 30 days as small dots/squares
- Green for posted, dim for missed, ember for today
- Shows the streak visually, not just numbers
- Keep it compact — fits in the existing StreakCounter card

#### 3. `src/components/content/PostLog.tsx` (227 lines → ~300 lines)

**Enhancements:**
- Add month filter (dropdown: "All", "February", "January", etc.)
- Add pillar filter (buttons, same pattern as kanban owner filter)
- Show total posts count per filter
- Expandable rows already work — keep as-is

#### 4. `src/app/api/content/route.ts` — Check/Add PATCH + DELETE

**Verify existing methods.** If missing, add:
- `PATCH /api/content` — Update draft (title, content, status, platforms, scheduledFor)
- `DELETE /api/content?id=draft-xxx` — Remove draft
- `POST /api/content` — Add new draft (may already exist)

### Key Decisions
- **No new dependencies** — date inputs use native HTML date picker
- **Modal for content editing** — keeps the list view clean
- **Status dropdown vs click-advance** — dropdown is more flexible (can go backwards)
- **Streak heatmap** — 30-day grid, not GitHub-style year grid (too much for this section)

---

## SESSION 4 — Battle Board Polish (4:14 AM)

**Goal:** Convert client filter from button row to dropdown, polish kanban UX.

### Files to Modify

#### 1. `src/components/kanban/KanbanBoard.tsx` (385 lines → ~400 lines)

**Client Filter → Dropdown Conversion:**

Current: Button row iterating `allClients` array — doesn't scale when many clients exist.

New: GlassSelect dropdown
- Default: "All Clients"
- Options: sorted list of unique client names from cards
- Same filtering logic, just different UI
- Place next to owner filter buttons (keep owner as buttons — only 4 options)

```tsx
<GlassSelect
  value={clientFilter}
  onChange={(e) => setClientFilter(e.target.value)}
  options={[
    { value: 'all', label: 'All Clients' },
    ...allClients.map(c => ({ value: c, label: c }))
  ]}
/>
```

**Additional Polish:**

a) **Done Column Collapse**
- Done column shows all completed cards — can be very long (60+ cards)
- Add "Show X more" pattern: show 5 most recent, expandable
- Count badge on column header showing total

b) **Card Count Badges**
- Show card count on each column header: "📋 To Do (12)"

c) **Drag Handle Visual**
- If drag-and-drop exists, improve the grab cursor area
- If no DnD yet, skip (too complex for this session)

d) **Priority Color Indicators**
- Cards already have priority field — add subtle left-border color
- High: ember molten, Medium: ember flame, Low: blue, None: transparent

### Key Decisions
- **Keep owner filter as buttons** — only 4 options, buttons work fine
- **Client filter to dropdown** — scales to 22+ clients
- **Done column collapse** — prevents scroll fatigue
- **No drag-and-drop** — if it doesn't exist, don't add it tonight (too complex)

---

## SESSION 5 — Time↔Billing Integration + Mobile Pass (5:32 AM)

**Goal:** Connect Time Forge entries to Billing page, and do a mobile responsive sweep.

### Part A: Time → Billing Integration

#### Files to Modify

1. **`src/components/time/TimeTracker.tsx`** — After saving a time entry:
   - Show a subtle toast/indicator: "💰 Billing will sync on next refresh"
   - No auto-sync (could be expensive) — the Sync button on Billing page handles it

2. **`src/components/time/RevenueSummary.tsx`** (152 lines)
   - Add link to Billing page: "View full billing →" (ember link)
   - Show current month total from billing data alongside time-calculated total
   - If discrepancy, show warning icon

3. **`src/app/billing/page.tsx`** (built in Session 2)
   - Add "Time Entries" expandable section at bottom
   - Show time entries for selected month grouped by client
   - Each row: description, duration, rate, total
   - Link each entry back to Time Forge

### Part B: Mobile Responsive Pass

**Check and fix these pages:**

| Page | Known Issues | Fix |
|------|-------------|-----|
| Billing (new) | Built mobile-first in Session 2 | Verify cards stack, table scrolls |
| Battle Board | Card content may overflow | Max-width on cards, truncate long titles |
| Content Hub | DraftQueue rows may be tight | Reduce padding on mobile, stack metadata vertically |
| Time Forge | MonthlyBilling table | Horizontal scroll wrapper on table |
| The Helm | Should be OK | Quick verify |

**Mobile breakpoint strategy:**
- Use CSS media queries via inline styles: `window.innerWidth` check or CSS `@media` in globals.css
- Actually — use a `useMediaQuery` hook or check `window.matchMedia` for conditional rendering
- Create `src/hooks/useIsMobile.ts` if it doesn't exist:

```tsx
'use client';
import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}
```

**Mobile-specific fixes:**
- Tables: wrap in `overflow-x: auto` container
- Card grids: switch from `grid-template-columns: repeat(3, 1fr)` to `1fr` on mobile
- Font sizes: already using tokens, should be fine
- Sidebar: already collapses (BottomNav on mobile)
- Touch targets: ensure all clickable elements ≥ 44px

### Key Decisions
- **No auto-sync** — manual Sync button is intentional (prevents accidental overwrites)
- **useIsMobile hook** — lightweight, no dependencies
- **Horizontal scroll for tables** — better than hiding columns on mobile
- **Session 5 is the last session** — prioritize the mobile pass, skip nice-to-haves if running low on time

---

## Execution Notes for All Sessions

1. **Import tokens consistently:** `import { color, typography, radius, animation, spacing } from '@/styles/tokens'`
2. **Use existing UI components:** GlassCard, EmberButton, GlassSelect, GlassModal, SectionHeading, GlassPill
3. **Dynamic subtitles:** Add entries to `src/lib/subtitles.ts` for new pages
4. **Test in browser:** After building, open `http://localhost:3000/<route>` and verify
5. **No new npm packages** — everything is achievable with existing deps + inline SVG
6. **TypeScript strict:** All components typed, no `any` unless truly needed
7. **Error states:** Each page should handle loading + error gracefully (already patterned in existing pages)

## File Reference Quick-Access

```
src/styles/tokens.ts          — Design tokens (colors, typography, spacing)
src/components/ui/index.ts    — UI component barrel export
src/lib/subtitles.ts          — Dynamic subtitle generator
src/lib/data.ts               — Data read/write helpers (readBillingData, etc.)
src/lib/types.ts               — Shared TypeScript types
src/components/layout/Sidebar.tsx — Navigation config
```

---

*Plan complete. Sessions 2-5: read this file, execute your section, verify in browser.*
