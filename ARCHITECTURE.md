# The Forge — Architecture

**Version:** 2.1 (Forge Redesign)
**Last Updated:** 2026-02-14

---

## Folder Structure

```
src/
  app/                          # Next.js App Router
    (dashboard)/                # Route group — main views
      page.tsx                  # Command Deck (dashboard)
      kanban/page.tsx           # Kanban board (full page)
      content/page.tsx          # Content Hub
      clients/page.tsx          # Client Command
      helm/page.tsx             # The Helm (Goals)
      anvil/page.tsx            # The Anvil (Notes + Drop Box)
      vault/page.tsx            # Vault viewer
      calendar/page.tsx         # Calendar
      time/page.tsx             # Time Forge
      a2p/page.tsx              # A2P Pipeline
      health/page.tsx           # The Crucible (Health)
    api/                        # API routes (JSON CRUD)
      tasks/route.ts
      goals/route.ts
      notes/route.ts
      status/route.ts
      kanban/route.ts
      vault/route.ts
      content/route.ts
      activity/route.ts
      search/route.ts
      upload/route.ts
      cron/route.ts
      docs/route.ts
      reports/route.ts
      time/route.ts             # NEW — Time Forge
      clients/route.ts          # NEW — Client Command
      a2p/route.ts              # NEW — A2P Pipeline
      health/route.ts           # NEW — The Crucible
      expenses/route.ts         # NEW — Subscriptions
    layout.tsx                  # Root layout (sidebar, background, fonts)
    globals.css                 # Global styles + keyframes
    page.tsx                    # Dashboard entry
  components/
    ui/                         # ⭐ Core reusable primitives
      GlassCard.tsx             # Frosted glass card (foundation)
      EmberButton.tsx           # Primary action button
      StatusOrb.tsx             # Breathing status indicator
      SectionHeading.tsx        # Consistent section headers
      EmberParticles.tsx        # Background particle effect
      AmbientBackground.tsx     # Forge background (replaces Starfield)
      GlassInput.tsx            # Glass-styled input (future)
      GlassPill.tsx             # Tag/status pill (future)
      GlassModal.tsx            # Modal with glass treatment (future)
      GlassSelect.tsx           # Select dropdown (future)
    dashboard/                  # Dashboard-specific widgets
    kanban/                     # KanbanBoard, KanbanCard, KanbanColumn, CardModal, ListView
    clients/                    # Client Command components
    content/                    # Content Hub (StreakCounter, ContentCalendar, etc.)
    helm/                       # Goals/Helm components (GoalCard, GoalsSummary, AddGoalModal)
    health/                     # The Crucible components
    time/                       # Time Forge components
    a2p/                        # A2P Pipeline components
    notes/                      # NotesList, DropBox, NoteModal
    layout/                     # Sidebar, BottomNav, QOTD
    status/                     # StatusOrb (legacy location → migrating to ui/)
    search/                     # GlobalSearch
    actions/                    # QuickActions, UploadButton
    docs/                       # DocsViewer, WorkspaceTabs
    calendar/                   # CalendarView, CronJobCard
    activity/                   # ActivityFeed
  lib/                          # Utilities
    data.ts                     # JSON file read/write helpers
    vault.ts                    # Vault file helpers
    types.ts                    # TypeScript types
  styles/
    tokens.ts                   # ⭐ Design tokens (single source of truth)
  hooks/                        # Custom React hooks (future)
  types/                        # Shared TypeScript types (future — currently in lib/types.ts)
data/                           # JSON data files (server-side)
  kanban.json
  notes.json
  goals.json
  status.json
  quotes.json
  content.json
  clients.json                  # NEW
  time.json                     # NEW
  a2p.json                      # NEW
  health.json                   # NEW
  expenses.json                 # NEW
```

---

## Component Hierarchy

```
RootLayout
├── AmbientBackground           # Fixed background (ember orbs, particles)
│   └── EmberParticles
├── Sidebar                      # Desktop nav (glass panel)
│   ├── StatusOrb
│   ├── SubAgentOrbs
│   ├── GlobalSearch
│   └── Nav items (SectionHeading per group)
├── BottomNav                    # Mobile nav (glass bar)
├── QOTD                        # Quote of the day
└── <Page>                       # Route content
    └── GlassCard(s)             # Every card uses GlassCard
        ├── SectionHeading       # Card/section headers
        ├── EmberButton          # Actions
        ├── GlassPill            # Tags, badges
        └── [module components]  # Page-specific
```

### Shared Primitives (ui/)

Every module composes from these primitives. No module should define its own card, button, or heading styles.

| Primitive | Used By |
|-----------|---------|
| `GlassCard` | Every card in every module |
| `EmberButton` | All action buttons |
| `SectionHeading` | All section/page headers |
| `StatusOrb` | Sidebar, dashboard |
| `GlassPill` | Tags, status badges, client pills |
| `GlassModal` | All modals (card detail, forms) |

---

## Data Flow

```
JSON files (data/*.json)
  ↓ read by
API routes (src/app/api/*/route.ts)  ←  fs.readFile / fs.writeFile
  ↓ fetched by
React components (client-side fetch)
  ↓ user actions
fetch() POST/PUT/DELETE → API routes
  ↓ writes back to
JSON files
```

- **No database.** All data lives in JSON files on disk.
- **No ORM.** Direct `fs.readFileSync` / `fs.writeFileSync` in API routes.
- **Revalidation:** Components refetch after mutations. No server-side caching.
- **Shared reader:** `src/lib/data.ts` provides typed helpers (`readKanban()`, `writeKanban()`, etc.).

---

## Conventions

### Naming
- **Files:** PascalCase for components (`GlassCard.tsx`), camelCase for utilities (`data.ts`)
- **Routes:** lowercase kebab (`/api/time/billing`)
- **CSS classes:** Tailwind utility-first. Custom values via tokens only.
- **Types:** PascalCase, exported from `lib/types.ts`

### Imports
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';
// 2. Components (absolute)
import { GlassCard } from '@/components/ui/GlassCard';
// 3. Lib/utils
import { tokens } from '@/styles/tokens';
// 4. Types
import type { KanbanCard } from '@/lib/types';
```

### Component Pattern
```typescript
'use client'; // only if interactive

interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps): React.ReactElement {
  return <div>...</div>;
}
```

---

## Design Token Usage

**`src/styles/tokens.ts`** is the single source of truth for all visual properties.

### Rules
1. **Never hardcode colors, spacing, shadows, or radii** in components
2. Use Tailwind classes for standard spacing/layout
3. Use `tokens` for custom values (glass effects, ember colors, animations)
4. CSS variables in `globals.css` bridge tokens → Tailwind's `@theme`

### Example
```typescript
import { color, shadow, glass, animation } from '@/styles/tokens';

// In style props (for dynamic/JS-driven values)
style={{
  background: color.bg.surface,
  backdropFilter: glass.blur.card,
  border: `1px solid ${color.glass.border}`,
  boxShadow: shadow.card,
  transition: `all ${animation.duration.normal} ${animation.easing.default}`,
}}
```

### Token Categories
| Category | What It Controls |
|----------|-----------------|
| `color` | All colors (bg, ember, text, status, glass, ambient, kanban, category) |
| `typography` | Font families, sizes, weights, spacing |
| `spacing` | Consistent spacing scale |
| `radius` | Border radius scale |
| `shadow` | Card, hover, glow, priority shadows |
| `glass` | Backdrop blur, cursor glow effects |
| `animation` | Durations, easings, keyframe names, hover transforms |
| `layout` | Sidebar width, nav height, content max-width |
| `zIndex` | Z-index scale |
| `limits` | Performance budgets (max particles, max glass cards) |

---

## Performance Budget

- Max **3** ambient gradient orbs (background)
- Max **20** ember particles
- Max **10** visible glass cards with `backdrop-filter`
- Max **15** simultaneously animated elements
- Use `IntersectionObserver` to pause off-screen animations
- Respect `prefers-reduced-motion`
- `will-change: transform` only on actively animating elements
