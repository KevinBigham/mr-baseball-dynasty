import { useEffect, useState, useCallback, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { DataTable } from '../ui/data-table';
import CoachTip from '../shared/CoachTip';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { cn } from '../../lib/utils';

// ─── Stat column definitions ─────────────────────────────────────────────────

interface ColDef {
  key: string;
  label: string;
  format: (v: number) => string;
  width: string;
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

const ADV_HITTING_COLS: ColDef[] = [
  { key: 'wRCPlus', label: 'wRC+',  format: v => String(Math.round(v)), width: 'w-12' },
  { key: 'wOBA',    label: 'wOBA',  format: v => v.toFixed(3),          width: 'w-12' },
  { key: 'ops',     label: 'OPS',   format: v => v.toFixed(3),          width: 'w-12' },
  { key: 'babip',   label: 'BABIP', format: v => v.toFixed(3),          width: 'w-12' },
  { key: 'iso',     label: 'ISO',   format: v => v.toFixed(3),          width: 'w-12' },
  { key: 'avg',     label: 'AVG',   format: v => v.toFixed(3),          width: 'w-12' },
  { key: 'obp',     label: 'OBP',   format: v => v.toFixed(3),          width: 'w-12' },
  { key: 'slg',     label: 'SLG',   format: v => v.toFixed(3),          width: 'w-12' },
  { key: 'war',     label: 'WAR',   format: v => v.toFixed(1),          width: 'w-12' },
];

const ADV_PITCHING_COLS: ColDef[] = [
  { key: 'fip',   label: 'FIP',   format: v => v.toFixed(2),  width: 'w-12' },
  { key: 'xFIP',  label: 'xFIP',  format: v => v.toFixed(2),  width: 'w-12' },
  { key: 'era',   label: 'ERA',   format: v => v.toFixed(2),  width: 'w-12' },
  { key: 'babip', label: 'BABIP', format: v => v.toFixed(3),  width: 'w-12' },
  { key: 'whip',  label: 'WHIP',  format: v => v.toFixed(2),  width: 'w-12' },
  { key: 'k9',    label: 'K/9',   format: v => v.toFixed(1),  width: 'w-12' },
  { key: 'bb9',   label: 'BB/9',  format: v => v.toFixed(1),  width: 'w-12' },
  { key: 'kbb',   label: 'K/BB',  format: v => v.toFixed(2),  width: 'w-12' },
  { key: 'war',   label: 'WAR',   format: v => v.toFixed(1),  width: 'w-12' },
];

const CAREER_HITTING_COLS: ColDef[] = [
  { key: 'seasons', label: 'YRS', format: v => String(v),    width: 'w-10' },
  { key: 'g',       label: 'G',   format: v => String(v),    width: 'w-10' },
  { key: 'avg',     label: 'AVG', format: v => v.toFixed(3), width: 'w-12' },
  { key: 'hr',      label: 'HR',  format: v => String(v),    width: 'w-10' },
  { key: 'h',       label: 'H',   format: v => String(v),    width: 'w-10' },
  { key: 'rbi',     label: 'RBI', format: v => String(v),    width: 'w-10' },
  { key: 'ops',     label: 'OPS', format: v => v.toFixed(3), width: 'w-12' },
  { key: 'sb',      label: 'SB',  format: v => String(v),    width: 'w-10' },
  { key: 'bb',      label: 'BB',  format: v => String(v),    width: 'w-10' },
];

const CAREER_PITCHING_COLS: ColDef[] = [
  { key: 'seasons', label: 'YRS', format: v => String(v),    width: 'w-10' },
  { key: 'g',       label: 'G',   format: v => String(v),    width: 'w-10' },
  { key: 'w',       label: 'W',   format: v => String(v),    width: 'w-10' },
  { key: 'l',       label: 'L',   format: v => String(v),    width: 'w-10' },
  { key: 'era',     label: 'ERA', format: v => v.toFixed(2), width: 'w-12' },
  { key: 'ip',      label: 'IP',  format: v => v.toFixed(1), width: 'w-12' },
  { key: 'k',       label: 'K',   format: v => String(v),    width: 'w-10' },
  { key: 'sv',      label: 'SV',  format: v => String(v),    width: 'w-10' },
  { key: 'whip',    label: 'WHIP',format: v => v.toFixed(2), width: 'w-12' },
];

const HITTING_POSITIONS = ['ALL', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const PITCHING_POSITIONS = ['ALL', 'SP', 'RP', 'CL'];

const ASC_STATS = new Set(['era', 'whip', 'bb9', 'bb', 'l', 'k', 'hra', 'h', 'fip', 'xFIP', 'hr9', 'babip']);

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

const ELITE_ADV_HITTING: Record<string, (v: number) => boolean> = {
  wRCPlus: v => v >= 130,
  wOBA:    v => v >= 0.370,
  ops:     v => v >= 0.900,
  iso:     v => v >= 0.220,
  war:     v => v >= 5.0,
  avg:     v => v >= 0.300,
  obp:     v => v >= 0.380,
  slg:     v => v >= 0.520,
};

const ELITE_ADV_PITCHING: Record<string, (v: number) => boolean> = {
  fip:  v => v <= 3.00 && v > 0,
  xFIP: v => v <= 3.20 && v > 0,
  era:  v => v <= 3.00 && v > 0,
  whip: v => v <= 1.10 && v > 0,
  k9:   v => v >= 10.0,
  kbb:  v => v >= 4.0,
  bb9:  v => v <= 2.00 && v > 0,
  war:  v => v >= 4.0,
};

// ─── Unified row type for DataTable ──────────────────────────────────────────

interface LeaderRow {
  rank: number;
  playerId: number;
  name: string;
  teamAbbr: string;
  teamId: number;
  position: string;
  age: number;
  isPitcher: boolean;
  stats: Record<string, number>;
  isRetired?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

type LeaderboardMode = 'hitting' | 'pitching' | 'advanced' | 'career';

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
  const [mode, setMode] = useState<LeaderboardMode>('hitting');
  const [advSubCat, setAdvSubCat] = useState<'hitting' | 'pitching'>('hitting');
  const [advData, setAdvData] = useState<Array<{
    rank: number; playerId: number; name: string; teamAbbr: string;
    position: string; age: number; stats: Record<string, number>;
  }>>([]);
  const [careerSubCat, setCareerSubCat] = useState<'hitting' | 'pitching'>('hitting');
  const [careerData, setCareerData] = useState<Array<{
    rank: number; playerId: number; name: string; position: string;
    seasonsPlayed: number; isRetired: boolean; careerTotals: Record<string, number>;
  }>>([]);

  const isAdvanced = mode === 'advanced';
  const isCareer = mode === 'career';
  const colDefs = isCareer
    ? (careerSubCat === 'hitting' ? CAREER_HITTING_COLS : CAREER_PITCHING_COLS)
    : isAdvanced
    ? (advSubCat === 'hitting' ? ADV_HITTING_COLS : ADV_PITCHING_COLS)
    : (leaderboardCategory === 'hitting' ? HITTING_COLS : PITCHING_COLS);
  const positions = isAdvanced
    ? (advSubCat === 'hitting' ? HITTING_POSITIONS : PITCHING_POSITIONS)
    : (leaderboardCategory === 'hitting' ? HITTING_POSITIONS : PITCHING_POSITIONS);
  const eliteMap = isAdvanced
    ? (advSubCat === 'hitting' ? ELITE_ADV_HITTING : ELITE_ADV_PITCHING)
    : (leaderboardCategory === 'hitting' ? ELITE_HITTING : ELITE_PITCHING);

  const switchCategory = useCallback((cat: LeaderboardMode) => {
    setMode(cat);
    if (cat === 'career') {
      setCareerSubCat('hitting');
      setSortBy('hr');
      setSortAsc(false);
    } else if (cat === 'advanced') {
      setAdvSubCat('hitting');
      setSortBy('wRCPlus');
      setSortAsc(false);
    } else {
      setLeaderboardCategory(cat);
      const defaultSort = cat === 'hitting' ? 'hr' : 'era';
      setSortBy(defaultSort);
      setSortAsc(ASC_STATS.has(defaultSort));
    }
    setPosFilter('ALL');
    setMyTeamOnly(false);
  }, [setLeaderboardCategory]);

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

    if (isCareer) {
      getEngine().getCareerLeaderboard(sortBy)
        .then((data) => setCareerData(data as any))
        .finally(() => setLoading(false));
    } else if (isAdvanced) {
      getEngine().getLeaderboardAdvanced(advSubCat, sortBy, 50)
        .then(setAdvData)
        .finally(() => setLoading(false));
    } else {
      getEngine().getLeaderboardFull({
        category: leaderboardCategory,
        sortBy,
        minPA: qualified ? 100 : 1,
        minIP: qualified ? 20 : 1,
        position: posFilter === 'ALL' ? undefined : posFilter,
        limit: 50,
      })
        .then((data) => setLeaderboardFull(data as any))
        .finally(() => setLoading(false));
    }
  }, [gameStarted, leaderboardCategory, sortBy, posFilter, qualified, setLeaderboardFull, isAdvanced, advSubCat, isCareer, careerSubCat]);

  // Normalize all modes into unified LeaderRow[]
  const displayed: LeaderRow[] = useMemo(() => {
    if (isCareer) {
      let rows = careerData;
      if (sortAsc) rows = [...rows].reverse();
      return rows.map((r, i) => ({
        rank: i + 1,
        playerId: r.playerId,
        name: r.name,
        teamAbbr: r.isRetired ? 'RET' : '',
        teamId: 0,
        position: r.position,
        age: r.seasonsPlayed,
        isPitcher: careerSubCat === 'pitching',
        stats: r.careerTotals,
        isRetired: r.isRetired,
      }));
    }
    if (isAdvanced) {
      let rows = advData;
      if (sortAsc) rows = [...rows].reverse();
      return rows.map((r, i) => ({
        rank: i + 1,
        playerId: r.playerId,
        name: r.name,
        teamAbbr: r.teamAbbr,
        teamId: 0,
        position: r.position,
        age: r.age,
        isPitcher: advSubCat === 'pitching',
        stats: r.stats,
      }));
    }
    let rows = leaderboardFull;
    if (myTeamOnly) {
      rows = rows.filter(e => e.teamId === userTeamId);
    }
    if (sortAsc) {
      rows = [...rows].reverse();
    }
    return rows as LeaderRow[];
  }, [leaderboardFull, myTeamOnly, userTeamId, sortAsc, isAdvanced, advData, advSubCat, isCareer, careerData, careerSubCat]);

  const openPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  // Build TanStack columns from ColDef arrays
  const columns: ColumnDef<LeaderRow, any>[] = useMemo(() => {
    const cols: ColumnDef<LeaderRow, any>[] = [
      {
        id: 'rank',
        header: '#',
        accessorFn: (_, idx) => idx + 1,
        enableSorting: false,
        meta: { align: 'right' as const },
        cell: ({ row }) => (
          <span className="text-gray-500">{row.index + 1}</span>
        ),
      },
      {
        id: 'name',
        header: 'PLAYER',
        accessorKey: 'name',
        enableSorting: false,
        meta: { align: 'left' as const, className: 'min-w-[120px] font-bold' },
        cell: ({ row }) => {
          const entry = row.original;
          const isUserTeam = !isCareer && entry.teamId === userTeamId;
          return (
            <span style={{ color: isUserTeam ? '#fb923c' : '#fdba74' }}>
              {entry.name}
              {entry.isRetired && (
                <span className="ml-1 text-gray-500 text-[10px] font-bold bg-gray-800 px-1">RET</span>
              )}
              {!isCareer && row.index === 0 && sortBy === 'ops' && leaderboardCategory === 'hitting' && (
                <span className="ml-1 text-yellow-400 text-[10px] font-black" title="MVP Leader">MVP</span>
              )}
              {!isCareer && row.index === 0 && sortBy === 'era' && leaderboardCategory === 'pitching' && sortAsc && (
                <span className="ml-1 text-yellow-400 text-[10px] font-black" title="Cy Young Leader">CY</span>
              )}
            </span>
          );
        },
      },
    ];

    if (!isCareer) {
      cols.push({
        id: 'team',
        header: 'TM',
        accessorKey: 'teamAbbr',
        enableSorting: false,
        meta: { align: 'left' as const },
        cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string}</span>,
      });
    }

    cols.push({
      id: 'position',
      header: 'POS',
      accessorKey: 'position',
      enableSorting: false,
      meta: { align: 'left' as const },
      cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string}</span>,
    });

    if (!isCareer) {
      cols.push({
        id: 'age',
        header: 'AGE',
        accessorKey: 'age',
        enableSorting: false,
        meta: { align: 'right' as const },
        cell: ({ getValue }) => <span className="text-gray-500">{getValue() as number}</span>,
      });
    }

    // Stat columns from ColDef
    for (const col of colDefs) {
      const isSorted = sortBy === col.key;
      const eliteFn = eliteMap[col.key];
      cols.push({
        id: col.key,
        header: col.label,
        accessorFn: (row) => row.stats?.[col.key] ?? 0,
        enableSorting: true,
        sortDescFirst: !ASC_STATS.has(col.key),
        meta: {
          align: 'right' as const,
        },
        cell: ({ getValue }) => {
          const val = getValue() as number;
          const isElite = eliteFn?.(val) ?? false;
          return (
            <span
              className={cn(
                isElite ? 'font-bold' : '',
                isSorted && !isElite ? 'text-orange-400 font-bold' : '',
              )}
              style={{ color: isElite ? '#fbbf24' : isSorted ? undefined : '#9ca3af' }}
            >
              {col.format(val)}
            </span>
          );
        },
      });
    }

    return cols;
  }, [colDefs, eliteMap, sortBy, isCareer, userTeamId, leaderboardCategory, sortAsc]);

  // Manual sorting state — server provides sorted data, we just show indicators
  const sorting: SortingState = useMemo(() => {
    const colExists = colDefs.some(c => c.key === sortBy);
    if (!colExists) return [];
    return [{ id: sortBy, desc: !sortAsc }];
  }, [sortBy, sortAsc, colDefs]);

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    if (newSorting.length > 0) {
      const col = newSorting[0];
      handleSort(col.id);
    }
  }, [handleSort]);

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">STATISTICAL LEADERBOARDS</div>
      <CoachTip section="leaderboards" />

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {(['hitting', 'pitching', 'advanced', 'career'] as const).map(cat => {
          const isActive = (cat === 'advanced' || cat === 'career') ? mode === cat : (mode !== 'advanced' && mode !== 'career' && leaderboardCategory === cat);
          return (
            <button
              key={cat}
              onClick={() => switchCategory(cat)}
              className={cn(
                'text-xs px-4 py-1.5 border font-bold uppercase tracking-wider transition-colors min-h-[44px]',
                isActive
                  ? 'border-orange-500 text-orange-400 bg-orange-950/30'
                  : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400',
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Advanced sub-category toggle */}
      {isAdvanced && (
        <div className="flex gap-1 mb-3">
          {(['hitting', 'pitching'] as const).map(sub => (
            <button
              key={sub}
              onClick={() => {
                setAdvSubCat(sub);
                setSortBy(sub === 'hitting' ? 'wRCPlus' : 'fip');
                setSortAsc(sub === 'pitching');
              }}
              className={cn(
                'text-xs px-3 py-1 border transition-colors',
                advSubCat === sub
                  ? 'border-orange-500 text-orange-400 bg-orange-950/20'
                  : 'border-gray-700 text-gray-500 hover:text-gray-400',
              )}
            >
              {sub === 'hitting' ? 'HITTERS' : 'PITCHERS'}
            </button>
          ))}
        </div>
      )}

      {/* Career sub-category toggle */}
      {isCareer && (
        <div className="flex gap-1 mb-3">
          {(['hitting', 'pitching'] as const).map(sub => (
            <button
              key={sub}
              onClick={() => {
                setCareerSubCat(sub);
                setSortBy(sub === 'hitting' ? 'hr' : 'w');
                setSortAsc(false);
              }}
              className={cn(
                'text-xs px-3 py-1 border transition-colors min-h-[44px]',
                careerSubCat === sub
                  ? 'border-orange-500 text-orange-400 bg-orange-950/20'
                  : 'border-gray-700 text-gray-500 hover:text-gray-400',
              )}
            >
              {sub === 'hitting' ? 'HITTERS' : 'PITCHERS'}
            </button>
          ))}
        </div>
      )}

      {/* Filters row (hidden for career mode) */}
      {!isCareer && <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 text-xs">SEASON:</span>
          <select
            value={useGameStore.getState().season}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs px-2 py-1 focus:border-orange-500 focus:outline-none min-h-[44px]"
            aria-label="Season"
            disabled
            title="Historical seasons coming soon"
          >
            <option value={useGameStore.getState().season}>{useGameStore.getState().season}</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 text-xs">POS:</span>
          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs px-2 py-1 focus:border-orange-500 focus:outline-none min-h-[44px]"
            aria-label="Filter by position"
          >
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={qualified}
            onChange={e => setQualified(e.target.checked)}
            className="accent-orange-500"
          />
          <span className="text-gray-500 text-xs">QUALIFIED</span>
        </label>

        <button
          onClick={() => setMyTeamOnly(m => !m)}
          className={cn(
            'text-xs px-3 py-1 border font-bold uppercase tracking-wider transition-colors',
            myTeamOnly
              ? 'border-orange-500 text-orange-400 bg-orange-950/30'
              : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400',
          )}
        >
          MY TEAM
        </button>

        <span className="text-gray-700 text-xs ml-auto">
          {displayed.length} players{myTeamOnly ? ' (filtered)' : ''}
        </span>
      </div>}

      {!gameStarted && <div className="text-gray-500 text-xs">Start a game first.</div>}
      {loading && <div className="text-orange-400 text-xs animate-pulse" aria-live="polite" role="status">Loading...</div>}

      {!loading && displayed.length > 0 && (
        <div className="bloomberg-border">
          <DataTable<LeaderRow>
            columns={columns}
            data={displayed}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            manualSorting
            stickyColumns={2}
            onRowClick={(row) => !row.isRetired && openPlayer(row.playerId)}
            rowStyle={(row) => {
              const isUserTeam = !isCareer && row.teamId === userTeamId;
              return {
                background: isUserTeam ? 'rgba(249,115,22,0.04)' : undefined,
                borderLeft: isUserTeam ? '2px solid #f97316' : '2px solid transparent',
              };
            }}
            caption={`${isCareer ? `Career ${careerSubCat}` : isAdvanced ? `Advanced ${advSubCat}` : leaderboardCategory} leaderboard`}
            emptyMessage={myTeamOnly
              ? 'No players from your team match the current filters.'
              : 'Simulate a season first to see leaderboard data.'}
          />
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
