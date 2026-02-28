import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  STATUS_DISPLAY,
  generateDemoRotation,
  generateDemoSchedule,
  getRotationSummary,
  type RotationStarter,
  type ScheduleSlot,
} from '../../engine/pitching/rotationPlanner';

function StarterCard({ starter }: { starter: RotationStarter }) {
  const statusInfo = STATUS_DISPLAY[starter.status];
  const ovrColor = starter.overall >= 85 ? '#22c55e' : starter.overall >= 75 ? '#eab308' : '#94a3b8';
  const eraColor = starter.era <= 3.00 ? '#22c55e' : starter.era <= 3.50 ? '#3b82f6' : starter.era <= 4.00 ? '#eab308' : '#ef4444';
  const fatigueColor = starter.fatigueLevel <= 30 ? '#22c55e' : starter.fatigueLevel <= 55 ? '#eab308' : '#ef4444';
  const gradeColors: Record<string, string> = { A: '#22c55e', B: '#3b82f6', C: '#eab308', D: '#ef4444' };

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {starter.overall}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{starter.name}</span>
                <span className="text-gray-600 text-[10px]">({starter.hand}HP)</span>
              </div>
              <div className="text-gray-600 text-[10px]">{starter.wins}W-{starter.losses}L | {starter.inningsPitched} IP</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: statusInfo.color + '22', color: statusInfo.color }}>
            {statusInfo.emoji} {statusInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">ERA</div>
            <div className="font-bold tabular-nums" style={{ color: eraColor }}>{starter.era.toFixed(2)}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">REST</div>
            <div className="text-gray-300 font-bold tabular-nums">{starter.daysSinceStart}d</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">FATIGUE</div>
            <div className="font-bold tabular-nums" style={{ color: fatigueColor }}>{starter.fatigueLevel}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">LAST PC</div>
            <div className="text-gray-300 font-bold tabular-nums">{starter.pitchCount}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">MATCHUP</div>
            <div className="font-bold" style={{ color: gradeColors[starter.matchupGrade] }}>{starter.matchupGrade}</div>
          </div>
        </div>

        <div className="text-[10px] text-gray-400">
          Next: <span className="text-gray-300 font-bold">{starter.nextStart}</span> vs <span className="text-gray-300">{starter.nextOpponent}</span>
          <span className="text-gray-600 ml-2">(opp avg {starter.nextOppAvg.toFixed(3)} vs {starter.hand}HP)</span>
        </div>
      </div>
    </div>
  );
}

function ScheduleRow({ slot }: { slot: ScheduleSlot }) {
  const statusInfo = STATUS_DISPLAY[slot.status];

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors px-4 py-2 flex items-center gap-3">
      <span className="text-gray-400 text-[10px] font-bold w-12">{slot.date}</span>
      <span className="text-gray-300 text-[10px] w-8">{slot.opponent}</span>
      <span className="text-orange-300 text-[10px] font-bold flex-1">{slot.starterName}</span>
      <span className="px-1 py-0.5 text-[9px] font-bold rounded"
        style={{ backgroundColor: statusInfo.color + '22', color: statusInfo.color }}>
        {statusInfo.emoji} {statusInfo.label}
      </span>
      {slot.notes && <span className="text-gray-600 text-[9px]">{slot.notes}</span>}
    </div>
  );
}

export default function RotationPlannerView() {
  const { gameStarted } = useGameStore();
  const [starters] = useState<RotationStarter[]>(() => generateDemoRotation());
  const [schedule] = useState<ScheduleSlot[]>(() => generateDemoSchedule());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getRotationSummary(starters);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>STARTING ROTATION PLANNER</span>
        <span className="text-gray-600 text-[10px]">{summary.healthyStarters} HEALTHY STARTERS</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ROTATION ERA</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.avgERA <= 3.50 ? '#22c55e' : '#eab308' }}>{summary.avgERA.toFixed(2)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG IP</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgInnings}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">STARTS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.totalStarts}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">QS%</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.qualityStartPct}%</div>
        </div>
      </div>

      {/* Rotation cards */}
      <div>
        <div className="text-orange-400 text-[10px] font-bold mb-2">ROTATION</div>
        <div className="space-y-2">
          {starters.map(s => <StarterCard key={s.id} starter={s} />)}
        </div>
      </div>

      {/* Upcoming schedule */}
      <div>
        <div className="text-blue-400 text-[10px] font-bold mb-2">UPCOMING STARTS</div>
        <div className="space-y-1">
          {schedule.map((s, i) => <ScheduleRow key={i} slot={s} />)}
        </div>
      </div>
    </div>
  );
}
