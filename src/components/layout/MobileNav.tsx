import { useState } from 'react';
import { useUIStore, type NavTab } from '../../store/uiStore';

const NAV_TABS: Array<{ id: NavTab; label: string }> = [
  { id: 'dashboard',  label: 'HOME' },
  { id: 'standings',  label: 'STANDINGS' },
  { id: 'roster',     label: 'ROSTER' },
  { id: 'stats',      label: 'LEADERBOARDS' },
  { id: 'finance',    label: 'FINANCES' },
  { id: 'history',    label: 'HISTORY' },
  { id: 'profile',    label: 'PLAYER' },
];

export default function MobileNav() {
  const { activeTab, setActiveTab } = useUIStore();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sm:hidden border-b border-gray-800 bg-gray-950" role="navigation" aria-label="Main navigation">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold tracking-wider text-gray-400"
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
      >
        <span className="text-orange-400">
          {NAV_TABS.find(t => t.id === activeTab)?.label ?? 'MENU'}
        </span>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div id="mobile-nav-menu" className="border-t border-gray-800">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setOpen(false);
              }}
              className={[
                'w-full text-left px-4 py-3 text-xs font-bold tracking-wider uppercase transition-colors',
                activeTab === tab.id
                  ? 'bg-orange-900/40 text-orange-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900',
              ].join(' ')}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
