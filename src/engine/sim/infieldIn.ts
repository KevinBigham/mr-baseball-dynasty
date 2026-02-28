/**
 * Infield-in defense mechanic.
 *
 * When there's a runner on 3rd with < 2 outs in a close game,
 * the defense may bring the infield in to cut off the run at home.
 *
 * Trade-off:
 * - Ground balls are MORE likely to be hits (holes are bigger)
 * - But if the grounder IS an out, the runner on 3rd is held (no run scores)
 * - GDP becomes less likely (infield drawn in, harder to turn two)
 *
 * The mechanic modifies BABIP on ground balls and adjusts run scoring.
 */

/**
 * Determine if the defense should bring the infield in.
 *
 * Conditions:
 * - Runner on 3rd
 * - Less than 2 outs
 * - Close game (within 2 runs) OR late innings (7th+)
 * - Not bases loaded with 0 outs (double play too valuable)
 */
export function shouldInfieldIn(
  runners: number,
  outs: number,
  runDiff: number, // positive = fielding team leads
  inning: number,
): boolean {
  // Must have runner on 3rd
  if (!(runners & 0b100)) return false;
  // Must be less than 2 outs
  if (outs >= 2) return false;
  // Don't bring infield in with bases loaded and 0 outs — DP is too valuable
  if (runners === 0b111 && outs === 0) return false;

  // Close game: within 2 runs (either direction)
  const isClose = Math.abs(runDiff) <= 2;
  // Late game: 7th inning or later
  const isLate = inning >= 7;

  // In a close game or late innings, bring it in
  return isClose || (isLate && runDiff >= 0 && runDiff <= 3);
}

/**
 * Modifiers when infield is in.
 *
 * @returns groundBallBABIPBonus: additive bonus to GB BABIP (holes are bigger)
 * @returns gdpReduction: multiplier on GDP probability (harder to turn two)
 */
export interface InfieldInModifiers {
  groundBallBABIPBonus: number;  // Added to effective BABIP for ground balls
  gdpReduction: number;          // Multiplier on GDP chance (< 1 = fewer DPs)
}

export function getInfieldInModifiers(): InfieldInModifiers {
  return {
    groundBallBABIPBonus: 0.06,  // ~6% more GB hits (big effect — holes are real)
    gdpReduction: 0.55,          // ~45% fewer GDPs (harder to turn two when drawn in)
  };
}
