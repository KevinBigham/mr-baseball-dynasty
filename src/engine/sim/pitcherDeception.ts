/**
 * Pitcher deception modifier.
 *
 * Pitchers with high movement AND pitching IQ create better
 * pitch tunneling — making pitches look the same out of the
 * hand before breaking differently. This makes batters chase
 * more pitches, reducing walks.
 *
 * Effect: up to 0.98x BB rate for elite deception pitchers.
 * No PRNG consumption — deterministic from attributes.
 */

import type { Player } from '../../types/player';

/**
 * Compute BB-rate multiplier from pitcher deception.
 *
 * @param pitcher The pitcher
 * @returns BB rate multiplier (0.98 to 1.0)
 */
export function getDeceptionBBMod(pitcher: Player): number {
  const attrs = pitcher.pitcherAttributes;
  if (!attrs) return 1.0;

  const movement = attrs.movement ?? 400;
  const iq = attrs.pitchingIQ ?? 400;

  // Both must be above average for deception to work
  if (movement <= 400 || iq <= 400) return 1.0;

  // Composite: min of the two above-average deltas
  const movDelta = (movement - 400) / 150; // 0 to 1
  const iqDelta = (iq - 400) / 150;        // 0 to 1
  const composite = Math.min(movDelta, iqDelta);

  // Up to -2% BB rate for elite deception
  return 1.0 - composite * 0.02;
}
