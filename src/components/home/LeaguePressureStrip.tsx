/**
 * LeaguePressureStrip.tsx — Compact division/league context strip.
 * Shows where the user team sits relative to division rivals.
 * Degrades honestly when standings are unavailable.
 */

import type { StandingsRow } from '../../types/league';

interface Props {
  standings: StandingsRow[] | null;
  userTeamId: number;
}

export default function LeaguePressureStrip({ standings, userTeamId }: Props) {
  if (!standings || standings.length === 0) {
    return (
      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-3 flex items-center justify-between">
          <span>DIVISION RACE</span>
          <span className="text-gray-500 font-normal text-[10px]">WAITING</span>
        </div>
        <div className="px-3 py-4 text-center">
          <div className="text-gray-500 text-xs mb-1">No standings data yet.</div>
          <div className="text-gray-700 text-[10px]">
            Start the season to see your division race unfold here.
          </div>
        </div>
      </div>
    );
  }

  const userRow = standings.find(s => s.teamId === userTeamId);
  if (!userRow) return null;

  // Get division mates
  const divisionTeams = standings
    .filter(s => s.division === userRow.division && s.league === userRow.league)
    .sort((a, b) => b.wins - a.wins);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-3 flex items-center justify-between">
        <span>{userRow.league} {userRow.division}</span>
        <span className="text-gray-500 font-normal text-[10px]">DIVISION RACE</span>
      </div>
      <div className="divide-y divide-gray-800">
        {divisionTeams.map(team => {
          const isUser = team.teamId === userTeamId;
          return (
            <div
              key={team.teamId}
              className={`px-3 py-1.5 flex items-center justify-between text-xs ${
                isUser ? 'bg-orange-950/20' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-bold tabular-nums ${isUser ? 'text-orange-400' : 'text-gray-300'}`}>
                  {team.abbreviation}
                </span>
                <span className="text-gray-500 truncate">{team.name}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums shrink-0">
                <span className={isUser ? 'text-gray-200' : 'text-gray-400'}>
                  {team.wins}–{team.losses}
                </span>
                <span className="text-gray-500 w-8 text-right">
                  {team.gb === 0 ? '—' : team.gb.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
