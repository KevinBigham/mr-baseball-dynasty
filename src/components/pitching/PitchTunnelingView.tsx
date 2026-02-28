import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  TUNNEL_GRADE_DISPLAY,
  PITCH_LABELS,
  generateDemoTunneling,
  getTunnelSummary,
  type TunnelingPitcher,
  type PitchPair,
} from '../../engine/pitching/pitchTunneling';

function PairBadge({ pair }: { pair: PitchPair }) {
  const gradeInfo = TUNNEL_GRADE_DISPLAY[pair.tunnelGrade];
  const p1 = PITCH_LABELS[pair.pitch1];
  const p2 = PITCH_LABELS[pair.pitch2];

  return (
    <div className="bloomberg-border px-2 py-1">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[9px] font-bold" style={{ color: p1.color }}>{p1.name}</span>
        <span className="text-gray-600 text-[9px]">+</span>
        <span className="text-[9px] font-bold" style={{ color: p2.color }}>{p2.name}</span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-bold tabular-nums" style={{ color: gradeInfo.color }}>{pair.tunnelScore}</span>
        <span className="text-gray-500">{pair.separationInches}&quot; sep</span>
        <span className="text-gray-400">{pair.whiffRateOnPair}% whiff</span>
      </div>
    </div>
  );
}

function PitcherCard({ pitcher }: { pitcher: TunnelingPitcher }) {
  const gradeInfo = TUNNEL_GRADE_DISPLAY[pitcher.overallGrade];
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
              <div className="flex items-center gap-1">
                {pitcher.pitches.map(p => (
                  <span key={p} className="text-[9px] font-bold" style={{ color: PITCH_LABELS[p].color }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="font-bold text-lg tabular-nums" style={{ color: gradeInfo.color }}>
                {pitcher.overallTunnelScore}
              </div>
              <div className="text-gray-600 text-[9px]">TUNNEL</div>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ backgroundColor: gradeInfo.color + '22', color: gradeInfo.color }}>
              {gradeInfo.label}
            </span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">WHIFF%</div>
            <div className="text-gray-300 font-bold tabular-nums">{pitcher.whiffRate}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">CHASE%</div>
            <div className="text-gray-300 font-bold tabular-nums">{pitcher.chaseRate}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">DECEPTION</div>
            <div className="font-bold tabular-nums" style={{ color: pitcher.deceptionIndex >= 80 ? '#22c55e' : pitcher.deceptionIndex >= 65 ? '#eab308' : '#94a3b8' }}>
              {pitcher.deceptionIndex}
            </div>
          </div>
        </div>

        {/* Pitch pairs */}
        <div className="text-[9px] text-gray-500 mb-1">PITCH PAIRS (tunnel score)</div>
        <div className="grid grid-cols-2 gap-1">
          {pitcher.allPairs.sort((a, b) => b.tunnelScore - a.tunnelScore).map((pair, i) => (
            <PairBadge key={i} pair={pair} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PitchTunnelingView() {
  const { gameStarted } = useGameStore();
  const [pitchers] = useState<TunnelingPitcher[]>(() => generateDemoTunneling());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getTunnelSummary(pitchers);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PITCH TUNNELING ANALYTICS</span>
        <span className="text-gray-600 text-[10px]">DECEPTION METRICS</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG TUNNEL</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgTunnelScore}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ELITE</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.eliteCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLUS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.plusCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG WHIFF%</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.avgWhiffRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {pitchers.sort((a, b) => b.overallTunnelScore - a.overallTunnelScore).map(p => (
          <PitcherCard key={p.id} pitcher={p} />
        ))}
      </div>
    </div>
  );
}
