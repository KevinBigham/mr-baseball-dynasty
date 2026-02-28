/**
 * Pitcher run support confidence modifier.
 *
 * Pitchers with big leads pitch more aggressively (attack the zone),
 * resulting in fewer walks but more hittable pitches. Pitchers in
 * deficit pitch more carefully, resulting in more walks.
 *
 * Effect: BB rate multiplier based on run differential.
 * Range: 0.97-1.02 (leading −3%, trailing +2% at most)
 *
 * No PRNG consumption — derived from score state.
 */

/**
 * Compute BB rate modifier based on run support.
 *
 * @param pitcherTeamRuns Runs scored by pitcher's team
 * @param opponentRuns Runs scored by opponent
 * @returns BB rate multiplier (< 1 = fewer walks when leading, > 1 = more walks when behind)
 */
export function getRunSupportBBMod(pitcherTeamRuns: number, opponentRuns: number): number {
  const diff = pitcherTeamRuns - opponentRuns;

  if (diff === 0) return 1.0; // Tied — neutral

  if (diff > 0) {
    // Leading: pitch more aggressively → fewer walks
    // Each run of lead reduces BB rate by ~0.75%, capped at -3%
    return Math.max(0.97, 1.0 - diff * 0.0075);
  }

  // Trailing: pitch more carefully → more walks
  // Each run behind increases BB rate by ~0.5%, capped at +2%
  return Math.min(1.02, 1.0 + Math.abs(diff) * 0.005);
}
