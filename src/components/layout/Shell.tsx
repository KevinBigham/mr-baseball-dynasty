import { useUIStore, type NavTab } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import Dashboard from '../dashboard/Dashboard';
import StandingsView from '../dashboard/StandingsTable';
import RosterView from '../roster/RosterView';
import Leaderboards from '../stats/Leaderboards';
import PlayerProfile from '../stats/PlayerProfile';
import TradeCenter from '../trade/TradeCenter';
import FreeAgentMarket from '../offseason/FreeAgentMarket';
import LineupEditor from '../lineup/LineupEditor';
import DraftRoom from '../draft/DraftRoom';
import ProspectRankingsView from '../prospects/ProspectRankings';
import FinanceDashboard from '../finance/FinanceDashboard';
import InjuryTransactions from '../history/InjuryTransactions';
import AdvancedStats from '../analytics/AdvancedStats';
import CoachingStaffView from '../coaching/CoachingStaffView';
import PlayerComparison from '../stats/PlayerComparison';

const NAV_TABS: Array<{ id: NavTab; label: string }> = [
  { id: 'dashboard',    label: 'HOME' },
  { id: 'standings',    label: 'STANDINGS' },
  { id: 'roster',       label: 'ROSTER' },
  { id: 'lineup',       label: 'LINEUP' },
  { id: 'trades',       label: 'TRADES' },
  { id: 'draft',        label: 'DRAFT' },
  { id: 'freeagents',   label: 'FA MARKET' },
  { id: 'prospects',    label: 'PROSPECTS' },
  { id: 'finance',      label: 'FINANCE' },
  { id: 'analytics',    label: 'ANALYTICS' },
  { id: 'frontoffice',  label: 'FRONT OFFICE' },
  { id: 'history',      label: 'HISTORY' },
  { id: 'stats',        label: 'LEADERS' },
  { id: 'compare',      label: 'COMPARE' },
  { id: 'profile',      label: 'PLAYER' },
];

export default function Shell() {
  const { activeTab, setActiveTab } = useUIStore();
  const { season, isSimulating, simProgress } = useGameStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard />;
      case 'standings':  return <StandingsView />;
      case 'roster':     return <RosterView />;
      case 'trades':     return <TradeCenter />;
      case 'freeagents': return <FreeAgentMarket />;
      case 'lineup':     return <LineupEditor />;
      case 'draft':      return <DraftRoom />;
      case 'prospects':  return <ProspectRankingsView />;
      case 'finance':    return <FinanceDashboard />;
      case 'analytics':    return <AdvancedStats />;
      case 'frontoffice':  return <CoachingStaffView />;
      case 'history':      return <InjuryTransactions />;
      case 'stats':        return <Leaderboards />;
      case 'compare':    return <PlayerComparison allPlayers={[]} />;
      case 'profile':    return <PlayerProfile />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* ── Header bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-black border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-orange-500 font-bold text-sm tracking-widest">MR. BASEBALL DYNASTY</span>
          <span className="text-gray-600 text-xs">⚾</span>
          <span className="text-gray-500 text-xs">SEASON {season}</span>
        </div>
        {isSimulating && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-200"
                style={{ width: `${Math.round(simProgress * 100)}%` }}
              />
            </div>
            <span className="text-orange-400 text-xs animate-pulse">SIMULATING…</span>
          </div>
        )}
        <span className="text-gray-600 text-xs hidden sm:block">
          v0.1 — ENGINE PROOF
        </span>
      </header>

      {/* ── Nav bar ─────────────────────────────────────────────────── */}
      <nav className="flex border-b border-gray-800 bg-gray-950 shrink-0">
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 text-xs font-bold tracking-wider uppercase transition-colors border-r border-gray-800 last:border-r-0',
              activeTab === tab.id
                ? 'bg-orange-900/40 text-orange-400 border-b-2 border-b-orange-500'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
