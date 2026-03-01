import { useState, useCallback } from 'react';
import { useUIStore, type NavTab } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import Dashboard from '../dashboard/Dashboard';
import StandingsView from '../dashboard/StandingsTable';
import RosterView from '../roster/RosterView';
import Leaderboards from '../stats/Leaderboards';
import PlayerProfile from '../stats/PlayerProfile';
import { getEngine } from '../../engine/engineClient';
import { saveGame } from '../../db/schema';

const NAV_TABS: Array<{ id: NavTab; label: string }> = [
  { id: 'dashboard',  label: 'HOME' },
  { id: 'standings',  label: 'STANDINGS' },
  { id: 'roster',     label: 'ROSTER' },
  { id: 'stats',      label: 'LEADERBOARDS' },
  { id: 'profile',    label: 'PLAYER' },
];

export default function Shell() {
  const { activeTab, setActiveTab } = useUIStore();
  const { season, userTeamId, isSimulating, simProgress, resetAll: resetGame } = useGameStore();
  const { resetAll: resetLeague } = useLeagueStore();
  const [saveFlash, setSaveFlash] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      const engine = getEngine();
      const state = await engine.getFullState();
      if (state) {
        await saveGame(state, `Manual Save — S${season}`, `Team ${userTeamId}`);
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 2000);
      }
    } catch { /* non-fatal */ }
  }, [season, userTeamId]);

  const handleNewGame = useCallback(() => {
    resetGame();
    resetLeague();
    setShowNewGameConfirm(false);
  }, [resetGame, resetLeague]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard />;
      case 'standings':  return <StandingsView />;
      case 'roster':     return <RosterView />;
      case 'stats':      return <Leaderboards />;
      case 'profile':    return <PlayerProfile />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* ── New Game Confirmation Modal ────────────────────────────── */}
      {showNewGameConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bloomberg-border bg-gray-900 p-6 max-w-sm w-full">
            <div className="text-orange-500 font-bold text-xs tracking-widest mb-4">NEW GAME</div>
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
        <div className="flex items-center gap-3">
          {saveFlash && (
            <span className="text-green-400 text-xs font-bold tracking-wider animate-pulse">SAVED</span>
          )}
          <button
            onClick={handleSave}
            className="border border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 text-xs px-3 py-1 uppercase tracking-wider transition-colors"
          >
            SAVE
          </button>
          <button
            onClick={() => setShowNewGameConfirm(true)}
            className="border border-gray-700 hover:border-red-500 text-gray-500 hover:text-red-400 text-xs px-3 py-1 uppercase tracking-wider transition-colors"
          >
            NEW GAME
          </button>
          <span className="text-gray-600 text-xs hidden sm:block">
            v0.1 — ENGINE PROOF
          </span>
        </div>
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
