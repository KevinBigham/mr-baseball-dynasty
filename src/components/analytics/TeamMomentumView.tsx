import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  MOMENTUM_DISPLAY,
  generateDemoMomentum,
  type TeamMomentumData,
} from '../../engine/analytics/teamMomentum';

function FactorBar({ factor }: { factor: { name: string; value: number; weight: number; description: string } }) {
  const color = factor.value >= 60 ? '#22c55e' : factor.value >= 30 ? '#eab308' : factor.value >= 0 ? '#f97316' : '#ef4444';
  const barWidth = Math.abs(factor.value);

  return (
    <div className="bloomberg-border px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-300 font-bold text-[10px]">{factor.name}</span>
        <span className="font-bold text-[10px] tabular-nums" style={{ color }}>
          {factor.value > 0 ? '+' : ''}{factor.value}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
        {factor.value >= 0 ? (
          <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: color }} />
        ) : (
          <div className="h-full rounded-full transition-all ml-auto" style={{ width: `${barWidth}%`, backgroundColor: color }} />
        )}
      </div>
      <div className="text-gray-500 text-[9px]">{factor.description}</div>
    </div>
  );
}

export default function TeamMomentumView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<TeamMomentumData>(() => generateDemoMomentum());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const momInfo = MOMENTUM_DISPLAY[data.level];
  const scoreColor = data.overallScore >= 50 ? '#22c55e' : data.overallScore >= 0 ? '#eab308' : '#ef4444';

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TEAM MOMENTUM TRACKER</span>
        <span className="text-gray-600 text-[10px]">VIBES CHECK</span>
      </div>

      {/* Momentum gauge */}
      <div className="bloomberg-border px-6 py-4 text-center">
        <div className="text-3xl font-bold tabular-nums mb-1" style={{ color: scoreColor }}>
          {data.overallScore > 0 ? '+' : ''}{data.overallScore}
        </div>
        <div className="text-lg font-bold mb-2" style={{ color: momInfo.color }}>
          {momInfo.emoji} {momInfo.label}
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative">
          <div className="absolute left-1/2 top-0 w-px h-full bg-gray-600" />
          {data.overallScore >= 0 ? (
            <div className="h-full rounded-full absolute" style={{ left: '50%', width: `${Math.min(50, data.overallScore / 2)}%`, backgroundColor: momInfo.color }} />
          ) : (
            <div className="h-full rounded-full absolute" style={{ right: '50%', width: `${Math.min(50, Math.abs(data.overallScore) / 2)}%`, backgroundColor: momInfo.color }} />
          )}
        </div>
      </div>

      {/* Record boxes */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">STREAK</div>
          <div className="text-green-400 font-bold text-xl">{data.currentStreak}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LAST 5</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{data.last5Record}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LAST 10</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{data.last10Record}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LAST 20</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{data.last20Record}</div>
        </div>
      </div>

      {/* Factors */}
      <div>
        <div className="text-orange-400 text-[10px] font-bold mb-2">MOMENTUM FACTORS</div>
        <div className="grid grid-cols-2 gap-2">
          {data.factors.sort((a, b) => b.value - a.value).map((f, i) => (
            <FactorBar key={i} factor={f} />
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div>
        <div className="text-green-400 text-[10px] font-bold mb-2">RECENT HIGHLIGHTS</div>
        <div className="space-y-1">
          {data.recentHighlights.map((h, i) => (
            <div key={i} className="bloomberg-border px-3 py-1.5 text-[10px] text-gray-400">
              {h}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
