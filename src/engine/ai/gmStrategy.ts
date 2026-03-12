/**
 * GM strategy classification.
 * Considers win%, roster age, and farm system depth to determine team mode.
 */

import type { Player } from '../../types/player';
import type { TeamSeason, TeamStrategy } from '../../types/team';

/** Average age of MLB-active players for a team */
function averageMLBAge(players: Player[], teamId: number): number {
  const mlb = players.filter(p =>
    p.teamId === teamId &&
    (p.rosterData.rosterStatus === 'MLB_ACTIVE' ||
     p.rosterData.rosterStatus === 'MLB_IL_10' ||
     p.rosterData.rosterStatus === 'MLB_IL_60')
  );
  if (mlb.length === 0) return 28;
  return mlb.reduce((s, p) => s + p.age, 0) / mlb.length;
}

/** Count of high-potential minor leaguers (potential > 350) */
function farmProspectCount(players: Player[], teamId: number): number {
  return players.filter(p =>
    p.teamId === teamId &&
    p.potential > 350 &&
    !['MLB_ACTIVE', 'MLB_IL_10', 'MLB_IL_60', 'FREE_AGENT', 'RETIRED', 'DFA', 'WAIVERS'].includes(p.rosterData.rosterStatus)
  ).length;
}

export function classifyAllTeams(
  teamSeasons: Map<number, TeamSeason>,
  players?: Player[],
): Map<number, TeamStrategy> {
  const strategies = new Map<number, TeamStrategy>();
  for (const [teamId, ts] of teamSeasons) {
    const pct = ts.wins / Math.max(1, ts.wins + ts.losses);

    // Enhanced classification using roster data when available
    if (players) {
      const avgAge = averageMLBAge(players, teamId);
      const farmCount = farmProspectCount(players, teamId);

      // Old winning team with weak farm → still contender but fragile
      if (pct >= 0.55) {
        strategies.set(teamId, 'contender');
      } else if (pct <= 0.38) {
        // Bad record: definitely rebuilding
        strategies.set(teamId, 'rebuilder');
      } else if (pct <= 0.45 && avgAge > 30 && farmCount < 5) {
        // Aging, mediocre, weak farm → rebuild
        strategies.set(teamId, 'rebuilder');
      } else if (pct >= 0.48 && avgAge < 28 && farmCount >= 8) {
        // Young, competitive, strong farm → treat as contender (on the rise)
        strategies.set(teamId, 'contender');
      } else {
        strategies.set(teamId, 'fringe');
      }
    } else {
      // Fallback: simple win% classification
      if (pct >= 0.55) strategies.set(teamId, 'contender');
      else if (pct <= 0.42) strategies.set(teamId, 'rebuilder');
      else strategies.set(teamId, 'fringe');
    }
  }
  return strategies;
}
