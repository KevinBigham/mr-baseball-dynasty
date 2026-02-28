/**
 * Win Probability estimation.
 *
 * Uses a simple logistic model based on run differential, inning, and
 * base-out state to estimate the home team's probability of winning.
 * Useful for strategic decisions: when to play for one run, when to
 * bring in the closer, leverage index for relievers, etc.
 */

/**
 * Estimate home team win probability.
 *
 * @param runDiff Home score minus away score
 * @param inning Current inning (1-based)
 * @param isTop True if away team is batting
 * @param outs Current outs (0-2)
 * @param runners Bitmask (1=1st, 2=2nd, 4=3rd)
 * @returns Win probability for the home team (0-1)
 */
export function homeWinProbability(
  runDiff: number,
  inning: number,
  isTop: boolean,
  outs: number,
  runners: number,
): number {
  // Innings remaining affects how much a run deficit matters
  const halfInningsRemaining = Math.max(0.5, (9 - inning) * 2 + (isTop ? 1 : 0));
  const inningFactor = halfInningsRemaining / 18; // 0 to 1 scale

  // Run differential contribution — more impactful in later innings
  const runWeight = 0.15 + (1 - inningFactor) * 0.25; // 0.15 early, 0.40 late
  const runContribution = runDiff * runWeight;

  // Base-out state — runners on base shift probability
  const runnerBonus = baseRunnerExpectedRuns(runners, outs);
  // If it's the top half, runners help the away team (hurt home)
  // If it's the bottom half, runners help the home team
  const runnerContribution = isTop ? -runnerBonus * 0.05 : runnerBonus * 0.05;

  // Logistic function to keep probability in (0, 1)
  const logit = runContribution + runnerContribution;
  const prob = 1 / (1 + Math.exp(-logit));

  // Clamp to avoid extreme values
  return Math.max(0.01, Math.min(0.99, prob));
}

/**
 * Expected runs from a given base-out state.
 * Based on simplified run expectancy matrix.
 */
function baseRunnerExpectedRuns(runners: number, outs: number): number {
  // Simplified run expectancy (MLB averages)
  // Format: [runners][outs] = expected runs
  const RE: Record<number, number[]> = {
    0b000: [0.48, 0.26, 0.10],  // Bases empty
    0b001: [0.85, 0.51, 0.22],  // Runner on 1st
    0b010: [1.10, 0.66, 0.32],  // Runner on 2nd
    0b011: [1.44, 0.89, 0.45],  // 1st and 2nd
    0b100: [1.35, 0.95, 0.36],  // Runner on 3rd
    0b101: [1.78, 1.15, 0.50],  // 1st and 3rd
    0b110: [1.96, 1.38, 0.57],  // 2nd and 3rd
    0b111: [2.28, 1.55, 0.75],  // Bases loaded
  };

  const safeOuts = Math.min(2, Math.max(0, outs));
  return RE[runners]?.[safeOuts] ?? RE[0b000]![safeOuts]!;
}

/**
 * Leverage Index — how important the current game state is.
 * Higher LI = more critical situation. Used to determine when to
 * use the best relievers vs. mop-up guys.
 *
 * @returns LI value (0.5 = low leverage, 1.0 = average, 2.0+ = high)
 */
export function leverageIndex(
  runDiff: number,
  inning: number,
  isTop: boolean,
  outs: number,
  runners: number,
): number {
  const winProb = homeWinProbability(runDiff, inning, isTop, outs, runners);

  // LI is highest when win probability is near 50%
  const closeness = 1 - Math.abs(winProb - 0.5) * 2; // 0 to 1 (1 = closest to 50%)

  // Late innings amplify leverage
  const lateFactor = inning >= 7 ? 1.5 : inning >= 5 ? 1.2 : 1.0;

  // Runners amplify leverage
  const runnerCount = ((runners & 1) ? 1 : 0) + ((runners & 2) ? 1 : 0) + ((runners & 4) ? 1 : 0);
  const runnerFactor = 1.0 + runnerCount * 0.15;

  return Math.max(0.3, closeness * lateFactor * runnerFactor * 2.0);
}
