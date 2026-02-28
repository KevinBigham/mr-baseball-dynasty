import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  SHIFT_DISPLAY,
  generateDemoShifts,
  getShiftSummary,
  type ShiftProfile,
} from '../../engine/analytics/defensiveShifts';

function ShiftCard({ profile }: { profile: ShiftProfile }) {
  const shiftInfo = SHIFT_DISPLAY[profile.recommendedShift];
  const currentInfo = SHIFT_DISPLAY[profile.currentShift];
  const effColor = profile.shiftEffectiveness >= 3 ? '#22c55e' : profile.shiftEffectiveness >= 0 ? '#eab308' : '#ef4444';
  const isOptimal = profile.currentShift === profile.recommendedShift;

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-orange-300 font-bold text-sm">{profile.batterName}</div>
            <div className="text-gray-600 text-[10px]">{profile.batterTeam} | Bats {profile.batterHand}</div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: shiftInfo.color + '22', color: shiftInfo.color }}>
            {shiftInfo.emoji} {shiftInfo.label}
          </span>
        </div>

        {/* Spray chart percentages */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">PULL</div>
            <div className="font-bold tabular-nums" style={{ color: profile.pullPct >= 45 ? '#ef4444' : '#94a3b8' }}>{profile.pullPct}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">CENTER</div>
            <div className="text-gray-300 font-bold tabular-nums">{profile.centerPct}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">OPPO</div>
            <div className="font-bold tabular-nums" style={{ color: profile.oppoPct >= 35 ? '#22c55e' : '#94a3b8' }}>{profile.oppoPct}%</div>
          </div>
        </div>

        {/* Batted ball types */}
        <div className="flex items-center gap-3 text-[10px] mb-2">
          <span className="text-gray-600">GB {profile.gbPct}%</span>
          <span className="text-gray-600">FB {profile.fbPct}%</span>
          <span className="text-gray-600">LD {profile.ldPct}%</span>
        </div>

        {/* Effectiveness */}
        <div className="flex items-center justify-between text-[10px] mb-1">
          <div>
            <span className="text-gray-600">Current: </span>
            <span style={{ color: currentInfo.color }}>{currentInfo.emoji} {currentInfo.label}</span>
            {!isOptimal && <span className="text-red-400 ml-1">(NOT OPTIMAL)</span>}
          </div>
          <span className="font-bold tabular-nums" style={{ color: effColor }}>
            {profile.shiftEffectiveness > 0 ? '+' : ''}{profile.shiftEffectiveness} runs
          </span>
        </div>

        {/* wOBA comparison */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-600">wOBA std: <span className="text-gray-300">{profile.wOBAvsStandard.toFixed(3)}</span></span>
          <span className="text-gray-600">wOBA shift: <span className="text-green-400">{profile.wOBAvsShift.toFixed(3)}</span></span>
        </div>
      </div>
    </div>
  );
}

export default function DefensiveShiftsView() {
  const { gameStarted } = useGameStore();
  const [profiles] = useState<ShiftProfile[]>(() => generateDemoShifts());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getShiftSummary(profiles);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>DEFENSIVE POSITIONING</span>
        <span className="text-gray-600 text-[10px]">{profiles.length} PROFILES</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RUNS SAVED</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.totalRunsSaved >= 0 ? '#22c55e' : '#ef4444' }}>
            {summary.totalRunsSaved > 0 ? '+' : ''}{summary.totalRunsSaved}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PULL HEAVY</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.pullHeavy}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OPPO HEAVY</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.oppoHeavy}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG EFF</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.avgEffectiveness >= 0 ? '#22c55e' : '#ef4444' }}>
            {summary.avgEffectiveness > 0 ? '+' : ''}{summary.avgEffectiveness}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {profiles.sort((a, b) => b.shiftEffectiveness - a.shiftEffectiveness).map(p => (
          <ShiftCard key={p.id} profile={p} />
        ))}
      </div>
    </div>
  );
}
