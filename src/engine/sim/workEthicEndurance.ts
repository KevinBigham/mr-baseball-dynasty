/**
 * Work ethic endurance modifier.
 *
 * Pitchers with high work ethic maintain effectiveness deeper into
 * games. Their dedication to conditioning translates to a small
 * reduction in effective pitch count — they tire more slowly.
 *
 * Effect: up to -5 effective pitch count for elite work ethic.
 * No PRNG consumption — deterministic from attribute.
 */

import type { Player } from '../../types/player';

/**
 * Compute effective pitch count reduction from work ethic.
 *
 * @param pitcher The pitcher
 * @returns Pitches to subtract from effective pitch count (0 to -5)
 */
export function getWorkEthicPitchReduction(pitcher: Player): number {
  const workEthic = pitcher.workEthic ?? 50;

  // Only above-average work ethic (> 60) provides benefit
  if (workEthic <= 60) return 0;

  // Scale: 0 at 60, up to -5 at 100
  return Math.min(5, Math.round((workEthic - 60) / 8));
}
