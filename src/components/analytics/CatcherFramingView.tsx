import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  GRADE_DISPLAY,
  generateDemoCatchers,
  type CatcherFramer,
} from '../../engine/analytics/catcherFraming';

function CatcherCard({ catcher }: { catcher: CatcherFramer }) {
  const gradeInfo = GRADE_DISPLAY[catcher.grade];
  const ovrColor = catcher.overall >= 78 ? '#22c55e' : catcher.overall >= 68 ? '#eab308' : '#94a3b8';
  const frColor = catcher.framingRuns >= 8 ? '#22c55e' : catcher.framingRuns >= 0 ? '#eab308' : '#ef4444';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {catcher.overall}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-xs">#{catcher.rank}</span>
                <span className="text-orange-300 font-bold text-sm">{catcher.name}</span>
              </div>
              <div className="text-gray-600 text-[10px]">{catcher.team} | {catcher.gamesStarted} GS | {catcher.inningsCaught} INN</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: gradeInfo.color + '22', color: gradeInfo.color }}>
            {gradeInfo.emoji} {gradeInfo.label}
          </span>
        </div>

        {/* Framing stats */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">FRMG RUNS</div>
            <div className="font-bold tabular-nums" style={{ color: frColor }}>
              {catcher.framingRuns > 0 ? '+' : ''}{catcher.framingRuns.toFixed(1)}
            </div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">STR RATE</div>
            <div className="text-gray-300 tabular-nums">{catcher.strikeRate.toFixed(1)}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">+STRIKES</div>
            <div className="text-green-400 tabular-nums">+{catcher.extraStrikes}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">CSAE</div>
            <div className="tabular-nums" style={{ color: catcher.calledStrikeAboveExpected >= 0 ? '#22c55e' : '#ef4444' }}>
              {catcher.calledStrikeAboveExpected > 0 ? '+' : ''}{catcher.calledStrikeAboveExpected}
            </div>
          </div>
        </div>

        {/* Battery synergy */}
        <div className="flex items-center gap-4 text-[10px]">
          <div>
            <span className="text-gray-600">Best w/ </span>
            <span className="text-green-400 font-bold">{catcher.batteryBest.pitcher}</span>
            <span className="text-gray-500"> ({catcher.batteryBest.synergy})</span>
          </div>
          <div>
            <span className="text-gray-600">Worst w/ </span>
            <span className="text-red-400 font-bold">{catcher.batteryWorst.pitcher}</span>
            <span className="text-gray-500"> ({catcher.batteryWorst.synergy})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatcherFramingView() {
  const { gameStarted } = useGameStore();
  const [catchers] = useState(() => generateDemoCatchers());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const totalFramingRuns = Math.round(catchers.reduce((s, c) => s + c.framingRuns, 0) * 10) / 10;
  const elite = catchers.filter(c => c.grade === 'elite').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CATCHER FRAMING</span>
        <span className="text-gray-600 text-[10px]">{catchers.length} CATCHERS</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL FRM RUNS</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: totalFramingRuns >= 0 ? '#22c55e' : '#ef4444' }}>
            {totalFramingRuns > 0 ? '+' : ''}{totalFramingRuns}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ELITE FRAMERS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{elite}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LG AVG STR%</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">48.0%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TRACKED</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{catchers.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {catchers.map(c => (
          <CatcherCard key={c.id} catcher={c} />
        ))}
      </div>
    </div>
  );
}
