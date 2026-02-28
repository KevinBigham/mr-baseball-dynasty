import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterData, RosterPlayer, StandingsData, StandingsRow } from '../../types/league';

function formatMoney(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
}

function OvrBar({ ovr }: { ovr: number }) {
  const pct = Math.min(100, (ovr / 80) * 100);
  const color = ovr >= 70 ? 'bg-green-500' : ovr >= 60 ? 'bg-blue-500' : ovr >= 50 ? 'bg-orange-500' : 'bg-gray-600';
  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`tabular-nums text-xs font-bold ${
        ovr >= 70 ? 'text-green-400' : ovr >= 60 ? 'text-blue-400' : ovr >= 50 ? 'text-orange-400' : 'text-gray-400'
      }`}>{ovr}</span>
    </div>
  );
}

function PositionGroup({ label, players, onClickPlayer }: {
  label: string;
  players: RosterPlayer[];
  onClickPlayer: (id: number) => void;
}) {
  if (players.length === 0) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-gray-600 text-[10px] font-bold">{label}</div>
      {players.map(p => (
        <div key={p.playerId}
          className="flex items-center gap-1 text-xs hover:bg-gray-800/30 cursor-pointer px-1 py-0.5 rounded"
          onClick={() => onClickPlayer(p.playerId)}>
          <span className="text-orange-300 font-bold truncate flex-1">{p.name}</span>
          <span className="text-gray-600 text-[10px]">{p.age}</span>
          <OvrBar ovr={p.overall} />
        </div>
      ))}
    </div>
  );
}

export default function TeamSnapshot() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getStandings()
      .then(s => {
        setStandings(s);
        setSelectedTeamId(userTeamId);
      })
      .finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  useEffect(() => {
    if (selectedTeamId == null) return;
    getEngine().getRoster(selectedTeamId).then(setRoster);
  }, [selectedTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading team data...</div>;
  if (!standings) return null;

  const team = standings.standings.find(t => t.teamId === selectedTeamId);

  // Group players by position
  const active = roster ? [...roster.active, ...roster.il] : [];
  const starters = active.filter(p => p.position === 'SP').sort((a, b) => b.overall - a.overall);
  const relievers = active.filter(p => p.position === 'RP' || p.position === 'CL').sort((a, b) => b.overall - a.overall);
  const catchers = active.filter(p => p.position === 'C').sort((a, b) => b.overall - a.overall);
  const infielders = active.filter(p => ['1B', '2B', '3B', 'SS'].includes(p.position)).sort((a, b) => b.overall - a.overall);
  const outfielders = active.filter(p => ['LF', 'CF', 'RF'].includes(p.position)).sort((a, b) => b.overall - a.overall);
  const dh = active.filter(p => p.position === 'DH').sort((a, b) => b.overall - a.overall);

  const totalPayroll = active.reduce((s, p) => s + p.salary, 0);
  const avgOvr = active.length > 0 ? Math.round(active.reduce((s, p) => s + p.overall, 0) / active.length) : 0;
  const avgAge = active.length > 0 ? (active.reduce((s, p) => s + p.age, 0) / active.length).toFixed(1) : '—';
  const topPlayer = active.length > 0 ? active.reduce((best, p) => p.overall > best.overall ? p : best) : null;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TEAM SNAPSHOT</span>
        <select value={selectedTeamId ?? ''} onChange={e => setSelectedTeamId(Number(e.target.value))}
          className="bg-gray-800 text-orange-400 text-xs px-2 py-0.5 rounded border border-gray-700">
          {standings.standings
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(t => (
              <option key={t.teamId} value={t.teamId}>
                {t.name} ({t.abbreviation})
              </option>
            ))}
        </select>
      </div>

      {team && (
        <>
          {/* Team header */}
          <div className="grid grid-cols-6 gap-3">
            <div className="bloomberg-border px-3 py-2 text-center">
              <div className="text-gray-500 text-[10px]">RECORD</div>
              <div className="text-gray-300 font-bold text-lg tabular-nums">{team.wins}-{team.losses}</div>
              <div className="text-gray-600 text-[10px]">.{team.pct.toFixed(3).slice(2)}</div>
            </div>
            <div className="bloomberg-border px-3 py-2 text-center">
              <div className="text-gray-500 text-[10px]">DIV RANK</div>
              <div className="text-gray-300 font-bold text-lg tabular-nums">
                {standings.standings
                  .filter(t => t.league === team.league && t.division === team.division)
                  .sort((a, b) => b.pct - a.pct)
                  .findIndex(t => t.teamId === team.teamId) + 1}
              </div>
              <div className="text-gray-600 text-[10px]">{team.league} {team.division}</div>
            </div>
            <div className="bloomberg-border px-3 py-2 text-center">
              <div className="text-gray-500 text-[10px]">RUN DIFF</div>
              <div className={`font-bold text-lg tabular-nums ${
                team.runsScored - team.runsAllowed > 0 ? 'text-green-400' : team.runsScored - team.runsAllowed < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {team.runsScored - team.runsAllowed > 0 ? '+' : ''}{team.runsScored - team.runsAllowed}
              </div>
            </div>
            <div className="bloomberg-border px-3 py-2 text-center">
              <div className="text-gray-500 text-[10px]">AVG OVR</div>
              <div className={`font-bold text-xl tabular-nums ${
                avgOvr >= 60 ? 'text-green-400' : avgOvr >= 50 ? 'text-orange-400' : 'text-gray-400'
              }`}>{avgOvr}</div>
            </div>
            <div className="bloomberg-border px-3 py-2 text-center">
              <div className="text-gray-500 text-[10px]">AVG AGE</div>
              <div className="text-gray-300 font-bold text-lg tabular-nums">{avgAge}</div>
            </div>
            <div className="bloomberg-border px-3 py-2 text-center">
              <div className="text-gray-500 text-[10px]">PAYROLL</div>
              <div className="text-gray-300 font-bold text-lg tabular-nums">{formatMoney(totalPayroll)}</div>
            </div>
          </div>

          {/* Best player callout */}
          {topPlayer && (
            <div className="bloomberg-border px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-800/30"
              onClick={() => goToPlayer(topPlayer.playerId)}>
              <div>
                <span className="text-gray-500 text-[10px]">FRANCHISE PLAYER</span>
                <div className="text-orange-300 font-bold">{topPlayer.name}</div>
                <span className="text-gray-600 text-xs">{topPlayer.position} · Age {topPlayer.age}</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold tabular-nums ${
                  topPlayer.overall >= 70 ? 'text-green-400' : topPlayer.overall >= 60 ? 'text-blue-400' : 'text-orange-400'
                }`}>{topPlayer.overall}</span>
                <div className="text-gray-600 text-[10px]">OVR</div>
              </div>
            </div>
          )}

          {/* Roster grid */}
          {roster && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bloomberg-border p-3 space-y-3">
                <div className="bloomberg-header -mx-3 -mt-3 mb-2">POSITION PLAYERS</div>
                <PositionGroup label="CATCHER" players={catchers} onClickPlayer={goToPlayer} />
                <PositionGroup label="INFIELD" players={infielders} onClickPlayer={goToPlayer} />
                <PositionGroup label="OUTFIELD" players={outfielders} onClickPlayer={goToPlayer} />
                {dh.length > 0 && <PositionGroup label="DH" players={dh} onClickPlayer={goToPlayer} />}
              </div>
              <div className="bloomberg-border p-3 space-y-3">
                <div className="bloomberg-header -mx-3 -mt-3 mb-2">ROTATION</div>
                <PositionGroup label="STARTING PITCHERS" players={starters} onClickPlayer={goToPlayer} />
              </div>
              <div className="bloomberg-border p-3 space-y-3">
                <div className="bloomberg-header -mx-3 -mt-3 mb-2">BULLPEN</div>
                <PositionGroup label="RELIEVERS & CLOSERS" players={relievers} onClickPlayer={goToPlayer} />
              </div>
            </div>
          )}

          {/* Minor league depth */}
          {roster && roster.minors.length > 0 && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">TOP MINOR LEAGUE TALENT ({roster.minors.length} total)</div>
              <div className="grid grid-cols-5 gap-0 divide-x divide-gray-800">
                {roster.minors
                  .sort((a, b) => b.overall - a.overall)
                  .slice(0, 10)
                  .map(p => (
                    <div key={p.playerId}
                      className="px-2 py-1.5 text-xs hover:bg-gray-800/30 cursor-pointer"
                      onClick={() => goToPlayer(p.playerId)}>
                      <div className="text-orange-300 font-bold truncate">{p.name}</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-gray-600 text-[10px]">{p.position} · {p.age}</span>
                        <OvrBar ovr={p.overall} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
