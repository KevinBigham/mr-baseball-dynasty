import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  CLUTCH_DISPLAY,
  generateDemoClutchPlayers,
  getClutchSummary,
  type ClutchPlayer,
} from '../../engine/analytics/clutchIndex';

function ClutchCard({ player }: { player: ClutchPlayer }) {
  const clutchInfo = CLUTCH_DISPLAY[player.clutchRating];
  const ovrColor = player.overall >= 85 ? '#22c55e' : player.overall >= 75 ? '#eab308' : '#94a3b8';
  const ciColor = player.clutchIndex >= 2 ? '#22c55e' : player.clutchIndex >= 0 ? '#eab308' : '#ef4444';
  const diffColor = player.pressureDiff >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{player.name}</div>
              <div className="text-gray-600 text-[10px]">{player.pos}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="font-bold text-lg tabular-nums" style={{ color: ciColor }}>
                {player.clutchIndex > 0 ? '+' : ''}{player.clutchIndex.toFixed(1)}
              </div>
              <div className="text-gray-600 text-[9px]">CLUTCH IDX</div>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ backgroundColor: clutchInfo.color + '22', color: clutchInfo.color }}>
              {clutchInfo.emoji} {clutchInfo.label}
            </span>
          </div>
        </div>

        {/* Situation splits */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">RISP AVG</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.rispAvg.toFixed(3)}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">RISP OPS</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.rispOps.toFixed(3)}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">LATE&CLOSE</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.lateCloseOps.toFixed(3)}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">WPA</div>
            <div className="font-bold tabular-nums" style={{ color: player.clutchWPA >= 0 ? '#22c55e' : '#ef4444' }}>
              {player.clutchWPA > 0 ? '+' : ''}{player.clutchWPA.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Key stats */}
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-gray-600">RBI w/ RISP: <span className="text-gray-300 font-bold">{player.rbiWithRISP}</span></span>
          <span className="text-gray-600">Go-Ahead: <span className="text-gray-300 font-bold">{player.goAheadRBI}</span></span>
          {player.walkoffHits > 0 && <span className="text-green-400 font-bold">{player.walkoffHits} WALK-OFF</span>}
          <span className="ml-auto text-gray-600">Pressure Diff: <span className="font-bold" style={{ color: diffColor }}>
            {player.pressureDiff > 0 ? '+' : ''}{player.pressureDiff.toFixed(3)}
          </span></span>
        </div>
      </div>
    </div>
  );
}

export default function ClutchIndexView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<ClutchPlayer[]>(() => generateDemoClutchPlayers());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getClutchSummary(players);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CLUTCH PERFORMANCE INDEX</span>
        <span className="text-gray-600 text-[10px]">HIGH-LEVERAGE ANALYSIS</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MR. CLUTCH</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.mrClutchCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CLUTCH</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.clutchCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ICE COLD</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.iceCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM RISP</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.teamRISPAvg.toFixed(3)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">WALK-OFFS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.totalWalkoffs}</div>
        </div>
      </div>

      <div className="space-y-2">
        {players.sort((a, b) => b.clutchIndex - a.clutchIndex).map(p => (
          <ClutchCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
