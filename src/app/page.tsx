import { GoalsSummary } from '@/components/goals/GoalsSummary';
import { UniversalInbox } from '@/components/notes/UniversalInbox';
import { PageHeader } from '@/components/layout/PageHeader';
import { QOTDBanner } from '@/components/dashboard/QOTDBanner';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { MiniKanban } from '@/components/dashboard/MiniKanban';
import { WinsThisWeek } from '@/components/dashboard/WinsThisWeek';

function getDateString(): string {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function getDynamicSubtitle(): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Late night / early morning (12am - 5am)
  if (hour < 5) {
    const late = [
      'The forge never sleeps 🔥',
      'Building while the world sleeps 🌙',
      'Night shift. Let\'s get it 🖤',
      'Burning the midnight oil ⚡',
    ];
    return late[Math.floor(Math.random() * late.length)];
  }

  // Early morning (5am - 8am)
  if (hour < 8) {
    const early = [
      'Early bird gets the empire 🌅',
      'New day, new builds 🔨',
      'Rise and forge 🔥',
      'First light. First moves ⚡',
    ];
    return early[Math.floor(Math.random() * early.length)];
  }

  // Morning (8am - 12pm)
  if (hour < 12) {
    const morning = [
      'Build something beautiful today 🖤',
      'Morning momentum. Let\'s go 🚀',
      'The forge is hot. Time to create 🔥',
      'Good morning, Commander ☀️',
    ];
    return morning[Math.floor(Math.random() * morning.length)];
  }

  // Afternoon (12pm - 5pm)
  if (hour < 17) {
    const afternoon = [
      'Afternoon push. Stay sharp ⚔️',
      'Keep the momentum going 💪',
      'The grind continues 🔥',
      'Halfway there. Finish strong 🎯',
    ];
    return afternoon[Math.floor(Math.random() * afternoon.length)];
  }

  // Evening (5pm - 9pm)
  if (hour < 21) {
    const evening = [
      'Evening session. Wind it down or rev it up? 🌆',
      'Golden hour builds hit different ✨',
      'End the day stronger than you started 💎',
      'Evening mode. What needs finishing? 🎯',
    ];
    return evening[Math.floor(Math.random() * evening.length)];
  }

  // Night (9pm - 12am)
  const night = [
    'Night owl mode activated 🦉',
    'Late night builds. No distractions 🌙',
    'The quiet hours are the productive hours 🖤',
    'One more thing before bed? ⚡',
  ];
  return night[Math.floor(Math.random() * night.length)];
}

export default function Home(): React.ReactElement {
  return (
    <div>
      {/* Header with gradient fade */}
      <div style={{ position: 'relative' }}>
        <PageHeader
          title="Command Deck"
          subtitle={getDynamicSubtitle()}
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
