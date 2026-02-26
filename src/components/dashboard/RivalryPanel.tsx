/**
 * RivalryPanel.tsx — Division rivalry heat tracker
 *
 * Adapted from Mr. Football Dynasty v98's rivalry system.
 * Shows 4 division rivals with heat bars, tiers, and recent moments.
 */

import { useState } from 'react';
import { useLeagueStore } from '../../store/leagueStore';
import { getRivalTierInfo, type RivalRecord } from '../../engine/rivalry';

// ─── Single rival card ────────────────────────────────────────────────────────

function RivalCard({ rival }: { rival: RivalRecord }) {
  const [expanded, setExpanded] = useState(false);
  const tier    = getRivalTierInfo(rival.tier);
  const heatPct = rival.heat / 15;

  const deltaColor = rival.lastDelta > 0 ? '#f97316' : rival.lastDelta < 0 ? '#60a5fa' : '#6b7280';

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-150"
      style={{ border: `1px solid ${tier.color}33`, background: `${tier.color}08` }}
    >
      {/* Main row */}
      <div
        className="px-3 py-2.5 flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Team abbr */}
        <div
          className="font-black text-sm w-10 shrink-0 tabular-nums text-center"
          style={{ color: tier.color }}
        >
          {rival.rivalAbbr}
        </div>

        {/* Heat bar */}
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-xs truncate pr-2">{rival.rivalName}</div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs">{tier.emoji}</span>
              <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.label}</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-gray-800">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(heatPct * 100)}%`, background: tier.color }}
            />
          </div>
        </div>

        {/* Heat + delta */}
        <div className="text-right shrink-0 min-w-[40px]">
          <div className="font-black text-sm tabular-nums" style={{ color: tier.color }}>
            {rival.heat}<span className="text-gray-600 font-normal text-xs">/15</span>
          </div>
          {rival.lastDelta !== 0 && (
            <div className="text-xs font-bold tabular-nums" style={{ color: deltaColor }}>
              {rival.lastDelta > 0 ? '+' : ''}{rival.lastDelta}
            </div>
          )}
        </div>
      </div>

      {/* Expanded moments */}
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t" style={{ borderColor: `${tier.color}22` }}>
          <div className="text-gray-600 text-xs pt-2">{tier.desc}</div>
          {rival.moments.length > 0 && (
            <div className="space-y-1 mt-1">
              <div className="text-gray-700 text-xs uppercase tracking-widest">Recent Moments</div>
              {rival.moments.map((m, i) => (
                <div key={i} className="text-xs text-gray-400 flex gap-1.5 items-start">
                  <span className="text-gray-700 shrink-0">—</span>
                  <span className="italic">{m}</span>
                </div>
              ))}
            </div>
          )}
          {rival.seasons > 0 && (
            <div className="text-gray-700 text-xs pt-1">
              {rival.seasons} season{rival.seasons !== 1 ? 's' : ''} of rivalry tracked
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function RivalryPanel() {
  const rivals = useLeagueStore(s => s.rivals);

  if (rivals.length === 0) return null;

  const sorted = [...rivals].sort((a, b) => b.heat - a.heat);
  const topTier = getRivalTierInfo(sorted[0].tier);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>DIVISION RIVALS</span>
        <div className="flex items-center gap-1.5 normal-case font-normal text-xs">
          <span>{topTier.emoji}</span>
          <span style={{ color: topTier.color }}>{sorted[0].rivalAbbr} — {topTier.label}</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        {sorted.map(rival => (
          <RivalCard key={rival.rivalTeamId} rival={rival} />
        ))}
        <div className="text-gray-700 text-xs text-center pt-1">
          Heat increases with close finishes, playoff races, and shared October drama
        </div>
      </div>
    </div>
  );
}
