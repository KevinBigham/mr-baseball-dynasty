import type { Player } from '../../types/player';

/**
 * Pinch-runner decision engine.
 *
 * In late innings of close games, teams may substitute a slow runner
 * on base with a faster bench player to improve scoring chances.
 *
 * Criteria:
 * - Inning 7+ (late game only)
 * - Close game (within 2 runs)
 * - Runner on base is slow (speed < 300)
 * - Bench has a significantly faster player (speed > runner + 100)
 * - Runner is not a pitcher
 *
 * No PRNG consumption — purely situational decision.
 */

export interface PinchRunnerDecision {
  shouldSub: boolean;
  runnerPlayerId: number;      // Player being removed
  replacementPlayerId: number; // Bench player entering
}

/**
 * Check if a pinch-runner substitution should be made.
 *
 * @param runners Array of runners on base [1st, 2nd, 3rd] (null if unoccupied)
 * @param bench Available bench players
 * @param inning Current inning
 * @param scoreDiff Batting team's score minus fielding team's score
 * @param usedPlayers Set of player IDs already used this game
 * @returns Decision object, or null if no sub should be made
 */
export function selectPinchRunner(
  runners: (Player | null)[],
  bench: Player[],
  inning: number,
  scoreDiff: number,
  usedPlayers: Set<number>,
): PinchRunnerDecision | null {
  // Only in late innings of close games
  if (inning < 7) return null;
  if (Math.abs(scoreDiff) > 2) return null;

  // Find the slowest runner on base
  let slowestRunner: Player | null = null;
  let slowestSpeed = Infinity;

  for (const runner of runners) {
    if (!runner) continue;
    if (runner.isPitcher) continue; // Don't sub pitchers
    const speed = runner.hitterAttributes?.speed ?? 400;
    if (speed < 300 && speed < slowestSpeed) {
      slowestSpeed = speed;
      slowestRunner = runner;
    }
  }

  if (!slowestRunner) return null;

  // Find the fastest available bench player
  const available = bench.filter(p => !usedPlayers.has(p.playerId) && !p.isPitcher);
  if (available.length === 0) return null;

  let fastestBench: Player | null = null;
  let fastestSpeed = 0;

  for (const p of available) {
    const speed = p.hitterAttributes?.speed ?? 300;
    if (speed > fastestSpeed) {
      fastestSpeed = speed;
      fastestBench = p;
    }
  }

  if (!fastestBench) return null;

  // Only sub if the bench player is significantly faster
  if (fastestSpeed < slowestSpeed + 100) return null;

  return {
    shouldSub: true,
    runnerPlayerId: slowestRunner.playerId,
    replacementPlayerId: fastestBench.playerId,
  };
}
