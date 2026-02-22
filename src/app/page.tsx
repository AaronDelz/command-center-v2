import { GoalsSummary } from '@/components/goals/GoalsSummary';
import { UniversalInbox } from '@/components/notes/UniversalInbox';
import { PageHeader } from '@/components/layout/PageHeader';
import { QOTDBanner } from '@/components/dashboard/QOTDBanner';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { MiniKanban } from '@/components/dashboard/MiniKanban';
import { WinsThisWeek } from '@/components/dashboard/WinsThisWeek';
import { getDynamicSubtitle } from '@/lib/subtitles';

function getDateString(): string {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function Home(): React.ReactElement {
  return (
    <div>
      {/* Header with gradient fade */}
      <div style={{ position: 'relative' }}>
        <PageHeader
          title="Command Deck"
          subtitle={getDynamicSubtitle('deck')}
          date={getDateString()}
        />
        {/* Gradient fade at bottom of header */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '16px',
            background: 'linear-gradient(to bottom, transparent, rgba(13, 13, 20, 0.6))',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* QOTD Banner */}
      <div className="mb-5">
        <QOTDBanner />
      </div>

      {/* Top row: Goals Summary + Drop Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <GoalsSummary />
        <UniversalInbox />
      </div>

      {/* Mini Kanban Preview */}
      <div className="mb-5">
        <MiniKanban />
      </div>

      {/* Wins This Week */}
      <div className="mb-5">
        <WinsThisWeek />
      </div>

      {/* Bottom row: Activity + Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <ActivityFeed />
        <MiniCalendar />
      </div>
    </div>
  );
}
