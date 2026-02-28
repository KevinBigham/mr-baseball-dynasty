/**
 * Platoon advantage K-rate modifier.
 *
 * Same-side matchups (LHP vs LHB, RHP vs RHB) favor the pitcher —
 * breaking balls move away from the batter's swing plane, generating
 * more whiffs. Opposite-side matchups favor the hitter with better
 * pitch visibility and breaking ball movement toward their barrel.
 *
 * Effect: ±1% K rate based on platoon matchup.
 * Switch hitters always count as favorable matchup for the hitter.
 * No PRNG consumption — deterministic from handedness.
 */

import type { BatSide, ThrowSide } from '../../types/player';

/**
 * Compute K-rate multiplier from platoon matchup.
 *
 * @param pitcherThrows Pitcher's throwing hand ('L' or 'R')
 * @param batterBats Batter's batting side ('L', 'R', or 'S' for switch)
 * @returns K rate multiplier (0.99 to 1.01)
 */
export function getPlatoonKMod(pitcherThrows: ThrowSide, batterBats: BatSide): number {
  // Switch hitters neutralize the platoon advantage
  if (batterBats === 'S') return 1.0;

  // Same-side: pitcher advantage → more K's
  if (
    (pitcherThrows === 'L' && batterBats === 'L') ||
    (pitcherThrows === 'R' && batterBats === 'R')
  ) {
    return 1.01;
  }

  // Opposite-side: no K modifier (handled by platoon split in contact)
  return 1.0;
}
