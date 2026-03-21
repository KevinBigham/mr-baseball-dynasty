import { useUIStore, type NavTab } from '../../store/uiStore';
import MbdIcon from '../ui/mbd-icon';
import type { IconName } from '../../constants/icons';

const MOBILE_TABS: Array<{ id: NavTab; label: string; icon: IconName }> = [
  { id: 'home',        label: 'HOME',    icon: 'home' },
  { id: 'team',        label: 'TEAM',    icon: 'team' },
  { id: 'frontoffice', label: 'OFFICE',  icon: 'frontOffice' },
  { id: 'league',      label: 'LEAGUE',  icon: 'league' },
  { id: 'history',     label: 'HISTORY', icon: 'history' },
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
          <MbdIcon name={tab.icon} size="lg" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
