import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterData, RosterPlayer, StandingsData } from '../../types/league';
import type { TradeablePlayer } from '../../types/trade';

const POSITION_GROUPS = [
  { label: 'ALL', positions: [] },
  { label: 'C', positions: ['C'] },
  { label: 'INF', positions: ['1B', '2B', '3B', 'SS'] },
  { label: 'OF', positions: ['LF', 'CF', 'RF'] },
  { label: 'SP', positions: ['SP'] },
  { label: 'RP/CL', positions: ['RP', 'CL'] },
] as const;

function ValueBar({ value }: { value: number }) {
  const pct = Math.min(100, value);
  const color = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-blue-500' : value >= 30 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function NeedBadge({ need }: { need: 'critical' | 'moderate' | 'low' }) {
  const colors = {
    critical: 'bg-red-900/40 text-red-400',
    moderate: 'bg-orange-900/40 text-orange-400',
    low: 'bg-gray-800 text-gray-500',
  };
  return <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${colors[need]}`}>{need.toUpperCase()}</span>;
}

function computePositionNeeds(roster: RosterData): Array<{ position: string; need: 'critical' | 'moderate' | 'low'; bestOvr: number; depth: number }> {
  const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];
  const active = [...roster.active, ...roster.il];

  return positions.map(pos => {
    const players = active.filter(p => p.position === pos).sort((a, b) => b.overall - a.overall);
    const bestOvr = players.length > 0 ? players[0].overall : 0;
    const depth = players.length;

    let need: 'critical' | 'moderate' | 'low' = 'low';
    if (depth === 0 || bestOvr < 40) need = 'critical';
    else if (depth <= 1 && bestOvr < 55) need = 'moderate';
    else if (pos === 'SP' && depth < 5) need = depth < 4 ? 'critical' : 'moderate';
    else if (pos === 'RP' && depth < 3) need = 'moderate';

    return { position: pos, need, bestOvr, depth };
  });
}

export default function TradeFinder() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [userRoster, setUserRoster] = useState<RosterData | null>(null);
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [allTargets, setAllTargets] = useState<Array<TradeablePlayer & { teamName: string; teamAbbr: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [posFilter, setPosFilter] = useState<typeof POSITION_GROUPS[number]>(POSITION_GROUPS[0]);
  const [sortBy, setSortBy] = useState<'tradeValue' | 'overall' | 'age' | 'salary'>('tradeValue');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [maxAge, setMaxAge] = useState(99);
  const [onlySellers, setOnlySellers] = useState(false);

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);

    Promise.all([
      getEngine().getRoster(userTeamId),
      getEngine().getStandings(),
    ]).then(async ([roster, st]) => {
      setUserRoster(roster);
      setStandings(st);

      // Get tradeable players from all other teams
      const otherTeams = st.standings.filter(t => t.teamId !== userTeamId);
      const targetLists = await Promise.all(
        otherTeams.map(async t => {
          const players = await getEngine().getTradeablePlayers(t.teamId);
          return players.map(p => ({ ...p, teamName: t.name, teamAbbr: t.abbreviation }));
        })
      );

      setAllTargets(targetLists.flat());
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading trade targets...</div>;
  if (!userRoster || !standings) return null;

  const needs = computePositionNeeds(userRoster);
  const criticalNeeds = needs.filter(n => n.need === 'critical');

  // Filter targets
  let filtered = [...allTargets];
  if (posFilter.positions.length > 0) {
    filtered = filtered.filter(p => posFilter.positions.includes(p.position as never));
  }
  if (maxAge < 99) {
    filtered = filtered.filter(p => p.age <= maxAge);
  }
  if (onlySellers) {
    const sellerTeams = standings.standings.filter(t => t.pct < 0.46).map(t => t.name);
    filtered = filtered.filter(p => sellerTeams.includes(p.teamName));
  }

  // Sort
  const mult = sortDir === 'desc' ? -1 : 1;
  filtered.sort((a, b) => mult * (a[sortBy] - b[sortBy]));

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">TRADE FINDER</div>

      {/* Team needs */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">YOUR ROSTER NEEDS</div>
        <div className="grid grid-cols-6 gap-0 divide-x divide-gray-800">
          {needs.filter(n => n.need !== 'low' || n.position === 'SP').slice(0, 12).map(n => (
            <div key={n.position} className="px-2 py-1.5 text-center">
              <div className="text-gray-500 text-[10px] font-bold">{n.position}</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <NeedBadge need={n.need} />
              </div>
              <div className="text-gray-600 text-[10px] mt-0.5">
                Best: <span className="text-gray-400 font-bold">{n.bestOvr || '—'}</span> · {n.depth}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-gray-600 text-xs">POSITION:</span>
          {POSITION_GROUPS.map(g => (
            <button key={g.label} onClick={() => setPosFilter(g)}
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                posFilter.label === g.label ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600 text-xs">MAX AGE:</span>
          <select value={maxAge} onChange={e => setMaxAge(Number(e.target.value))}
            className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded border border-gray-700">
            <option value={99}>Any</option>
            <option value={25}>25</option>
            <option value={28}>28</option>
            <option value={30}>30</option>
            <option value={32}>32</option>
          </select>
        </div>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={onlySellers} onChange={e => setOnlySellers(e.target.checked)}
            className="accent-orange-500" />
          <span className="text-gray-400 text-xs">Sellers only (sub-.460)</span>
        </label>
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} targets</span>
      </div>

      {/* Critical needs callout */}
      {criticalNeeds.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded px-3 py-2 text-xs text-red-300">
          Critical needs: {criticalNeeds.map(n => n.position).join(', ')}
        </div>
      )}

      {/* Trade targets table */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">AVAILABLE TRADE TARGETS ({filtered.length})</div>
        <div className="max-h-[36rem] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                <th className="px-2 py-1 text-right">#</th>
                <th className="px-2 py-1 text-left">PLAYER</th>
                <th className="px-2 py-1">POS</th>
                <th className="px-2 py-1 text-left">TEAM</th>
                <th className="px-2 py-1 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('age')}>
                  AGE {sortBy === 'age' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-2 py-1 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('overall')}>
                  OVR {sortBy === 'overall' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-2 py-1">POT</th>
                <th className="px-2 py-1 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('tradeValue')}>
                  VALUE {sortBy === 'tradeValue' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-2 py-1 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('salary')}>
                  SALARY {sortBy === 'salary' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-2 py-1">CTR</th>
                <th className="px-2 py-1">BAR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((p, i) => (
                <tr key={p.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => goToPlayer(p.playerId)}>
                  <td className="px-2 py-1 text-right tabular-nums text-gray-600">{i + 1}</td>
                  <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                  <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                  <td className="px-2 py-1 text-gray-500">{p.teamAbbr}</td>
                  <td className="px-2 py-1 tabular-nums text-gray-400 text-center">{p.age}</td>
                  <td className="px-2 py-1 text-center">
                    <span className={`font-bold tabular-nums ${
                      p.overall >= 70 ? 'text-green-400' : p.overall >= 60 ? 'text-blue-400' : p.overall >= 50 ? 'text-orange-400' : 'text-gray-400'
                    }`}>{p.overall}</span>
                  </td>
                  <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.potential}</td>
                  <td className="px-2 py-1 text-center">
                    <span className={`font-bold tabular-nums ${
                      p.tradeValue >= 70 ? 'text-green-400' : p.tradeValue >= 40 ? 'text-orange-400' : 'text-gray-500'
                    }`}>{p.tradeValue}</span>
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums text-gray-400">
                    ${(p.salary / 1_000_000).toFixed(1)}M
                  </td>
                  <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.contractYrs}Y</td>
                  <td className="px-2 py-1"><ValueBar value={p.tradeValue} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
