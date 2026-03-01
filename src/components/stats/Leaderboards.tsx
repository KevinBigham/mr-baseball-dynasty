import { useEffect, useState, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { LeaderboardFullEntry } from '../../types/league';

// ─── Stat column definitions ─────────────────────────────────────────────────

interface ColDef {
  key: string;
  label: string;
  format: (v: number) => string;
  width: string;    // Tailwind width
}

const HITTING_COLS: ColDef[] = [
  { key: 'g',   label: 'G',   format: v => String(v),         width: 'w-10' },
  { key: 'pa',  label: 'PA',  format: v => String(v),         width: 'w-10' },
  { key: 'avg', label: 'AVG', format: v => v.toFixed(3),      width: 'w-12' },
  { key: 'obp', label: 'OBP', format: v => v.toFixed(3),      width: 'w-12' },
  { key: 'slg', label: 'SLG', format: v => v.toFixed(3),      width: 'w-12' },
  { key: 'ops', label: 'OPS', format: v => v.toFixed(3),      width: 'w-12' },
  { key: 'hr',  label: 'HR',  format: v => String(v),         width: 'w-10' },
  { key: 'rbi', label: 'RBI', format: v => String(v),         width: 'w-10' },
  { key: 'r',   label: 'R',   format: v => String(v),         width: 'w-10' },
  { key: 'h',   label: 'H',   format: v => String(v),         width: 'w-10' },
  { key: '2b',  label: '2B',  format: v => String(v),         width: 'w-10' },
  { key: '3b',  label: '3B',  format: v => String(v),         width: 'w-10' },
  { key: 'bb',  label: 'BB',  format: v => String(v),         width: 'w-10' },
  { key: 'k',   label: 'K',   format: v => String(v),         width: 'w-10' },
  { key: 'sb',  label: 'SB',  format: v => String(v),         width: 'w-10' },
];

const PITCHING_COLS: ColDef[] = [
  { key: 'g',    label: 'G',    format: v => String(v),       width: 'w-10' },
  { key: 'gs',   label: 'GS',   format: v => String(v),       width: 'w-10' },
  { key: 'w',    label: 'W',    format: v => String(v),       width: 'w-10' },
  { key: 'l',    label: 'L',    format: v => String(v),       width: 'w-10' },
  { key: 'sv',   label: 'SV',   format: v => String(v),       width: 'w-10' },
  { key: 'ip',   label: 'IP',   format: v => v.toFixed(1),    width: 'w-12' },
  { key: 'era',  label: 'ERA',  format: v => v.toFixed(2),    width: 'w-12' },
  { key: 'whip', label: 'WHIP', format: v => v.toFixed(2),    width: 'w-12' },
  { key: 'k',    label: 'K',    format: v => String(v),       width: 'w-10' },
  { key: 'bb',   label: 'BB',   format: v => String(v),       width: 'w-10' },
  { key: 'k9',   label: 'K/9',  format: v => v.toFixed(1),    width: 'w-12' },
  { key: 'bb9',  label: 'BB/9', format: v => v.toFixed(1),    width: 'w-12' },
  { key: 'h',    label: 'H',    format: v => String(v),       width: 'w-10' },
  { key: 'hra',  label: 'HRA',  format: v => String(v),       width: 'w-10' },
];

const HITTING_POSITIONS = ['ALL', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const PITCHING_POSITIONS = ['ALL', 'SP', 'RP', 'CL'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Leaderboards() {
  const { leaderboardFull, setLeaderboardFull } = useLeagueStore();
  const { setSelectedPlayer, setActiveTab, leaderboardCategory, setLeaderboardCategory } = useUIStore();
  const { gameStarted } = useGameStore();

  const [sortBy, setSortBy] = useState('hr');
  const [posFilter, setPosFilter] = useState('ALL');
  const [qualified, setQualified] = useState(true);
  const [loading, setLoading] = useState(false);

  const cols = leaderboardCategory === 'hitting' ? HITTING_COLS : PITCHING_COLS;
  const positions = leaderboardCategory === 'hitting' ? HITTING_POSITIONS : PITCHING_POSITIONS;

  // Reset sortBy and posFilter when switching category
  const switchCategory = useCallback((cat: 'hitting' | 'pitching') => {
    setLeaderboardCategory(cat);
    setSortBy(cat === 'hitting' ? 'hr' : 'era');
    setPosFilter('ALL');
  }, [setLeaderboardCategory]);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getLeaderboardFull({
      category: leaderboardCategory,
      sortBy,
      minPA: qualified ? 100 : 1,
      minIP: qualified ? 20 : 1,
      position: posFilter === 'ALL' ? undefined : posFilter,
      limit: 50,
    })
      .then(setLeaderboardFull)
      .finally(() => setLoading(false));
  }, [gameStarted, leaderboardCategory, sortBy, posFilter, qualified, setLeaderboardFull]);

  const openPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">STATISTICAL LEADERBOARDS</div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3">
        {(['hitting', 'pitching'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => switchCategory(cat)}
            className={[
              'text-xs px-4 py-1.5 border font-bold uppercase tracking-wider transition-colors',
              leaderboardCategory === cat
                ? 'border-orange-500 text-orange-400 bg-orange-950/30'
                : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {/* Position filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 text-xs">POS:</span>
          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs px-2 py-1 focus:border-orange-500 focus:outline-none"
          >
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Qualified toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={qualified}
            onChange={e => setQualified(e.target.checked)}
            className="accent-orange-500"
          />
          <span className="text-gray-500 text-xs">QUALIFIED</span>
        </label>

        <span className="text-gray-700 text-xs ml-auto">
          {leaderboardFull.length} players
        </span>
      </div>

      {!gameStarted && <div className="text-gray-500 text-xs">Start a game first.</div>}
      {loading && <div className="text-orange-400 text-xs animate-pulse">Loading...</div>}

      {!loading && leaderboardFull.length > 0 && (
        <div className="bloomberg-border overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-right px-2 py-1.5 w-8 sticky left-0 bg-gray-950 z-10">#</th>
                <th className="text-left px-2 py-1.5 sticky left-8 bg-gray-950 z-10 min-w-[120px]">PLAYER</th>
                <th className="text-left px-2 py-1.5 w-10">TM</th>
                <th className="text-left px-2 py-1.5 w-10">POS</th>
                <th className="text-right px-2 py-1.5 w-8">AGE</th>
                {cols.map(col => (
                  <th
                    key={col.key}
                    onClick={() => setSortBy(col.key)}
                    className={[
                      'text-right px-2 py-1.5 cursor-pointer hover:text-gray-400 transition-colors select-none',
                      col.width,
                      sortBy === col.key ? 'text-orange-500 font-bold' : '',
                    ].join(' ')}
                  >
                    {col.label}{sortBy === col.key ? ' ▼' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboardFull.map((entry: LeaderboardFullEntry) => (
                <tr
                  key={entry.playerId}
                  className="bloomberg-row cursor-pointer text-xs hover:bg-gray-800/50"
                  onClick={() => openPlayer(entry.playerId)}
                >
                  <td className="text-right px-2 py-1 text-gray-600 tabular-nums sticky left-0 bg-gray-950">{entry.rank}</td>
                  <td className="px-2 py-1 font-bold text-orange-300 sticky left-8 bg-gray-950">{entry.name}</td>
                  <td className="px-2 py-1 text-gray-500">{entry.teamAbbr}</td>
                  <td className="px-2 py-1 text-gray-500">{entry.position}</td>
                  <td className="text-right px-2 py-1 tabular-nums text-gray-500">{entry.age}</td>
                  {cols.map(col => (
                    <td
                      key={col.key}
                      className={[
                        'text-right px-2 py-1 tabular-nums',
                        sortBy === col.key ? 'text-orange-400 font-bold' : 'text-gray-400',
                      ].join(' ')}
                    >
                      {col.format(entry.stats[col.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && leaderboardFull.length === 0 && gameStarted && (
        <div className="text-gray-500 text-xs text-center py-8">
          Simulate a season first to see leaderboard data.
        </div>
      )}
    </div>
  );
}
