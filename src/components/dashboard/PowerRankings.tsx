/**
 * PowerRankings — Weekly power rankings with movement arrows.
 * Ported from MFD's POWER_RANKINGS_986 concept.
 */

import { useState, useEffect, useRef } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';

interface TeamRanking {
  teamId: number;
  name: string;
  abbr: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  powerScore: number;
  rank: number;
  prevRank: number | null;
}

function computePowerScore(wins: number, losses: number, rs: number, ra: number): number {
  const games = wins + losses;
  if (games === 0) return 50;
  const winPct = wins / games;
  const runDiff = rs - ra;
  // Weighted formula: 60% win record, 40% run differential
  return Math.round(winPct * 60 + Math.max(-20, Math.min(20, runDiff * 0.01)) * 40 / 20 + 50);
}

export default function PowerRankings() {
  const { gameStarted, userTeamId } = useGameStore();
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const prevRankingsRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (!gameStarted) return;
    (async () => {
      setLoading(true);
      try {
        const engine = getEngine();
        const standings = await engine.getStandings();
        if (!standings || !Array.isArray(standings)) {
          setLoading(false);
          return;
        }

        const ranked: TeamRanking[] = (standings as Array<{
          teamId: number;
          name?: string;
          abbreviation?: string;
          wins: number;
          losses: number;
          runsScored?: number;
          runsAllowed?: number;
        }>).map(t => ({
          teamId: t.teamId,
          name: t.name ?? `Team ${t.teamId}`,
          abbr: t.abbreviation ?? '???',
          wins: t.wins,
          losses: t.losses,
          runsScored: t.runsScored ?? 0,
          runsAllowed: t.runsAllowed ?? 0,
          powerScore: computePowerScore(t.wins, t.losses, t.runsScored ?? 0, t.runsAllowed ?? 0),
          rank: 0,
          prevRank: prevRankingsRef.current.get(t.teamId) ?? null,
        }));

        // Sort by power score descending
        ranked.sort((a, b) => b.powerScore - a.powerScore);
        ranked.forEach((r, i) => { r.rank = i + 1; });

        // Store current rankings for next comparison
        const newMap = new Map<number, number>();
        ranked.forEach(r => newMap.set(r.teamId, r.rank));
        prevRankingsRef.current = newMap;

        setRankings(ranked);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [gameStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gameStarted) return null;
  if (loading) return <div className="text-gray-500 text-xs animate-pulse p-4">Loading rankings...</div>;
  if (rankings.length === 0) return null;

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">POWER RANKINGS</div>
      <div className="divide-y divide-gray-800/30">
        {rankings.map(r => {
          const isUser = r.teamId === userTeamId;
          const movement = r.prevRank !== null ? r.prevRank - r.rank : 0;
          const medalColor =
            r.rank === 1 ? '#fbbf24' :
            r.rank === 2 ? '#94a3b8' :
            r.rank === 3 ? '#cd7f32' : undefined;

          return (
            <div
              key={r.teamId}
              className="flex items-center gap-2 px-3 py-1.5 transition-colors"
              style={{
                background: isUser ? 'rgba(234,88,12,0.06)' : 'transparent',
                borderLeft: isUser ? '3px solid #ea580c' : '3px solid transparent',
              }}
            >
              {/* Rank */}
              <span
                className="text-xs font-black tabular-nums w-5 text-right"
                style={{ color: medalColor ?? (isUser ? '#f97316' : '#6b7280') }}
              >
                {r.rank}
              </span>

              {/* Movement arrow */}
              <span className="w-4 text-center text-[10px] font-bold">
                {movement > 0 && <span className="text-green-400">▲</span>}
                {movement < 0 && <span className="text-red-400">▼</span>}
                {movement === 0 && r.prevRank !== null && <span className="text-gray-700">—</span>}
              </span>

              {/* Team */}
              <span
                className={`text-xs font-bold w-8 ${isUser ? 'text-orange-400' : 'text-gray-400'}`}
              >
                {r.abbr}
              </span>

              {/* Record */}
              <span className="text-gray-500 text-[10px] tabular-nums w-12">
                {r.wins}-{r.losses}
              </span>

              {/* Run differential */}
              <span className={`text-[10px] tabular-nums w-10 text-right ${
                r.runsScored - r.runsAllowed > 0 ? 'text-green-500' :
                r.runsScored - r.runsAllowed < 0 ? 'text-red-400' : 'text-gray-500'
              }`}>
                {r.runsScored - r.runsAllowed > 0 ? '+' : ''}{r.runsScored - r.runsAllowed}
              </span>

              {/* Power score bar */}
              <div className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(5, r.powerScore)}%`,
                      background: isUser ? '#ea580c' : medalColor ?? '#374151',
                    }}
                  />
                </div>
                <span className="text-gray-500 text-[9px] tabular-nums w-5">{r.powerScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
