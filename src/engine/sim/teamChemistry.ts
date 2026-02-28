/**
 * Team chemistry mechanic.
 *
 * Team chemistry is derived from recent win/loss record and affects
 * overall team performance. Winning teams play loose and confident;
 * losing teams press and make more mistakes.
 *
 * Chemistry modifier: applied to defense rating (fielding) and as
 * a small BABIP adjustment. Range: ±2% effect.
 *
 * Deterministic — computed from team W/L record, no PRNG consumption.
 */

/**
 * Compute team chemistry modifier from recent record.
 *
 * @param wins Team wins so far this season
 * @param losses Team losses so far this season
 * @returns Modifier in range [-0.02, +0.02] (positive = good chemistry)
 */
export function getTeamChemistryModifier(wins: number, losses: number): number {
  const totalGames = wins + losses;
  if (totalGames < 10) return 0; // Need enough games for meaningful trend

  const winPct = wins / totalGames;

  // Centered at .500: teams above .500 get a boost, below get a penalty
  // The effect is subtle and bounded
  const deviation = winPct - 0.500;

  // Scale: ±0.02 max at extreme records (.600+ or .400-)
  const effect = Math.max(-0.02, Math.min(0.02, deviation * 0.20));

  return effect;
}

/**
 * Convert chemistry modifier to a defense rating adjustment.
 * Good chemistry = sharper fielding, bad chemistry = more errors.
 *
 * @param chemMod Chemistry modifier from getTeamChemistryModifier
 * @returns Defense rating adjustment (on 0-550 scale)
 */
export function chemistryDefenseAdjustment(chemMod: number): number {
  // ±0.02 chemistry → ±10 defense rating points
  return Math.round(chemMod * 500);
}
