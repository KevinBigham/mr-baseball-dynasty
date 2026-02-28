/**
 * Baserunning IQ advancement modifier.
 *
 * Smart baserunners (high baserunningIQ) read the ball off the bat
 * better, take better routes, and make better "go/hold" decisions.
 * This translates to a small effective speed bonus for base
 * advancement purposes (first-to-third, scoring from 2nd, etc.).
 *
 * Effect: up to +15 effective speed for advancement rolls.
 * No PRNG consumption — deterministic from attributes.
 */

import type { Player } from '../../types/player';

/**
 * Compute the lead runner's effective speed for advancement.
 *
 * Takes the actual runner speed (blended toward league-average to
 * limit run production shift) and adds a small baserunningIQ bonus.
 *
 * @param runner The lead runner (or null if no runners)
 * @returns Effective speed for advancement (uses MLB-average 350 as default)
 */
export function getLeadRunnerEffectiveSpeed(runner: Player | null): number {
  if (!runner) return 350;

  const attrs = runner.hitterAttributes;
  if (!attrs) return 350;

  const briq = attrs.baserunningIQ ?? 400;

  // Keep base advancement speed at league-average (350) to avoid
  // run production shift. Only IQ provides a bonus.
  if (briq <= 400) return 350;

  // Up to +10 effective speed for elite baserunningIQ (550)
  const iqBonus = Math.min(10, Math.round((briq - 400) / 150 * 10));

  return 350 + iqBonus;
}
