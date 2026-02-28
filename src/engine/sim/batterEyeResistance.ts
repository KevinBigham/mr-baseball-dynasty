/**
 * Batter eye BB resistance modifier.
 *
 * Batters with elite plate discipline (high eye attribute) draw
 * more walks by laying off borderline pitches. This is a direct
 * BB-rate boost that represents the hitter's ability to recognize
 * pitches out of the zone.
 *
 * Effect: up to +2% BB rate for elite eye.
 * No PRNG consumption — deterministic from attribute.
 */

import type { Player } from '../../types/player';

/**
 * Compute BB-rate multiplier from batter's eye attribute.
 *
 * @param batter The batter
 * @returns BB rate multiplier (1.0 to 1.02)
 */
export function getBatterEyeBBMod(batter: Player): number {
  const eye = batter.hitterAttributes?.eye ?? 400;

  // Only elite eye (> 450) provides a meaningful walk bonus
  if (eye <= 450) return 1.0;

  // Up to +2% BB rate for elite eye (550)
  return 1.0 + Math.min(0.02, (eye - 450) / 100 * 0.02);
}
