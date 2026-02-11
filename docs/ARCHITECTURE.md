# Command Center V2 — Architecture Spec

*Created: 2026-02-06*
*Project Lead: Orion*

---

## Overview

Complete rebuild of the Orion Dashboard on Next.js + TypeScript + Tailwind. Local-only deployment.

**Port:** 3000 (development)
**Current V1:** Stays running on 8083

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Data | JSON files (same as V1 for compatibility) |
| API | Next.js Route Handlers |

---

## Data Layer

**Keep existing JSON files** for seamless migration:
- `kanban.json` — Task board data
- `notes.json` — Quick notes
- `status.json` — Live state from bridge
- `quotes.json` — Quote of the day rotation
- `reports.json` — Generated reports index

**Data location:** Symlink or read from V1 location:
`/Users/Orion/Documents/projects/orion-dashboard/src/`

---

## Features

### Ported from V1
1. **Status Sidebar** — Orb, state, current task, activity log
2. **Kanban Board** — 7 columns, drag-drop, owner filter, tag filter
3. **Quick Notes** — Add/view/complete notes
4. **Docs Viewer** — Workspace files + Reports
5. **Quick Actions** — Status report, security check, activity summary
6. **QOTD Banner** — Daily quote rotation

### New Features (Alex Finn's 3)
1. **Activity Feed** — Comprehensive action log, filterable
2. **Calendar View** — Visualize scheduled cron jobs
3. **Global Search** — Search across all workspace data

---

## Design Direction

**"Stars in the Margins"**
- Full starfield background (subtle, slow animation)
- Content areas mostly opaque (slight transparency allowed)
- Purple accent color (#8b5cf6)
- Clean typography hierarchy
- More whitespace than V1
- Mobile responsive

---

## Component Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Main dashboard (Kanban default)
│   ├── notes/page.tsx      # Quick Notes view
│   ├── docs/page.tsx       # Docs viewer
│   ├── activity/page.tsx   # Activity Feed (new)
│   ├── calendar/page.tsx   # Calendar view (new)
│   └── api/
│       ├── kanban/route.ts
│       ├── notes/route.ts
│       ├── status/route.ts
│       ├── docs/route.ts
│       ├── search/route.ts  # Global search (new)
│       └── activity/route.ts # Activity feed (new)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Starfield.tsx
│   │   └── Navigation.tsx
│   ├── status/
│   │   ├── StatusOrb.tsx
│   │   ├── StateDisplay.tsx
│   │   └── ActivityLog.tsx
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── KanbanCard.tsx
│   │   └── CardModal.tsx
│   ├── notes/
│   │   ├── NotesList.tsx
│   │   └── NoteModal.tsx
│   ├── docs/
│   │   ├── DocsViewer.tsx
│   │   └── WorkspaceTabs.tsx
│   ├── search/
│   │   └── GlobalSearch.tsx
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   └── CronJobCard.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Badge.tsx
├── lib/
│   ├── data.ts             # JSON file read/write
│   ├── search.ts           # Search indexing
│   └── types.ts            # TypeScript interfaces
└── styles/
    └── globals.css         # Tailwind + custom styles
```

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/kanban` | GET/POST/PATCH | Kanban CRUD |
| `/api/notes` | GET/POST/PATCH | Notes CRUD |
| `/api/status` | GET | Read status.json |
| `/api/docs` | GET | List/read workspace files |
| `/api/search` | GET | Global search |
| `/api/activity` | GET | Activity feed data |
| `/api/cron` | GET | Fetch cron jobs for calendar |

---

## Phase Breakdown

### Phase 1: Core Shell
- [ ] App layout with sidebar
- [ ] Starfield background
- [ ] Navigation tabs
- [ ] Status orb + state display
- [ ] Dark theme styling

### Phase 2: Port Features
- [ ] 2a: Kanban board
- [ ] 2b: Quick Notes
- [ ] 2c: Docs viewer
- [ ] 2d: Quick Actions

### Phase 3: New Features
- [ ] 3a: Activity Feed
- [ ] 3b: Calendar view
- [ ] 3c: Global Search

### Phase 4: Polish
- [ ] Mobile responsive
- [ ] Performance optimization
- [ ] Final QA

---

## Notes for Builders

- Follow CLAUDE.md conventions
- TypeScript strict mode — no `any`
- Use existing component patterns
- Keep functions under 50 lines
- No new dependencies without discussion
- Test before committing
