import { PageHeader } from '@/components/layout/PageHeader';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getDynamicSubtitle } from '@/lib/subtitles';

export default function KanbanPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Battle Board" subtitle={getDynamicSubtitle('kanban')} />
      <KanbanBoard />
    </div>
  );
}
