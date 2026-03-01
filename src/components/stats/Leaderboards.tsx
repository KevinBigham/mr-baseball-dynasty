import { useEffect, useState, useCallback, useMemo } from 'react';
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

// Stats where lower is better (ascending sort is "best")
const ASC_STATS = new Set(['era', 'whip', 'bb9', 'bb', 'l', 'k', 'hra', 'h']);

// Elite stat thresholds — values that deserve gold highlighting
const ELITE_HITTING: Record<string, (v: number) => boolean> = {
  avg:  v => v >= 0.300,
  obp:  v => v >= 0.380,
  slg:  v => v >= 0.520,
  ops:  v => v >= 0.900,
  hr:   v => v >= 35,
  rbi:  v => v >= 100,
  r:    v => v >= 100,
  h:    v => v >= 180,
  sb:   v => v >= 30,
};

const ELITE_PITCHING: Record<string, (v: number) => boolean> = {
  era:  v => v <= 3.00 && v > 0,
  whip: v => v <= 1.10 && v > 0,
  k9:   v => v >= 10.0,
  w:    v => v >= 16,
  sv:   v => v >= 30,
  k:    v => v >= 200,
  bb9:  v => v <= 2.00 && v > 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Leaderboards() {
  const { leaderboardFull, setLeaderboardFull } = useLeagueStore();
  const { setSelectedPlayer, setActiveTab, leaderboardCategory, setLeaderboardCategory } = useUIStore();
  const { gameStarted, userTeamId } = useGameStore();

  const [sortBy, setSortBy] = useState('hr');
  const [sortAsc, setSortAsc] = useState(false);
  const [posFilter, setPosFilter] = useState('ALL');
  const [qualified, setQualified] = useState(true);
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const cols = leaderboardCategory === 'hitting' ? HITTING_COLS : PITCHING_COLS;
  const positions = leaderboardCategory === 'hitting' ? HITTING_POSITIONS : PITCHING_POSITIONS;
  const eliteMap = leaderboardCategory === 'hitting' ? ELITE_HITTING : ELITE_PITCHING;

  // Reset sortBy and posFilter when switching category
  const switchCategory = useCallback((cat: 'hitting' | 'pitching') => {
    setLeaderboardCategory(cat);
    const defaultSort = cat === 'hitting' ? 'hr' : 'era';
    setSortBy(defaultSort);
    setSortAsc(ASC_STATS.has(defaultSort));
    setPosFilter('ALL');
    setMyTeamOnly(false);
  }, [setLeaderboardCategory]);

  // Clicking a column header: if same column → toggle direction; if new column → auto-pick direction
  const handleSort = useCallback((key: string) => {
    if (key === sortBy) {
      setSortAsc(a => !a);
    } else {
      setSortBy(key);
      setSortAsc(ASC_STATS.has(key));
    }
  }, [sortBy]);

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

  // Client-side filter for My Team + re-sort for direction
  const displayed = useMemo(() => {
    let rows = leaderboardFull;
    if (myTeamOnly) {
      rows = rows.filter(e => e.teamId === userTeamId);
    }
    // The server always returns descending. If we want ascending, reverse.
    if (sortAsc) {
      rows = [...rows].reverse();
    }
    return rows;
  }, [leaderboardFull, myTeamOnly, userTeamId, sortAsc]);

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

        {/* My Team toggle */}
        <button
          onClick={() => setMyTeamOnly(m => !m)}
          className={[
            'text-xs px-3 py-1 border font-bold uppercase tracking-wider transition-colors',
            myTeamOnly
              ? 'border-orange-500 text-orange-400 bg-orange-950/30'
              : 'border-gray-700 text-gray-600 hover:border-gray-600 hover:text-gray-400',
          ].join(' ')}
        >
          MY TEAM
        </button>

        <span className="text-gray-700 text-xs ml-auto">
          {displayed.length} players{myTeamOnly ? ' (filtered)' : ''}
        </span>
      </div>

      {!gameStarted && <div className="text-gray-500 text-xs">Start a game first.</div>}
      {loading && <div className="text-orange-400 text-xs animate-pulse">Loading...</div>}

      {!loading && displayed.length > 0 && (
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
                    onClick={() => handleSort(col.key)}
                    className={[
                      'text-right px-2 py-1.5 cursor-pointer hover:text-gray-400 transition-colors select-none',
                      col.width,
                      sortBy === col.key ? 'text-orange-500 font-bold' : '',
                    ].join(' ')}
                  >
                    {col.label}{sortBy === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((entry: LeaderboardFullEntry, idx: number) => {
                const isUserTeam = entry.teamId === userTeamId;
                return (
                  <tr
                    key={entry.playerId}
                    className={[
                      'bloomberg-row cursor-pointer text-xs hover:bg-gray-800/50',
                    ].join(' ')}
                    style={{
                      background: isUserTeam ? 'rgba(249,115,22,0.04)' : undefined,
                      borderLeft: isUserTeam ? '2px solid #f97316' : '2px solid transparent',
                    }}
                    onClick={() => openPlayer(entry.playerId)}
                  >
                    <td className="text-right px-2 py-1 text-gray-600 tabular-nums sticky left-0 bg-gray-950">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1 font-bold sticky left-8 bg-gray-950" style={{ color: isUserTeam ? '#fb923c' : '#fdba74' }}>
                      {entry.name}
                      {idx === 0 && sortBy === 'ops' && leaderboardCategory === 'hitting' && (
                        <span className="ml-1 text-yellow-400 text-[10px] font-black" title="MVP Leader">MVP</span>
                      )}
                      {idx === 0 && sortBy === 'era' && leaderboardCategory === 'pitching' && sortAsc && (
                        <span className="ml-1 text-yellow-400 text-[10px] font-black" title="Cy Young Leader">CY</span>
                      )}
                    </td>
                    <td className="px-2 py-1 text-gray-500">{entry.teamAbbr}</td>
                    <td className="px-2 py-1 text-gray-500">{entry.position}</td>
                    <td className="text-right px-2 py-1 tabular-nums text-gray-500">{entry.age}</td>
                    {cols.map(col => {
                      const val = entry.stats[col.key] ?? 0;
                      const isElite = eliteMap[col.key]?.(val) ?? false;
                      const isSortCol = sortBy === col.key;
                      return (
                        <td
                          key={col.key}
                          className={[
                            'text-right px-2 py-1 tabular-nums',
                            isElite ? 'font-bold' : '',
                            isSortCol && !isElite ? 'text-orange-400 font-bold' : '',
                          ].join(' ')}
                          style={{
                            color: isElite ? '#fbbf24' : isSortCol ? undefined : '#9ca3af',
                          }}
                        >
                          {col.format(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && displayed.length === 0 && gameStarted && (
        <div className="text-gray-500 text-xs text-center py-8">
          {myTeamOnly
            ? 'No players from your team match the current filters.'
            : 'Simulate a season first to see leaderboard data.'}
        </div>
      )}
    </div>
  );
}
