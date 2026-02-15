'use client';

interface Task {
  text: string;
  done: boolean;
}

interface DaySchedule {
  day: string;
  theme: string;
  tasks: Task[];
}

interface ContentCalendarProps {
  schedule: Record<string, DaySchedule>;
  onToggleTask: (date: string, taskIndex: number) => void;
}

const themeEmojis: Record<string, string> = {
  'Load the Chamber': '🔫',
  'Show Up Day': '💪',
  'Record Day': '🎥',
  'Go Live Day': '🔴',
  'Ship + Engage': '🚀',
  'Orion Works': '🤖',
};

export function ContentCalendar({ schedule, onToggleTask }: ContentCalendarProps) {
  const today = new Date().toISOString().split('T')[0];
  const dates = Object.keys(schedule).sort();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Content Calendar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {dates.map((date) => {
          const entry = schedule[date];
          const isToday = date === today;
          const allDone = entry.tasks.length > 0 && entry.tasks.every((t) => t.done);
          const isPast = date < today;

          return (
            <div
              key={date}
              className={`bg-surface/80 backdrop-blur-sm rounded-xl border p-3 transition-all ${
                isToday
                  ? 'border-accent ring-1 ring-accent/30'
                  : allDone
                  ? 'border-green-500/30'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{themeEmojis[entry.theme] || '📋'}</span>
                <div>
                  <p className={`text-xs font-bold ${isToday ? 'text-accent' : 'text-foreground'}`}>
                    {entry.day}
                  </p>
                  <p className="text-[10px] text-text-muted">{entry.theme}</p>
                </div>
                {isToday && (
                  <span className="ml-auto text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                    TODAY
                  </span>
                )}
              </div>

              {entry.tasks.length > 0 ? (
                <div className="space-y-1.5">
                  {entry.tasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => onToggleTask(date, i)}
                      className="flex items-center gap-2 w-full text-left group"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ${
                          task.done
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : 'border-border group-hover:border-accent'
                        }`}
                      >
                        {task.done && '✓'}
                      </span>
                      <span
                        className={`text-xs ${
                          task.done
                            ? 'text-text-muted line-through'
                            : isPast
                            ? 'text-red-400'
                            : 'text-foreground'
                        }`}
                      >
                        {task.text}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-text-muted italic">No tasks</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
