'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StatusOrb } from '../status/StatusOrb';
import { SubAgentOrbs } from '../status/SubAgentOrbs';
import type { SubAgent } from '../status/SubAgentOrbs';
import { QuickActions } from '../actions/QuickActions';
import { GlobalSearch } from '../search/GlobalSearch';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '◉' },
  { label: 'Notes', href: '/notes', icon: '✎' },
  { label: 'Docs', href: '/docs', icon: '📄' },
  { label: 'Activity', href: '/activity', icon: '⚡' },
  { label: 'Calendar', href: '/calendar', icon: '📅' },
];

interface StatusData {
  state: string;
  stateDescription: string;
  currentTask: string | null;
  activityLog: Array<{ time: string; action: string }>;
  subAgents: SubAgent[];
}

function mapState(state: string): 'idle' | 'active' | 'alert' | 'thinking' {
  if (state === 'thinking') return 'thinking';
  if (state === 'alert') return 'alert';
  if (state === 'working' || state === 'coding' || state === 'reading') return 'active';
  return 'idle';
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<StatusData | null>(null);

  // Poll status every 3 seconds
  useEffect(() => {
    const fetchStatus = async (): Promise<void> => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // Silently fail
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      {/* Alert Vignette Overlay */}
      {status?.state === 'alert' && (
        <div className="alert-vignette" aria-hidden="true" />
      )}

      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden p-3 bg-surface/90 backdrop-blur-sm border border-border rounded-lg hover:bg-surface-raised transition-colors"
        aria-label="Toggle navigation menu"
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span className={`block h-0.5 bg-foreground transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block h-0.5 bg-foreground transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 bg-foreground transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </div>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-[280px] bg-surface/95 backdrop-blur-md border-r border-border flex flex-col z-40
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Command Center
            </h1>
            <p className="text-sm text-text-muted mt-1">v2.0</p>
          </div>
          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 hover:bg-surface-raised rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <span className="text-xl text-text-muted">×</span>
          </button>
        </div>

        {/* Global Search */}
        <div className="p-4 border-b border-border">
          <GlobalSearch />
        </div>

        {/* Status Orb + Info */}
        <div className="p-6 border-b border-border flex flex-col items-center gap-2">
          <StatusOrb state={status ? mapState(status.state) : 'idle'} />
          {status?.stateDescription && (
            <p className="text-xs text-text-muted text-center">{status.stateDescription}</p>
          )}
          {status?.currentTask && (
            <p className="text-xs text-accent text-center truncate max-w-full">{status.currentTask}</p>
          )}
          <SubAgentOrbs agents={status?.subAgents || []} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg min-h-[44px]
                      transition-all duration-200 relative
                      ${isActive 
                        ? 'bg-accent/20 text-accent border-l-2 border-accent' 
                        : 'text-text-muted hover:bg-surface-raised hover:text-foreground hover:translate-x-1'
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Actions */}
        <div className="border-t border-border">
          <QuickActions />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            Orion • Local Dashboard
          </p>
        </div>
      </aside>
    </>
  );
}
