import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { INITIAL_TEAMS } from '../../data/teams';
import type { GameSummary } from '../../types/game';
import type { StandingsData, StandingsRow } from '../../types/league';

const teamById = new Map(INITIAL_TEAMS.map(t => [t.teamId, t]));
function abbr(id: number) { return teamById.get(id)?.abbreviation ?? '???'; }

function ScoreCard({ game, userTeamId }: { game: GameSummary; userTeamId: number }) {
  const homeWon = game.homeScore > game.awayScore;
  const isUserGame = game.homeTeamId === userTeamId || game.awayTeamId === userTeamId;

  return (
    <div className={`bloomberg-border ${isUserGame ? 'ring-1 ring-orange-800' : ''}`}>
      {/* Away team row */}
      <div className={`flex items-center justify-between px-2 py-1 text-xs ${!homeWon ? 'bg-gray-900/50' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold w-10 ${!homeWon ? 'text-orange-300' : 'text-gray-500'}`}>
            {abbr(game.awayTeamId)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {game.lineScore && (
            <span className="text-gray-700 tabular-nums hidden sm:inline text-[10px]">
              {game.lineScore.away.map(r => String(r)).join(' ')}
            </span>
          )}
          <span className={`font-bold tabular-nums w-6 text-right ${!homeWon ? 'text-orange-400' : 'text-gray-400'}`}>
            {game.awayScore}
          </span>
          <span className="tabular-nums text-gray-600 w-5 text-right">{game.awayHits}H</span>
        </div>
      </div>

      {/* Home team row */}
      <div className={`flex items-center justify-between px-2 py-1 text-xs border-t border-gray-800 ${homeWon ? 'bg-gray-900/50' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold w-10 ${homeWon ? 'text-orange-300' : 'text-gray-500'}`}>
            {abbr(game.homeTeamId)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {game.lineScore && (
            <span className="text-gray-700 tabular-nums hidden sm:inline text-[10px]">
              {game.lineScore.home.map(r => String(r)).join(' ')}
            </span>
          )}
          <span className={`font-bold tabular-nums w-6 text-right ${homeWon ? 'text-orange-400' : 'text-gray-400'}`}>
            {game.homeScore}
          </span>
          <span className="tabular-nums text-gray-600 w-5 text-right">{game.homeHits}H</span>
        </div>
      </div>

      {/* Footer badges */}
      <div className="flex items-center justify-between px-2 py-0.5 border-t border-gray-800 text-[10px]">
        <span className="text-gray-700">FINAL{game.innings > 9 ? `/${game.innings}` : ''}</span>
        <div className="flex gap-1">
          {game.walkOff && <span className="text-orange-500 font-bold">WO</span>}
          {game.innings > 9 && <span className="text-yellow-500">EXTRA</span>}
          {isUserGame && <span className="text-orange-400">YOUR TEAM</span>}
        </div>
      </div>
    </div>
  );
}

function StandingsQuick({ standings, userTeamId }: { standings: StandingsRow[]; userTeamId: number }) {
  const divisions: Record<string, StandingsRow[]> = {};
  for (const row of standings) {
    const key = `${row.league} ${row.division}`;
    (divisions[key] ??= []).push(row);
  }

  const divOrder = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

  return (
    <div className="grid grid-cols-6 gap-2">
      {divOrder.map(div => {
        const teams = (divisions[div] ?? []).sort((a, b) => b.wins - a.wins);
        const leader = teams[0];
        return (
          <div key={div} className="bloomberg-border">
            <div className="text-gray-600 text-[10px] font-bold px-1.5 py-0.5 border-b border-gray-800 bg-gray-900/30">
              {div.toUpperCase()}
            </div>
            {teams.map(t => {
              const gb = leader ? ((leader.wins - t.wins) + (t.losses - leader.losses)) / 2 : 0;
              return (
                <div key={t.teamId} className={`flex items-center justify-between px-1.5 py-0.5 text-[10px] ${
                  t.teamId === userTeamId ? 'bg-orange-900/20' : ''
                }`}>
                  <span className={`font-bold ${t.teamId === userTeamId ? 'text-orange-400' : 'text-gray-400'}`}>
                    {t.abbreviation}
                  </span>
                  <span className="tabular-nums text-gray-500">
                    {t.wins}-{t.losses}
                    {gb > 0 && <span className="text-gray-700 ml-1">-{gb}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function Scoreboard() {
  const { gameStarted, userTeamId } = useGameStore();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getRecentGames(),
      getEngine().getStandings(),
    ]).then(([g, s]) => {
      setGames(g);
      setStandings(s);
    }).finally(() => setLoading(false));
  }, [gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading scoreboard...</div>;

  // Group games by "date" (just use the game IDs / order since dates are abstract)
  const userGames = games.filter(g => g.homeTeamId === userTeamId || g.awayTeamId === userTeamId);
  const otherGames = games.filter(g => g.homeTeamId !== userTeamId && g.awayTeamId !== userTeamId);

  // Stats
  const userWins = userGames.filter(g => {
    const isHome = g.homeTeamId === userTeamId;
    return isHome ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
  }).length;
  const totalUserGames = userGames.length;

  // Compute streak
  let streak = 0;
  let streakType: 'W' | 'L' | null = null;
  for (let i = games.length - 1; i >= 0; i--) {
    const g = games[i];
    if (g.homeTeamId !== userTeamId && g.awayTeamId !== userTeamId) continue;
    const isHome = g.homeTeamId === userTeamId;
    const won = isHome ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
    const type = won ? 'W' : 'L';
    if (streakType === null) { streakType = type; streak = 1; }
    else if (type === streakType) { streak++; }
    else break;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SCOREBOARD</span>
        {totalUserGames > 0 && (
          <span className="text-gray-500 text-xs">
            Your record: <span className="text-orange-400 font-bold">{userWins}-{totalUserGames - userWins}</span>
            {streakType && <span className={`ml-2 ${streakType === 'W' ? 'text-green-400' : 'text-red-400'}`}>{streakType}{streak}</span>}
          </span>
        )}
      </div>

      {/* Quick standings */}
      {standings && (
        <StandingsQuick standings={standings.standings} userTeamId={userTeamId} />
      )}

      {/* Your games section */}
      {userGames.length > 0 && (
        <>
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Your Games</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {userGames.slice().reverse().map(g => (
              <ScoreCard key={g.gameId} game={g} userTeamId={userTeamId} />
            ))}
          </div>
        </>
      )}

      {/* League games */}
      {otherGames.length > 0 && (
        <>
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Around The League</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {otherGames.slice().reverse().map(g => (
              <ScoreCard key={g.gameId} game={g} userTeamId={userTeamId} />
            ))}
          </div>
        </>
      )}

      {games.length === 0 && (
        <div className="text-gray-600 text-xs text-center py-8">
          No games played yet. Use granular sim controls to play games, or simulate a full season.
        </div>
      )}
    </div>
  );
}
