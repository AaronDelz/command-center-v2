# Command Center V2 Missing Features

## Status: ✅ COMPLETE

## Plan

### 1. Owner Filter on Kanban
- [x] Add `ownerFilter` state to KanbanBoard.tsx
- [x] Add filter buttons (All | Aaron | Orion) in header
- [x] Pass filter to KanbanColumn
- [x] Filter cards before rendering in KanbanColumn

### 2. Replies on Quick Notes  
- [x] Update Note type in types.ts to include optional `replies` array
- [x] Update RawNote interface in data.ts to include replies
- [x] Preserve replies when writing notes
- [x] Update NotesList.tsx to show reply count
- [x] Add expand/collapse to show replies

### 3. Drag and Drop Cards
- [x] Add drag handlers to KanbanCard (draggable, onDragStart)
- [x] Add drop handlers to KanbanColumn (onDragOver, onDrop)
- [x] Add onMoveCard callback to KanbanBoard
- [x] Uses existing PATCH endpoint for column moves
- [x] Visual feedback during drag (opacity, border highlight)

### 4. Reports Section in Docs
- [x] Add Report type to types.ts
- [x] Create /api/reports route to read reports.json
- [x] Add report content fetching (reads markdown files from clawd/)
- [x] Update docs/page.tsx with sub-tabs: "Workspace Files" | "Reports"
- [x] Reports list as card grid with category badges
- [x] Reuses existing DocsViewer for report content display

---

## Review

**Files Modified:**
- `src/lib/types.ts` - Added NoteReply, Report, ReportsData interfaces
- `src/lib/data.ts` - Added readReportsData, readReportContent functions; updated notes to preserve replies
- `src/components/kanban/KanbanBoard.tsx` - Added owner filter state and UI, handleMoveCard function
- `src/components/kanban/KanbanColumn.tsx` - Added drag/drop handlers, owner filtering
- `src/components/kanban/KanbanCard.tsx` - Made draggable with visual feedback
- `src/components/notes/NotesList.tsx` - Added expandable replies section
- `src/app/docs/page.tsx` - Added section tabs and reports section
- `src/app/api/reports/route.ts` - New API route for reports

**Changes Made:**

1. **Owner Filter (KanbanBoard.tsx, KanbanColumn.tsx)**
   - Added owner filter state with three options: 'all' | 'aaron' | 'orion'
   - Filter buttons styled consistently with purple accent theme
   - Cards filtered at column level, count shows filtered/total when filtering

2. **Replies on Notes (types.ts, data.ts, NotesList.tsx)**
   - Extended Note type with NoteReply interface
   - Replies show as collapsible section under each note
   - Click to expand/collapse, shows reply author and timestamp

3. **Drag and Drop (KanbanCard.tsx, KanbanColumn.tsx, KanbanBoard.tsx)**
   - Native HTML5 drag/drop implementation (no external deps)
   - Visual feedback: card becomes semi-transparent when dragging
   - Column background highlights purple when dragging over
   - Uses existing PATCH API to persist column changes

4. **Reports Section (docs/page.tsx, api/reports/route.ts)**
   - Docs page now has two sub-tabs: Workspace Files and Reports
   - Reports fetched from reports.json, content from clawd/knowledge/reports/
   - Report cards show title, description, category badge, date
   - Clicking a report loads its markdown content via DocsViewer

**No new dependencies added.** All features use native browser APIs and existing libraries.
