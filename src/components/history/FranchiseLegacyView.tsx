import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  LEGACY_TIERS,
  calcLegacyScore,
  getLegacyTier,
  type LegacyStats,
  type LegacyTier,
  type LegacyResult,
} from '../../engine/history/franchiseLegacy';

function TierBadge({ tier }: { tier: LegacyTier }) {
  const info = LEGACY_TIERS[tier];
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-gray-500 w-20 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-gray-300 font-bold tabular-nums w-8">{value.toFixed(1)}</span>
    </div>
  );
}

// Demo data
const DEMO_STATS: LegacyStats = {
  seasons: 8,
  games: 1296,
  wins: 720,
  losses: 576,
  rings: 2,
  playoffs: 5,
  pennants: 3,
  draftHits: 4,
  devSuccesses: 12,
  capMastery: 3,
  neverTanked: true,
  firedManager: false,
};

export default function FranchiseLegacyView() {
  const { gameStarted } = useGameStore();
  const [stats] = useState<LegacyStats>(DEMO_STATS);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const result = calcLegacyScore(stats);
  const tierInfo = LEGACY_TIERS[result.tier];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>FRANCHISE LEGACY</span>
        <TierBadge tier={result.tier} />
      </div>

      {/* Big score */}
      <div className="bloomberg-border px-6 py-6 text-center">
        <div className="text-gray-500 text-[10px] mb-1">LEGACY SCORE</div>
        <div className="text-6xl font-bold tabular-nums mb-2" style={{ color: tierInfo.color }}>
          {result.score}
        </div>
        <div className="text-gray-400 text-xs mb-1">{tierInfo.desc}</div>
        <div className="text-gray-600 text-[10px]">
          {stats.seasons} seasons | {stats.wins}W-{stats.losses}L ({(result.winPct * 100).toFixed(1)}%)
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-6 gap-2">
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RINGS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{stats.rings}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PENNANTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{stats.pennants}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLAYOFFS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{stats.playoffs}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DRAFT HITS</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{stats.draftHits}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DEV WINS</div>
          <div className="text-purple-400 font-bold text-xl tabular-nums">{stats.devSuccesses}</div>
        </div>
        <div className="bloomberg-border px-2 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SEASONS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{stats.seasons}</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">LEGACY BREAKDOWN</div>
        <div className="p-4 space-y-2">
          <BreakdownBar label="WIN %" value={result.breakdown.winPct} max={25} color="#22c55e" />
          <BreakdownBar label="RINGS" value={result.breakdown.rings} max={25} color="#eab308" />
          <BreakdownBar label="PLAYOFFS" value={result.breakdown.playoffs} max={10} color="#3b82f6" />
          <BreakdownBar label="PENNANTS" value={result.breakdown.pennants} max={8} color="#f97316" />
          <BreakdownBar label="DRAFT" value={result.breakdown.draftHits} max={10} color="#a855f7" />
          <BreakdownBar label="DEV" value={result.breakdown.development} max={7} color="#06b6d4" />
          <BreakdownBar label="FINANCIAL" value={result.breakdown.financial} max={5} color="#10b981" />
          <BreakdownBar label="INTEGRITY" value={result.breakdown.integrity} max={5} color="#84cc16" />
          <BreakdownBar label="LONGEVITY" value={result.breakdown.longevity} max={5} color="#94a3b8" />
          {result.breakdown.dynastyBonus > 0 && (
            <BreakdownBar label="DYNASTY" value={result.breakdown.dynastyBonus} max={10} color="#eab308" />
          )}
          {result.breakdown.eraBonus > 0 && (
            <BreakdownBar label="ERA" value={result.breakdown.eraBonus} max={8} color="#a855f7" />
          )}
          {result.breakdown.firedPenalty < 0 && (
            <BreakdownBar label="FIRED" value={Math.abs(result.breakdown.firedPenalty)} max={15} color="#ef4444" />
          )}
        </div>
      </div>

      {/* Tier reference */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">LEGACY TIERS</div>
        <div className="p-3 grid grid-cols-3 gap-3 text-[10px]">
          {(Object.entries(LEGACY_TIERS) as [LegacyTier, typeof LEGACY_TIERS[LegacyTier]][]).map(([tier, info]) => (
            <div key={tier} className="flex items-start gap-2">
              <span style={{ color: info.color }}>{info.icon}</span>
              <div>
                <div className="font-bold" style={{ color: info.color }}>{info.label} ({info.min}+)</div>
                <div className="text-gray-600">{info.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
