/**
 * Hitter approach modifier — power vs contact profiles.
 *
 * Extreme power hitters (high power, low contact) accept higher
 * strikeout rates but get a slight ISO/slugging boost. Contact
 * hitters (high contact, low power) reduce their K rate slightly
 * but sacrifice power upside.
 *
 * These modifiers apply to the K rate — power hitters K more,
 * contact hitters K less.
 *
 * Effect: up to ±2% K rate based on hitter profile.
 * No PRNG consumption — deterministic from attributes.
 */

import type { Player } from '../../types/player';

/**
 * Compute K-rate multiplier from hitter approach profile.
 *
 * @param batter The batter
 * @returns K rate multiplier (0.98 to 1.02)
 */
export function getHitterApproachKMod(batter: Player): number {
  const attrs = batter.hitterAttributes;
  if (!attrs) return 1.0;

  const power = attrs.power ?? 400;
  const contact = attrs.contact ?? 400;

  // Power-heavy hitter: power exceeds contact significantly
  const diff = power - contact;

  if (diff > 80) {
    // Extreme power hitter: up to +2% K rate (they swing harder)
    return 1.0 + Math.min(0.02, (diff - 80) / 200 * 0.02);
  }

  if (diff < -80) {
    // Extreme contact hitter: up to -1% K rate (they choke up, make contact)
    return 1.0 - Math.min(0.01, (-diff - 80) / 200 * 0.01);
  }

  return 1.0;
}
