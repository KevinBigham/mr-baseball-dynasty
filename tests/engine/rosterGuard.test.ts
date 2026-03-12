import { describe, it, expect } from 'vitest';
import type { Player } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import { ensureMinimumRosters } from '../../src/engine/rosterGuard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makePlayer = (id: number, teamId: number, isPitcher = false): Player => ({
  playerId: id,
  teamId,
  name: `Player ${id}`,
  firstName: 'Test',
  lastName: 'Player',
  leagueLevel: 'MLB',
  age: 25,
  position: isPitcher ? 'SP' : 'SS',
  bats: 'R',
  throws: 'R',
  nationality: 'american',
  isPitcher,
  hitterAttributes: isPitcher ? null : {
    contact: 300, power: 300, eye: 300, speed: 300,
    fielding: 300, armStrength: 300, durability: 300, baserunningIQ: 300,
    platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
    workEthic: 60, mentalToughness: 55,
  },
  pitcherAttributes: isPitcher ? {
    stuff: 300, movement: 300, command: 300, stamina: 300,
    pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 300,
    durability: 300, recoveryRate: 300, platoonTendency: 0,
    pitchTypeMix: { fastball: 0.55, breaking: 0.25, offspeed: 0.20 },
    pitchingIQ: 300, workEthic: 60, mentalToughness: 55,
  } : null,
  overall: 300,
  potential: 400,
  development: { theta: 0, sigma: 0.1, phase: 'prime' },
  rosterData: {
    rosterStatus: 'MLB_ACTIVE',
    isOn40Man: true,
    optionYearsRemaining: 3,
    optionUsedThisSeason: false,
    minorLeagueDaysThisSeason: 0,
    demotionsThisSeason: 0,
    serviceTimeDays: 172 * 3,
    serviceTimeCurrentTeamDays: 172 * 3,
    rule5Selected: false,
    signedSeason: 2023,
    signedAge: 22,
    contractYearsRemaining: 3,
    salary: 1_000_000,
    arbitrationEligible: false,
    freeAgentEligible: false,
    hasTenAndFive: false,
  },
});

const makeTeam = (id: number): Team => ({
  teamId: id,
  name: `Team ${id}`,
  abbreviation: `T${id}`,
  city: 'City',
  league: 'AL',
  division: 'East',
  conferenceId: 0,
  divisionId: 0,
  parkFactorId: 0,
  budget: 100_000_000,
  scoutingQuality: 0.7,
  coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
  strategy: 'fringe',
  seasonRecord: { wins: 0, losses: 0, runsScored: 0, runsAllowed: 0 },
  rotationIndex: 0,
  bullpenReliefCounter: 0,
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ensureMinimumRosters', () => {
  it('promotes minor leaguers when team has fewer than 9 position players', () => {
    const teamId = 1;
    const players: Player[] = [];

    // 5 MLB_ACTIVE hitters
    for (let i = 1; i <= 5; i++) {
      players.push(makePlayer(i, teamId, false));
    }

    // 6 MINORS_AAA hitters available for promotion
    for (let i = 6; i <= 11; i++) {
      const p = makePlayer(i, teamId, false);
      p.rosterData.rosterStatus = 'MINORS_AAA';
      p.rosterData.isOn40Man = false;
      players.push(p);
    }

    // 5 MLB_ACTIVE pitchers (already at minimum, no promotion needed)
    for (let i = 12; i <= 16; i++) {
      players.push(makePlayer(i, teamId, true));
    }

    const teams = [makeTeam(teamId)];
    const promotions = ensureMinimumRosters(players, teams);

    // Need 9 hitters, have 5 => should promote 4
    expect(promotions).toBe(4);

    // Verify that 9 hitters are now MLB_ACTIVE
    const activeHitters = players.filter(
      p => p.teamId === teamId && !p.isPitcher && p.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    expect(activeHitters).toHaveLength(9);

    // Promoted players should have isOn40Man = true
    const promoted = players.filter(
      p => p.playerId >= 6 && p.playerId <= 11 && p.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    expect(promoted).toHaveLength(4);
    for (const p of promoted) {
      expect(p.rosterData.isOn40Man).toBe(true);
    }
  });

  it('promotes minor league pitchers when team has fewer than 5 active pitchers', () => {
    const teamId = 1;
    const players: Player[] = [];

    // 9 MLB_ACTIVE hitters (at minimum, no promotion needed)
    for (let i = 1; i <= 9; i++) {
      players.push(makePlayer(i, teamId, false));
    }

    // 2 MLB_ACTIVE pitchers (below minimum of 5)
    for (let i = 10; i <= 11; i++) {
      players.push(makePlayer(i, teamId, true));
    }

    // 5 MINORS_AAA pitchers available for promotion
    for (let i = 12; i <= 16; i++) {
      const p = makePlayer(i, teamId, true);
      p.rosterData.rosterStatus = 'MINORS_AAA';
      p.rosterData.isOn40Man = false;
      players.push(p);
    }

    const teams = [makeTeam(teamId)];
    const promotions = ensureMinimumRosters(players, teams);

    // Need 5 pitchers, have 2 => should promote 3
    expect(promotions).toBe(3);

    // Verify that 5 pitchers are now MLB_ACTIVE
    const activePitchers = players.filter(
      p => p.teamId === teamId && p.isPitcher && p.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    expect(activePitchers).toHaveLength(5);

    // Promoted pitchers should have isOn40Man = true
    const promoted = players.filter(
      p => p.playerId >= 12 && p.playerId <= 16 && p.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    expect(promoted).toHaveLength(3);
    for (const p of promoted) {
      expect(p.rosterData.isOn40Man).toBe(true);
    }
  });
});
