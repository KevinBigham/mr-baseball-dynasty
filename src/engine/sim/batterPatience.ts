/**
 * Batter patience pitch count modifier.
 *
 * Disciplined batters (high eye) work longer counts, forcing
 * pitchers to throw more pitches per plate appearance. This
 * accelerates pitcher fatigue without consuming PRNG.
 *
 * Effect: up to +1 extra pitch per PA for elite eye.
 * No PRNG consumption — modifies pitch count estimate.
 */

/**
 * Compute extra pitches per PA from batter patience.
 *
 * @param eye Batter's eye attribute (0-550)
 * @returns Extra pitches to add to pitch count (0 to +1)
 */
export function getPatiencePitchBonus(eye: number): number {
  // Only above-average eye (> 420) batters work longer counts
  if (eye <= 420) return 0;

  // Scale: 0 at 420, up to +1 at 550
  return Math.min(1, (eye - 420) / 130);
}
