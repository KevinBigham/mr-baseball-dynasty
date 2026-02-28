/**
 * Infield hit probability modifier.
 *
 * Fast runners can beat out some ground ball outs, converting
 * them to infield singles. This adds a small BABIP bonus on
 * ground balls for fast runners.
 *
 * Effect: up to +0.015 GB BABIP for elite speed.
 * No PRNG consumption — derived from speed attribute.
 */

/**
 * Compute infield hit BABIP bonus for ground balls.
 *
 * @param speed Batter's speed attribute (0-550)
 * @returns GB BABIP bonus (0 to +0.015)
 */
export function getInfieldHitBonus(speed: number): number {
  // Only fast runners (speed > 400) get this bonus
  if (speed <= 400) return 0;

  // Scale: 0 at 400, up to +0.015 at 550
  return Math.min(0.015, (speed - 400) / 150 * 0.015);
}
