import type { Player } from '../../types/player';

// ─── Pinch-hit decision logic ────────────────────────────────────────────────
// In late innings (7+), the manager may pinch-hit for weak batters when:
//  - Runners are in scoring position or it's a high-leverage spot
//  - A significantly better bench bat is available
//  - The batter is below a quality threshold

/**
 * Compute offensive quality score for a hitter (higher = better).
 * Returns 0 for pitchers with no hitter attributes.
 */
function offensiveQuality(player: Player): number {
  const h = player.hitterAttributes;
  if (!h) return 0;
  return h.contact * 0.35 + h.power * 0.40 + h.eye * 0.25;
}

/**
 * Decide whether to pinch-hit for the current batter.
 * Returns the best bench bat to use, or null if no pinch-hit.
 */
export function selectPinchHitter(
  batter: Player,
  inning: number,
  runners: number,
  outs: number,
  bench: Player[],
  pitcherHand: 'L' | 'R',
): Player | null {
  // Only pinch-hit in 7th inning or later
  if (inning < 7) return null;

  // Need some leverage: runners on or late & close
  const runnersOn = runners !== 0;
  const isHighLeverage = runnersOn || (inning >= 8);
  if (!isHighLeverage) return null;

  // Don't pinch-hit with 2 outs and nobody on (low leverage)
  if (outs >= 2 && !runnersOn) return null;

  // No bench bats available
  if (bench.length === 0) return null;

  const batterQ = offensiveQuality(batter);

  // Only pinch-hit for weak batters (below 370 offensive quality = below avg)
  // Or always consider pinch-hitting pitchers (quality near 0)
  if (batterQ >= 370 && !batter.isPitcher) return null;

  // Find best bench bat, with platoon advantage consideration
  let bestBench: Player | null = null;
  let bestScore = -Infinity;

  for (const benchPlayer of bench) {
    let score = offensiveQuality(benchPlayer);

    // Platoon bonus: if bench bat has advantage vs pitcher hand
    if (benchPlayer.bats !== pitcherHand && benchPlayer.bats !== 'S') {
      score += 15; // Small platoon bonus
    }

    if (score > bestScore) {
      bestScore = score;
      bestBench = benchPlayer;
    }
  }

  if (!bestBench) return null;

  // Only pinch-hit if the bench bat is meaningfully better
  const improvement = bestScore - batterQ;
  if (batter.isPitcher) {
    // Always pinch-hit for pitchers if any bench bat is available
    return bestBench;
  }
  // For position players, need at least 40-point improvement
  if (improvement >= 40) return bestBench;

  return null;
}
