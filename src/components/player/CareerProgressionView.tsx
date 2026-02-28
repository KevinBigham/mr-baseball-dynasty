import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  PHASE_DISPLAY,
  generateDemoProgressions,
  getProgressionSummary,
  type ProgressionPlayer,
} from '../../engine/player/careerProgression';

function PlayerCard({ player }: { player: ProgressionPlayer }) {
  const phaseInfo = PHASE_DISPLAY[player.phase];
  const ovrColor = player.currentOvr >= 85 ? '#22c55e' : player.currentOvr >= 75 ? '#eab308' : '#94a3b8';
  const changeColor = player.ovrChangeLast3 > 0 ? '#22c55e' : player.ovrChangeLast3 < 0 ? '#ef4444' : '#6b7280';
  const trendEmoji = player.warTrend === 'up' ? '📈' : player.warTrend === 'down' ? '📉' : '➡️';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {player.currentOvr}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{player.name}</span>
                <span>{trendEmoji}</span>
              </div>
              <div className="text-gray-600 text-[10px]">{player.pos} | Age {player.age}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: phaseInfo.color + '22', color: phaseInfo.color }}>
            {phaseInfo.emoji} {phaseInfo.label}
          </span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-5 gap-1 text-[10px] mb-2">
          <div className="bloomberg-border px-1 py-1 text-center">
            <div className="text-gray-600">PEAK</div>
            <div className="text-gray-300 font-bold tabular-nums">{player.peakOvr}</div>
          </div>
          <div className="bloomberg-border px-1 py-1 text-center">
            <div className="text-gray-600">3YR CHG</div>
            <div className="font-bold tabular-nums" style={{ color: changeColor }}>
              {player.ovrChangeLast3 > 0 ? '+' : ''}{player.ovrChangeLast3}
            </div>
          </div>
          <div className="bloomberg-border px-1 py-1 text-center">
            <div className="text-gray-600">PROJ</div>
            <div className="text-blue-400 font-bold tabular-nums">{player.projectedOvrNext}</div>
          </div>
          <div className="bloomberg-border px-1 py-1 text-center">
            <div className="text-gray-600">CEIL</div>
            <div className="text-green-400 font-bold tabular-nums">{player.ceilingOvr}</div>
          </div>
          <div className="bloomberg-border px-1 py-1 text-center">
            <div className="text-gray-600">FLOOR</div>
            <div className="text-red-400 font-bold tabular-nums">{player.floorOvr}</div>
          </div>
        </div>

        {/* Season history */}
        <div className="space-y-0.5">
          {player.careerSeasons.map(s => (
            <div key={s.year} className="flex items-center gap-2 text-[9px]">
              <span className="text-gray-500 w-8">{s.year}</span>
              <span className="text-gray-600 w-6">({s.age})</span>
              <span className="font-bold tabular-nums w-6" style={{ color: s.overall >= 85 ? '#22c55e' : s.overall >= 75 ? '#eab308' : '#94a3b8' }}>{s.overall}</span>
              <span className="text-gray-400 tabular-nums w-8">{s.war} WAR</span>
              <span className="text-gray-500 flex-1 truncate">{s.keyStats}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CareerProgressionView() {
  const { gameStarted } = useGameStore();
  const [players] = useState<ProgressionPlayer[]>(() => generateDemoProgressions());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getProgressionSummary(players);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CAREER PROGRESSION TRACKER</span>
        <span className="text-gray-600 text-[10px]">DEVELOPMENT CURVES</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RISING</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.risingStars}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AT PEAK</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.peakPlayers}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DECLINING</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.decliningPlayers}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG AGE</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgAge}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {players.sort((a, b) => b.ovrChangeLast3 - a.ovrChangeLast3).map(p => (
          <PlayerCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
