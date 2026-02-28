/**
 * Pitcher momentum/confidence tracking within a game.
 *
 * A pitcher gains confidence from consecutive outs and loses it from
 * hits, walks, and runs allowed. This creates realistic momentum
 * swings where a pitcher "settles in" or "loses the zone."
 *
 * The modifier is small (±2-4%) to avoid overwhelming the core Log5
 * model, but enough to create interesting narrative moments.
 */

export interface MomentumState {
  consecutiveOuts: number;     // Streak of consecutive outs
  consecutiveBaserunners: number; // Streak of consecutive baserunners
  runsThisInning: number;      // Runs allowed in current inning
  confidence: number;          // -1.0 to 1.0 (negative = rattled, positive = locked in)
}

export function initialMomentum(): MomentumState {
  return {
    consecutiveOuts: 0,
    consecutiveBaserunners: 0,
    runsThisInning: 0,
    confidence: 0,
  };
}

/**
 * Update momentum after a plate appearance outcome.
 * Call this after each PA is resolved.
 */
export function updateMomentum(
  state: MomentumState,
  isOut: boolean,
  runsScored: number,
  mentalToughness: number, // 0-100, from pitcher attributes
): MomentumState {
  const toughnessFactor = mentalToughness / 100; // 0-1

  if (isOut) {
    const newConsOuts = state.consecutiveOuts + 1;
    // Outs build confidence: +0.02 per consecutive out, capped
    const confidenceGain = 0.02 * Math.min(newConsOuts, 3);
    return {
      consecutiveOuts: newConsOuts,
      consecutiveBaserunners: 0,
      runsThisInning: state.runsThisInning,
      confidence: Math.min(0.15, state.confidence + confidenceGain),
    };
  }

  // Baserunner reached — lose some confidence
  const newConsRunners = state.consecutiveBaserunners + 1;
  let confidenceLoss = 0.03 * newConsRunners;

  // Runs allowed hurt more
  if (runsScored > 0) {
    confidenceLoss += runsScored * 0.04;
  }

  // Mental toughness resists confidence loss
  confidenceLoss *= (1.0 - toughnessFactor * 0.4);

  return {
    consecutiveOuts: 0,
    consecutiveBaserunners: newConsRunners,
    runsThisInning: state.runsThisInning + runsScored,
    confidence: Math.max(-0.15, state.confidence - confidenceLoss),
  };
}

/**
 * Reset inning-specific momentum (between innings).
 * Keeps overall confidence but resets inning run counter.
 */
export function resetInningMomentum(state: MomentumState): MomentumState {
  return {
    ...state,
    runsThisInning: 0,
    // Slight regression toward neutral between innings
    confidence: state.confidence * 0.7,
  };
}

/**
 * Get the modifier to apply to plate appearance resolution.
 * Positive = pitcher is better, negative = pitcher is worse.
 * This is the opposite of the fatigue/TTO modifier convention.
 *
 * @returns A modifier value, typically -0.04 to +0.04
 */
export function getMomentumModifier(state: MomentumState): number {
  // Negate because the PA system treats positive modifier as pitcher penalty
  return -state.confidence;
}
