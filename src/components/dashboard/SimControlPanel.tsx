import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

// ─── Sim speed / granular control panel ─────────────────────────────────────
// Replaces the single "Simulate Season" button with granular options.

interface SimControlPanelProps {
  onSimGames: (count: number) => Promise<void>;
  onSimWeek: () => Promise<void>;
  onSimMonth: () => Promise<void>;
  onSimToASB: () => Promise<void>;
  onSimToDeadline: () => Promise<void>;
  onSimRest: () => Promise<void>;
  onSimFullSeason: () => Promise<void>;
  gamesPlayed: number;
  totalGames: number;
}

const SIM_MILESTONES = [
  { label: 'Opening Day', games: 0 },
  { label: 'April', games: 200 },
  { label: 'May', games: 450 },
  { label: 'June', games: 700 },
  { label: 'All-Star Break', games: 1215 },
  { label: 'Trade Deadline', games: 1500 },
  { label: 'August', games: 1800 },
  { label: 'September', games: 2100 },
  { label: 'End of Season', games: 2430 },
];

export default function SimControlPanel({
  onSimGames,
  onSimWeek,
  onSimMonth,
  onSimToASB,
  onSimToDeadline,
  onSimRest,
  onSimFullSeason,
  gamesPlayed,
  totalGames,
}: SimControlPanelProps) {
  const { isSimulating } = useGameStore();
  const [customGames, setCustomGames] = useState(10);

  const pct = totalGames > 0 ? gamesPlayed / totalGames : 0;
  const perTeamGames = totalGames > 0 ? Math.round((gamesPlayed / totalGames) * 162) : 0;
  const seasonComplete = gamesPlayed >= totalGames;

  // Find current milestone
  const currentMilestone = SIM_MILESTONES.reduce((best, m) =>
    gamesPlayed >= m.games ? m : best, SIM_MILESTONES[0]!);
  const nextMilestone = SIM_MILESTONES.find(m => m.games > gamesPlayed);

  const handleCustomSim = useCallback(async () => {
    await onSimGames(customGames);
  }, [customGames, onSimGames]);

  return (
    <div className="border border-gray-800 rounded bg-gray-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-orange-400 tracking-wider">SEASON SIMULATION</h3>
        <span className="text-xs text-gray-500">
          {perTeamGames}/162 games per team
        </span>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-600">
            {currentMilestone.label}
          </span>
          {nextMilestone && (
            <span className="text-xs text-gray-600">
              Next: {nextMilestone.label} ({nextMilestone.games - gamesPlayed} games away)
            </span>
          )}
        </div>
      </div>

      {seasonComplete ? (
        <div className="text-center py-3">
          <span className="text-green-400 text-sm font-bold">REGULAR SEASON COMPLETE</span>
          <p className="text-xs text-gray-500 mt-1">Advance to playoffs and offseason</p>
        </div>
      ) : (
        <>
          {/* ── Quick sim buttons ─────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={onSimWeek}
              disabled={isSimulating || seasonComplete}
              className="px-3 py-2 text-xs font-bold bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              SIM WEEK
            </button>
            <button
              onClick={onSimMonth}
              disabled={isSimulating || seasonComplete}
              className="px-3 py-2 text-xs font-bold bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              SIM MONTH
            </button>
            <button
              onClick={onSimFullSeason}
              disabled={isSimulating || seasonComplete}
              className="px-3 py-2 text-xs font-bold bg-orange-700 text-white rounded hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              SIM ALL
            </button>
          </div>

          {/* ── Milestone sim buttons ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {gamesPlayed < 1215 && (
              <button
                onClick={onSimToASB}
                disabled={isSimulating}
                className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                Sim to All-Star Break
              </button>
            )}
            {gamesPlayed < 1500 && (
              <button
                onClick={onSimToDeadline}
                disabled={isSimulating}
                className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                Sim to Trade Deadline
              </button>
            )}
            <button
              onClick={onSimRest}
              disabled={isSimulating || seasonComplete}
              className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              Sim to End of Season
            </button>
          </div>

          {/* ── Custom game count ─────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalGames - gamesPlayed}
              value={customGames}
              onChange={e => setCustomGames(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700 focus:border-orange-500 outline-none"
            />
            <button
              onClick={handleCustomSim}
              disabled={isSimulating || seasonComplete}
              className="px-3 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              Sim {customGames} game{customGames !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}

      {/* ── Sim active indicator ──────────────────────────────────── */}
      {isSimulating && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          <span className="text-xs text-orange-400 animate-pulse">Simulating...</span>
        </div>
      )}
    </div>
  );
}
