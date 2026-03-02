/**
 * rosterGuard.ts — Ensures all teams have minimum viable rosters before simulation.
 *
 * Prevents the asymmetric forfeit bug in gameSimulator (which always awards
 * the loss to the home team regardless of which team is short-handed).
 * Since we cannot modify gameSimulator.ts, we guard upstream.
 */

import type { Player } from '../types/player';
import type { Team } from '../types/team';

const MIN_POSITION_PLAYERS = 9;
const MIN_PITCHERS = 5;

/**
 * For each team, if they have fewer than MIN_POSITION_PLAYERS hitters or
 * MIN_PITCHERS pitchers at MLB_ACTIVE, promote the best available minor leaguers.
 * Returns the number of promotions made.
 */
export function ensureMinimumRosters(players: Player[], teams: Team[]): number {
  let promotions = 0;

  for (const team of teams) {
    const teamPlayers = players.filter(p => p.teamId === team.teamId);
    const activeHitters = teamPlayers.filter(
      p => p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher,
    );
    const activePitchers = teamPlayers.filter(
      p => p.rosterData.rosterStatus === 'MLB_ACTIVE' && p.isPitcher,
    );

    // Promote hitters if needed
    if (activeHitters.length < MIN_POSITION_PLAYERS) {
      const needed = MIN_POSITION_PLAYERS - activeHitters.length;
      const candidates = teamPlayers
        .filter(p => !p.isPitcher && p.rosterData.rosterStatus.startsWith('MINORS_'))
        .sort((a, b) => b.overall - a.overall);

      for (let i = 0; i < Math.min(needed, candidates.length); i++) {
        candidates[i].rosterData.rosterStatus = 'MLB_ACTIVE';
        candidates[i].rosterData.isOn40Man = true;
        promotions++;
      }
    }

    // Promote pitchers if needed
    if (activePitchers.length < MIN_PITCHERS) {
      const needed = MIN_PITCHERS - activePitchers.length;
      const candidates = teamPlayers
        .filter(p => p.isPitcher && p.rosterData.rosterStatus.startsWith('MINORS_'))
        .sort((a, b) => b.overall - a.overall);

      for (let i = 0; i < Math.min(needed, candidates.length); i++) {
        candidates[i].rosterData.rosterStatus = 'MLB_ACTIVE';
        candidates[i].rosterData.isOn40Man = true;
        promotions++;
      }
    }
  }

  return promotions;
}
