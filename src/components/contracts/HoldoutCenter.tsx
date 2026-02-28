import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  STAGE_DISPLAY,
  type HoldoutState,
  type HoldoutStage,
  getHoldoutSummary,
} from '../../engine/contracts/holdoutSystem';

function StageBadge({ stage }: { stage: HoldoutStage }) {
  const info = STAGE_DISPLAY[stage];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function StageTimeline({ current }: { current: HoldoutStage }) {
  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as HoldoutStage[]).map(s => {
        const info = STAGE_DISPLAY[s];
        const isActive = s <= current;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
              isActive ? 'border-opacity-100' : 'border-gray-700 opacity-30'
            }`} style={isActive ? { borderColor: info.color, color: info.color } : {}}>
              {s}
            </div>
            {s < 5 && <div className={`w-4 h-0.5 ${isActive ? 'bg-orange-500' : 'bg-gray-800'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function HoldoutCard({ holdout, onResolve }: { holdout: HoldoutState; onResolve: (resolution: string) => void }) {
  const info = STAGE_DISPLAY[holdout.stage];
  return (
    <div className="bloomberg-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border"
              style={{ borderColor: info.color, color: info.color, backgroundColor: info.color + '11' }}>
              {info.icon}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{holdout.playerName}</div>
              <div className="text-gray-600 text-[10px]">{holdout.position} | OVR {holdout.overall}</div>
            </div>
          </div>
          <StageBadge stage={holdout.stage} />
        </div>

        <StageTimeline current={holdout.stage} />

        <div className="grid grid-cols-3 gap-2 text-[10px] mt-3 mb-3">
          <div>
            <div className="text-gray-600">WEEK</div>
            <div className="text-orange-400 font-bold tabular-nums">{holdout.week}</div>
          </div>
          <div>
            <div className="text-gray-600">DEMANDS</div>
            <div className="text-gray-300 uppercase">{holdout.demands}</div>
          </div>
          <div>
            <div className="text-gray-600">SEVERITY</div>
            <div className={`font-bold uppercase ${holdout.severity === 'severe' ? 'text-red-400' : 'text-yellow-400'}`}>
              {holdout.severity}
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-[10px] italic mb-3">
          {info.desc}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onResolve('extend')}
            className="bloomberg-border px-2 py-1.5 text-[10px] font-bold text-green-400 hover:bg-green-900/20 transition-colors">
            EXTEND
          </button>
          <button onClick={() => onResolve('trade')}
            className="bloomberg-border px-2 py-1.5 text-[10px] font-bold text-orange-400 hover:bg-orange-900/20 transition-colors">
            TRADE
          </button>
          <button onClick={() => onResolve('cave')}
            className="bloomberg-border px-2 py-1.5 text-[10px] font-bold text-gray-400 hover:bg-gray-800/30 transition-colors">
            WAIT IT OUT
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo data
const DEMO_HOLDOUTS: HoldoutState[] = [
  { playerId: 1, playerName: 'Marcus Bell', position: 'SS', overall: 82, week: 4, stage: 3, severity: 'severe', demands: 'trade', tradeRequested: true },
  { playerId: 2, playerName: 'James O\'Brien', position: 'SP', overall: 78, week: 1, stage: 1, severity: 'moderate', demands: 'extension', tradeRequested: false },
];

export default function HoldoutCenter() {
  const { gameStarted } = useGameStore();
  const [holdouts, setHoldouts] = useState<HoldoutState[]>(DEMO_HOLDOUTS);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getHoldoutSummary(holdouts);

  const handleResolve = (idx: number, resolution: string) => {
    setHoldouts(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>HOLDOUT CENTER</span>
        {summary.critical > 0 && (
          <span className="text-red-400 text-[10px] animate-pulse">{summary.critical} CRITICAL</span>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ACTIVE</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.total}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CRITICAL</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.critical}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG WEEKS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.avgWeeks}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RESOLVED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">0</div>
        </div>
      </div>

      {/* Holdout cards */}
      <div className="grid grid-cols-2 gap-3">
        {holdouts.map((h, i) => (
          <HoldoutCard key={h.playerId} holdout={h} onResolve={(r) => handleResolve(i, r)} />
        ))}
        {holdouts.length === 0 && (
          <div className="col-span-2 bloomberg-border px-4 py-8 text-center text-gray-600 text-xs">
            No active holdouts. Your players are happy... for now.
          </div>
        )}
      </div>

      {/* Stage guide */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">HOLDOUT STAGES</div>
        <div className="p-3 grid grid-cols-5 gap-3 text-[10px] text-gray-500">
          {([1, 2, 3, 4, 5] as HoldoutStage[]).map(s => {
            const info = STAGE_DISPLAY[s];
            return (
              <div key={s}>
                <div className="font-bold mb-1" style={{ color: info.color }}>
                  {info.icon} STAGE {s}: {info.label}
                </div>
                <div>{info.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
