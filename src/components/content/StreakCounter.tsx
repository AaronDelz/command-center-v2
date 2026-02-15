'use client';

interface StreakCounterProps {
  current: number;
  best: number;
  lastPostDate: string;
}

export function StreakCounter({ current, best, lastPostDate }: StreakCounterProps) {
  const isActive = current > 0;
  const rings = Array.from({ length: Math.min(current, 30) }, (_, i) => i);

  return (
    <div className="bg-surface/80 backdrop-blur-sm rounded-xl border border-border p-6 text-center relative overflow-hidden">
      {/* Background glow */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* Streak fire ring */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          {/* Animated rings */}
          <svg viewBox="0 0 128 128" className="w-full h-full">
            {rings.map((i) => (
              <circle
                key={i}
                cx="64"
                cy="64"
                r={50 - i * 0.5}
                fill="none"
                stroke={`rgba(249, 115, 22, ${0.1 + (i / rings.length) * 0.3})`}
                strokeWidth="1"
                className="animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
            {/* Main ring */}
            <circle
              cx="64"
              cy="64"
              r="50"
              fill="none"
              stroke={isActive ? '#f97316' : '#3a3a4a'}
              strokeWidth="3"
              strokeDasharray={`${(current / Math.max(best, 7)) * 314} 314`}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl">{isActive ? '🔥' : '❄️'}</span>
            <span className="text-2xl font-bold text-foreground">{current}</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground">
          {isActive ? `${current} Day Streak` : 'No Active Streak'}
        </h3>
        <p className="text-sm text-text-muted mt-1">
          Best: {best} days • Last post: {lastPostDate}
        </p>
        {current >= best && current > 0 && (
          <span className="inline-block mt-2 text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full">
            🏆 Personal Best!
          </span>
        )}
      </div>
    </div>
  );
}
