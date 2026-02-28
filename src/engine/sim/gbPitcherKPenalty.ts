/**
 * Groundball pitcher K-rate tradeoff.
 *
 * Extreme groundball pitchers (gbFbTendency > 60) trade strikeouts
 * for weak contact. Their pitch profile induces more groundballs
 * but fewer whiffs. Conversely, extreme flyball pitchers (< 40)
 * get slightly more K's from high fastballs and swing-and-miss.
 *
 * Effect: up to ±2% K rate based on GB/FB tendency.
 * No PRNG consumption — deterministic from attribute.
 */

import type { Player } from '../../types/player';

/**
 * Compute K-rate multiplier from pitcher's GB/FB tendency.
 *
 * @param pitcher The pitcher
 * @returns K rate multiplier (0.98 to 1.02)
 */
export function getGBFBKMod(pitcher: Player): number {
  const tendency = pitcher.pitcherAttributes?.gbFbTendency ?? 50;

  // Extreme GB pitcher (> 60): fewer K's, more weak contact
  if (tendency > 60) {
    return 1.0 - Math.min(0.01, (tendency - 60) / 40 * 0.01);
  }

  // Extreme FB pitcher (< 40): more K's, elevated fastballs whiff more
  if (tendency < 40) {
    return 1.0 + Math.min(0.015, (40 - tendency) / 40 * 0.015);
  }

  return 1.0;
}
