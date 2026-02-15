import { PageHeader } from '@/components/layout/PageHeader';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function KanbanPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Kanban Board" subtitle="Plan, track, ship — the forge workflow" />
      <KanbanBoard />
    </div>
  );
}
