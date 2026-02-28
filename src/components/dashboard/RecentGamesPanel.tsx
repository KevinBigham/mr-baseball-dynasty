import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { INITIAL_TEAMS } from '../../data/teams';
import type { GameSummary } from '../../types/game';

const teamById = new Map(INITIAL_TEAMS.map(t => [t.teamId, t]));

function teamAbbr(teamId: number): string {
  return teamById.get(teamId)?.abbreviation ?? `T${teamId}`;
}

function teamName(teamId: number): string {
  return teamById.get(teamId)?.name ?? `Team ${teamId}`;
}

/** Generate a short game blurb from summary data */
function gameBlurb(g: GameSummary, userTeamId: number): string | null {
  const isHome = g.homeTeamId === userTeamId;
  const userScore = isHome ? g.homeScore : g.awayScore;
  const oppScore  = isHome ? g.awayScore : g.homeScore;
  const margin = Math.abs(userScore - oppScore);
  const won = userScore > oppScore;

  if (g.walkOff) return won ? 'Walk-off win!' : 'Lost on a walk-off';
  if (oppScore === 0 && won) return 'Shutout victory';
  if (userScore === 0 && !won) return 'Shut out';
  if (margin >= 7) return won ? 'Blowout win' : 'Blowout loss';
  if (g.innings > 9) return `${g.innings}-inning ${won ? 'win' : 'loss'}`;
  if (margin === 1) return won ? 'Edged it out' : 'Tough one-run loss';
  return null;
}

export default function RecentGamesPanel() {
  const { userTeamId } = useGameStore();
  const [games, setGames] = useState<GameSummary[]>([]);

  useEffect(() => {
    getEngine().getRecentGames().then(setGames);
  }, []);

  if (games.length === 0) return null;

  return (
    <div className="bloomberg-border bg-gray-900 px-4 py-3">
      <div className="bloomberg-header mb-2">RECENT GAMES</div>
      <div className="space-y-2">
        {games.slice().reverse().map(g => {
          const isHome = g.homeTeamId === userTeamId;
          const userScore = isHome ? g.homeScore : g.awayScore;
          const oppScore  = isHome ? g.awayScore : g.homeScore;
          const oppId     = isHome ? g.awayTeamId : g.homeTeamId;
          const won       = userScore > oppScore;
          const prefix    = isHome ? 'vs' : '@';

          return (
            <div
              key={g.gameId}
              className="flex items-center gap-3 text-xs font-mono py-1 border-b border-gray-800 last:border-b-0"
            >
              {/* W/L indicator */}
              <span className={`font-bold w-4 ${won ? 'text-green-400' : 'text-red-400'}`}>
                {won ? 'W' : 'L'}
              </span>

              {/* Matchup */}
              <span className="text-gray-500 w-5">{prefix}</span>
              <span className="text-gray-300 w-12" title={teamName(oppId)}>
                {teamAbbr(oppId)}
              </span>

              {/* Score */}
              <span className={`font-bold w-8 text-right ${won ? 'text-green-400' : 'text-red-400'}`}>
                {userScore}
              </span>
              <span className="text-gray-600">-</span>
              <span className="text-gray-400 w-8">{oppScore}</span>

              {/* Line score (compact) */}
              {g.lineScore && (
                <span className="text-gray-600 hidden sm:inline ml-auto">
                  {(isHome ? g.lineScore.home : g.lineScore.away)
                    .map(r => r > 0 ? String(r) : '0')
                    .join(' ')}
                </span>
              )}

              {/* Extras / Walk-off badges */}
              {g.innings > 9 && (
                <span className="text-yellow-500 text-[10px] ml-1">
                  F/{g.innings}
                </span>
              )}
              {g.walkOff && (
                <span className="text-orange-400 text-[10px] ml-1">WO</span>
              )}

              {/* Game blurb */}
              {(() => {
                const blurb = gameBlurb(g, userTeamId);
                return blurb ? (
                  <span className="text-gray-600 text-[10px] ml-1 hidden md:inline italic">
                    {blurb}
                  </span>
                ) : null;
              })()}
            </div>
          );
        })}
      </div>

      {/* Win streak / record summary */}
      {games.length > 0 && (() => {
        let streak = 0;
        let lastWon: boolean | null = null;
        for (let i = games.length - 1; i >= 0; i--) {
          const g = games[i]!;
          const isHome = g.homeTeamId === userTeamId;
          const won = isHome ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
          if (lastWon === null) {
            lastWon = won;
            streak = 1;
          } else if (won === lastWon) {
            streak++;
          } else {
            break;
          }
        }
        const label = lastWon ? `W${streak}` : `L${streak}`;
        const color = lastWon ? 'text-green-400' : 'text-red-400';
        return (
          <div className="mt-2 text-xs text-gray-500">
            Current streak: <span className={`font-bold ${color}`}>{label}</span>
          </div>
        );
      })()}
    </div>
  );
}
