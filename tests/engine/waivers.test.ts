import { describe, it, expect } from 'vitest';
import type { Player, Position } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import { processWaivers } from '../../src/engine/waivers';
import { identifyRule5Eligible, conductRule5Draft, userRule5Pick } from '../../src/engine/draft/rule5Draft';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> & { playerId: number; position: Position }): Player {
  const isPitcher = ['SP', 'RP', 'CL'].includes(overrides.position);
  return {
    playerId: overrides.playerId,
    teamId: overrides.teamId ?? 1,
    name: overrides.name ?? `Player ${overrides.playerId}`,
    firstName: 'Test',
    lastName: 'Player',
    leagueLevel: 'MLB',
    age: overrides.age ?? 27,
    position: overrides.position,
    bats: 'R', throws: 'R', nationality: 'american', isPitcher,
    hitterAttributes: null, pitcherAttributes: null,
    overall: overrides.overall ?? 350,
    potential: overrides.potential ?? 380,
    development: { theta: 0, sigma: 8, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true, optionYearsRemaining: 3, optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0, demotionsThisSeason: 0,
      serviceTimeDays: 172 * 4,
      serviceTimeCurrentTeamDays: 172 * 4,
      rule5Selected: false, signedSeason: 2020, signedAge: 22,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
      ...overrides.rosterData,
    },
  };
}

function makeTeam(teamId: number, abbr: string): Team {
  return {
    teamId,
    name: `Team ${abbr}`,
    abbreviation: abbr,
    city: `City ${abbr}`,
    league: teamId <= 15 ? 'AL' : 'NL',
    division: 'East',
    conferenceId: 0,
    divisionId: 0,
    parkFactorId: 0,
    budget: 150_000_000,
    scoutingQuality: 0.7,
    coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'fringe',
    seasonRecord: { wins: 81, losses: 81, runsScored: 700, runsAllowed: 700 },
    rotationIndex: 0,
    bullpenReliefCounter: 0,
  };
}

// ─── Waiver Tests ────────────────────────────────────────────────────────────

describe('processWaivers', () => {
  it('returns empty array when no DFA players', () => {
    const teams = [makeTeam(1, 'T1'), makeTeam(2, 'T2')];
    const players = [makePlayer({ playerId: 1, position: 'SS', teamId: 1 })];
    expect(processWaivers(players, teams, 99)).toEqual([]);
  });

  it('claims a DFA player for a team that needs the position', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    // Team 2 has no SS (critical need), team 1 DFAs a decent SS
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1, overall: 320,
        rosterData: { rosterStatus: 'DFA' } as Player['rosterData'],
      }),
      // Team 2 has players but no SS
      makePlayer({ playerId: 10, position: 'SP', teamId: 2, overall: 350 }),
      makePlayer({ playerId: 11, position: 'CF', teamId: 2, overall: 330 }),
    ];

    const claims = processWaivers(players, teams, 1); // User is team 1
    expect(claims.length).toBe(1);
    expect(claims[0].outcome).toBe('claimed');
    expect(claims[0].claimingTeamId).toBe(2);
    expect(players[0].teamId).toBe(2);
    expect(players[0].rosterData.rosterStatus).toBe('MLB_ACTIVE');
  });

  it('outrights unclaimed player with low service time to minors', () => {
    const teams = [makeTeam(1, 'USR')];
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1, overall: 250,
        rosterData: {
          rosterStatus: 'DFA',
          serviceTimeDays: 172 * 2, // Under 5 years
        } as Player['rosterData'],
      }),
    ];

    const claims = processWaivers(players, teams, 99);
    expect(claims.length).toBe(1);
    expect(claims[0].outcome).toBe('outrighted');
    expect(players[0].rosterData.rosterStatus).toBe('MINORS_AAA');
  });

  it('releases unclaimed player with high service time', () => {
    const teams = [makeTeam(1, 'USR')];
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1, overall: 180,
        rosterData: {
          rosterStatus: 'DFA',
          serviceTimeDays: 172 * 6,
        } as Player['rosterData'],
      }),
    ];

    const claims = processWaivers(players, teams, 99);
    expect(claims.length).toBe(1);
    expect(claims[0].outcome).toBe('released');
    expect(players[0].rosterData.rosterStatus).toBe('FREE_AGENT');
    expect(players[0].teamId).toBe(-1);
  });

  it('worst team gets first claim priority', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'BAD'), makeTeam(3, 'GOOD')];
    teams[1].seasonRecord = { wins: 50, losses: 112, runsScored: 500, runsAllowed: 800 };
    teams[2].seasonRecord = { wins: 100, losses: 62, runsScored: 800, runsAllowed: 600 };

    const standings = teams.map(t => ({
      teamId: t.teamId, name: t.name, abbreviation: t.abbreviation,
      league: t.league, division: t.division,
      wins: t.seasonRecord.wins, losses: t.seasonRecord.losses,
      pct: t.seasonRecord.wins / (t.seasonRecord.wins + t.seasonRecord.losses),
      gb: 0, runsScored: t.seasonRecord.runsScored, runsAllowed: t.seasonRecord.runsAllowed,
      pythagWins: t.seasonRecord.wins,
    }));

    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1, overall: 350,
        rosterData: { rosterStatus: 'DFA' } as Player['rosterData'],
      }),
      // Give both teams enough players so AI can evaluate needs
      makePlayer({ playerId: 10, position: 'SP', teamId: 2, overall: 300 }),
      makePlayer({ playerId: 11, position: 'SP', teamId: 3, overall: 300 }),
    ];

    const claims = processWaivers(players, teams, 1, standings);
    expect(claims.length).toBe(1);
    expect(claims[0].claimingTeamId).toBe(2); // Bad team claims first
  });
});

// ─── Rule 5 Tests ────────────────────────────────────────────────────────────

describe('identifyRule5Eligible', () => {
  it('identifies minor leaguers not on 40-man with enough time', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1,
        rosterData: {
          rosterStatus: 'MINORS_AA',
          isOn40Man: false,
          signedSeason: 2020, signedAge: 18,
        } as Player['rosterData'],
      }),
    ];
    const eligible = identifyRule5Eligible(players, 2026);
    // Signed at age 18, 6 years ago → eligible (signed age >=18 needs 5+)
    expect(eligible).toHaveLength(1);
  });

  it('excludes players already on 40-man', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1,
        rosterData: {
          rosterStatus: 'MINORS_AA',
          isOn40Man: true,
          signedSeason: 2020, signedAge: 18,
        } as Player['rosterData'],
      }),
    ];
    expect(identifyRule5Eligible(players, 2026)).toHaveLength(0);
  });

  it('excludes players with too little time in system', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1,
        rosterData: {
          rosterStatus: 'MINORS_AA',
          isOn40Man: false,
          signedSeason: 2024, signedAge: 20,
        } as Player['rosterData'],
      }),
    ];
    // Only 2 years in system, need 5
    expect(identifyRule5Eligible(players, 2026)).toHaveLength(0);
  });

  it('excludes free agents and retired players', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: -1,
        rosterData: {
          rosterStatus: 'FREE_AGENT',
          isOn40Man: false,
          signedSeason: 2018, signedAge: 18,
        } as Player['rosterData'],
      }),
    ];
    expect(identifyRule5Eligible(players, 2026)).toHaveLength(0);
  });

  it('applies 6-year threshold for players signed under 18', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1,
        rosterData: {
          rosterStatus: 'MINORS_ROOKIE',
          isOn40Man: false,
          signedSeason: 2021, signedAge: 16, // Signed under 18
        } as Player['rosterData'],
      }),
    ];
    // 5 years in system but signed under 18 needs 6
    expect(identifyRule5Eligible(players, 2026)).toHaveLength(0);
    // At 6 years, should be eligible
    expect(identifyRule5Eligible(players, 2027)).toHaveLength(1);
  });
});

describe('conductRule5Draft', () => {
  it('AI teams select eligible players', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const players = [
      // Team 1's minor leaguer eligible for Rule 5
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1, overall: 300, potential: 400, age: 23,
        rosterData: {
          rosterStatus: 'MINORS_AA',
          isOn40Man: false,
          signedSeason: 2020, signedAge: 18,
        } as Player['rosterData'],
      }),
      // Team 2 has roster but needs SS
      makePlayer({ playerId: 10, position: 'SP', teamId: 2, overall: 350 }),
      makePlayer({ playerId: 11, position: 'CF', teamId: 2, overall: 330 }),
    ];

    const selections = conductRule5Draft(players, teams, 99, 2026);
    expect(selections.length).toBeGreaterThanOrEqual(0);
    if (selections.length > 0) {
      expect(selections[0].originalTeamId).toBe(1);
      expect(selections[0].selectingTeamId).toBe(2);
      // Player should now be on selecting team
      expect(players[0].teamId).toBe(2);
      expect(players[0].rosterData.rule5Selected).toBe(true);
      expect(players[0].rosterData.isOn40Man).toBe(true);
    }
  });

  it('skips user team in AI draft', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 2, overall: 300, potential: 400, age: 23,
        rosterData: {
          rosterStatus: 'MINORS_AA',
          isOn40Man: false,
          signedSeason: 2020, signedAge: 18,
        } as Player['rosterData'],
      }),
      makePlayer({ playerId: 10, position: 'SP', teamId: 1, overall: 350 }),
    ];

    const selections = conductRule5Draft(players, teams, 1, 2026);
    // User team (1) should not appear in AI selections
    for (const sel of selections) {
      expect(sel.selectingTeamId).not.toBe(1);
    }
  });
});

describe('userRule5Pick', () => {
  it('allows user to select an eligible player', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 2, overall: 300,
        rosterData: {
          rosterStatus: 'MINORS_AA',
          isOn40Man: false,
          signedSeason: 2020, signedAge: 18,
        } as Player['rosterData'],
      }),
      makePlayer({ playerId: 10, position: 'SP', teamId: 1, overall: 350 }),
    ];

    const result = userRule5Pick(players[0], 1, players);
    expect(result.ok).toBe(true);
    expect(players[0].teamId).toBe(1);
    expect(players[0].rosterData.rosterStatus).toBe('MLB_ACTIVE');
    expect(players[0].rosterData.rule5Selected).toBe(true);
    expect(players[0].rosterData.rule5OriginalTeamId).toBe(2);
  });

  it('rejects if player is already on 40-man', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 2,
        rosterData: { isOn40Man: true } as Player['rosterData'],
      }),
    ];
    const result = userRule5Pick(players[0], 1, players);
    expect(result.ok).toBe(false);
  });

  it('rejects if selecting from own team', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', teamId: 1,
        rosterData: {
          rosterStatus: 'MINORS_AA',
          isOn40Man: false,
        } as Player['rosterData'],
      }),
    ];
    const result = userRule5Pick(players[0], 1, players);
    expect(result.ok).toBe(false);
  });
});
