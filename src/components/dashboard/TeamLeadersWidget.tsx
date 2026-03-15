/**
 * TeamLeadersWidget.tsx — Compact team leaders card for the HOME dashboard.
 *
 * Shows your team's top hitter (by OPS) and top pitcher (by ERA),
 * plus quick team aggregate stats. Bloomberg-style presentation.
 */

import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';

interface LeaderEntry {
  name: string;
  position: string;
  stat: string;
  statLabel: string;
  secondaryStat: string;
  secondaryLabel: string;
  playerId: number;
}

interface TeamAggs {
  teamBA: string;
  teamERA: string;
  teamHR: number;
  teamSO: number;
}

export default function TeamLeadersWidget() {
  const { userTeamId, season, gamePhase, isSimulating } = useGameStore();
  const { navigate, setSelectedPlayer } = useUIStore();
  const [topHitter, setTopHitter] = useState<LeaderEntry | null>(null);
  const [topPitcher, setTopPitcher] = useState<LeaderEntry | null>(null);
  const [aggs, setAggs] = useState<TeamAggs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const engine = getEngine();
        const roster = await engine.getRoster(userTeamId);
        if (cancelled || !roster || (roster as any[]).length === 0) {
          setLoading(false);
          return;
        }

        const players = roster as any[];

        // ── Team aggregates ──────────────────────────────
        let totalH = 0, totalAB = 0, totalHR = 0;
        let totalER = 0, totalIP = 0, totalSO = 0;

        for (const p of players) {
          const s = p.stats;
          if (!s) continue;
          if (!p.isPitcher) {
            totalH += s.h ?? 0;
            totalAB += s.ab ?? 0;
            totalHR += s.hr ?? 0;
          } else {
            totalER += s.er ?? 0;
            totalIP += s.ip ?? 0;
            totalSO += s.so ?? s.k ?? 0;
          }
        }

        const teamBA = totalAB > 0 ? (totalH / totalAB).toFixed(3) : '.000';
        const teamERA = totalIP > 0 ? ((totalER * 9) / totalIP).toFixed(2) : '0.00';

        if (!cancelled) {
          setAggs({ teamBA, teamERA, teamHR: totalHR, teamSO: totalSO });
        }

        // ── Top hitter by OPS ────────────────────────────
        let bestHitter: any = null;
        let bestOPS = -1;
        for (const p of players) {
          if (p.isPitcher) continue;
          const s = p.stats;
          if (!s || (s.ab ?? 0) < 20) continue;
          const ops = (s.obp ?? 0) + (s.slg ?? 0);
          const opsNum = typeof ops === 'string' ? parseFloat(ops) : ops;
          if (opsNum > bestOPS) {
            bestOPS = opsNum;
            bestHitter = p;
          }
        }

        if (bestHitter && !cancelled) {
          const s = bestHitter.stats;
          const ops = ((s.obp ?? 0) + (s.slg ?? 0));
          const opsStr = typeof ops === 'number' ? ops.toFixed(3) : String(ops);
          setTopHitter({
            name: bestHitter.name,
            position: bestHitter.position ?? 'UT',
            stat: opsStr,
            statLabel: 'OPS',
            secondaryStat: `${s.hr ?? 0} HR · ${s.rbi ?? 0} RBI`,
            secondaryLabel: '',
            playerId: bestHitter.playerId,
          });
        }

        // ── Top pitcher by ERA (min 10 IP) ───────────────
        let bestPitcher: any = null;
        let bestERA = 999;
        for (const p of players) {
          if (!p.isPitcher) continue;
          const s = p.stats;
          if (!s || (s.ip ?? 0) < 10) continue;
          const era = typeof s.era === 'string' ? parseFloat(s.era) : (s.era ?? 99);
          if (era < bestERA) {
            bestERA = era;
            bestPitcher = p;
          }
        }

        if (bestPitcher && !cancelled) {
          const s = bestPitcher.stats;
          const era = typeof s.era === 'number' ? s.era.toFixed(2) : String(s.era ?? '0.00');
          setTopPitcher({
            name: bestPitcher.name,
            position: bestPitcher.position ?? 'SP',
            stat: era,
            statLabel: 'ERA',
            secondaryStat: `${s.wins ?? s.w ?? 0}-${s.losses ?? s.l ?? 0} · ${s.so ?? s.k ?? 0} K`,
            secondaryLabel: '',
            playerId: bestPitcher.playerId,
          });
        }
      } catch { /* engine not ready */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userTeamId, season, gamePhase, isSimulating]);

  // Don't show if no data
  if (loading || (!topHitter && !topPitcher && !aggs)) return null;

  const handlePlayerClick = (playerId: number) => {
    setSelectedPlayer(playerId);
    navigate('team', 'player');
  };

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>TEAM LEADERS</span>
        <span className="text-gray-500 font-normal text-[10px]">S{season}</span>
      </div>

      {/* Team aggregate bar */}
      {aggs && (
        <div className="grid grid-cols-4 gap-px bg-gray-800">
          <AggCell label="TEAM AVG" value={aggs.teamBA} />
          <AggCell label="TEAM ERA" value={aggs.teamERA} />
          <AggCell label="HR" value={String(aggs.teamHR)} />
          <AggCell label="K" value={String(aggs.teamSO)} />
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-gray-800">
        {/* Top Hitter */}
        <div className="px-4 py-3">
          <div className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">TOP HITTER</div>
          {topHitter ? (
            <button
              onClick={() => handlePlayerClick(topHitter.playerId)}
              className="text-left w-full hover:bg-gray-800/50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <div className="text-xs font-bold text-gray-200 truncate">
                {topHitter.name}
                <span className="text-gray-500 font-normal ml-1">{topHitter.position}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-orange-400 tabular-nums">{topHitter.stat}</span>
                <span className="text-[9px] text-gray-500 font-bold">{topHitter.statLabel}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">{topHitter.secondaryStat}</div>
            </button>
          ) : (
            <div className="text-gray-500 text-xs italic">No qualifying hitters</div>
          )}
        </div>

        {/* Top Pitcher */}
        <div className="px-4 py-3">
          <div className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">TOP PITCHER</div>
          {topPitcher ? (
            <button
              onClick={() => handlePlayerClick(topPitcher.playerId)}
              className="text-left w-full hover:bg-gray-800/50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <div className="text-xs font-bold text-gray-200 truncate">
                {topPitcher.name}
                <span className="text-gray-500 font-normal ml-1">{topPitcher.position}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-green-400 tabular-nums">{topPitcher.stat}</span>
                <span className="text-[9px] text-gray-500 font-bold">{topPitcher.statLabel}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">{topPitcher.secondaryStat}</div>
            </button>
          ) : (
            <div className="text-gray-500 text-xs italic">No qualifying pitchers</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AggCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 px-3 py-1.5 text-center">
      <div className="text-[8px] text-gray-500 font-bold tracking-widest">{label}</div>
      <div className="text-sm font-bold text-gray-300 tabular-nums">{value}</div>
    </div>
  );
}
