/**
 * Outfield arm strength defense modifier.
 *
 * Teams with strong-armed outfielders create a deterrent effect —
 * runners are less aggressive, batters hold at first instead of
 * trying to stretch hits, and fewer extra-base hits occur on
 * balls to the outfield. This translates to a small defense
 * rating bonus.
 *
 * Effect: up to +3 defense rating for elite outfield arms.
 * No PRNG consumption — deterministic from attributes.
 */

import type { Player } from '../../types/player';

const OF_POSITIONS = new Set(['LF', 'CF', 'RF']);

/**
 * Compute defense rating bonus from outfield arm strength.
 *
 * @param players All active players for the fielding team
 * @param teamId The fielding team's ID
 * @returns Defense rating bonus (0 to +3)
 */
export function getOutfieldArmBonus(players: Player[], teamId: number): number {
  const outfielders = players.filter(
    p => p.teamId === teamId
      && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && OF_POSITIONS.has(p.position),
  );

  if (outfielders.length === 0) return 0;

  const avgArm = outfielders.reduce(
    (sum, p) => sum + (p.hitterAttributes?.armStrength ?? 400), 0,
  ) / outfielders.length;

  // Only above-average arm strength (> 400) provides a bonus
  if (avgArm <= 400) return 0;

  // Up to +3 defense rating for elite average arm strength (550)
  return Math.min(3, Math.round((avgArm - 400) / 150 * 3));
}
