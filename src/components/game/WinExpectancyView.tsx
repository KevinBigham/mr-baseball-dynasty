import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  BASE_STATE_DISPLAY,
  calcWinExpectancy,
  generateDemoTimeline,
  generateDemoSituation,
  type WETimelinePoint,
  type GameSituation,
} from '../../engine/game/winExpectancy';

function SituationPanel({ situation }: { situation: GameSituation }) {
  const we = calcWinExpectancy(situation);
  const exciteColor = we.excitement === 'extreme' ? '#ef4444' : we.excitement === 'high' ? '#f97316' : we.excitement === 'medium' ? '#eab308' : '#22c55e';
  const wpColor = we.winProbability >= 60 ? '#22c55e' : we.winProbability >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="bloomberg-border px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-orange-300 font-bold text-sm">CURRENT SITUATION</div>
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ backgroundColor: exciteColor + '22', color: exciteColor }}>
          {we.excitement.toUpperCase()} LEVERAGE
        </span>
      </div>

      <div className="text-gray-400 text-xs mb-3">{we.situation}</div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-600 text-[10px]">WIN PROB</div>
          <div className="font-bold text-2xl tabular-nums" style={{ color: wpColor }}>{we.winProbability}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-600 text-[10px]">LEVERAGE</div>
          <div className="font-bold text-2xl tabular-nums" style={{ color: exciteColor }}>{we.leverageIndex.toFixed(2)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-600 text-[10px]">RUN EXPECT</div>
          <div className="text-blue-400 font-bold text-2xl tabular-nums">{we.runExpectancy.toFixed(2)}</div>
        </div>
      </div>

      {/* Base state display */}
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-gray-600 font-bold">BASES:</span>
        <span className="text-gray-300">{BASE_STATE_DISPLAY[situation.baseState].emoji} {BASE_STATE_DISPLAY[situation.baseState].label}</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-300">{situation.outs} out</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-300">{situation.isTopHalf ? 'Top' : 'Bot'} {situation.inning}</span>
      </div>
    </div>
  );
}

function TimelineRow({ point }: { point: WETimelinePoint }) {
  const liColor = point.leverageIndex >= 2.5 ? '#ef4444' : point.leverageIndex >= 1.5 ? '#f97316' : point.leverageIndex >= 0.8 ? '#eab308' : '#22c55e';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800/30 text-[10px] border-b border-gray-800/50">
      <span className="text-gray-600 w-10 tabular-nums">{point.half === 'top' ? 'T' : 'B'}{point.inning}</span>
      <span className="text-gray-300 flex-1">{point.event}</span>
      <span className="text-green-400 w-12 text-right tabular-nums font-bold">{point.homeWP}%</span>
      <span className="text-red-400 w-12 text-right tabular-nums font-bold">{point.awayWP}%</span>
      <span className="w-10 text-right tabular-nums font-bold" style={{ color: liColor }}>{point.leverageIndex.toFixed(1)}</span>
    </div>
  );
}

export default function WinExpectancyView() {
  const { gameStarted } = useGameStore();
  const [situation] = useState(() => generateDemoSituation());
  const [timeline] = useState(() => generateDemoTimeline());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const we = calcWinExpectancy(situation);
  const maxLI = Math.max(...timeline.map(p => p.leverageIndex));
  const highLeveragePlays = timeline.filter(p => p.leverageIndex >= 1.5).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>WIN EXPECTANCY</span>
        <span className="text-gray-600 text-[10px]">HOME {we.winProbability}% — AWAY {100 - we.winProbability}%</span>
      </div>

      <SituationPanel situation={situation} />

      {/* Win probability bar */}
      <div className="bloomberg-border px-4 py-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-green-400 font-bold">HOME {we.winProbability}%</span>
          <span className="text-red-400 font-bold">AWAY {100 - we.winProbability}%</span>
        </div>
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-green-600 transition-all" style={{ width: `${we.winProbability}%` }} />
          <div className="h-full bg-red-600 transition-all" style={{ width: `${100 - we.winProbability}%` }} />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MAX LEVERAGE</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{maxLI.toFixed(2)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HIGH LI PLAYS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{highLeveragePlays}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL EVENTS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{timeline.length}</div>
        </div>
      </div>

      {/* Event timeline */}
      <div className="bloomberg-border">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-gray-600 font-bold border-b border-gray-700">
          <span className="w-10">INN</span>
          <span className="flex-1">EVENT</span>
          <span className="w-12 text-right">HOME</span>
          <span className="w-12 text-right">AWAY</span>
          <span className="w-10 text-right">LI</span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {timeline.map(p => (
            <TimelineRow key={p.id} point={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
