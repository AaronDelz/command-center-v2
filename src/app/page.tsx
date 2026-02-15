import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { GoalsSummary } from '@/components/goals/GoalsSummary';
import { DropBox } from '@/components/notes/DropBox';
import { PageHeader } from '@/components/layout/PageHeader';

function getDateString(): string {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export function Home(): React.ReactElement {
  return (
    <div>
      <PageHeader
        title="Command Deck"
        subtitle="Build something beautiful today 🖤"
        date={getDateString()}
      />

      {/* Top row: Goals Summary + Drop Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <GoalsSummary />
        <DropBox />
      </div>

      {/* Kanban Board */}
      <section className="mb-6">
        <KanbanBoard />
      </section>
    </div>
  );
}

export default Home;
