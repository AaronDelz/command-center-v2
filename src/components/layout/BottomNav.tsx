'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '◉' },
  { label: 'Notes', href: '/notes', icon: '✎' },
  { label: 'Docs', href: '/docs', icon: '📄' },
  { label: 'Activity', href: '/activity', icon: '⚡' },
  { label: 'Calendar', href: '/calendar', icon: '📅' },
];

export function BottomNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface/90 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2
                transition-colors duration-200
                ${isActive ? 'text-accent' : 'text-text-muted'}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
