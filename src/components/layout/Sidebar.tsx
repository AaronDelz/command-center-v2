'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StatusOrb } from '../status/StatusOrb';
import { color, typography, animation, layout, zIndex, glass, radius } from '@/styles/tokens';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'CORE',
    items: [
      { label: 'The Helm', href: '/', icon: '🎯' },
      { label: 'Battle Board', href: '/kanban', icon: '⚔️' },
      { label: 'The Anvil', href: '/notes', icon: '🔨' },
    ],
  },
  {
    label: 'WORK',
    items: [
      { label: 'Client Command', href: '/clients', icon: '👥' },
      { label: 'Time Forge', href: '/time', icon: '⏱️' },
      { label: 'Calendar', href: '/calendar', icon: '📅' },
    ],
  },
  {
    label: 'RESOURCES',
    items: [
      { label: 'Vault', href: '/vault', icon: '📚' },
      { label: 'Content Hub', href: '/content', icon: '📱' },
    ],
  },
];

interface StatusData {
  state: string;
  stateDescription: string;
}

function mapStatus(state: string): 'idle' | 'active' | 'alert' | 'thinking' {
  if (state === 'thinking' || state === 'working' || state === 'coding' || state === 'reading') return 'thinking';
  if (state === 'alert') return 'alert';
  if (state === 'active' || state === 'online') return 'active';
  return 'idle';
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    const fetchStatus = async (): Promise<void> => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) setStatus(await res.json());
      } catch { /* silent */ }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const orbStatus = status ? mapStatus(status.state) : 'idle';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-lg"
        style={{
          background: color.bg.elevated,
          backdropFilter: glass.blur.nav,
          border: `1px solid ${color.glass.border}`,
        }}
        aria-label="Toggle navigation"
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span className={`block h-0.5 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} style={{ background: color.text.primary }} />
          <span className={`block h-0.5 transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`} style={{ background: color.text.primary }} />
          <span className={`block h-0.5 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} style={{ background: color.text.primary }} />
        </div>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{
          width: layout.sidebar.width,
          background: 'rgba(11, 11, 18, 0.92)',
          backdropFilter: glass.blur.nav,
          WebkitBackdropFilter: glass.blur.nav,
          borderRight: `1px solid rgba(255, 255, 255, 0.04)`,
          zIndex: zIndex.sidebar,
        }}
      >
        {/* Ember edge glow */}
        <div
          className="absolute top-0 right-0 bottom-0 pointer-events-none"
          style={{
            width: '1px',
            background: `linear-gradient(180deg, transparent, rgba(255,107,53,0.15) 30%, rgba(255,107,53,0.08) 70%, transparent)`,
          }}
        />

        {/* Header */}
        <div style={{ padding: '24px 22px 18px', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
          <h1
            className="font-cinzel"
            style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: color.text.primary,
              letterSpacing: typography.letterSpacing.widest,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: color.ember.DEFAULT }}>🔥</span> THE FORGE
          </h1>
          <div style={{ fontSize: '0.7rem', color: color.text.secondary, marginTop: '3px', fontStyle: 'italic', letterSpacing: '0.02em' }}>
            Iron sharpens iron
          </div>
        </div>

        {/* Status Orb — Constellation */}
        <div style={{ padding: '8px 20px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `1px solid rgba(255,255,255,0.05)`, overflow: 'visible' }}>
          <div style={{ transform: 'scale(0.55)', transformOrigin: 'center center', margin: '-20px 0' }}>
            <StatusOrb state={orbStatus} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ padding: '12px 16px 4px' }}>
              <div style={{
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: color.text.accent,
                marginBottom: '6px',
                fontWeight: 600,
                paddingLeft: '6px',
              }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 14px',
                      borderRadius: radius.md,
                      color: isActive ? color.ember.flame : color.text.secondary,
                      background: isActive ? 'rgba(255,107,53,0.07)' : 'transparent',
                      fontSize: '0.82rem',
                      fontWeight: 400,
                      marginBottom: '2px',
                      position: 'relative',
                      textDecoration: 'none',
                      transition: `all ${animation.duration.normal} ${animation.easing.default}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = color.text.primary;
                        e.currentTarget.style.transform = 'translateX(3px)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = color.text.secondary;
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Active ember bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: '6px',
                        bottom: '6px',
                        width: '3px',
                        borderRadius: '0 2px 2px 0',
                        background: color.ember.DEFAULT,
                        boxShadow: `0 0 8px rgba(255,107,53,0.4)`,
                      }} />
                    )}
                    <span style={{ fontSize: '0.95rem', width: '22px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.6rem',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: 'rgba(255,107,53,0.15)',
                        color: color.ember.DEFAULT,
                        fontWeight: 600,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* System - pushed to bottom */}
          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: `1px solid rgba(255,255,255,0.04)`, padding: '12px 16px 4px' }}>
            <div style={{
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: color.text.accent,
              marginBottom: '6px',
              fontWeight: 600,
              paddingLeft: '6px',
            }}>
              SYSTEM
            </div>
            <Link
              href="/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 14px',
                borderRadius: radius.md,
                color: pathname === '/settings' ? color.ember.flame : color.text.secondary,
                background: pathname === '/settings' ? 'rgba(255,107,53,0.07)' : 'transparent',
                fontSize: '0.82rem',
                textDecoration: 'none',
                transition: `all ${animation.duration.normal} ${animation.easing.default}`,
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/settings') {
                  e.currentTarget.style.color = color.text.primary;
                  e.currentTarget.style.transform = 'translateX(3px)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/settings') {
                  e.currentTarget.style.color = color.text.secondary;
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {pathname === '/settings' && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '6px',
                  bottom: '6px',
                  width: '3px',
                  borderRadius: '0 2px 2px 0',
                  background: color.ember.DEFAULT,
                  boxShadow: `0 0 8px rgba(255,107,53,0.4)`,
                }} />
              )}
              <span style={{ fontSize: '0.95rem', width: '22px', textAlign: 'center' }}>⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* Footer — User profile */}
        <div style={{
          padding: '14px 20px',
          borderTop: `1px solid rgba(255,255,255,0.05)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color.ember.DEFAULT}, ${color.ember.coal})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: color.text.primary,
            }}>
              AD
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: color.text.primary, fontWeight: 500 }}>Aaron Delz</div>
              <div style={{ fontSize: '0.6rem', color: color.text.dim }}>Commander</div>
            </div>
          </div>
          {/* Submarine Dolphins insignia */}
          <svg width="28" height="14" viewBox="0 0 60 28" fill="none" style={{ opacity: 0.2, transition: 'opacity 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.2'; }}
          >
            <title>Submarine Warfare Insignia</title>
            <path d="M30 6 C24 2, 14 2, 6 8 C4 10, 3 13, 5 15 C7 17, 12 16, 16 14 C18 13, 20 12, 22 12 L24 14 C26 16, 28 17, 30 17 C32 17, 34 16, 36 14 L38 12 C40 12, 42 13, 44 14 C48 16, 53 17, 55 15 C57 13, 56 10, 54 8 C46 2, 36 2, 30 6Z" fill="currentColor" opacity="0.4"/>
            <circle cx="30" cy="11" r="3" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
      </aside>
    </>
  );
}
