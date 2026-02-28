/**
 * First time through order K-rate bonus.
 *
 * Pitchers are most effective the first time through the batting
 * order — hitters haven't seen their pitch sequences yet and
 * have no timing data. This gives a small K-rate boost for the
 * first 9 batters faced (times-through-order = 1).
 *
 * Conversely, third time through gives batters the advantage
 * as they've seen the full repertoire.
 *
 * Effect: +1% K first time through, -0.5% third time through.
 * No PRNG consumption — deterministic from TTO counter.
 */

/**
 * Compute K-rate multiplier from times through order.
 *
 * @param timesThrough How many times through the order (1 = first)
 * @returns K rate multiplier (0.995 to 1.01)
 */
export function getTimesThruKMod(timesThrough: number): number {
  // Third+ time through: batters have seen the full repertoire
  if (timesThrough >= 3) return 0.995;  // -0.5%
  return 1.0;
}
