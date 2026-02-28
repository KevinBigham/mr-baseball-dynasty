import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import SimControlPanel from '../dashboard/SimControlPanel';
import type { StandingsData } from '../../types/league';

interface GameResult {
  awayTeamId: number;
  homeTeamId: number;
  awayTeamAbbr: string;
  homeTeamAbbr: string;
  awayScore: number;
  homeScore: number;
}

export default function SimHub() {
  const { gameStarted, userTeamId, isSimulating, setSimulating, setSimProgress } = useGameStore();
  const { setStandings } = useLeagueStore();
  const { setActiveTab } = useUIStore();
  const [simState, setSimState] = useState({ gamesPlayed: 0, totalGames: 0 });
  const [standings, setLocalStandings] = useState<StandingsData | null>(null);
  const [recentGames, setRecentGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!gameStarted) return;
    const engine = getEngine();
    const [progress, stds, games] = await Promise.all([
      engine.getSimProgress(),
      engine.getStandings(),
      engine.getRecentGames(),
    ]);
    setSimState({ gamesPlayed: progress.gamesPlayed, totalGames: progress.totalScheduled });
    setLocalStandings(stds);
    setStandings(stds);
    setRecentGames(games as GameResult[]);
  }, [gameStarted, setStandings]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleSim = useCallback(async (fn: () => Promise<unknown>) => {
    setSimulating(true);
    setSimProgress(0);
    try {
      await fn();
      await refreshData();
    } finally {
      setSimulating(false);
      setSimProgress(1);
    }
  }, [setSimulating, setSimProgress, refreshData]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const perTeam = simState.totalGames > 0 ? Math.round((simState.gamesPlayed / simState.totalGames) * 162) : 0;

  // Quick standings: top 5 teams
  const topTeams = standings?.standings
    ?.slice()
    .sort((a, b) => {
      const aPct = a.wins / Math.max(1, a.wins + a.losses);
      const bPct = b.wins / Math.max(1, b.wins + b.losses);
      return bPct - aPct;
    })
    .slice(0, 10) ?? [];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SIMULATION HUB</span>
        <span className="text-gray-500 text-xs">Game {perTeam}/162</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Sim controls */}
        <div className="col-span-2">
          <SimControlPanel
            onSimGames={(count) => handleSim(() => getEngine().simGames(count))}
            onSimWeek={() => handleSim(() => getEngine().simWeek())}
            onSimMonth={() => handleSim(() => getEngine().simMonth())}
            onSimToASB={() => handleSim(() => getEngine().simToAllStarBreak())}
            onSimToDeadline={() => handleSim(() => getEngine().simToTradeDeadline())}
            onSimRest={() => handleSim(() => getEngine().simRest())}
            onSimFullSeason={() => handleSim(() => getEngine().simulateSeason())}
            gamesPlayed={simState.gamesPlayed}
            totalGames={simState.totalGames}
          />

          {/* Recent games */}
          {recentGames.length > 0 && (
            <div className="bloomberg-border mt-4">
              <div className="bloomberg-header">RECENT RESULTS</div>
              <div className="max-h-[16rem] overflow-y-auto">
                <div className="grid grid-cols-3 gap-1 p-2">
                  {recentGames.slice(-12).map((g, i) => {
                    const isUser = g.awayTeamId === userTeamId || g.homeTeamId === userTeamId;
                    return (
                      <div key={i} className={`text-xs p-1.5 rounded ${isUser ? 'bg-orange-900/20 border border-orange-900/30' : 'bg-gray-900/50'}`}>
                        <div className="flex justify-between">
                          <span className={g.awayScore > g.homeScore ? 'text-green-400 font-bold' : 'text-gray-500'}>
                            {g.awayTeamAbbr}
                          </span>
                          <span className="tabular-nums text-gray-400">{g.awayScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={g.homeScore > g.awayScore ? 'text-green-400 font-bold' : 'text-gray-500'}>
                            {g.homeTeamAbbr}
                          </span>
                          <span className="tabular-nums text-gray-400">{g.homeScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live standings */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">STANDINGS SNAPSHOT</div>
          <div className="max-h-[28rem] overflow-y-auto">
            {topTeams.length === 0 ? (
              <div className="p-4 text-gray-600 text-xs text-center">Sim some games to see standings.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-[10px] border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="px-2 py-1 text-right">#</th>
                    <th className="px-2 py-1 text-left">TEAM</th>
                    <th className="px-2 py-1 text-right">W</th>
                    <th className="px-2 py-1 text-right">L</th>
                    <th className="px-2 py-1 text-right">PCT</th>
                  </tr>
                </thead>
                <tbody>
                  {topTeams.map((t, i) => {
                    const pct = t.wins / Math.max(1, t.wins + t.losses);
                    const isUser = t.teamId === userTeamId;
                    return (
                      <tr key={t.teamId} className={`text-xs ${isUser ? 'bg-orange-900/20' : 'hover:bg-gray-800/50'}`}>
                        <td className="px-2 py-0.5 text-right tabular-nums text-gray-600">{i + 1}</td>
                        <td className={`px-2 py-0.5 font-bold ${isUser ? 'text-orange-400' : 'text-gray-300'}`}>
                          {t.abbreviation}
                        </td>
                        <td className="px-2 py-0.5 text-right tabular-nums text-green-400">{t.wins}</td>
                        <td className="px-2 py-0.5 text-right tabular-nums text-red-400">{t.losses}</td>
                        <td className="px-2 py-0.5 text-right tabular-nums text-gray-400">{pct.toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-2 py-1 border-t border-gray-800">
            <button onClick={() => setActiveTab('standings')}
              className="text-orange-400 text-[10px] font-bold hover:underline">
              FULL STANDINGS →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
