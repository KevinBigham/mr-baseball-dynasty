/**
 * Catcher game-calling modifier.
 *
 * Smart catchers (high defensiveIQ) call better pitch sequences,
 * improving the pitcher's effective command. This translates to a
 * small BABIP reduction (fewer hard-hit balls from bad pitch selection).
 *
 * Effect: up to -0.004 BABIP for elite game-calling catchers.
 * No PRNG consumption — deterministic from catcher attributes.
 */

import type { Player } from '../../types/player';

/**
 * Compute BABIP modifier based on catcher game-calling ability.
 *
 * @param catcher The catcher player (or null if not found)
 * @returns BABIP modifier (negative = fewer hits, 0 to -0.004)
 */
export function getGameCallingMod(catcher: Player | null): number {
  if (!catcher) return 0;

  const defIQ = catcher.hitterAttributes?.defensiveIQ ?? 400;

  // Only above-average catchers (defensiveIQ > 400) provide a benefit
  if (defIQ <= 400) return 0;

  // Scale: 0 at 400, up to -0.004 at 550
  return -Math.min(0.004, (defIQ - 400) / 150 * 0.004);
}
