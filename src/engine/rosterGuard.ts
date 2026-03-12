/**
 * rosterGuard.ts — Ensures all teams have minimum viable rosters before simulation.
 *
 * Prevents the asymmetric forfeit bug in gameSimulator (which always awards
 * the loss to the home team regardless of which team is short-handed).
 * Since we cannot modify gameSimulator.ts, we guard upstream.
 */

import type { Player, Position } from '../types/player';
import type { Team } from '../types/team';

const MIN_POSITION_PLAYERS = 9;
const MIN_PITCHERS = 5;

// Counter for emergency filler player IDs — use a high range to avoid collisions
let _fillerIdCounter = 900_000;

/** Generate a bare-minimum filler player to prevent forfeits */
function createFillerPlayer(teamId: number, isPitcher: boolean): Player {
  const id = _fillerIdCounter++;
  const position: Position = isPitcher ? 'SP' : 'CF';
  const ovr = 150;
  return {
    playerId: id,
    teamId,
    name: `Filler ${isPitcher ? 'P' : 'H'} #${id % 1000}`,
    firstName: 'Filler',
    lastName: `${isPitcher ? 'P' : 'H'} #${id % 1000}`,
    age: 25,
    position,
    bats: 'R',
    throws: 'R',
    leagueLevel: 'MLB',
    nationality: 'american',
    isPitcher,
    hitterAttributes: isPitcher ? null : {
      contact: ovr, power: ovr, eye: ovr, speed: ovr, baserunningIQ: ovr,
      fielding: ovr, armStrength: ovr, durability: ovr,
      platoonSensitivity: 0, offensiveIQ: ovr, defensiveIQ: ovr,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: isPitcher ? {
      stuff: ovr, movement: ovr, command: ovr, stamina: ovr,
      pitchArsenalCount: 3, gbFbTendency: 50, holdRunners: ovr,
      durability: ovr, recoveryRate: ovr, platoonTendency: 0,
      pitchTypeMix: { fastball: 0.6, breaking: 0.25, offspeed: 0.15 },
      pitchingIQ: ovr, workEthic: 50, mentalToughness: 50,
    } : null,
    overall: ovr,
    potential: ovr,
    development: { theta: 0, sigma: 5, phase: 'decline' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 0,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 0,
      serviceTimeCurrentTeamDays: 0,
      rule5Selected: false,
      signedSeason: 2026,
      signedAge: 25,
      contractYearsRemaining: 1,
      salary: 700_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  };
}

/**
 * For each team, if they have fewer than MIN_POSITION_PLAYERS hitters or
 * MIN_PITCHERS pitchers at MLB_ACTIVE, promote the best available minor leaguers.
 * If no minor leaguers are available, generate emergency filler players.
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

      const promoted = Math.min(needed, candidates.length);
      for (let i = 0; i < promoted; i++) {
        candidates[i].rosterData.rosterStatus = 'MLB_ACTIVE';
        candidates[i].rosterData.isOn40Man = true;
        promotions++;
      }

      // If still short, generate emergency filler players
      const stillNeeded = needed - promoted;
      for (let i = 0; i < stillNeeded; i++) {
        players.push(createFillerPlayer(team.teamId, false));
        promotions++;
      }
    }

    // Promote pitchers if needed
    if (activePitchers.length < MIN_PITCHERS) {
      const needed = MIN_PITCHERS - activePitchers.length;
      const candidates = teamPlayers
        .filter(p => p.isPitcher && p.rosterData.rosterStatus.startsWith('MINORS_'))
        .sort((a, b) => b.overall - a.overall);

      const promoted = Math.min(needed, candidates.length);
      for (let i = 0; i < promoted; i++) {
        candidates[i].rosterData.rosterStatus = 'MLB_ACTIVE';
        candidates[i].rosterData.isOn40Man = true;
        promotions++;
      }

      // If still short, generate emergency filler players
      const stillNeeded = needed - promoted;
      for (let i = 0; i < stillNeeded; i++) {
        players.push(createFillerPlayer(team.teamId, true));
        promotions++;
      }
    }
  }

  return promotions;
}
