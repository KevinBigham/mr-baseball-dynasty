/**
 * Standings utilities — tiebreaker comparisons for playoff seeding.
 */

import type { StandingsRow } from '../types/league';

/**
 * Compare two teams for standings/seeding purposes.
 * Tiebreaker order:
 * 1. Wins (desc)
 * 2. Losses (asc — fewer losses better)
 * 3. Run differential (desc)
 * 4. Runs scored (desc — more offense wins)
 * 5. Pythagorean wins (desc)
 */
export function tiebreakCompare(a: StandingsRow, b: StandingsRow): number {
  // 1. Win count
  if (b.wins !== a.wins) return b.wins - a.wins;
  // 2. Loss count
  if (a.losses !== b.losses) return a.losses - b.losses;
  // 3. Run differential
  const aDiff = a.runsScored - a.runsAllowed;
  const bDiff = b.runsScored - b.runsAllowed;
  if (bDiff !== aDiff) return bDiff - aDiff;
  // 4. Runs scored
  if (b.runsScored !== a.runsScored) return b.runsScored - a.runsScored;
  // 5. Pythagorean wins
  return (b.pythagWins ?? 0) - (a.pythagWins ?? 0);
}
