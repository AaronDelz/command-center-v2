import { color, typography } from '@/styles/tokens';

interface SectionHeadingProps {
  title?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  action?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function SectionHeading({
  title,
  icon,
  badge,
  action,
  className = '',
  size = 'md',
  children,
}: SectionHeadingProps): React.ReactElement {
  const sizeStyles = {
    sm: { fontSize: '0.625rem', marginBottom: '8px' },
    md: { fontSize: typography.fontSize.sectionHeader, marginBottom: '16px' },
    lg: { fontSize: '0.875rem', marginBottom: '20px' },
  };

  return (
    <div className={`flex items-center justify-between ${className}`} style={{ marginBottom: sizeStyles[size].marginBottom }}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        {(title || children) && (
          <h2
            style={{
              fontFamily: typography.fontFamily.display,
              fontSize: sizeStyles[size].fontSize,
              fontWeight: typography.fontWeight.semibold,
              color: color.text.accent,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            {children || title}
          </h2>
        )}
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
