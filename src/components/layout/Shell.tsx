import { useState, useCallback, lazy, Suspense } from 'react';
import { useUIStore, type NavTab } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import Dashboard from '../dashboard/Dashboard';
import { getEngine } from '../../engine/engineClient';
import { saveGame } from '../../db/schema';
import SaveManager from './SaveManager';
import SettingsPanel from './SettingsPanel';
import CompareModal from '../stats/CompareModal';
import ErrorBoundary from './ErrorBoundary';
import OfflineIndicator from './OfflineIndicator';
import FiredScreen from '../dashboard/FiredScreen';
import MobileNav from './MobileNav';
import LoadingFallback from './LoadingFallback';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useRouterSync } from '../../hooks/useRouterSync';
import { useSound } from '../../hooks/useSound';
import { useAmbient } from '../../hooks/useAmbient';
import MbdIcon from '../ui/mbd-icon';
import TransactionTicker from '../dashboard/TransactionTicker';
import CommandPalette from '../ui/command-palette';
import { PageTransition } from '../ui/animated';
import { generateTransactionTicker } from '../../engine/warRoom';
import type { IconName } from '../../constants/icons';

// Lazy-load tab-level route components for bundle optimization
const StandingsView = lazy(() => import('../dashboard/StandingsTable'));
const RosterView    = lazy(() => import('../roster/RosterView'));
const Leaderboards  = lazy(() => import('../stats/Leaderboards'));
const PlayerProfile = lazy(() => import('../stats/PlayerProfile'));
const FinanceView   = lazy(() => import('../stats/FinanceView'));
const HistoryView   = lazy(() => import('../stats/HistoryView'));

// Phase 8 audit: route ALL sub-tabs to real components
const AwardsView           = lazy(() => import('../awards/AwardsView'));
const PlayoffBracketView   = lazy(() => import('../playoffs/PlayoffBracketView'));
const FranchiseRecordsView = lazy(() => import('../stats/FranchiseRecordsView'));
const HallOfFameGallery    = lazy(() => import('../stats/HallOfFameGallery'));
const TradeCenter          = lazy(() => import('../offseason/TradeCenter'));
const FreeAgencyPanel      = lazy(() => import('../offseason/FreeAgencyPanel'));
const ScoutingReports      = lazy(() => import('../roster/ScoutingReports'));

// ─── 5-Pillar Navigation (UI_EVOLUTION_MARKER_2026) ─────────────────────────
const NAV_PILLARS: Array<{ id: NavTab; label: string; icon: IconName; subTabs: Array<{ id: string; label: string }> }> = [
  { id: 'home', label: 'HOME', icon: 'home', subTabs: [] },
  { id: 'team', label: 'TEAM', icon: 'team', subTabs: [
    { id: 'roster', label: 'ROSTER' },
    { id: 'depth', label: 'DEPTH CHART' },
    { id: 'pipeline', label: 'PROSPECTS' },
    { id: 'devlab', label: 'DEV LAB' },
    { id: 'player', label: 'PLAYER' },
  ]},
  { id: 'frontoffice', label: 'FRONT OFFICE', icon: 'frontOffice', subTabs: [
    { id: 'finances', label: 'FINANCES' },
    { id: 'trades', label: 'TRADES' },
    { id: 'scouting', label: 'SCOUTING' },
    { id: 'freeagency', label: 'FREE AGENCY' },
  ]},
  { id: 'league', label: 'LEAGUE', icon: 'league', subTabs: [
    { id: 'standings', label: 'STANDINGS' },
    { id: 'leaderboards', label: 'LEADERS' },
    { id: 'awards', label: 'AWARDS' },
    { id: 'playoffs', label: 'PLAYOFFS' },
  ]},
  { id: 'history', label: 'HISTORY', icon: 'history', subTabs: [
    { id: 'history', label: 'TIMELINE' },
    { id: 'records', label: 'RECORDS' },
    { id: 'hof', label: 'HALL OF FAME' },
    { id: 'career', label: 'CAREER LEADERS' },
  ]},
];

// NAV_PILLARS used directly by navigation rendering

export default function Shell() {
  const { activeTab, subTab, navigate } = useUIStore();
  const { season, userTeamId, isSimulating, simProgress, gamePhase, resetAll: resetGame } = useGameStore();
  const { resetAll: resetLeague } = useLeagueStore();
  const [saveFlash, setSaveFlash] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Audio hooks
  const { play } = useSound();
  useAmbient();

  // Bidirectional URL ↔ Zustand sync
  useRouterSync();

  // Map legacy tab values
  const effectiveTab = activeTab === 'dashboard' ? 'home'
    : activeTab === 'standings' ? 'league'
    : activeTab === 'roster' ? 'team'
    : activeTab === 'stats' ? 'league'
    : activeTab === 'finance' ? 'frontoffice'
    : activeTab === 'profile' ? 'team'
    : activeTab;

  const currentPillar = NAV_PILLARS.find(p => p.id === effectiveTab) ?? NAV_PILLARS[0];

  // ESC to close topmost modal
  useEscapeKey(useCallback(() => {
    if (showSettings) setShowSettings(false);
    else if (showSaveManager) setShowSaveManager(false);
    else if (showNewGameConfirm) setShowNewGameConfirm(false);
  }, [showSettings, showSaveManager, showNewGameConfirm]));

  const handleSave = useCallback(async () => {
    try {
      const engine = getEngine();
      const state = await engine.getFullState();
      if (state) {
        await saveGame(state, `Manual Save — S${season}`, `Team ${userTeamId}`);
        void play('playSave');
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 2000);
      }
    } catch {
      void play('playBuzz');
      useUIStore.getState().addToast('Save failed', 'error');
    }
  }, [season, userTeamId, play]);

  const handleNewGame = useCallback(() => {
    resetGame();
    resetLeague();
    setShowNewGameConfirm(false);
  }, [resetGame, resetLeague]);

  const renderContent = () => {
    const wrap = (child: JSX.Element) => (
      <ErrorBoundary partial>
        <Suspense fallback={<LoadingFallback />}>{child}</Suspense>
      </ErrorBoundary>
    );

    switch (effectiveTab) {
      case 'home':
        return <Dashboard />;

      case 'team':
        switch (subTab) {
          case 'player':
          case 'profile':   return wrap(<PlayerProfile />);
          default:           return wrap(<RosterView />);
        }

      case 'frontoffice':
        switch (subTab) {
          case 'trades':     return wrap(<TradeCenter />);
          case 'freeagency': return wrap(<FreeAgencyPanel onDone={() => navigate('frontoffice', 'finances')} />);
          case 'scouting':   return wrap(<ScoutingReports />);
          default:           return wrap(<FinanceView />);
        }

      case 'league':
        switch (subTab) {
          case 'leaderboards':
          case 'stats':       return wrap(<Leaderboards />);
          case 'awards':      return wrap(<AwardsView />);
          case 'playoffs':    return wrap(<PlayoffBracketView />);
          default:            return wrap(<StandingsView />);
        }

      case 'history':
        switch (subTab) {
          case 'records':    return wrap(<FranchiseRecordsView />);
          case 'hof':        return wrap(<HallOfFameGallery />);
          case 'career':     return wrap(<Leaderboards />);
          default:           return wrap(<HistoryView />);
        }

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0B1020' }}>
      {/* ── Skip to content (a11y) ────────────────────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-orange-600 focus:text-black focus:px-4 focus:py-2 focus:text-xs focus:font-bold"
      >
        Skip to content
      </a>

      {/* ── Cmd+K Command Palette ───────────────────────────────────── */}
      <CommandPalette />

      {/* ── New Game Confirmation Modal ────────────────────────────── */}
      {showNewGameConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="new-game-title">
          <div className="bloomberg-border bg-[#0F1930] p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div id="new-game-title" className="text-orange-500 font-bold text-xs tracking-widest mb-4">NEW GAME</div>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure? This will end your current dynasty. Make sure you've saved first.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleNewGame}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold text-xs py-3 uppercase tracking-widest"
              >
                START OVER
              </button>
              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-3 uppercase tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-2.5 shrink-0 safe-top" style={{ backgroundColor: '#060B14', borderBottom: '1px solid rgba(30,42,74,0.5)' }} role="banner">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className="tracking-wider truncate" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '18px', color: '#f97316', letterSpacing: '0.08em' }}>MR. BASEBALL DYNASTY</span>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <span style={{ color: '#64748B', fontSize: '10px', fontFamily: 'Space Grotesk, sans-serif' }}>SZN</span>
            <span style={{ color: '#f97316', fontSize: '12px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>{season}</span>
          </div>
          <span className="sm:hidden text-[10px]" style={{ color: '#64748B' }}>S{season}</span>
        </div>
        {isSimulating && (
          <div className="flex items-center gap-2" aria-live="polite" role="status">
            <div className="w-32 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(30,42,74,0.5)' }} role="progressbar" aria-valuenow={Math.round(simProgress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Simulation progress">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.round(simProgress * 100)}%`, backgroundColor: '#f97316', boxShadow: '0 0 8px rgba(249,115,22,0.4)' }}
              />
            </div>
            <span className="text-[10px] tracking-wider animate-pulse" style={{ color: '#f97316', fontFamily: 'Space Grotesk, sans-serif' }}>SIMULATING</span>
          </div>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <OfflineIndicator />
          <span aria-live="assertive">
            {saveFlash && (
              <span className="text-[10px] font-bold tracking-wider animate-pulse" style={{ color: '#22C55E', fontFamily: 'Space Grotesk, sans-serif' }}>SAVED</span>
            )}
          </span>
          {[
            { label: 'SAVE', onClick: handleSave, hoverColor: '#f97316' },
            { label: 'LOAD', onClick: () => setShowSaveManager(true), hoverColor: '#38BDF8' },
            { label: 'NEW', onClick: () => setShowNewGameConfirm(true), hoverColor: '#F43F5E' },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className="text-[10px] px-2.5 sm:px-3 py-1.5 uppercase tracking-[0.15em] transition-all duration-150 min-h-[44px] sm:min-h-0"
              style={{ color: '#64748B', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, border: '1px solid rgba(30,42,74,0.5)', borderRadius: '3px', backgroundColor: 'transparent' }}
              onMouseOver={e => { (e.target as HTMLElement).style.borderColor = btn.hoverColor; (e.target as HTMLElement).style.color = btn.hoverColor; }}
              onMouseOut={e => { (e.target as HTMLElement).style.borderColor = 'rgba(30,42,74,0.5)'; (e.target as HTMLElement).style.color = '#64748B'; }}
              aria-label={`${btn.label} game`}
            >
              {btn.label}
            </button>
          ))}
          <button
            onClick={() => { void play('playClick'); setShowSettings(true); }}
            className="text-sm px-2 py-1.5 transition-all duration-150 min-h-[44px] sm:min-h-0"
            style={{ color: '#3B4A6B', border: '1px solid rgba(30,42,74,0.3)', borderRadius: '3px' }}
            onMouseOver={e => { (e.target as HTMLElement).style.color = '#A7B3C7'; (e.target as HTMLElement).style.borderColor = 'rgba(30,42,74,0.6)'; }}
            onMouseOut={e => { (e.target as HTMLElement).style.color = '#3B4A6B'; (e.target as HTMLElement).style.borderColor = 'rgba(30,42,74,0.3)'; }}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* ── Mobile Nav (bottom tab bar) ────────────────────────────── */}
      <MobileNav onNewGame={() => setShowNewGameConfirm(true)} />

      {/* ── Mobile Sub-Nav (scrollable, only shown on mobile when pillar has sub-tabs) ── */}
      {currentPillar.subTabs.length > 0 && (
        <div className="sm:hidden overflow-x-auto flex shrink-0" style={{ backgroundColor: '#0B1020', borderBottom: '1px solid #1E2A4A' }}>
          {currentPillar.subTabs.map(st => (
            <button
              key={st.id}
              onClick={() => navigate(effectiveTab as NavTab, st.id)}
              className={[
                'px-3 py-2 text-[10px] font-semibold tracking-widest uppercase transition-colors whitespace-nowrap touch-target',
                subTab === st.id
                  ? 'text-orange-400 border-b-2 border-orange-500'
                  : 'text-gray-500 active:text-gray-400',
              ].join(' ')}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Desktop Nav — 5 Pillars ─────────────────────────────────── */}
      <nav className="hidden sm:block shrink-0" style={{ backgroundColor: '#060B14', borderBottom: '1px solid rgba(30,42,74,0.3)' }} role="navigation" aria-label="Main navigation">
        {/* Primary pillar tabs */}
        <div className="flex">
          {NAV_PILLARS.map(pillar => {
            const active = effectiveTab === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => { void play('playNav'); navigate(pillar.id, pillar.subTabs[0]?.id ?? ''); }}
                className="relative px-5 py-3 text-[11px] tracking-[0.15em] uppercase transition-all duration-150 flex items-center gap-2"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#f97316' : '#64748B',
                  backgroundColor: active ? 'rgba(249,115,22,0.06)' : 'transparent',
                }}
                onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#A7B3C7'; }}
                onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
                aria-current={active ? 'page' : undefined}
              >
                <MbdIcon name={pillar.icon} size="md" />
                {pillar.label}
                {active && <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ backgroundColor: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.4)' }} />}
              </button>
            );
          })}
        </div>
        {/* Sub-navigation for active pillar */}
        {currentPillar.subTabs.length > 0 && (
          <div className="flex px-1" style={{ backgroundColor: '#0B1020', borderTop: '1px solid rgba(30,42,74,0.2)' }}>
            {currentPillar.subTabs.map(st => {
              const active = subTab === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => navigate(effectiveTab as NavTab, st.id)}
                  className="relative px-3.5 py-2 text-[10px] tracking-[0.12em] uppercase transition-all duration-150"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#F8FAFC' : '#64748B',
                  }}
                  onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#A7B3C7'; }}
                  onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.color = active ? '#F8FAFC' : '#64748B'; }}
                >
                  {st.label}
                  {active && <div className="absolute bottom-0 left-1 right-1 h-[1px]" style={{ backgroundColor: '#f97316' }} />}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 overflow-auto pb-16 sm:pb-0" role="main">
        <PageTransition transitionKey={`${effectiveTab}-${subTab}`}>
          {renderContent()}
        </PageTransition>
      </main>

      {/* ── Save/Load Manager Modal ────────────────────────────────── */}
      {showSaveManager && (
        <SaveManager onClose={() => setShowSaveManager(false)} />
      )}

      {/* ── Player Comparison Modal ──────────────────────────────── */}
      <CompareModal />

      {/* ── Transaction Ticker (desktop) ─────────────────────── */}
      <div className="hidden sm:block shrink-0">
        <TransactionTicker ticks={generateTransactionTicker(season, 0, gamePhase === 'offseason' ? 'offseason' : 'season')} />
      </div>

      {/* ── Settings Panel ─────────────────────────────────────── */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* ── Fired Screen ──────────────────────────────────────────── */}
      {gamePhase === 'fired' && <FiredScreen />}
    </div>
  );
}
