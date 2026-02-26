/**
 * ReputationCard.tsx — Franchise Reputation Score
 *
 * Displays a multi-dimensional legacy grade computed from franchise history.
 * Four dimensions (25 pts each): Winning, October, Development, Longevity.
 */

import { useLeagueStore } from '../../store/leagueStore';
import { computeReputation } from '../../engine/reputation';

export default function ReputationCard() {
  const history = useLeagueStore(s => s.franchiseHistory);

  // Need at least 2 seasons to show meaningful reputation
  if (history.length < 2) return null;

  const rep = computeReputation(history);
  if (!rep) return null;

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Header */}
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>FRANCHISE REPUTATION</span>
        <span className="text-gray-600 text-xs normal-case font-normal">
          {history.length} season{history.length !== 1 ? 's' : ''} evaluated
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">

        {/* Top row: grade + flavor */}
        <div className="flex items-start gap-4">
          {/* Grade */}
          <div
            className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl"
            style={{
              background: `${rep.gradeColor}15`,
              border:     `2px solid ${rep.gradeColor}40`,
              color:      rep.gradeColor,
            }}
          >
            {rep.grade}
          </div>

          {/* Flavor */}
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm" style={{ color: rep.gradeColor }}>
              {rep.flavor}
            </div>
            <div className="text-gray-500 text-xs mt-0.5 leading-snug">{rep.flavorDesc}</div>
            <div className="mt-1.5">
              <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${rep.overall}%`, background: rep.gradeColor }}
                />
              </div>
              <div className="text-gray-700 text-xs mt-0.5 tabular-nums">
                {rep.overall}/100
              </div>
            </div>
          </div>
        </div>

        {/* Four dimensions */}
        <div className="grid grid-cols-4 gap-2">
          {rep.dimensions.map(dim => (
            <div key={dim.label} className="bloomberg-border bg-gray-900 px-2 py-2">
              <div className="text-gray-600 text-xs">{dim.label}</div>
              <div className="font-black tabular-nums text-lg" style={{ color: dim.color }}>
                {dim.score}
                <span className="text-gray-700 font-normal text-xs">/{dim.max}</span>
              </div>
              {/* Mini bar */}
              <div className="h-1 rounded-full bg-gray-800 overflow-hidden mt-1">
                <div
                  className="h-full rounded-full"
                  style={{
                    width:      `${(dim.score / dim.max) * 100}%`,
                    background: dim.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
