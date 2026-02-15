'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { color, glass, zIndex, layout } from '@/styles/tokens';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '◉' },
  { label: 'Kanban', href: '/kanban', icon: '⚒' },
  { label: 'Content', href: '/content', icon: '📱' },
  { label: 'Clients', href: '/clients', icon: '👥' },
  { label: 'Helm', href: '/helm', icon: '🎯' },
];

export function MobileNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden"
      style={{
        zIndex: zIndex.bottomNav,
        background: 'rgba(11, 11, 18, 0.92)',
        backdropFilter: glass.blur.nav,
        WebkitBackdropFilter: glass.blur.nav,
        borderTop: `1px solid rgba(255, 255, 255, 0.05)`,
        paddingBottom: 'env(safe-area-inset-bottom, 6px)',
      }}
    >
      <div className="flex items-center justify-around" style={{ height: layout.bottomNav.height }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 relative"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '5px 8px',
                color: isActive ? color.ember.DEFAULT : color.text.dim,
                fontSize: '0.55rem',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              {/* Active dot indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: color.ember.DEFAULT,
                  boxShadow: `0 0 6px ${color.ember.DEFAULT}`,
                }} />
              )}
              <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
              <span style={{ fontWeight: 500 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
