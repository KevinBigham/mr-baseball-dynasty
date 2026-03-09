/**
 * GM strategy classification.
 * Stub — Sprint 04 branch surgery.
 */

import type { TeamSeason, TeamStrategy } from '../../types/team';

export function classifyAllTeams(
  teamSeasons: Map<number, TeamSeason>,
): Map<number, TeamStrategy> {
  const strategies = new Map<number, TeamStrategy>();
  for (const [teamId, ts] of teamSeasons) {
    const pct = ts.wins / Math.max(1, ts.wins + ts.losses);
    if (pct >= 0.55) strategies.set(teamId, 'contender');
    else if (pct <= 0.42) strategies.set(teamId, 'rebuilder');
    else strategies.set(teamId, 'fringe');
  }
  return strategies;
}
