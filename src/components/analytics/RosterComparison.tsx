import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { StandingsData, RosterData, RosterPlayer } from '../../types/league';

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'] as const;

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 70 ? 'text-green-400' : ovr >= 60 ? 'text-blue-400' : ovr >= 50 ? 'text-orange-400' : ovr >= 40 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-bold tabular-nums ${color}`}>{ovr}</span>;
}

function PositionGroup({ pos, playersA, playersB, onPlayer }: {
  pos: string;
  playersA: RosterPlayer[];
  playersB: RosterPlayer[];
  onPlayer: (id: number) => void;
}) {
  const maxLen = Math.max(playersA.length, playersB.length, 1);
  const avgA = playersA.length > 0 ? Math.round(playersA.reduce((s, p) => s + p.overall, 0) / playersA.length) : 0;
  const avgB = playersB.length > 0 ? Math.round(playersB.reduce((s, p) => s + p.overall, 0) / playersB.length) : 0;
  const winner = avgA > avgB ? 'A' : avgA < avgB ? 'B' : 'TIE';

  return (
    <div className="bloomberg-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/50 border-b border-gray-800">
        <span className={`text-xs font-bold tabular-nums ${winner === 'A' ? 'text-orange-400' : 'text-gray-500'}`}>
          {avgA > 0 ? avgA : '—'}
        </span>
        <span className="text-gray-500 text-xs font-bold">{pos}</span>
        <span className={`text-xs font-bold tabular-nums ${winner === 'B' ? 'text-blue-400' : 'text-gray-500'}`}>
          {avgB > 0 ? avgB : '—'}
        </span>
      </div>
      {Array.from({ length: maxLen }).map((_, i) => {
        const pA = playersA[i];
        const pB = playersB[i];
        return (
          <div key={i} className="flex items-center border-b border-gray-800/30 last:border-b-0">
            {/* Team A player */}
            <div className={`flex-1 flex items-center justify-between px-2 py-0.5 text-xs ${pA ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
              onClick={() => pA && onPlayer(pA.playerId)}>
              {pA ? (
                <>
                  <span className="text-orange-300 font-bold truncate">{pA.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-[10px]">{pA.age}</span>
                    <OvrBadge ovr={pA.overall} />
                  </div>
                </>
              ) : <span className="text-gray-800 text-[10px]">—</span>}
            </div>
            {/* Divider */}
            <div className="w-px h-5 bg-gray-800" />
            {/* Team B player */}
            <div className={`flex-1 flex items-center justify-between px-2 py-0.5 text-xs ${pB ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
              onClick={() => pB && onPlayer(pB.playerId)}>
              {pB ? (
                <>
                  <OvrBadge ovr={pB.overall} />
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-[10px]">{pB.age}</span>
                    <span className="text-blue-300 font-bold truncate">{pB.name}</span>
                  </div>
                </>
              ) : <span className="text-gray-800 text-[10px]">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryBar({ label, valA, valB }: { label: string; valA: number; valB: number }) {
  const total = valA + valB || 1;
  const pctA = (valA / total) * 100;
  const winner = valA > valB ? 'A' : valA < valB ? 'B' : 'TIE';
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className={`w-6 text-right text-xs font-bold tabular-nums ${winner === 'A' ? 'text-orange-400' : 'text-gray-500'}`}>{valA}</span>
      <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-gray-800">
        <div className="h-full bg-orange-500/70" style={{ width: `${pctA}%` }} />
        <div className="h-full bg-blue-500/70" style={{ width: `${100 - pctA}%` }} />
      </div>
      <span className={`w-6 text-xs font-bold tabular-nums ${winner === 'B' ? 'text-blue-400' : 'text-gray-500'}`}>{valB}</span>
      <span className="text-gray-600 text-[10px] w-20">{label}</span>
    </div>
  );
}

export default function RosterComparison() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [teamA, setTeamA] = useState<number | null>(null);
  const [teamB, setTeamB] = useState<number | null>(null);
  const [rosterA, setRosterA] = useState<RosterData | null>(null);
  const [rosterB, setRosterB] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getStandings().then(s => {
      setStandings(s);
      if (userTeamId != null) setTeamA(userTeamId);
      // Pick best non-user team as default B
      const sorted = [...s.standings].sort((a, b) => b.pct - a.pct);
      const best = sorted.find(t => t.teamId !== userTeamId);
      if (best) setTeamB(best.teamId);
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  // Load rosters when teams change
  useEffect(() => {
    if (teamA != null) getEngine().getRoster(teamA).then(setRosterA);
    else setRosterA(null);
  }, [teamA]);

  useEffect(() => {
    if (teamB != null) getEngine().getRoster(teamB).then(setRosterB);
    else setRosterB(null);
  }, [teamB]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading...</div>;
  if (!standings) return null;

  const teams = [...standings.standings].sort((a, b) => a.name.localeCompare(b.name));
  const nameA = standings.standings.find(t => t.teamId === teamA);
  const nameB = standings.standings.find(t => t.teamId === teamB);

  // Group active players by position
  const groupByPos = (roster: RosterData | null) => {
    if (!roster) return new Map<string, RosterPlayer[]>();
    const all = [...roster.active, ...roster.il].sort((a, b) => b.overall - a.overall);
    const map = new Map<string, RosterPlayer[]>();
    for (const pos of POSITIONS) map.set(pos, []);
    for (const p of all) {
      const bucket = map.get(p.position) ?? map.get(p.isPitcher ? 'SP' : 'DH')!;
      bucket.push(p);
    }
    return map;
  };

  const groupA = groupByPos(rosterA);
  const groupB = groupByPos(rosterB);

  // Compute team-level aggregates
  const avgOvr = (roster: RosterData | null) => {
    if (!roster) return 0;
    const all = roster.active;
    if (all.length === 0) return 0;
    return Math.round(all.reduce((s, p) => s + p.overall, 0) / all.length);
  };
  const avgAge = (roster: RosterData | null) => {
    if (!roster) return 0;
    const all = roster.active;
    if (all.length === 0) return 0;
    return Math.round(all.reduce((s, p) => s + p.age, 0) / all.length * 10) / 10;
  };
  const totalPayroll = (roster: RosterData | null) => {
    if (!roster) return 0;
    return [...roster.active, ...roster.il, ...roster.minors].reduce((s, p) => s + p.salary, 0);
  };

  // Position advantage counts
  let winsA = 0, winsB = 0, ties = 0;
  for (const pos of POSITIONS) {
    const pA = groupA.get(pos) ?? [];
    const pB = groupB.get(pos) ?? [];
    const aOvr = pA.length > 0 ? pA[0].overall : 0;
    const bOvr = pB.length > 0 ? pB[0].overall : 0;
    if (aOvr > bOvr) winsA++;
    else if (bOvr > aOvr) winsB++;
    else ties++;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">ROSTER COMPARISON</div>

      {/* Team selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bloomberg-border p-2">
          <label className="text-gray-500 text-xs font-bold block mb-1">TEAM A</label>
          <select value={teamA ?? ''}
            onChange={e => setTeamA(Number(e.target.value))}
            className="w-full bg-gray-900 text-orange-400 text-sm font-bold border border-gray-700 rounded px-2 py-1">
            <option value="">Select team...</option>
            {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
          </select>
        </div>
        <div className="bloomberg-border p-2">
          <label className="text-gray-500 text-xs font-bold block mb-1">TEAM B</label>
          <select value={teamB ?? ''}
            onChange={e => setTeamB(Number(e.target.value))}
            className="w-full bg-gray-900 text-blue-400 text-sm font-bold border border-gray-700 rounded px-2 py-1">
            <option value="">Select team...</option>
            {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {rosterA && rosterB && (
        <>
          {/* Summary badges */}
          <div className="bloomberg-border p-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-gray-600 text-[10px]">POSITION ADVANTAGES</div>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="text-orange-400 font-bold text-lg">{winsA}</span>
                  <span className="text-gray-600 text-xs">-</span>
                  <span className="text-gray-500 text-xs">{ties}</span>
                  <span className="text-gray-600 text-xs">-</span>
                  <span className="text-blue-400 font-bold text-lg">{winsB}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <SummaryBar label="AVG OVR" valA={avgOvr(rosterA)} valB={avgOvr(rosterB)} />
                <SummaryBar label="AVG AGE" valA={Math.round(avgAge(rosterA))} valB={Math.round(avgAge(rosterB))} />
              </div>
              <div className="space-y-0.5">
                <SummaryBar label="ROSTER SIZE" valA={rosterA.active.length} valB={rosterB.active.length} />
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-orange-400 tabular-nums">${(totalPayroll(rosterA) / 1e6).toFixed(0)}M</span>
                  <span className="text-gray-600">PAYROLL</span>
                  <span className="text-blue-400 tabular-nums">${(totalPayroll(rosterB) / 1e6).toFixed(0)}M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Headers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <span className="text-orange-400 font-bold text-sm">{nameA?.abbreviation}</span>
              <span className="text-gray-600 text-xs ml-2">{nameA?.wins}-{nameA?.losses}</span>
            </div>
            <div className="text-center">
              <span className="text-blue-400 font-bold text-sm">{nameB?.abbreviation}</span>
              <span className="text-gray-600 text-xs ml-2">{nameB?.wins}-{nameB?.losses}</span>
            </div>
          </div>

          {/* Position-by-position comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Offense positions */}
            <div className="space-y-2">
              <div className="text-gray-500 text-[10px] font-bold text-center">POSITION PLAYERS</div>
              {(['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const).map(pos => (
                <PositionGroup key={pos} pos={pos}
                  playersA={groupA.get(pos) ?? []}
                  playersB={groupB.get(pos) ?? []}
                  onPlayer={goToPlayer}
                />
              ))}
            </div>
            {/* Pitching */}
            <div className="space-y-2">
              <div className="text-gray-500 text-[10px] font-bold text-center">PITCHING</div>
              {(['SP', 'RP', 'CL'] as const).map(pos => (
                <PositionGroup key={pos} pos={pos}
                  playersA={groupA.get(pos) ?? []}
                  playersB={groupB.get(pos) ?? []}
                  onPlayer={goToPlayer}
                />
              ))}
              {/* Minor league depth */}
              <div className="bloomberg-border mt-4">
                <div className="px-3 py-1.5 bg-gray-900/50 border-b border-gray-800 text-center">
                  <span className="text-gray-500 text-[10px] font-bold">MINOR LEAGUE DEPTH</span>
                </div>
                <div className="flex">
                  <div className="flex-1 px-2 py-1 text-center border-r border-gray-800">
                    <div className="text-orange-400 font-bold text-lg tabular-nums">{rosterA.minors.length}</div>
                    <div className="text-gray-600 text-[10px]">ON 40-MAN</div>
                  </div>
                  <div className="flex-1 px-2 py-1 text-center">
                    <div className="text-blue-400 font-bold text-lg tabular-nums">{rosterB.minors.length}</div>
                    <div className="text-gray-600 text-[10px]">ON 40-MAN</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {(!rosterA || !rosterB) && (teamA != null || teamB != null) && (
        <div className="text-gray-600 text-xs text-center py-8">Select two teams to compare rosters.</div>
      )}
    </div>
  );
}
