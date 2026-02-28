import type { Player } from '../../types/player';

/**
 * Defensive substitution logic.
 *
 * Late in close games, managers swap in better fielders from the bench
 * to protect leads. This replaces weaker-fielding lineup slots with
 * better defensive players.
 */

/**
 * Check if a defensive substitution should be made and return the swap.
 * Returns null if no sub is warranted.
 */
export function selectDefensiveSub(
  lineup: Player[],
  bench: Player[],
  inning: number,
  leadMargin: number,
): { lineupSlot: number; replacement: Player } | null {
  // Only consider defensive subs in 9th+ inning when leading by 1-2 (very rare)
  if (inning < 9) return null;
  if (leadMargin < 1 || leadMargin > 2) return null;
  if (bench.length === 0) return null;

  // Find the worst fielder in the lineup
  let worstSlot = -1;
  let worstFielding = 999;
  for (let i = 0; i < lineup.length; i++) {
    const p = lineup[i];
    if (!p) continue;
    const fielding = p.hitterAttributes?.fielding ?? 400;
    if (fielding < worstFielding) {
      worstFielding = fielding;
      worstSlot = i;
    }
  }

  if (worstSlot < 0) return null;

  // Need the worst fielder to be really poor (< 300) — only swap clearly bad defenders
  if (worstFielding >= 300) return null;

  // Find the best fielder on the bench
  let bestBench: Player | null = null;
  let bestBenchFielding = 0;
  for (const p of bench) {
    const fielding = p.hitterAttributes?.fielding ?? 0;
    if (fielding > bestBenchFielding) {
      bestBenchFielding = fielding;
      bestBench = p;
    }
  }

  if (!bestBench) return null;

  // Only sub if the bench player is significantly better defensively (80+ points)
  if (bestBenchFielding - worstFielding < 80) return null;

  return { lineupSlot: worstSlot, replacement: bestBench };
}
