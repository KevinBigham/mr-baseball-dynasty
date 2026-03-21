/**
 * MonthRecap — Compact card showing the user's monthly results,
 * top performers, and quick standings snapshot.
 */

import type { PartialSeasonResult } from '../../engine/sim/incrementalSimulator';
import type { StandingsRow } from '../../types/league';

const SEGMENT_LABELS = ['APRIL–MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER'];

interface Props {
  segment: number;              // 0-4
  partialResult: PartialSeasonResult;
  userTeamId: number;
  chunkRecord: { wins: number; losses: number }; // user record THIS chunk
  divisionStandings: StandingsRow[] | null;
  prevDivisionRank?: number;    // Division rank before this chunk (for movement indicator)
}

export default function MonthRecap({ segment, partialResult, userTeamId, chunkRecord, divisionStandings, prevDivisionRank }: Props) {
  const userTeam = partialResult.teamSeasons.find(t => t.teamId === userTeamId);
  const totalWins = userTeam?.record?.wins ?? 0;
  const totalLosses = userTeam?.record?.losses ?? 0;
  const totalGames = totalWins + totalLosses;
  const pct = totalGames > 0 ? (totalWins / totalGames).toFixed(3).slice(1) : '.000';

  // Runs per game
  const rs = userTeam?.record ? userTeam.record.runsScored / Math.max(1, totalGames) : 0;
  const ra = userTeam?.record ? userTeam.record.runsAllowed / Math.max(1, totalGames) : 0;

  // Find user's division standings
  const userStanding = divisionStandings?.find(s => s.teamId === userTeamId);
  const userDivision = userStanding?.division ?? '';
  const userLeague = userStanding?.league ?? '';
  const divTeams = divisionStandings
    ?.filter(s => s.division === userDivision && s.league === userLeague)
    .sort((a, b) => b.wins - a.wins) ?? [];

  // Current division rank (1-indexed)
  const currentRank = divTeams.findIndex(t => t.teamId === userTeamId) + 1;
  const rankMovement = prevDivisionRank && currentRank > 0 ? prevDivisionRank - currentRank : 0;

  // ── Needs attention callouts ──
  const alerts: { icon: string; text: string; color: string }[] = [];
  const monthWinPct = (chunkRecord.wins + chunkRecord.losses) > 0
    ? chunkRecord.wins / (chunkRecord.wins + chunkRecord.losses) : 0.5;
  if (monthWinPct < 0.350) {
    alerts.push({ icon: '📉', text: 'Rough month — consider lineup or rotation changes.', color: 'text-red-400' });
  } else if (monthWinPct >= 0.700) {
    alerts.push({ icon: '🔥', text: 'Dominant stretch! Keep riding the hot hand.', color: 'text-green-400' });
  }
  if (rankMovement > 0) {
    alerts.push({ icon: '📈', text: `Moved UP ${rankMovement} spot${rankMovement > 1 ? 's' : ''} in the division.`, color: 'text-green-400' });
  } else if (rankMovement < 0) {
    alerts.push({ icon: '📉', text: `Dropped ${Math.abs(rankMovement)} spot${Math.abs(rankMovement) > 1 ? 's' : ''} in the division.`, color: 'text-yellow-400' });
  }

  // Top hitters (by avg, min PA threshold)
  const minPA = Math.max(10, partialResult.gamesCompleted / 30 * 3);
  const topHitters = partialResult.playerSeasons
    .filter(p => p.teamId === userTeamId && p.pa > minPA && p.ab > 0)
    .map(p => ({ ...p, avg: p.h / p.ab }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);

  // Top pitchers (by ERA, min outs)
  const minOuts = Math.max(10, partialResult.gamesCompleted / 30);
  const topPitchers = partialResult.playerSeasons
    .filter(p => p.teamId === userTeamId && p.outs > minOuts && p.gp > 0)
    .map(p => ({ ...p, era: p.outs > 0 ? (p.er / p.outs) * 27 : 99 }))
    .sort((a, b) => a.era - b.era)
    .slice(0, 2);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>{SEGMENT_LABELS[segment] ?? 'MONTH'} RECAP</span>
        <span className="text-gray-500 font-normal text-xs">
          {chunkRecord.wins}–{chunkRecord.losses} this month
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Needs attention callouts */}
        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span>{a.icon}</span>
                <span className={a.color}>{a.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Overall record */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">RECORD</div>
            <div className="text-orange-400 font-bold tabular-nums text-sm">
              {totalWins}–{totalLosses}
            </div>
            <div className="text-gray-500 text-xs tabular-nums">{pct}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">RS/G</div>
            <div className="text-green-400 font-bold tabular-nums text-sm">{rs.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">RA/G</div>
            <div className="text-red-400 font-bold tabular-nums text-sm">{ra.toFixed(1)}</div>
          </div>
        </div>

        {/* Division standings */}
        {divTeams.length > 0 && (
          <div>
            <div className="text-gray-500 text-[10px] font-bold tracking-widest mb-1">
              {userLeague} {userDivision.toUpperCase()}
            </div>
            <div className="space-y-0.5">
              {divTeams.map((team, rank) => {
                const leaderWins = divTeams[0]?.wins ?? 0;
                const gb = rank === 0 ? '—' : ((leaderWins - team.wins + (team.losses - (divTeams[0]?.losses ?? 0))) / 2).toFixed(1);
                const isUser = team.teamId === userTeamId;
                return (
                  <div
                    key={team.teamId}
                    className={`flex items-center justify-between px-2 py-0.5 text-xs tabular-nums ${
                      isUser ? 'bg-orange-900/20 border-l-2 border-orange-500' : ''
                    }`}
                  >
                    <span className={isUser ? 'text-orange-400 font-bold' : 'text-gray-400'}>
                      {team.abbreviation}
                    </span>
                    <span className={isUser ? 'text-orange-400' : 'text-gray-500'}>
                      {team.wins}–{team.losses}
                    </span>
                    <span className="text-gray-500 w-8 text-right">{gb}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top performers */}
        {(topHitters.length > 0 || topPitchers.length > 0) && (
          <div>
            <div className="text-gray-500 text-[10px] font-bold tracking-widest mb-1">TOP PERFORMERS</div>
            <div className="flex gap-3 flex-wrap">
              {topHitters.map(p => (
                <div key={p.playerId} className="text-xs">
                  <span className="text-gray-300">#{p.playerId}</span>
                  {' '}
                  <span className="text-orange-400 font-bold tabular-nums">
                    .{(p.avg * 1000).toFixed(0).padStart(3, '0')}
                  </span>
                  {' '}
                  <span className="text-gray-500">{p.hr} HR · {p.rbi} RBI</span>
                </div>
              ))}
              {topPitchers.map(p => (
                <div key={p.playerId} className="text-xs">
                  <span className="text-gray-300">#{p.playerId}</span>
                  {' '}
                  <span className="text-blue-400 font-bold tabular-nums">
                    {p.era.toFixed(2)} ERA
                  </span>
                  {' '}
                  <span className="text-gray-500">{p.w}–{p.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
