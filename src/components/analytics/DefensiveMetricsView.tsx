import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  DEFENSE_GRADE_DISPLAY,
  generateDemoDefense,
  getDefenseSummary,
  type DefensivePlayer,
} from '../../engine/analytics/defensiveMetrics';

function PlayerRow({ player }: { player: DefensivePlayer }) {
  const gradeInfo = DEFENSE_GRADE_DISPLAY[player.grade];
  const ovrColor = player.overall >= 85 ? '#22c55e' : player.overall >= 75 ? '#eab308' : '#94a3b8';
  const drsColor = player.drs >= 10 ? '#22c55e' : player.drs >= 0 ? '#eab308' : '#ef4444';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
          style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
          {player.overall}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-orange-300 font-bold text-sm">{player.name}</span>
            <span className="text-gray-600 text-[10px]">{player.pos}</span>
          </div>
          <div className="text-gray-600 text-[9px]">DEF: {player.defenseRating} | ARM: {player.armStrength}</div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="text-center">
            <div className="text-gray-600">DRS</div>
            <div className="font-bold tabular-nums" style={{ color: drsColor }}>{player.drs > 0 ? '+' : ''}{player.drs}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">OAA</div>
            <div className="font-bold tabular-nums" style={{ color: player.oaa >= 0 ? '#22c55e' : '#ef4444' }}>{player.oaa > 0 ? '+' : ''}{player.oaa}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">UZR</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.uzr.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">FLD%</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.fieldingPct.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">ERR</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.errors}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">dWAR</div>
            <div className="font-bold tabular-nums" style={{ color: player.defWAR >= 0 ? '#22c55e' : '#ef4444' }}>{player.defWAR.toFixed(1)}</div>
          </div>
        </div>

        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
          style={{ backgroundColor: gradeInfo.color + '22', color: gradeInfo.color }}>
          {gradeInfo.emoji} {gradeInfo.label}
        </span>
      </div>
    </div>
  );
}

export default function DefensiveMetricsView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<DefensivePlayer[]>(() => generateDemoDefense());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getDefenseSummary(players);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>DEFENSIVE METRICS</span>
        <span className="text-gray-600 text-[10px]">DRS / OAA / UZR</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM DRS</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.teamDRS >= 0 ? '#22c55e' : '#ef4444' }}>
            {summary.teamDRS > 0 ? '+' : ''}{summary.teamDRS}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM OAA</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.teamOAA >= 0 ? '#22c55e' : '#ef4444' }}>
            {summary.teamOAA > 0 ? '+' : ''}{summary.teamOAA}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GOLD GLOVE</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.goldGloveCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FLD%</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.teamFieldingPct.toFixed(3)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ERRORS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.teamErrors}</div>
        </div>
      </div>

      <div className="space-y-1">
        {players.sort((a, b) => (b.drs + b.oaa) - (a.drs + a.oaa)).map(p => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
