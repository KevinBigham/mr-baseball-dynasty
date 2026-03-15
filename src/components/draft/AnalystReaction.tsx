/**
 * AnalystReaction — Shows a draft analyst's reaction to the most recent pick.
 * Ported from MFD's DRAFT_ANALYST_993 concept.
 */

import { getAnalystReaction, type ReactionType } from '../../data/draftAnalysts';

interface AnalystReactionProps {
  pickNumber: number;
  round: number;
  playerName: string;
  position: string;
  scoutedOvr: number;
  totalPicks: number;
}

const TYPE_STYLE: Record<ReactionType, { label: string; color: string; bg: string }> = {
  steal: { label: '🔥 STEAL', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
  value: { label: '✓ VALUE', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  reach: { label: '⚠️ REACH', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
  bust: { label: '💀 BUST ALERT', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  solid: { label: '— SOLID', color: '#94a3b8', bg: 'rgba(148,163,184,0.05)' },
};

export default function AnalystReaction({
  pickNumber,
  round,
  playerName,
  position,
  scoutedOvr,
  totalPicks,
}: AnalystReactionProps) {
  const { analyst, reaction, type } = getAnalystReaction(
    pickNumber, round, playerName, position, scoutedOvr, totalPicks,
  );

  const style = TYPE_STYLE[type];

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        background: style.bg,
        border: `1px solid ${style.color}25`,
      }}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: `1px solid ${style.color}15` }}>
        <div className="flex items-center gap-2">
          <span className="text-base">{analyst.emoji}</span>
          <div>
            <span className="text-xs font-bold text-gray-300">{analyst.name}</span>
            <span className="text-gray-500 text-[9px] ml-1.5">{analyst.title}</span>
          </div>
        </div>
        <span
          className="text-[10px] font-black tracking-widest"
          style={{ color: style.color }}
        >
          {style.label}
        </span>
      </div>

      {/* Reaction text */}
      <div className="px-3 py-2">
        <p className="text-gray-400 text-xs leading-relaxed italic">
          &ldquo;{reaction}&rdquo;
        </p>
      </div>
    </div>
  );
}
