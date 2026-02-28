import type { RandomGenerator } from 'pure-rand';
import { nextFloat } from '../math/prng';

/**
 * Count leverage simulation.
 *
 * Rather than simulating ball-by-ball, we abstract the count by rolling
 * a "count quality" for each PA based on pitcher command and batter eye.
 * The result is a modifier that represents whether the PA played out
 * in a hitter-favorable, pitcher-favorable, or neutral count.
 *
 * Real MLB data shows massive count splits:
 * - 3-0 count: .430 BA, but batters rarely swing
 * - 0-2 count: .160 BA, pitchers dominate
 * - Overall count effects explain ~15% of PA outcome variance
 *
 * We model this as a small modifier (±2-3%) to K and BB rates.
 */

export interface CountModifier {
  kRateMod: number;   // Multiplied on K rate (< 1 = fewer Ks for batter)
  bbRateMod: number;  // Multiplied on BB rate (> 1 = more walks for batter)
}

/**
 * Simulate the count context for a plate appearance.
 *
 * @param gen PRNG
 * @param pitcherCommand 0-550 (higher = better control)
 * @param batterEye 0-550 (higher = better pitch recognition)
 * @returns [modifier, gen] — count modifier and updated PRNG
 */
export function simulateCountContext(
  gen: RandomGenerator,
  pitcherCommand: number,
  batterEye: number,
): [CountModifier, RandomGenerator] {
  let roll: number;
  [roll, gen] = nextFloat(gen);

  // Command factor: higher command → more strikes → pitcher-favorable counts
  const commandFactor = pitcherCommand / 400; // 1.0 at average
  // Eye factor: higher eye → better takes → hitter-favorable counts
  const eyeFactor = batterEye / 400; // 1.0 at average

  // Probability of hitter-favorable count: base 30%, eye increases, command decreases
  const hitterFavProb = Math.max(0.15, Math.min(0.45,
    0.30 + (eyeFactor - 1.0) * 0.10 - (commandFactor - 1.0) * 0.10,
  ));

  // Probability of pitcher-favorable count: base 30%, command increases, eye decreases
  const pitcherFavProb = Math.max(0.15, Math.min(0.45,
    0.30 + (commandFactor - 1.0) * 0.10 - (eyeFactor - 1.0) * 0.10,
  ));

  if (roll < hitterFavProb) {
    // Hitter-favorable count (2-0, 3-1, etc.): fewer Ks, more walks
    return [{ kRateMod: 0.92, bbRateMod: 1.08 }, gen];
  } else if (roll < hitterFavProb + pitcherFavProb) {
    // Pitcher-favorable count (0-2, 1-2, etc.): more Ks, fewer walks
    return [{ kRateMod: 1.08, bbRateMod: 0.92 }, gen];
  } else {
    // Neutral count: no modification
    return [{ kRateMod: 1.0, bbRateMod: 1.0 }, gen];
  }
}
