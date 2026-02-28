/**
 * Pitcher command/control advantage modifier.
 *
 * Pitchers with elite command paint the corners more consistently,
 * generating weaker contact. This translates to fewer well-struck
 * balls — a small K-rate boost from called strikes and swinging
 * strikes on nasty locations.
 *
 * Effect: up to +1.5% K rate for elite command pitchers.
 * No PRNG consumption — deterministic from attribute.
 */

import type { Player } from '../../types/player';

/**
 * Compute K-rate multiplier from pitcher command.
 *
 * @param pitcher The pitcher
 * @returns K rate multiplier (1.0 to 1.015)
 */
export function getCommandKMod(pitcher: Player): number {
  const command = pitcher.pitcherAttributes?.command ?? 400;

  // Only above-average command (> 420) provides a K bonus
  if (command <= 420) return 1.0;

  // Up to +0.5% K rate for elite command (550)
  return 1.0 + Math.min(0.005, (command - 420) / 130 * 0.005);
}
