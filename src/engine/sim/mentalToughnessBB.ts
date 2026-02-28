/**
 * Pitcher mental toughness BB modifier.
 *
 * Mentally tough pitchers stay composed in high-leverage situations,
 * attacking the zone instead of nibbling. This reduces walk rate
 * in clutch spots. Conversely, pitchers with low mental toughness
 * tend to overthrow or lose the strike zone under pressure.
 *
 * Effect: up to ±1% BB rate based on mental toughness + leverage.
 * No PRNG consumption — deterministic from attributes.
 */

import type { Player } from '../../types/player';

/**
 * Compute BB-rate multiplier from pitcher mental toughness.
 *
 * @param pitcher The pitcher
 * @param leverageIndex Current leverage index (1.0 = average)
 * @returns BB rate multiplier (0.99 to 1.01)
 */
export function getMentalToughnessBBMod(pitcher: Player, leverageIndex: number): number {
  // Only applies in above-average leverage situations
  if (leverageIndex <= 1.0) return 1.0;

  const mt = pitcher.pitcherAttributes?.mentalToughness ?? 50;
  const liScale = Math.min(1, (leverageIndex - 1.0) / 1.5); // 0 to 1

  // Above-average mental toughness (> 55): fewer walks under pressure
  if (mt > 55) {
    const mtScale = Math.min(1, (mt - 55) / 45); // 0 to 1
    return 1.0 - mtScale * liScale * 0.01;
  }

  // Below-average mental toughness (< 45): more walks under pressure
  if (mt < 45) {
    const mtScale = Math.min(1, (45 - mt) / 45); // 0 to 1
    return 1.0 + mtScale * liScale * 0.01;
  }

  return 1.0;
}
