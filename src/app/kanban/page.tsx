import { PageHeader } from '@/components/layout/PageHeader';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function KanbanPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Battle Board" subtitle="Plan, track, ship — the forge workflow" />
      <KanbanBoard />
    </div>
  );
}
