import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  GRADE_DISPLAY,
  generateDemoPitchMix,
  getMixSummary,
  type MixPitcher,
  type PitchUsage,
} from '../../engine/pitching/pitchMixOptimizer';

function PitchBar({ pitch }: { pitch: PitchUsage }) {
  const gradeInfo = GRADE_DISPLAY[pitch.grade];
  const diffColor = pitch.usageDiff > 3 ? '#22c55e' : pitch.usageDiff < -3 ? '#ef4444' : '#6b7280';

  return (
    <div className="bloomberg-border px-2 py-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-gray-300 font-bold text-[10px]">{pitch.pitch}</span>
          <span className="text-[9px]" style={{ color: gradeInfo.color }}>{gradeInfo.number}</span>
        </div>
        <span className="text-gray-400 text-[9px]">{pitch.avgVelo} mph</span>
      </div>

      {/* Usage bars */}
      <div className="space-y-0.5 mb-1">
        <div className="flex items-center gap-1 text-[9px]">
          <span className="text-gray-600 w-10">NOW</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${pitch.currentUsage}%` }} />
          </div>
          <span className="text-gray-300 tabular-nums w-8 text-right">{pitch.currentUsage}%</span>
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          <span className="text-gray-600 w-10">OPT</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${pitch.optimalUsage}%` }} />
          </div>
          <span className="text-gray-400 tabular-nums w-8 text-right">{pitch.optimalUsage}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[9px]">
        <span className="text-gray-600">Whiff: <span className="text-gray-300">{pitch.whiffRate}%</span></span>
        <span className="text-gray-600">Chase: <span className="text-gray-300">{pitch.chaseRate}%</span></span>
        <span className="font-bold ml-auto" style={{ color: diffColor }}>
          {pitch.usageDiff > 0 ? '+' : ''}{pitch.usageDiff}%
        </span>
      </div>
    </div>
  );
}

function PitcherCard({ pitcher }: { pitcher: MixPitcher }) {
  const ovrColor = pitcher.overall >= 85 ? '#22c55e' : pitcher.overall >= 75 ? '#eab308' : '#94a3b8';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {pitcher.overall}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{pitcher.name}</span>
                <span className="text-gray-600 text-[10px]">({pitcher.hand}HP)</span>
              </div>
              <div className="text-gray-600 text-[10px]">{pitcher.pitches.length} pitches</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-bold text-lg">{pitcher.overallMixGrade}</div>
            <div className="text-gray-600 text-[9px]">MIX GRADE</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 mb-2">
          {pitcher.pitches.map((p, i) => (
            <PitchBar key={i} pitch={p} />
          ))}
        </div>

        {/* Suggestions */}
        {pitcher.suggestions.length > 0 && (
          <div className="space-y-0.5">
            {pitcher.suggestions.map((s, i) => (
              <div key={i} className="text-[9px] text-gray-400">
                <span className="text-orange-400">TIP:</span> {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PitchMixView() {
  const { gameStarted } = useGameStore();
  const [pitchers] = useState<MixPitcher[]>(() => generateDemoPitchMix());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getMixSummary(pitchers);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PITCH MIX OPTIMIZER</span>
        <span className="text-gray-600 text-[10px]">USAGE ANALYSIS</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG PITCHES</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgPitchCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OVERUSED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.overusedCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UNDERUSED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.underusedCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOP WHIFF</div>
          <div className="text-orange-400 font-bold text-sm">{summary.topWhiffPitch}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {pitchers.map(p => (
          <PitcherCard key={p.id} pitcher={p} />
        ))}
      </div>
    </div>
  );
}
