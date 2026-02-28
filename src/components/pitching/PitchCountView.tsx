import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ZONE_DISPLAY,
  generateDemoPitchers,
  type PitcherWorkload,
} from '../../engine/pitching/pitchCount';

function PitcherCard({ pitcher }: { pitcher: PitcherWorkload }) {
  const zoneInfo = ZONE_DISPLAY[pitcher.zone];
  const ovrColor = pitcher.overall >= 85 ? '#22c55e' : pitcher.overall >= 75 ? '#eab308' : '#94a3b8';
  const pcPct = Math.min(100, (pitcher.pitchCount / pitcher.hardLimit) * 100);
  const effColor = pitcher.effectiveness >= 70 ? '#22c55e' : pitcher.effectiveness >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className={`bloomberg-border ${pitcher.zone === 'red' || pitcher.zone === 'danger' ? 'border-red-800/40' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {pitcher.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{pitcher.name}</div>
              <div className="text-gray-600 text-[10px]">{pitcher.lineScore}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: zoneInfo.color + '22', color: zoneInfo.color }}>
            {zoneInfo.label}
          </span>
        </div>

        {/* Pitch count with bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-600">PITCH COUNT</span>
            <span className="tabular-nums font-bold" style={{ color: zoneInfo.color }}>
              {pitcher.pitchCount} / {pitcher.pitchLimit} ({pitcher.hardLimit} max)
            </span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative">
            {/* Soft limit marker */}
            <div className="absolute top-0 h-full w-px bg-yellow-500/50"
              style={{ left: `${(pitcher.pitchLimit / pitcher.hardLimit) * 100}%` }} />
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pcPct}%`, backgroundColor: zoneInfo.color }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div className="text-center">
            <div className="text-gray-600">VELO</div>
            <div className="text-gray-300 tabular-nums">{pitcher.velocityCurrent} mph
              {pitcher.velocityDrop > 0 && <span className="text-red-400 ml-0.5">(-{pitcher.velocityDrop})</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">EFF</div>
            <div className="font-bold tabular-nums" style={{ color: effColor }}>{pitcher.effectiveness}%</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">TTO</div>
            <div className="tabular-nums" style={{ color: pitcher.timesThrough >= 3 ? '#f97316' : '#94a3b8' }}>
              {pitcher.timesThrough}x
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">STR%</div>
            <div className="text-gray-300 tabular-nums">{pitcher.strikeRate}%</div>
          </div>
        </div>

        {/* Performance line */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>{pitcher.ksThrown} K</span>
          <span>{pitcher.hitsAllowed} H</span>
          <span>{pitcher.walksAllowed} BB</span>
          <span>{pitcher.earnedRuns} ER</span>
          <span>{pitcher.hittersRetired} retired</span>
        </div>
      </div>
    </div>
  );
}

export default function PitchCountView() {
  const { gameStarted } = useGameStore();
  const [pitchers] = useState<PitcherWorkload[]>(() => generateDemoPitchers());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const avgPC = Math.round(pitchers.reduce((s, p) => s + p.pitchCount, 0) / pitchers.length);
  const avgEff = Math.round(pitchers.reduce((s, p) => s + p.effectiveness, 0) / pitchers.length);
  const redZone = pitchers.filter(p => p.zone === 'red' || p.zone === 'danger').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PITCH COUNT MANAGEMENT</span>
        <span className="text-gray-600 text-[10px]">{pitchers.length} STARTERS TRACKED</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG PITCH COUNT</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{avgPC}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG EFFECTIVENESS</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: avgEff >= 70 ? '#22c55e' : '#eab308' }}>{avgEff}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">IN RED ZONE</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{redZone}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">STARTERS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{pitchers.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {pitchers.sort((a, b) => b.pitchCount - a.pitchCount).map(p => (
          <PitcherCard key={p.id} pitcher={p} />
        ))}
      </div>
    </div>
  );
}
