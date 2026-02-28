import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { StandingsData, StandingsRow } from '../../types/league';
import type { PowerRanking } from '../../engine/analytics/powerRankings';

interface TeamData {
  standings: StandingsRow;
  power: PowerRanking;
  payroll: number;
}

function CompareBar({ labelA, labelB, valA, valB, higherIsBetter = true }: {
  labelA: string; labelB: string; valA: number; valB: number; higherIsBetter?: boolean;
}) {
  const total = valA + valB || 1;
  const pctA = (valA / total) * 100;
  const winner = higherIsBetter ? (valA > valB ? 'A' : valA < valB ? 'B' : 'TIE') : (valA < valB ? 'A' : valA > valB ? 'B' : 'TIE');

  return (
    <div className="flex items-center gap-2 text-xs py-1">
      <span className={`w-16 text-right tabular-nums font-bold ${winner === 'A' ? 'text-orange-400' : 'text-gray-500'}`}>
        {labelA}
      </span>
      <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-gray-800">
        <div className="h-full bg-orange-500/70 transition-all" style={{ width: `${pctA}%` }} />
        <div className="h-full bg-blue-500/70 transition-all" style={{ width: `${100 - pctA}%` }} />
      </div>
      <span className={`w-16 tabular-nums font-bold ${winner === 'B' ? 'text-blue-400' : 'text-gray-500'}`}>
        {labelB}
      </span>
    </div>
  );
}

function StatRow({ label, valA, valB, format, higherIsBetter = true }: {
  label: string; valA: number; valB: number; format?: (v: number) => string; higherIsBetter?: boolean;
}) {
  const fmt = format ?? ((v: number) => String(v));
  const winner = higherIsBetter ? (valA > valB ? 'A' : valA < valB ? 'B' : 'TIE') : (valA < valB ? 'A' : valA > valB ? 'B' : 'TIE');

  return (
    <tr className="text-xs hover:bg-gray-800/30">
      <td className={`px-3 py-1 text-right tabular-nums font-bold ${winner === 'A' ? 'text-orange-400' : 'text-gray-400'}`}>
        {fmt(valA)}
      </td>
      <td className="px-3 py-1 text-center text-gray-600 font-bold">{label}</td>
      <td className={`px-3 py-1 tabular-nums font-bold ${winner === 'B' ? 'text-blue-400' : 'text-gray-400'}`}>
        {fmt(valB)}
      </td>
    </tr>
  );
}

export default function TeamComparison() {
  const { gameStarted, userTeamId } = useGameStore();
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [rankings, setRankings] = useState<PowerRanking[]>([]);
  const [leagueFinancials, setLeagueFinancials] = useState<Array<{ teamName: string; payroll: number }>>([]);
  const [teamA, setTeamA] = useState<number | null>(null);
  const [teamB, setTeamB] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getStandings(),
      getEngine().getPowerRankings(),
      getEngine().getLeagueFinancials(),
    ]).then(([s, r, f]) => {
      setStandings(s);
      setRankings(r);
      setLeagueFinancials(f);
      // Default to user team vs. #1 ranked team
      if (userTeamId != null) setTeamA(userTeamId);
      if (r.length > 0) setTeamB(r[0].teamId !== userTeamId ? r[0].teamId : r[1]?.teamId ?? r[0].teamId);
    }).finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading comparison data...</div>;
  if (!standings) return null;

  const teams = standings.standings
    .sort((a, b) => a.name.localeCompare(b.name));

  const getTeamData = (teamId: number): TeamData | null => {
    const s = standings?.standings.find(r => r.teamId === teamId);
    const p = rankings.find(r => r.teamId === teamId);
    const f = leagueFinancials.find(r => r.teamName === s?.name);
    if (!s || !p) return null;
    return { standings: s, power: p, payroll: f?.payroll ?? 0 };
  };

  const dataA = teamA != null ? getTeamData(teamA) : null;
  const dataB = teamB != null ? getTeamData(teamB) : null;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">TEAM COMPARISON</div>

      {/* Team selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bloomberg-border p-2">
          <label className="text-gray-500 text-xs font-bold block mb-1">TEAM A</label>
          <select
            value={teamA ?? ''}
            onChange={e => setTeamA(Number(e.target.value))}
            className="w-full bg-gray-900 text-orange-400 text-sm font-bold border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-orange-500"
          >
            <option value="">Select team...</option>
            {teams.map(t => (
              <option key={t.teamId} value={t.teamId}>{t.name} ({t.abbreviation})</option>
            ))}
          </select>
        </div>
        <div className="bloomberg-border p-2">
          <label className="text-gray-500 text-xs font-bold block mb-1">TEAM B</label>
          <select
            value={teamB ?? ''}
            onChange={e => setTeamB(Number(e.target.value))}
            className="w-full bg-gray-900 text-blue-400 text-sm font-bold border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select team...</option>
            {teams.map(t => (
              <option key={t.teamId} value={t.teamId}>{t.name} ({t.abbreviation})</option>
            ))}
          </select>
        </div>
      </div>

      {dataA && dataB && (
        <>
          {/* Team headers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bloomberg-border text-center p-3">
              <div className="text-orange-400 font-bold text-lg">{dataA.standings.abbreviation}</div>
              <div className="text-gray-500 text-xs">{dataA.standings.name}</div>
              <div className="text-gray-400 tabular-nums text-sm mt-1">
                {dataA.standings.wins}-{dataA.standings.losses}
                <span className="text-gray-600 ml-2">({dataA.standings.pct.toFixed(3)})</span>
              </div>
            </div>
            <div className="bloomberg-border text-center p-3">
              <div className="text-blue-400 font-bold text-lg">{dataB.standings.abbreviation}</div>
              <div className="text-gray-500 text-xs">{dataB.standings.name}</div>
              <div className="text-gray-400 tabular-nums text-sm mt-1">
                {dataB.standings.wins}-{dataB.standings.losses}
                <span className="text-gray-600 ml-2">({dataB.standings.pct.toFixed(3)})</span>
              </div>
            </div>
          </div>

          {/* Power Rating bars */}
          <div className="bloomberg-border p-4 space-y-2">
            <div className="bloomberg-header -mx-4 -mt-4 px-4 py-1 mb-3">POWER RATINGS</div>
            <CompareBar
              labelA={String(dataA.power.rating)} labelB={String(dataB.power.rating)}
              valA={dataA.power.rating} valB={dataB.power.rating}
            />
            <div className="text-gray-600 text-xs text-center -mt-1 mb-2">OVERALL</div>

            <CompareBar
              labelA={String(dataA.power.offenseRating)} labelB={String(dataB.power.offenseRating)}
              valA={dataA.power.offenseRating} valB={dataB.power.offenseRating}
            />
            <div className="text-gray-600 text-xs text-center -mt-1 mb-2">OFFENSE</div>

            <CompareBar
              labelA={String(dataA.power.rotationRating)} labelB={String(dataB.power.rotationRating)}
              valA={dataA.power.rotationRating} valB={dataB.power.rotationRating}
            />
            <div className="text-gray-600 text-xs text-center -mt-1 mb-2">ROTATION</div>

            <CompareBar
              labelA={String(dataA.power.bullpenRating)} labelB={String(dataB.power.bullpenRating)}
              valA={dataA.power.bullpenRating} valB={dataB.power.bullpenRating}
            />
            <div className="text-gray-600 text-xs text-center -mt-1 mb-2">BULLPEN</div>

            <CompareBar
              labelA={String(dataA.power.farmRating)} labelB={String(dataB.power.farmRating)}
              valA={dataA.power.farmRating} valB={dataB.power.farmRating}
            />
            <div className="text-gray-600 text-xs text-center -mt-1 mb-2">FARM SYSTEM</div>
          </div>

          {/* Detailed stats table */}
          <div className="bloomberg-border">
            <div className="bloomberg-header">DETAILED COMPARISON</div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800">
                  <th className="px-3 py-1 text-right text-orange-400/60">{dataA.standings.abbreviation}</th>
                  <th className="px-3 py-1 text-center">STAT</th>
                  <th className="px-3 py-1 text-left text-blue-400/60">{dataB.standings.abbreviation}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                <StatRow label="WINS" valA={dataA.standings.wins} valB={dataB.standings.wins} />
                <StatRow label="LOSSES" valA={dataA.standings.losses} valB={dataB.standings.losses} higherIsBetter={false} />
                <StatRow label="WIN %" valA={dataA.standings.pct} valB={dataB.standings.pct} format={v => v.toFixed(3)} />
                <StatRow label="RUNS SCORED" valA={dataA.standings.runsScored} valB={dataB.standings.runsScored} />
                <StatRow label="RUNS ALLOWED" valA={dataA.standings.runsAllowed} valB={dataB.standings.runsAllowed} higherIsBetter={false} />
                <StatRow label="RUN DIFF" valA={dataA.standings.runsScored - dataA.standings.runsAllowed} valB={dataB.standings.runsScored - dataB.standings.runsAllowed} format={v => (v >= 0 ? '+' : '') + v} />
                <StatRow label="PYTHAG W" valA={dataA.standings.pythagWins} valB={dataB.standings.pythagWins} />
                <StatRow label="PWR RANK" valA={dataA.power.rank} valB={dataB.power.rank} higherIsBetter={false} format={v => '#' + v} />
                <StatRow label="PWR RATING" valA={dataA.power.rating} valB={dataB.power.rating} />
                <StatRow label="PAYROLL" valA={dataA.payroll} valB={dataB.payroll} format={v => '$' + (v / 1_000_000).toFixed(0) + 'M'} higherIsBetter={false} />
              </tbody>
            </table>
          </div>

          {/* Win % edge */}
          <div className="bloomberg-border p-4 text-center">
            <div className="text-gray-500 text-xs mb-2">HEAD-TO-HEAD EDGE (POWER RATING)</div>
            {(() => {
              const diff = dataA.power.rating - dataB.power.rating;
              const edge = diff > 0 ? dataA.standings.abbreviation : diff < 0 ? dataB.standings.abbreviation : 'EVEN';
              const color = diff > 0 ? 'text-orange-400' : diff < 0 ? 'text-blue-400' : 'text-gray-400';
              return (
                <div className={`text-xl font-bold ${color}`}>
                  {edge} {diff !== 0 && <span className="text-gray-500">+{Math.abs(diff)} pts</span>}
                </div>
              );
            })()}
          </div>
        </>
      )}

      {(!dataA || !dataB) && (teamA != null || teamB != null) && (
        <div className="text-gray-600 text-xs text-center py-8">Select two teams to compare.</div>
      )}
    </div>
  );
}
