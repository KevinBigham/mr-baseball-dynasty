/**
 * VisionPanel.tsx — Displays conflicting staff opinions on a prospect.
 * Shows 2-3 evaluations from different staff members with varying projections.
 */

import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateVisionOpinions, type StaffOpinion } from '../../engine/visionSystem';
import type { RosterPlayer } from '../../types/league';

interface Props {
  player: RosterPlayer;
}

function ConfidenceDots({ level }: { level: StaffOpinion['confidence'] }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <span className="inline-flex gap-0.5" title={`${level} confidence`}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: i < filled ? '#f97316' : '#374151' }}
        />
      ))}
    </span>
  );
}

export default function VisionPanel({ player }: Props) {
  const { frontOffice, season } = useGameStore();

  const opinions = useMemo(
    () => generateVisionOpinions(
      player.playerId,
      player.overall,
      player.potential,
      player.isPitcher,
      player.age,
      frontOffice,
      season,
    ),
    [player.playerId, player.overall, player.potential, player.isPitcher, player.age, frontOffice, season],
  );

  if (opinions.length === 0) return null;

  return (
    <div className="bloomberg-border bg-[#0F1930]">
      <div className="bloomberg-header px-3 flex items-center justify-between">
        <span>VISION SYSTEM</span>
        <span className="text-gray-500 font-normal text-[10px]">Staff Evaluations</span>
      </div>
      <div className="divide-y divide-[#1E2A4A]">
        {opinions.map((op, i) => (
          <div key={i} className="px-3 py-2.5">
            {/* Staff header */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">{op.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-300">{op.staffName}</div>
                <div className="text-[9px] text-gray-500">{op.staffRole}</div>
              </div>
              <ConfidenceDots level={op.confidence} />
            </div>

            {/* Quote */}
            <div className="text-xs text-gray-400 italic mb-1.5 leading-relaxed">
              "{op.quote}"
            </div>

            {/* Projection */}
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: op.color }}
              >
                {op.projectedGrade}
              </span>
              <span className="text-[9px] text-gray-500">ceiling →</span>
              <span
                className="text-[10px] font-bold"
                style={{ color: op.color }}
              >
                {op.projectedCeiling}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="px-3 py-1.5 border-t border-[#1E2A4A]">
        <div className="text-[8px] text-gray-500 text-center">
          Opinions vary based on staff quality and specialization. Better staff = more accurate projections.
        </div>
      </div>
    </div>
  );
}
