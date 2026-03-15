import { useState, useMemo, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { toGrade, gradeHeatBg } from '../../utils/gradeColor';
import { useSort, compareSortValues } from '../../hooks/useSort';
import { SortHeader } from '../shared/SortHeader';
import { useUIStore } from '../../store/uiStore';
import ScrollableTable from '../layout/ScrollableTable';
import type { Player } from '../../types/player';
import AgingBadge from '../shared/AgingBadge';

// ─── Column definitions ──────────────────────────────────────────────────────

interface AttrCol {
  key: string;
  label: string;
  abbr: string;
  get: (p: Player) => number | null;
}

const HITTER_COLS: AttrCol[] = [
  { key: 'con', label: 'Contact',    abbr: 'CON', get: p => p.hitterAttributes?.contact ?? null },
  { key: 'pow', label: 'Power',      abbr: 'POW', get: p => p.hitterAttributes?.power ?? null },
  { key: 'eye', label: 'Eye',        abbr: 'EYE', get: p => p.hitterAttributes?.eye ?? null },
  { key: 'spd', label: 'Speed',      abbr: 'SPD', get: p => p.hitterAttributes?.speed ?? null },
  { key: 'biq', label: 'Baserunning',abbr: 'BIQ', get: p => p.hitterAttributes?.baserunningIQ ?? null },
  { key: 'fld', label: 'Fielding',   abbr: 'FLD', get: p => p.hitterAttributes?.fielding ?? null },
  { key: 'arm', label: 'Arm',        abbr: 'ARM', get: p => p.hitterAttributes?.armStrength ?? null },
  { key: 'hdur',label: 'Durability', abbr: 'DUR', get: p => p.hitterAttributes?.durability ?? null },
];

const PITCHER_COLS: AttrCol[] = [
  { key: 'stf', label: 'Stuff',      abbr: 'STF', get: p => p.pitcherAttributes?.stuff ?? null },
  { key: 'mov', label: 'Movement',   abbr: 'MOV', get: p => p.pitcherAttributes?.movement ?? null },
  { key: 'cmd', label: 'Command',    abbr: 'CMD', get: p => p.pitcherAttributes?.command ?? null },
  { key: 'sta', label: 'Stamina',    abbr: 'STA', get: p => p.pitcherAttributes?.stamina ?? null },
  { key: 'pdur',label: 'Durability', abbr: 'DUR', get: p => p.pitcherAttributes?.durability ?? null },
  { key: 'hld', label: 'Hold Rnrs',  abbr: 'HLD', get: p => p.pitcherAttributes?.holdRunners ?? null },
  { key: 'rcv', label: 'Recovery',   abbr: 'RCV', get: p => p.pitcherAttributes?.recoveryRate ?? null },
];

// ─── Level filter values ─────────────────────────────────────────────────────

const LEVEL_FILTERS = [
  { id: 'ALL', label: 'ALL' },
  { id: 'MLB', label: 'MLB' },
  { id: 'AAA', label: 'AAA' },
  { id: 'AA',  label: 'AA' },
  { id: 'High-A', label: 'A+' },
  { id: 'Low-A',  label: 'A-' },
  { id: 'Rookie',  label: 'RK' },
  { id: 'INTL',    label: 'INT' },
];

// ─── Sort key union ──────────────────────────────────────────────────────────

type RatingSortKey = 'name' | 'pos' | 'age' | 'ovr' | 'pot'
  | 'con' | 'pow' | 'eye' | 'spd' | 'biq' | 'fld' | 'arm' | 'hdur'
  | 'stf' | 'mov' | 'cmd' | 'sta' | 'pdur' | 'hld' | 'rcv';

function getPlayerSortVal(p: Player, key: RatingSortKey): number | string {
  switch (key) {
    case 'name': return p.name.toLowerCase();
    case 'pos': return p.position;
    case 'age': return p.age;
    case 'ovr': return toGrade(p.overall);
    case 'pot': return toGrade(p.potential);
    default: {
      const col = [...HITTER_COLS, ...PITCHER_COLS].find(c => c.key === key);
      if (col) {
        const raw = col.get(p);
        return raw !== null ? toGrade(raw) : -1;
      }
      return 0;
    }
  }
}

// ─── Grade cell ──────────────────────────────────────────────────────────────

function GradeCell({ value }: { value: number | null }) {
  if (value === null) return <td className="px-0.5 py-0.5" />;
  const grade = toGrade(value);
  return (
    <td className="px-0.5 py-0.5 text-center">
      <div
        className="mx-auto rounded text-[10px] font-bold leading-5 tabular-nums"
        style={{
          backgroundColor: gradeHeatBg(grade),
          color: '#fff',
          width: '28px',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {grade}
      </div>
    </td>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface FranchiseRatingsProps {
  teamId: number;
}

export default function FranchiseRatings({ teamId }: FranchiseRatingsProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const { setSelectedPlayer, setActiveTab } = useUIStore();

  const { sort, toggle } = useSort<RatingSortKey>('ovr');

  // Load raw Player[] from engine
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const engine = getEngine();
        const raw = await engine.getTeamPlayers(teamId);
        if (!cancelled) setPlayers(raw as Player[]);
      } catch (err) {
        console.error('[FranchiseRatings] getTeamPlayers failed:', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [teamId]);

  // Filter by level
  const filtered = useMemo(() => {
    if (levelFilter === 'ALL') return players;
    return players.filter(p => {
      const lvl = p.leagueLevel?.toUpperCase() ?? '';
      const filt = levelFilter.toUpperCase();
      if (filt === 'MLB') return lvl === 'MLB' || lvl === 'MLB_ACTIVE' || p.rosterData?.rosterStatus?.startsWith('MLB');
      if (filt === 'AAA') return lvl === 'AAA' || p.rosterData?.rosterStatus === 'MINORS_AAA';
      if (filt === 'AA') return lvl === 'AA' || p.rosterData?.rosterStatus === 'MINORS_AA';
      if (filt === 'HIGH-A') return lvl === 'HIGH-A' || lvl === 'A+' || p.rosterData?.rosterStatus === 'MINORS_APLUS';
      if (filt === 'LOW-A') return lvl === 'LOW-A' || lvl === 'A-' || p.rosterData?.rosterStatus === 'MINORS_AMINUS';
      if (filt === 'ROOKIE') return lvl === 'ROOKIE' || lvl === 'RK' || p.rosterData?.rosterStatus === 'MINORS_ROOKIE';
      if (filt === 'INTL') return lvl === 'INTL' || lvl === 'INT' || p.rosterData?.rosterStatus === 'MINORS_INTL';
      return true;
    });
  }, [players, levelFilter]);

  // Separate hitters and pitchers, then sort
  const hitters = useMemo(() => {
    const list = filtered.filter(p => !p.isPitcher);
    return list.sort((a, b) => compareSortValues(
      getPlayerSortVal(a, sort.key),
      getPlayerSortVal(b, sort.key),
      sort.dir,
    ));
  }, [filtered, sort]);

  const pitchers = useMemo(() => {
    const list = filtered.filter(p => p.isPitcher);
    return list.sort((a, b) => compareSortValues(
      getPlayerSortVal(a, sort.key),
      getPlayerSortVal(b, sort.key),
      sort.dir,
    ));
  }, [filtered, sort]);

  const openProfile = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (loading) {
    return (
      <div className="p-4 text-gray-500 text-xs animate-pulse">Loading ratings...</div>
    );
  }

  return (
    <div>
      {/* Level filter */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-gray-500 text-[10px] font-bold tracking-wider mr-1">LEVEL</span>
        {LEVEL_FILTERS.map(lf => (
          <button
            key={lf.id}
            onClick={() => setLevelFilter(lf.id)}
            className={`text-[10px] px-2 py-0.5 font-bold tracking-wide transition-colors rounded ${
              levelFilter === lf.id
                ? 'text-orange-400 bg-orange-900/40 border border-orange-600'
                : 'text-gray-500 hover:text-gray-300 border border-gray-700/50'
            }`}
          >
            {lf.label}
          </button>
        ))}
        <span className="ml-auto text-gray-500 text-[10px]">
          {filtered.length} player{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Position Players Ratings */}
      {hitters.length > 0 && (
        <ScrollableTable className="bloomberg-border mb-4">
          <div className="bloomberg-header px-4 flex items-center justify-between">
            <span>POSITION PLAYERS — RATINGS</span>
            <span className="text-gray-500 font-normal text-[10px]">{hitters.length}</span>
          </div>
          <table className="w-full">
            <caption className="sr-only">Position Player Ratings</caption>
            <thead>
              <tr className="text-gray-500 text-[10px]" style={{ borderBottom: '1px solid #1E2A4A' }}>
                <SortHeader label="PLAYER" sortKey="name" currentSort={sort} onSort={toggle} align="left" />
                <SortHeader label="POS" sortKey="pos" currentSort={sort} onSort={toggle} align="center" />
                <SortHeader label="AGE" sortKey="age" currentSort={sort} onSort={toggle} />
                <SortHeader label="OVR" sortKey="ovr" currentSort={sort} onSort={toggle} />
                <SortHeader label="POT" sortKey="pot" currentSort={sort} onSort={toggle} />
                <th className="px-1 py-1 text-gray-700">│</th>
                {HITTER_COLS.map(col => (
                  <SortHeader key={col.key} label={col.abbr} sortKey={col.key as RatingSortKey} currentSort={sort} onSort={toggle} />
                ))}
              </tr>
            </thead>
            <tbody>
              {hitters.map(p => (
                <tr key={p.playerId} className="bloomberg-row text-xs hover:bg-gray-800/30 transition-colors">
                  <td className="px-2 py-0.5 whitespace-nowrap">
                    <button
                      onClick={() => openProfile(p.playerId)}
                      className="text-orange-300 hover:text-orange-200 font-bold text-xs truncate text-left transition-colors"
                    >
                      {p.name}
                    </button>
                  </td>
                  <td className="text-center text-gray-500 text-[10px] px-1">{p.position}</td>
                  <td className="text-right text-gray-400 tabular-nums px-1 text-[10px]"><span className="inline-flex items-center gap-0.5">{p.age} <AgingBadge age={p.age} position={p.position} compact /></span></td>
                  <GradeCell value={p.overall} />
                  <GradeCell value={p.potential} />
                  <td className="px-0.5 text-gray-800">│</td>
                  {HITTER_COLS.map(col => (
                    <GradeCell key={col.key} value={col.get(p)} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      )}

      {/* Pitcher Ratings */}
      {pitchers.length > 0 && (
        <ScrollableTable className="bloomberg-border mb-4">
          <div className="bloomberg-header px-4 flex items-center justify-between">
            <span>PITCHERS — RATINGS</span>
            <span className="text-gray-500 font-normal text-[10px]">{pitchers.length}</span>
          </div>
          <table className="w-full">
            <caption className="sr-only">Pitcher Ratings</caption>
            <thead>
              <tr className="text-gray-500 text-[10px]" style={{ borderBottom: '1px solid #1E2A4A' }}>
                <SortHeader label="PLAYER" sortKey="name" currentSort={sort} onSort={toggle} align="left" />
                <SortHeader label="POS" sortKey="pos" currentSort={sort} onSort={toggle} align="center" />
                <SortHeader label="AGE" sortKey="age" currentSort={sort} onSort={toggle} />
                <SortHeader label="OVR" sortKey="ovr" currentSort={sort} onSort={toggle} />
                <SortHeader label="POT" sortKey="pot" currentSort={sort} onSort={toggle} />
                <th className="px-1 py-1 text-gray-700">│</th>
                {PITCHER_COLS.map(col => (
                  <SortHeader key={col.key} label={col.abbr} sortKey={col.key as RatingSortKey} currentSort={sort} onSort={toggle} />
                ))}
              </tr>
            </thead>
            <tbody>
              {pitchers.map(p => (
                <tr key={p.playerId} className="bloomberg-row text-xs hover:bg-gray-800/30 transition-colors">
                  <td className="px-2 py-0.5 whitespace-nowrap">
                    <button
                      onClick={() => openProfile(p.playerId)}
                      className="text-orange-300 hover:text-orange-200 font-bold text-xs truncate text-left transition-colors"
                    >
                      {p.name}
                    </button>
                  </td>
                  <td className="text-center text-gray-500 text-[10px] px-1">{p.position}</td>
                  <td className="text-right text-gray-400 tabular-nums px-1 text-[10px]"><span className="inline-flex items-center gap-0.5">{p.age} <AgingBadge age={p.age} position={p.position} compact /></span></td>
                  <GradeCell value={p.overall} />
                  <GradeCell value={p.potential} />
                  <td className="px-0.5 text-gray-800">│</td>
                  {PITCHER_COLS.map(col => (
                    <GradeCell key={col.key} value={col.get(p)} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      )}

      {filtered.length === 0 && (
        <div className="text-gray-500 text-xs text-center py-8">No players at this level.</div>
      )}
    </div>
  );
}
