import { color, typography } from '@/styles/tokens';

interface SectionHeadingProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string | number;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  icon,
  badge,
  action,
  className = '',
}: SectionHeadingProps): React.ReactElement {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        <h2
          style={{
            fontFamily: typography.fontFamily.display,
            fontSize: typography.fontSize.sectionHeader,
            fontWeight: typography.fontWeight.semibold,
            color: color.text.accent,
            letterSpacing: typography.letterSpacing.widest,
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {title}
        </h2>
        {badge != null && (
          <span
            style={{
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
              color: color.text.secondary,
              background: color.bg.overlay,
              padding: '2px 8px',
              borderRadius: '9999px',
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
