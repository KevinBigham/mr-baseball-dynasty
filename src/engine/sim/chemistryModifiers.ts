/**
 * chemistryModifiers.ts — On-field chemistry effect computation
 *
 * Implements RFC Section 6 (player-personality-chemistry-rfc-v1.md):
 *   6.1 Cohesion modifier: applied only in close games (margin ≤ 2 runs)
 *   6.2 Morale modifier: applied to all plate appearances
 *
 * Design rules:
 *   - Pure functions — same inputs always produce same outputs
 *   - No randomness, no side effects, no ambient state
 *   - All bounds explicitly enforced (see RFC caps)
 */

import type { TeamChemistryState } from '../../types/chemistry';

// ─── Cohesion modifier (RFC 6.1) ─────────────────────────────────────────────

/**
 * Returns a batting contact bonus for close-game situations (margin ≤ 2 runs).
 * Positive = batting team benefits (more contact, more wins).
 * Negative = batting team is disadvantaged.
 *
 * RFC bounds: [−0.03, +0.02].
 */
export function cohesionCloseGameBonus(cohesion: number): number {
  if (cohesion >= 80) return  0.02;   // +2% win probability
  if (cohesion >= 60) return  0.0;    // no modifier
  if (cohesion >= 40) return -0.01;   // −1% win probability
  return                      -0.03;   // −3% win probability
}

// ─── Morale modifiers (RFC 6.2) ──────────────────────────────────────────────

/**
 * Returns a batting contact bonus based on team morale.
 * Positive = batter makes more contact (fewer strikeouts).
 *
 * RFC bounds: [−0.005, +0.005].
 */
export function moraleContactBonus(morale: number): number {
  if (morale >= 80) return  0.005;   // +0.5% batting contact
  if (morale <  30) return -0.005;   // −0.5% batting contact
  return 0;
}

/**
 * Returns a pitching quality bonus based on team morale.
 * Positive = pitcher is better (more strikeouts, fewer runs).
 *
 * RFC bounds: [−0.003, +0.003].
 */
export function moralePitchingBonus(morale: number): number {
  if (morale >= 80) return  0.003;   // −0.3% to pitcher ERA → pitcher better
  if (morale <  30) return -0.003;   // +0.3% to pitcher ERA → pitcher worse
  return 0;
}

// ─── Combined half-inning bonuses ────────────────────────────────────────────

export interface HalfInningChemBonuses {
  /** Contact bonus for batting team (morale + optional close-game cohesion). */
  batterChemBonus: number;
  /** Pitching quality bonus for pitching team (morale). Positive = pitcher better. */
  pitcherChemBonus: number;
}

/**
 * Build chemistry bonuses for a single half-inning.
 *
 * @param battingChemistry  Chemistry state of the team that is batting.
 * @param pitchingChemistry Chemistry state of the team that is pitching.
 * @param isCloseGame       True when |homeScore − awayScore| ≤ 2 (cohesion modifier applies).
 */
export function buildHalfInningChemBonuses(
  battingChemistry: TeamChemistryState | undefined,
  pitchingChemistry: TeamChemistryState | undefined,
  isCloseGame: boolean,
): HalfInningChemBonuses {
  if (!battingChemistry && !pitchingChemistry) {
    return { batterChemBonus: 0, pitcherChemBonus: 0 };
  }

  const contactBonus  = battingChemistry  ? moraleContactBonus(battingChemistry.morale)    : 0;
  const cohesionBonus = (isCloseGame && battingChemistry)
    ? cohesionCloseGameBonus(battingChemistry.cohesion)
    : 0;
  const pitchBonus    = pitchingChemistry ? moralePitchingBonus(pitchingChemistry.morale)  : 0;

  return {
    batterChemBonus:  contactBonus + cohesionBonus,
    pitcherChemBonus: pitchBonus,
  };
}
