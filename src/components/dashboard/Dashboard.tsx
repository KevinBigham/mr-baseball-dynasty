import React, { useEffect, useState, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import type { SeasonResult } from '../../types/league';

const TEAM_OPTIONS = [
  { id: 1,  label: 'ADM — New Harbor Admirals (AL East)' },
  { id: 2,  label: 'COL — Capitol City Colonials (AL East)' },
  { id: 3,  label: 'LOB — Boston Bay Lobsters (AL East)' },
  { id: 4,  label: 'STM — Steel City Steamers (AL East)' },
  { id: 5,  label: 'HAM — Lake City Hammers (AL East)' },
  { id: 6,  label: 'WLV — River City Wolves (AL Central)' },
  { id: 7,  label: 'CRU — South City Crushers (AL Central)' },
  { id: 8,  label: 'FOX — Prairie City Foxes (AL Central)' },
  { id: 9,  label: 'MIN — Twin Peaks Miners (AL Central)' },
  { id: 10, label: 'MON — Crown City Monarchs (AL Central)' },
  { id: 11, label: 'GUL — Bay City Gulls (AL West)' },
  { id: 12, label: 'RAT — Desert City Rattlers (AL West)' },
  { id: 13, label: 'COU — Sun Valley Cougars (AL West)' },
  { id: 14, label: 'LUM — Northwest City Lumberjacks (AL West)' },
  { id: 15, label: 'ANG — Anaheim Hills Angels (AL West)' },
  { id: 16, label: 'MET — New Harbor Metros (NL East)' },
  { id: 17, label: 'BRA — Peach City Brawlers (NL East)' },
  { id: 18, label: 'TID — Palmetto City Tides (NL East)' },
  { id: 19, label: 'PAT — Brick City Patriots (NL East)' },
  { id: 20, label: 'HUR — Swamp City Hurricanes (NL East)' },
  { id: 21, label: 'CUB — Lake City Cubs (NL Central)' },
  { id: 22, label: 'RED — Gateway City Redbirds (NL Central)' },
  { id: 23, label: 'CIN — Blue Grass City Reds (NL Central)' },
  { id: 24, label: 'AST — Bayou City Astros (NL Central)' },
  { id: 25, label: 'BRW — Lake Front Brewers (NL Central)' },
  { id: 26, label: 'DOD — Harbor Bay Dodgers (NL West)' },
  { id: 27, label: 'GNT — Bay City Giants (NL West)' },
  { id: 28, label: 'PAD — Harbor Lights Padres (NL West)' },
  { id: 29, label: 'ROC — Mile High City Rockies (NL West)' },
  { id: 30, label: 'DIA — Sandstone Park Diamondbacks (NL West)' },
];

export default function Dashboard() {
  const { gameStarted, season, userTeamId, isSimulating, setGameStarted, setSeason, setUserTeamId, setSimulating, setSimProgress } = useGameStore();
  const { setStandings, setLeaderboard, setLastSeasonStats } = useLeagueStore();
  const { setActiveTab, setSelectedTeam } = useUIStore();
  const [lastResult, setLastResult] = useState<SeasonResult | null>(null);
  const [selectedTeamForNew, setSelectedTeamForNew] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const startNewGame = useCallback(async () => {
    setError(null);
    setStatus('Generating league…');
    try {
      const engine = getEngine();
      const seed = Date.now() % 2147483647;
      await engine.newGame(seed, selectedTeamForNew);
      setUserTeamId(selectedTeamForNew);
      setSelectedTeam(selectedTeamForNew);
      setSeason(2026);
      setGameStarted(true);
      // Load initial standings
      const standings = await engine.getStandings();
      setStandings(standings);
      setStatus('');
    } catch (e) {
      setError(String(e));
      setStatus('');
    }
  }, [selectedTeamForNew, setUserTeamId, setSelectedTeam, setSeason, setGameStarted, setStandings]);

  const simulateSeason = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);
    try {
      const engine = getEngine();
      const result = await engine.simulateSeason();
      setLastResult(result);
      setSeason(result.season);
      setLastSeasonStats(result.leagueERA, result.leagueBA, result.leagueRPG);
      // Refresh standings + leaderboard
      const [standings, hrLeaders] = await Promise.all([
        engine.getStandings(),
        engine.getLeaderboard('hr', 10),
      ]);
      setStandings(standings);
      setLeaderboard(hrLeaders);
      setSimProgress(1);
    } catch (e) {
      setError(String(e));
    } finally {
      setSimulating(false);
    }
  }, [setSeason, setSimulating, setSimProgress, setStandings, setLeaderboard, setLastSeasonStats]);

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-8">
        <div className="text-center">
          <div className="text-orange-500 font-bold text-2xl tracking-widest mb-2">MR. BASEBALL DYNASTY</div>
          <div className="text-gray-500 text-xs">A SABERMETRICALLY CREDIBLE FRANCHISE SIMULATION</div>
        </div>

        <div className="bloomberg-border bg-gray-900 p-6 w-full max-w-md">
          <div className="bloomberg-header -mx-6 -mt-6 mb-4 px-4">SELECT YOUR FRANCHISE</div>
          <div className="mb-4">
            <label className="text-gray-500 text-xs block mb-1">TEAM</label>
            <select
              value={selectedTeamForNew}
              onChange={e => setSelectedTeamForNew(Number(e.target.value))}
              className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-xs px-2 py-1.5 rounded focus:border-orange-500 focus:outline-none"
            >
              {TEAM_OPTIONS.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
          {status && <div className="text-orange-400 text-xs mb-3 animate-pulse">{status}</div>}
          <button
            onClick={startNewGame}
            className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs py-2 uppercase tracking-widest transition-colors"
          >
            START DYNASTY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Control row */}
      <div className="flex gap-3 items-center">
        <div className="bloomberg-border bg-gray-900 px-4 py-2 flex-1">
          <div className="text-gray-500 text-xs">FRANCHISE</div>
          <div className="text-orange-400 font-bold">{TEAM_OPTIONS.find(t => t.id === userTeamId)?.label ?? '---'}</div>
        </div>
        <div className="bloomberg-border bg-gray-900 px-4 py-2">
          <div className="text-gray-500 text-xs">SEASON</div>
          <div className="text-gray-200 font-bold">{season}</div>
        </div>
        <button
          onClick={simulateSeason}
          disabled={isSimulating}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-xs px-6 py-2 uppercase tracking-widest transition-colors"
        >
          {isSimulating ? 'SIMULATING…' : `SIM ${season} SEASON`}
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors"
        >
          STANDINGS
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors"
        >
          ROSTER
        </button>
      </div>

      {error && (
        <div className="bloomberg-border bg-red-950 px-4 py-2 text-red-400 text-xs">{error}</div>
      )}

      {/* Season results */}
      {lastResult && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'LEAGUE BA',  value: lastResult.leagueBA.toFixed(3) },
            { label: 'LEAGUE ERA', value: lastResult.leagueERA.toFixed(2) },
            { label: 'RUNS/GAME',  value: lastResult.leagueRPG.toFixed(2) },
            { label: 'WINS SD',    value: lastResult.teamWinsSD.toFixed(1) },
          ].map(stat => (
            <div key={stat.label} className="bloomberg-border bg-gray-900 px-4 py-3">
              <div className="text-gray-500 text-xs">{stat.label}</div>
              <div className="text-orange-400 font-bold text-lg tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions if no season run yet */}
      {!lastResult && (
        <div className="bloomberg-border bg-gray-900 p-6 text-center">
          <div className="text-gray-500 text-xs mb-2">READY TO SIM YOUR FIRST SEASON</div>
          <div className="text-gray-600 text-xs">Click "SIM {season} SEASON" to run all 2,430 games</div>
          <div className="text-gray-600 text-xs mt-1">Powered by Log5 + 25-state Markov chain + 3-stage PA engine</div>
        </div>
      )}
    </div>
  );
}
