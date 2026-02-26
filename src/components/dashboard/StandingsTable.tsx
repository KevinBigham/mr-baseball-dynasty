import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { StandingsRow } from '../../types/league';

function computeGB(rows: StandingsRow[]): StandingsRow[] {
  if (rows.length === 0) return rows;
  const leader = rows.reduce((a, b) => a.wins > b.wins ? a : b);
  return rows.map(r => ({
    ...r,
    gb: r === leader ? 0 : ((leader.wins - r.wins) + (r.losses - leader.losses)) / 2,
  }));
}

function groupByDivision(rows: StandingsRow[]): Record<string, StandingsRow[]> {
  const groups: Record<string, StandingsRow[]> = {};
  for (const r of rows) {
    const key = `${r.league} ${r.division}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  // Sort each group by wins desc
  for (const key of Object.keys(groups)) {
    groups[key] = computeGB(groups[key]!.sort((a, b) => b.wins - a.wins || a.losses - b.losses));
  }
  return groups;
}

const DIV_ORDER = [
  'AL East', 'AL Central', 'AL West',
  'NL East', 'NL Central', 'NL West',
];

export default function StandingsView() {
  const { standings, setStandings } = useLeagueStore();
  const { gameStarted } = useGameStore();
  const { setSelectedTeam, setActiveTab } = useUIStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted || standings) return;
    setLoading(true);
    getEngine().getStandings()
      .then(setStandings)
      .finally(() => setLoading(false));
  }, [gameStarted, standings, setStandings]);

  if (!gameStarted) {
    return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  }
  if (loading) {
    return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading standings…</div>;
  }
  if (!standings) {
    return <div className="p-4 text-gray-500 text-xs">No standings yet. Simulate a season first.</div>;
  }

  const grouped = groupByDivision(standings.standings);

  return (
    <div className="p-4">
      <div className="bloomberg-header mb-4 -mx-4 -mt-4 px-8 py-2">
        MLB STANDINGS — SEASON {standings.season}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {DIV_ORDER.map(divKey => {
          const rows = grouped[divKey];
          if (!rows) return null;

          return (
            <div key={divKey} className="bloomberg-border">
              <div className="bloomberg-header text-xs">{divKey}</div>
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800">
                    <th className="text-left px-2 py-1 w-32">TEAM</th>
                    <th className="text-right px-2 py-1">W</th>
                    <th className="text-right px-2 py-1">L</th>
                    <th className="text-right px-2 py-1">PCT</th>
                    <th className="text-right px-2 py-1">GB</th>
                    <th className="text-right px-2 py-1">RS</th>
                    <th className="text-right px-2 py-1">RA</th>
                    <th className="text-right px-2 py-1 text-orange-600" title="Pythagorean wins">xW</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.teamId}
                      className={[
                        'bloomberg-row cursor-pointer text-xs',
                        i === 0 ? 'text-orange-300' : '',
                      ].join(' ')}
                      onClick={() => {
                        setSelectedTeam(row.teamId);
                        setActiveTab('roster');
                      }}
                    >
                      <td className="px-2 py-1 font-bold">{row.abbreviation}</td>
                      <td className="text-right px-2 py-1 tabular-nums">{row.wins}</td>
                      <td className="text-right px-2 py-1 tabular-nums">{row.losses}</td>
                      <td className="text-right px-2 py-1 tabular-nums">{row.pct.toFixed(3).replace('0.', '.')}</td>
                      <td className="text-right px-2 py-1 tabular-nums text-gray-500">{row.gb === 0 ? '—' : row.gb.toFixed(1)}</td>
                      <td className="text-right px-2 py-1 tabular-nums">{row.runsScored}</td>
                      <td className="text-right px-2 py-1 tabular-nums">{row.runsAllowed}</td>
                      <td className="text-right px-2 py-1 tabular-nums text-orange-600">{row.pythagWins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
