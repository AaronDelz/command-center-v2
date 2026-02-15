'use client';

import { color, typography } from '@/styles/tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  date?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, date, actions }: PageHeaderProps): React.ReactElement {
  return (
    <div style={{ marginBottom: subtitle ? '4px' : '24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2
          className="font-cinzel"
          style={{
            fontSize: typography.fontSize.pageTitle,
            fontWeight: typography.fontWeight.semibold,
            color: color.text.primary,
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {date && (
            <span style={{ fontSize: '0.78rem', color: color.text.secondary }}>{date}</span>
          )}
          {actions}
        </div>
      </div>
      {subtitle && (
        <div style={{
          fontSize: '0.8rem',
          color: color.text.secondary,
          fontStyle: 'italic',
          marginBottom: '24px',
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
