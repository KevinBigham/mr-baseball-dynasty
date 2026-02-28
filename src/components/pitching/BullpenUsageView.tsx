import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  AVAILABILITY_DISPLAY,
  ROLE_DISPLAY,
  generateDemoBullpen,
  getBullpenSummary,
  type BullpenArm,
} from '../../engine/pitching/bullpenUsage';

function ArmCard({ arm }: { arm: BullpenArm }) {
  const avail = AVAILABILITY_DISPLAY[arm.availability];
  const roleInfo = ROLE_DISPLAY[arm.role];
  const ovrColor = arm.overall >= 82 ? '#22c55e' : arm.overall >= 72 ? '#eab308' : '#94a3b8';
  const eraColor = arm.era <= 2.50 ? '#22c55e' : arm.era <= 3.50 ? '#3b82f6' : arm.era <= 4.50 ? '#eab308' : '#ef4444';
  const irPct = arm.inheritedRunnersTotal > 0 ? Math.round((arm.inheritedRunnersScored / arm.inheritedRunnersTotal) * 100) : 0;

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {arm.overall}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{arm.name}</span>
                <span className="text-gray-600 text-[10px]">({arm.hand}HP)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold" style={{ color: roleInfo.color }}>{roleInfo.label}</span>
              </div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: avail.color + '22', color: avail.color }}>
            {avail.emoji} {avail.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">ERA</div>
            <div className="font-bold tabular-nums" style={{ color: eraColor }}>{arm.era.toFixed(2)}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">WHIP</div>
            <div className="text-gray-300 font-bold tabular-nums">{arm.whip.toFixed(2)}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">K/9</div>
            <div className="text-gray-300 font-bold tabular-nums">{arm.kPer9.toFixed(1)}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">SV/HLD</div>
            <div className="text-gray-300 font-bold tabular-nums">{arm.saves}/{arm.holds}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">AVG LI</div>
            <div className="text-gray-300 font-bold tabular-nums">{arm.leverageIndex.toFixed(1)}</div>
          </div>
        </div>

        {/* Workload info */}
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-gray-600">Rest: <span className="text-gray-300 font-bold">{arm.daysRest}d</span></span>
          <span className="text-gray-600">Last 3d: <span className="text-gray-300 font-bold">{arm.pitchesLast3Days}p</span></span>
          <span className="text-gray-600">App: <span className="text-gray-300 font-bold">{arm.appearances}</span></span>
          <span className="text-gray-600">IP: <span className="text-gray-300 font-bold">{arm.inningsPitched}</span></span>
          <span className="text-gray-600">IR%: <span className="font-bold" style={{ color: irPct <= 25 ? '#22c55e' : '#ef4444' }}>{irPct}%</span></span>
        </div>
      </div>
    </div>
  );
}

export default function BullpenUsageView() {
  const { gameStarted } = useGameStore();
  const [arms] = useState<BullpenArm[]>(() => generateDemoBullpen());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getBullpenSummary(arms);

  // Sort by role priority: closer, setup, high_leverage, lefty, middle, long, mop_up
  const roleOrder: Record<string, number> = { closer: 0, setup: 1, high_leverage: 2, lefty_specialist: 3, middle: 4, long: 5, mop_up: 6 };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>BULLPEN USAGE TRACKER</span>
        <span className="text-gray-600 text-[10px]">{summary.totalArms} RELIEVERS</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RESTED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.fullyRested}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVAILABLE</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.available}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LIMITED</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.limited}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UNAVAIL</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.unavailable}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM ERA</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.avgEra <= 3.00 ? '#22c55e' : summary.avgEra <= 4.00 ? '#eab308' : '#ef4444' }}>
            {summary.avgEra.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {arms.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]).map(a => (
          <ArmCard key={a.id} arm={a} />
        ))}
      </div>
    </div>
  );
}
