/**
 * LegacyScoreCard.tsx — Displays Legacy Score prominently on the Dashboard.
 * Shows total score, tier, breakdown, and season-by-season mini-graph.
 */

import { useMemo } from 'react';
import { useLeagueStore } from '../../store/leagueStore';
import { calculateLegacyScore, getLegacyTier } from '../../engine/legacyEngine';
import AnimatedNumber from '../shared/AnimatedNumber';

export default function LegacyScoreCard() {
  const { franchiseHistory } = useLeagueStore();

  const breakdown = useMemo(() => calculateLegacyScore(franchiseHistory), [franchiseHistory]);
  const tier = useMemo(() => getLegacyTier(breakdown.total), [breakdown.total]);

  // Season-by-season cumulative score for mini sparkline
  // Must be called unconditionally to satisfy Rules of Hooks
  const cumulative = useMemo(() => {
    if (franchiseHistory.length === 0) return [];
    const scores: number[] = [];
    const reversed = [...franchiseHistory].reverse();
    for (let i = 0; i < reversed.length; i++) {
      scores.push(calculateLegacyScore(reversed.slice(0, i + 1)).total);
    }
    return scores;
  }, [franchiseHistory]);

  if (franchiseHistory.length === 0) return null;

  const maxScore = Math.max(1, ...cumulative);

  return (
    <div className="bloomberg-border bg-[#0F1930]">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>LEGACY SCORE</span>
        <span
          className="text-[10px] font-bold tracking-widest"
          style={{ color: tier.color }}
        >
          {tier.tier}
        </span>
      </div>
      <div className="px-4 py-3">
        {/* Score display */}
        <div className="flex items-end gap-3 mb-3">
          <AnimatedNumber
            value={breakdown.total}
            className="text-3xl font-black"
            prefix=""
            suffix=""
          />
          <span className="text-gray-500 text-xs mb-1">LEGACY POINTS</span>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'CHAMPIONSHIPS', value: breakdown.championships, color: '#fbbf24' },
            { label: 'PLAYOFFS', value: breakdown.playoffAppearances, color: '#60a5fa' },
            { label: 'WIN %', value: breakdown.winPercentage, color: '#4ade80' },
            { label: 'CONSISTENCY', value: breakdown.consistency, color: '#f97316' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-lg font-bold tabular-nums" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-[8px] text-gray-500 tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Mini sparkline */}
        {cumulative.length > 1 && (
          <div className="flex items-end gap-px h-8" title="Legacy Score over time">
            {cumulative.map((score, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all duration-300"
                style={{
                  height: `${(score / maxScore) * 100}%`,
                  backgroundColor: tier.color,
                  opacity: 0.3 + (i / cumulative.length) * 0.7,
                  minHeight: '2px',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
