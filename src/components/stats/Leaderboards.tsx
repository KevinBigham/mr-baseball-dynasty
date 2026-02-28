import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { LeaderboardEntry } from '../../types/league';

const HITTING_STATS = [
  { id: 'hr',  label: 'HOME RUNS' },
  { id: 'rbi', label: 'RBI' },
  { id: 'avg', label: 'BATTING AVG' },
  { id: 'obp', label: 'ON-BASE PCT' },
  { id: 'slg', label: 'SLUGGING' },
  { id: 'ops', label: 'OPS' },
  { id: 'sb',  label: 'STOLEN BASES' },
  { id: 'h',   label: 'HITS' },
  { id: 'r',   label: 'RUNS' },
  { id: '2b',  label: 'DOUBLES' },
  { id: 'bb',  label: 'WALKS' },
  { id: 'k_h', label: 'STRIKEOUTS' },
];

const PITCHING_STATS = [
  { id: 'era',  label: 'ERA' },
  { id: 'wins', label: 'WINS' },
  { id: 'k',    label: 'STRIKEOUTS' },
  { id: 'whip', label: 'WHIP' },
  { id: 'sv',   label: 'SAVES' },
  { id: 'qs',   label: 'QUALITY STARTS' },
  { id: 'cg',   label: 'COMPLETE GAMES' },
  { id: 'sho',  label: 'SHUTOUTS' },
  { id: 'k9',   label: 'K/9' },
  { id: 'bb9',  label: 'BB/9' },
  { id: 'fip',  label: 'FIP' },
  { id: 'gsc',  label: 'AVG GAME SCORE' },
];

export default function Leaderboards() {
  const { leaderboard, setLeaderboard } = useLeagueStore();
  const { setSelectedPlayer, setActiveTab } = useUIStore();
  const { gameStarted } = useGameStore();
  const [activeStat, setActiveStat] = useState('hr');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine().getLeaderboard(activeStat, 30)
      .then(setLeaderboard)
      .finally(() => setLoading(false));
  }, [gameStarted, activeStat, setLeaderboard]);


  const openPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">STATISTICAL LEADERBOARDS</div>

      {/* Stat selector */}
      <div className="flex gap-1 mb-4 flex-wrap">
        <span className="text-gray-600 text-xs py-1 mr-2">HITTING:</span>
        {HITTING_STATS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStat(s.id)}
            className={[
              'text-xs px-3 py-1 border transition-colors',
              activeStat === s.id
                ? 'border-orange-500 text-orange-400 bg-orange-950/30'
                : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
        <span className="text-gray-600 text-xs py-1 ml-4 mr-2">PITCHING:</span>
        {PITCHING_STATS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStat(s.id)}
            className={[
              'text-xs px-3 py-1 border transition-colors',
              activeStat === s.id
                ? 'border-orange-500 text-orange-400 bg-orange-950/30'
                : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!gameStarted && <div className="text-gray-500 text-xs">Start a game first.</div>}
      {loading && <div className="text-orange-400 text-xs animate-pulse">Loading…</div>}

      {!loading && leaderboard.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">
            {[...HITTING_STATS, ...PITCHING_STATS].find(s => s.id === activeStat)?.label ?? activeStat.toUpperCase()}
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800">
                <th className="text-right px-2 py-1 w-8">#</th>
                <th className="text-left px-2 py-1">PLAYER</th>
                <th className="text-left px-2 py-1">TM</th>
                <th className="text-left px-2 py-1">POS</th>
                <th className="text-right px-2 py-1">AGE</th>
                <th className="text-right px-2 py-1 text-orange-500">
                  {[...HITTING_STATS, ...PITCHING_STATS].find(s => s.id === activeStat)?.label ?? activeStat.toUpperCase()}
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry: LeaderboardEntry) => (
                <tr
                  key={entry.playerId}
                  className="bloomberg-row cursor-pointer text-xs"
                  onClick={() => openPlayer(entry.playerId)}
                >
                  <td className="text-right px-2 py-1 text-gray-600 tabular-nums">{entry.rank}</td>
                  <td className="px-2 py-1 font-bold text-orange-300">{entry.name}</td>
                  <td className="px-2 py-1 text-gray-500">{entry.teamAbbr}</td>
                  <td className="px-2 py-1 text-gray-500">{entry.position}</td>
                  <td className="text-right px-2 py-1 tabular-nums text-gray-500">{entry.age}</td>
                  <td className="text-right px-2 py-1 tabular-nums font-bold text-orange-400">{entry.displayValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && leaderboard.length === 0 && gameStarted && (
        <div className="text-gray-500 text-xs text-center py-8">
          Simulate a season first to see leaderboard data.
        </div>
      )}
    </div>
  );
}
