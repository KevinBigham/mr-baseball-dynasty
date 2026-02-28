import type { Player } from '../../types/player';

/**
 * Lineup protection effect.
 *
 * Pitchers adjust their approach based on who's on deck:
 * - Dangerous on-deck hitter → pitcher attacks the zone more
 *   (lower BB rate, slightly lower K rate — more hittable pitches)
 * - Weak on-deck hitter → pitcher nibbles more willingly
 *   (higher BB rate, slightly higher K rate — more breaking balls)
 *
 * The effect is small (±1-2% on walk rate) — enough to create
 * realistic protection dynamics without overwhelming the core model.
 */

/**
 * Compute a protection modifier for the current batter based on
 * the on-deck hitter's threat level.
 *
 * @returns bbModifier: multiplied on BB rate (< 1 = fewer walks, > 1 = more walks)
 */
export function getProtectionModifier(
  onDeckBatter: Player,
): number {
  const h = onDeckBatter.hitterAttributes;
  if (!h) return 1.0; // No data → no effect

  // Threat level: weighted composite of power + contact
  // League average is 400 for each attribute
  const threat = h.power * 0.6 + h.contact * 0.4;
  const avgThreat = 400;

  // Deviation from average: positive = dangerous, negative = weak
  const delta = (threat - avgThreat) / avgThreat; // roughly -0.4 to +0.4

  // Convert to walk rate multiplier:
  // Dangerous on-deck → pitcher attacks → fewer walks (multiplier < 1)
  // Weak on-deck → pitcher nibbles → more walks (multiplier > 1)
  // Capped at ±6% effect (very conservative)
  const bbMod = 1.0 - delta * 0.15;

  return Math.max(0.94, Math.min(1.06, bbMod));
}
