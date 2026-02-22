# Subtask Checklists for Battle Board Cards — Feb 21, 2026

## Tasks

- [ ] **Step 1: Update types** — Add `subtasks` field to `KanbanCard` interface in `src/lib/types.ts`
- [ ] **Step 2: Create subtask API** — New route `src/app/api/kanban/subtask/route.ts` with PATCH handler
- [ ] **Step 3: Update KanbanCard component** — Add interactive subtask checklist with optimistic toggle, expand/collapse, progress bar
- [ ] **Step 4: Consolidate Swati cards in kanban.json** — Remove 7 individual Swati cards, replace `swati-price-67` with single `swati-final-sprint` card containing 8 subtasks
- [ ] **Step 5: TypeScript check** — Run `npx tsc --noEmit`, fix any errors
- [ ] **Step 6: System event** — Fire completion event via openclaw
