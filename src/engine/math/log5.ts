// ─── Multi-outcome Log5 (Full Odds-Ratio Form) ────────────────────────────────
// For each outcome i:
//   P(i) = (A_i × B_i / L_i) / [(A_i × B_i / L_i) + ((1-A_i) × (1-B_i) / (1-L_i))]
// Then normalize across all outcomes in the stage.
//
// Canonical Bill James Log5 formula, NOT the simplified (A×B)/L version.

// ─── Single-outcome Log5 ──────────────────────────────────────────────────────
export function log5Single(
  batterRate: number,
  pitcherRate: number,
  leagueRate: number,
): number {
  // Clamp to avoid division by zero or log(0)
  const A = Math.max(0.001, Math.min(0.999, batterRate));
  const B = Math.max(0.001, Math.min(0.999, pitcherRate));
  const L = Math.max(0.001, Math.min(0.999, leagueRate));

  const numerator   = (A * B) / L;
  const denominator = numerator + ((1 - A) * (1 - B)) / (1 - L);
  return numerator / denominator;
}

// ─── Multi-outcome normalization ──────────────────────────────────────────────
// Applies log5 to each outcome, then normalizes so probabilities sum to 1.
export function log5MultiOutcome(
  outcomes: Array<{
    name: string;
    batterRate: number;
    pitcherRate: number;
    leagueRate: number;
  }>,
): Record<string, number> {
  const raw: Record<string, number> = {};
  let total = 0;

  for (const o of outcomes) {
    const p = log5Single(o.batterRate, o.pitcherRate, o.leagueRate);
    raw[o.name] = p;
    total += p;
  }

  // Normalize
  const result: Record<string, number> = {};
  for (const [name, p] of Object.entries(raw)) {
    result[name] = total > 0 ? p / total : 1 / outcomes.length;
  }
  return result;
}

// ─── Pitcher/batter influence weights ─────────────────────────────────────────
// Before feeding into Log5, blend pitcher and batter rates with asymmetric weights.
// pitcherWeight: 0.0 (batter controls entirely) to 1.0 (pitcher controls entirely)
export const PITCHER_WEIGHTS = {
  strikeout:   0.75, // Pitchers dominate K
  walk:        0.35, // Batters dominate BB
  homeRun:     0.55, // Slight pitcher edge on HR
  hitByPitch:  0.60, // Pitcher controls HBP
  ballInPlay:  0.50, // Neutral
  gbPercent:   0.55, // Slight pitcher edge on batted ball type
} as const;

export function weightedRates(
  batterRate: number,
  pitcherRate: number,
  leagueRate: number,
  pitcherWeight: number,
): { effectiveBatter: number; effectivePitcher: number } {
  const batterWeight = 1 - pitcherWeight;
  return {
    effectiveBatter:  batterRate  * batterWeight + leagueRate * pitcherWeight,
    effectivePitcher: pitcherRate * pitcherWeight + leagueRate * batterWeight,
  };
}

// ─── Logistic squash ──────────────────────────────────────────────────────────
// CRITICAL: Cap combined modifiers before entering Log5.
// Prevents compounding fatigue + TTO + platoon from creating absurd probabilities.
export function squashModifier(raw: number, maxMagnitude = 0.40): number {
  return maxMagnitude * Math.tanh(raw / maxMagnitude);
}

// ─── Apply squashed modifier to a probability ─────────────────────────────────
// modifier is additive; squash it, then shift the probability
export function applyModifier(baseProb: number, modifier: number): number {
  const safe = squashModifier(modifier);
  return Math.max(0.001, Math.min(0.999, baseProb + safe));
}

// ─── Sample from cumulative probability array ─────────────────────────────────
// items: [{name, prob}] where probs sum to ~1 (we normalize internally)
export function sampleOutcome(
  roll: number, // [0, 1) from PRNG
  outcomes: Array<{ name: string; prob: number }>,
): string {
  let cumulative = 0;
  const total = outcomes.reduce((s, o) => s + o.prob, 0);
  for (const o of outcomes) {
    cumulative += o.prob / total;
    if (roll < cumulative) return o.name;
  }
  return outcomes[outcomes.length - 1].name;
}
