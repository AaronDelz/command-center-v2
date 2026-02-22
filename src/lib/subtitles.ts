/**
 * Dynamic context-aware subtitles per page.
 * Time-of-day greetings + page-specific flavor text.
 */

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimeSlot(): 'lateNight' | 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 5) return 'lateNight';
  if (hour < 8) return 'earlyMorning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

type PageId = 'deck' | 'kanban' | 'anvil' | 'clients' | 'time' | 'calendar' | 'vault' | 'content' | 'helm' | 'settings';

const subtitles: Record<PageId, Record<ReturnType<typeof getTimeSlot>, string[]>> = {
  deck: {
    lateNight: ['The forge never sleeps 🔥', 'Building while the world sleeps 🌙', 'Night shift. Let\'s get it 🖤', 'Burning the midnight oil ⚡'],
    earlyMorning: ['Early bird gets the empire 🌅', 'New day, new builds 🔨', 'Rise and forge 🔥', 'First light. First moves ⚡'],
    morning: ['Build something beautiful today 🖤', 'Morning momentum. Let\'s go 🚀', 'The forge is hot. Time to create 🔥', 'Good morning, Commander ☀️'],
    afternoon: ['Afternoon push. Stay sharp ⚔️', 'Keep the momentum going 💪', 'The grind continues 🔥', 'Halfway there. Finish strong 🎯'],
    evening: ['Evening session. Wind it down or rev it up? 🌆', 'Golden hour builds hit different ✨', 'End the day stronger than you started 💎', 'Evening mode. What needs finishing? 🎯'],
    night: ['Night owl mode activated 🦉', 'Late night builds. No distractions 🌙', 'The quiet hours are the productive hours 🖤', 'One more thing before bed? ⚡'],
  },
  kanban: {
    lateNight: ['Midnight planning session 🌙', 'Queue up tomorrow\'s wins 🖤'],
    earlyMorning: ['First moves of the day — what ships today? 🚀', 'Dawn raid on the backlog ⚡'],
    morning: ['Plan, track, ship — the forge workflow 🔨', 'What\'s moving today? 🎯'],
    afternoon: ['Afternoon sprint — clear the board 💪', 'Shipping mode engaged 📦'],
    evening: ['Review the day\'s progress 🌆', 'Last push — anything ready to ship? ✨'],
    night: ['Planning tomorrow\'s battles 🦉', 'Late-night strategy session 🗺️'],
  },
  anvil: {
    lateNight: ['Capture those midnight ideas 💡', 'Brain dumps don\'t sleep 🌙'],
    earlyMorning: ['Morning brain dump — get it out of your head ☕', 'Fresh thoughts, fresh notes 🌅'],
    morning: ['Capture everything. Sort later 📝', 'The inbox of your mind 💭'],
    afternoon: ['Afternoon thoughts landing here 📋', 'Drop it, tag it, move on ⚡'],
    evening: ['Evening reflections 🌆', 'Parking thoughts for tomorrow 💡'],
    night: ['Late-night idea capture 🦉', 'Write it down before you forget 📝'],
  },
  clients: {
    lateNight: ['Client work never truly stops 🌙', 'Prepping for tomorrow\'s deliverables 🖤'],
    earlyMorning: ['Early start — clients love that ☀️', 'Relationships first, revenue follows 🤝'],
    morning: ['Your client roster — relationships, revenue, results 💼', 'Who needs attention today? 🎯'],
    afternoon: ['Afternoon check-in — any fires to put out? 🔥', 'Client pulse check 💪'],
    evening: ['Wrapping up client work for the day 🌆', 'Tomorrow\'s follow-ups start now 📋'],
    night: ['Prepping client deliverables 🦉', 'Quiet hours for deep client work 🖤'],
  },
  time: {
    lateNight: ['Burning midnight hours 🕐', 'Time is money — even at 2am 💰'],
    earlyMorning: ['Clock in early, clock out rich 💰', 'First timer of the day ⏱️'],
    morning: ['Track time, measure value, optimize results ⏱️', 'Every minute counts today 💎'],
    afternoon: ['Afternoon hours adding up 📊', 'Keep the timer running 💪'],
    evening: ['How\'d we do today? Check the numbers 📈', 'Time to tally the day 🌆'],
    night: ['Late-night work session logged 🦉', 'Overtime mode 🔥'],
  },
  calendar: {
    lateNight: ['Tomorrow\'s schedule awaits 🌙', 'Planning ahead while it\'s quiet 📅'],
    earlyMorning: ['What\'s on deck today? 📅', 'Your day starts here ☀️'],
    morning: ['Your schedule and upcoming events 📅', 'Navigate today\'s timeline 🗓️'],
    afternoon: ['Afternoon lineup — what\'s left? ⏰', 'Stay on schedule 🎯'],
    evening: ['How\'d today go? Plan tomorrow 🌆', 'Tomorrow\'s schedule shaping up 📋'],
    night: ['Tomorrow at a glance 🦉', 'Rest up — busy day ahead 🌙'],
  },
  vault: {
    lateNight: ['Late-night reading session 📚', 'Knowledge compounds while you sleep 🌙'],
    earlyMorning: ['Morning research — absorb and apply 📖', 'The vault is always open ☀️'],
    morning: ['Knowledge base — docs, reports, and reference 📚', 'What do you need to know? 🔍'],
    afternoon: ['Afternoon reference check 📋', 'Everything you\'ve built, documented 💎'],
    evening: ['Evening review of the archives 🌆', 'Document today\'s progress ✍️'],
    night: ['The vault holds everything 🦉', 'Deep dive into the knowledge base 📖'],
  },
  content: {
    lateNight: ['Midnight content ideas hit different 🌙', 'Creative insomnia? Channel it 💡'],
    earlyMorning: ['Morning content planning ☕', 'Create before you consume 🔥'],
    morning: ['Plan, create, publish, analyze — the content engine 📱', 'What\'s going out today? 🚀'],
    afternoon: ['Afternoon posting window — prime time 📊', 'Content doesn\'t create itself. Or does it? 🤖'],
    evening: ['Review today\'s engagement 📈', 'Schedule tomorrow\'s posts 🌆'],
    night: ['Draft now, post tomorrow 🦉', 'Content ideas don\'t wait for morning 💡'],
  },
  helm: {
    lateNight: ['Charting the course at midnight 🧭', 'Strategic planning — no distractions 🌙'],
    earlyMorning: ['Set the trajectory for today 🌅', 'Morning vision check 🧭'],
    morning: ['Navigate your trajectory 🧭', 'Eyes on the goals 🎯'],
    afternoon: ['Mid-day course correction? 🧭', 'Are we on track? 📊'],
    evening: ['End-of-day trajectory check 🌆', 'How far did we move today? 📈'],
    night: ['Recalibrating for tomorrow 🦉', 'The long game plays out here 🧭'],
  },
  settings: {
    lateNight: ['Late-night system tuning 🔧', 'Maintenance mode 🌙'],
    earlyMorning: ['Morning system check ☀️', 'Everything running smooth? 🔧'],
    morning: ['System configuration & diagnostics 🔧', 'Keep the machine humming ⚙️'],
    afternoon: ['Afternoon diagnostics 🔧', 'Fine-tuning the system ⚙️'],
    evening: ['Evening maintenance window 🌆', 'System health check 🔧'],
    night: ['Night maintenance — best time for updates 🦉', 'System tuning in quiet hours ⚙️'],
  },
};

export function getDynamicSubtitle(page: PageId): string {
  const slot = getTimeSlot();
  const options = subtitles[page]?.[slot];
  if (!options?.length) return '';
  return pick(options);
}
