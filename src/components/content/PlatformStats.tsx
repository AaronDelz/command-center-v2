'use client';

interface PlatformStatsProps {
  platforms: {
    xFollowers: number;
    communityMembers: number;
    eliteMembers: number;
    youtubeSubscribers: number;
  };
}

const platformConfig = [
  { key: 'xFollowers', label: 'X Followers', icon: '𝕏', color: 'text-foreground' },
  { key: 'communityMembers', label: 'Community', icon: '👥', color: 'text-blue-400' },
  { key: 'eliteMembers', label: 'Elite Members', icon: '⭐', color: 'text-amber-400' },
  { key: 'youtubeSubscribers', label: 'YouTube Subs', icon: '▶️', color: 'text-red-400' },
];

export function PlatformStats({ platforms }: PlatformStatsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Platform Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {platformConfig.map(({ key, label, icon, color }) => (
          <div
            key={key}
            className="bg-surface/80 backdrop-blur-sm rounded-xl border border-border p-4 text-center hover:border-accent/30 transition-colors"
          >
            <span className="text-2xl">{icon}</span>
            <p className={`text-2xl font-bold mt-2 ${color}`}>
              {platforms[key as keyof typeof platforms].toLocaleString()}
            </p>
            <p className="text-xs text-text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
