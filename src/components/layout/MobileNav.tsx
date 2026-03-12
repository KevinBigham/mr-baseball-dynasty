import { useUIStore, type NavTab } from '../../store/uiStore';

const MOBILE_TABS: Array<{ id: NavTab; label: string; icon: string }> = [
  { id: 'home',        label: 'HOME',    icon: '⚾' },
  { id: 'team',        label: 'TEAM',    icon: '📋' },
  { id: 'frontoffice', label: 'OFFICE',  icon: '💼' },
  { id: 'league',      label: 'LEAGUE',  icon: '🏆' },
  { id: 'history',     label: 'HISTORY', icon: '📖' },
];

interface MobileNavProps {
  onNewGame?: () => void;
}

export default function MobileNav({ onNewGame: _onNewGame }: MobileNavProps) {
  const { activeTab, navigate } = useUIStore();

  // Map legacy tab names
  const effectiveTab = activeTab === 'dashboard' ? 'home'
    : activeTab === 'standings' ? 'league'
    : activeTab === 'roster' ? 'team'
    : activeTab === 'stats' ? 'league'
    : activeTab === 'finance' ? 'frontoffice'
    : activeTab === 'profile' ? 'team'
    : activeTab;

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex safe-bottom"
      style={{ backgroundColor: '#0D1628', borderTop: '1px solid #1E2A4A' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {MOBILE_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.id)}
          className={[
            'flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors',
            effectiveTab === tab.id
              ? 'text-orange-400'
              : 'text-gray-500',
          ].join(' ')}
          aria-current={effectiveTab === tab.id ? 'page' : undefined}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
