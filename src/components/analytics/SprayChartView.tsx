import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ZONE_DISPLAY,
  generateDemoSprayCharts,
  getSpraySummary,
  type SprayChartPlayer,
} from '../../engine/analytics/sprayChart';

function PlayerCard({ player }: { player: SprayChartPlayer }) {
  const ovrColor = player.overall >= 85 ? '#22c55e' : player.overall >= 75 ? '#eab308' : '#94a3b8';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.overall}
            </div>
            <div>
              <span className="text-orange-300 font-bold text-sm">{player.name}</span>
              <span className="text-gray-600 text-[10px] ml-1">{player.pos} ({player.hand})</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400">{player.totalBIP} BIP</div>
        </div>

        {/* Direction summary */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">PULL</div>
            <div className="text-red-400 font-bold tabular-nums">{player.pullPct}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">CENTER</div>
            <div className="text-green-400 font-bold tabular-nums">{player.centerPct}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">OPPO</div>
            <div className="text-blue-400 font-bold tabular-nums">{player.oppoPct}%</div>
          </div>
        </div>

        {/* Zone breakdown */}
        <div className="space-y-0.5">
          {player.zones.map(z => {
            const zInfo = ZONE_DISPLAY[z.zone];
            return (
              <div key={z.zone} className="flex items-center gap-2 text-[9px]">
                <span className="w-6 font-bold" style={{ color: zInfo.color }}>{zInfo.abbr}</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${z.pct}%`, backgroundColor: zInfo.color }} />
                </div>
                <span className="text-gray-400 tabular-nums w-8 text-right">{z.pct.toFixed(0)}%</span>
                <span className="text-gray-600 tabular-nums w-10">{z.avg.toFixed(3)}</span>
                <span className="text-gray-500 tabular-nums w-6">{z.hr}HR</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <span className="text-gray-600">EV: <span className="text-gray-300 font-bold">{player.avgExitVelo}</span></span>
          <span className="text-gray-600">HH%: <span className="text-gray-300 font-bold">{player.hardHitRate}%</span></span>
        </div>
      </div>
    </div>
  );
}

export default function SprayChartView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<SprayChartPlayer[]>(() => generateDemoSprayCharts());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getSpraySummary(players);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SPRAY CHART ANALYSIS</span>
        <span className="text-gray-600 text-[10px]">BATTED BALL DISTRIBUTION</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM PULL%</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.teamPullPct}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM CTR%</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.teamCenterPct}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM OPPO%</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.teamOppoPct}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM HH%</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.teamHardHitRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {players.map(p => (
          <PlayerCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
