/**
 * Pitch arsenal diversity K-rate modifier.
 *
 * Pitchers with larger arsenals (more distinct pitch types) can
 * better tunnel and sequence pitches, generating more swings and
 * misses. This provides a standalone K-rate boost on top of the
 * TTO penalty reduction that arsenalCount already provides.
 *
 * Effect: up to 1.02x K rate for 5-pitch arsenals.
 * No PRNG consumption — deterministic from arsenal count.
 */

/**
 * Compute K-rate multiplier from pitch arsenal diversity.
 *
 * @param arsenalCount Number of distinct pitch types (2-5)
 * @returns K-rate multiplier (1.0 for 2-3 pitches, up to 1.03 for 5)
 */
export function getArsenalKMod(arsenalCount: number): number {
  // 2-3 pitches: no bonus (league minimum)
  if (arsenalCount <= 3) return 1.0;

  // 4 pitches: +1% K rate
  // 5 pitches: +2% K rate
  return 1.0 + (arsenalCount - 3) * 0.01;
}
