import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  SLOT_ROLES,
  gradeColor,
  generateDemoLineup,
  analyzeLineup,
  type LineupPlayer,
  type LineupSlot,
} from '../../engine/analytics/lineupOptimizer';

function PlayerRow({ player }: { player: LineupPlayer }) {
  const ovrColor = player.overall >= 85 ? '#22c55e' : player.overall >= 75 ? '#eab308' : '#94a3b8';
  const slotRole = SLOT_ROLES[player.currentSlot];
  const gradeClr = gradeColor(player.slotGrade);

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-2 flex items-center gap-3">
        {/* Slot number */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border"
          style={{ borderColor: slotRole.color, color: slotRole.color, backgroundColor: slotRole.color + '11' }}>
          {player.currentSlot}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-orange-300 font-bold text-sm">{player.name}</span>
            <span className="text-gray-600 text-[10px]">{player.pos}</span>
            <span className="text-gray-600 text-[10px]">({player.hand})</span>
          </div>
          <div className="text-gray-600 text-[9px]">{slotRole.label} — {slotRole.ideal}</div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="text-center">
            <div className="text-gray-600">OBP</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.obp.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">SLG</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.slg.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">OPS</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.ops.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">SPD</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.speed}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">POW</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.power}</div>
          </div>
        </div>

        {/* OVR badge */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
          style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
          {player.overall}
        </div>

        {/* Grade */}
        <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: gradeClr + '22', color: gradeClr }}>
          {player.slotGrade}
        </div>

        {/* Optimal slot indicator */}
        {!player.isOptimal && (
          <div className="text-[9px] text-gray-500">
            → {player.optimalSlot}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LineupOptimizerView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<LineupPlayer[]>(() => generateDemoLineup());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const analysis = analyzeLineup(players);
  const gradeClr = gradeColor(analysis.overallGrade);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>LINEUP OPTIMIZER</span>
        <span className="text-gray-600 text-[10px]">SABERMETRIC ANALYSIS</span>
      </div>

      {/* Analysis summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LINEUP GRADE</div>
          <div className="font-bold text-2xl" style={{ color: gradeClr }}>{analysis.overallGrade}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CURRENT R/G</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{analysis.currentRunsPerGame.toFixed(1)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OPTIMAL R/G</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{analysis.optimalRunsPerGame.toFixed(1)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RUNS GAINED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">+{analysis.runsGained.toFixed(1)}</div>
        </div>
      </div>

      {/* Strengths and weaknesses */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bloomberg-border px-3 py-2">
          <div className="text-green-400 text-[10px] font-bold mb-1">STRENGTHS</div>
          {analysis.strengths.map((s, i) => (
            <div key={i} className="text-gray-400 text-[10px]">+ {s}</div>
          ))}
          {analysis.strengths.length === 0 && <div className="text-gray-600 text-[10px]">None identified</div>}
        </div>
        <div className="bloomberg-border px-3 py-2">
          <div className="text-red-400 text-[10px] font-bold mb-1">WEAK SPOTS</div>
          {analysis.weakSpots.map((w, i) => (
            <div key={i} className="text-gray-400 text-[10px]">- {w}</div>
          ))}
          {analysis.weakSpots.length === 0 && <div className="text-gray-600 text-[10px]">None identified</div>}
        </div>
      </div>

      {/* Lineup */}
      <div>
        <div className="text-orange-400 text-[10px] font-bold mb-2">BATTING ORDER</div>
        <div className="space-y-1">
          {players.sort((a, b) => a.currentSlot - b.currentSlot).map(p => (
            <PlayerRow key={p.id} player={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
