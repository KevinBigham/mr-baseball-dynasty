/**
 * Late-game defensive focus modifier.
 *
 * In close, late-inning games (7th+, within 2 runs), experienced
 * defenders elevate their play. Teams with high average defensiveIQ
 * make fewer errors and turn more tough plays.
 *
 * Effect: up to +5 defense rating in close late-game situations.
 * No PRNG consumption — deterministic from game state.
 */

/**
 * Compute late-game defense rating bonus.
 *
 * @param inning Current inning
 * @param scoreDiff Absolute run differential
 * @param avgDefIQ Average defensive IQ of the fielding team (0-550)
 * @returns Defense rating bonus (0 to +5)
 */
export function getLateGameDefenseBonus(
  inning: number,
  scoreDiff: number,
  avgDefIQ: number,
): number {
  // Only applies in 7th inning or later
  if (inning < 7) return 0;

  // Only in close games (within 2 runs)
  if (Math.abs(scoreDiff) > 2) return 0;

  // Scale by average defensiveIQ above 400
  const iqBonus = Math.max(0, (avgDefIQ - 400) / 150); // 0 to 1

  // Up to +5 defense rating
  return Math.round(iqBonus * 5);
}
