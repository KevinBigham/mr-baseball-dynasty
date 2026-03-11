import { describe, it, expect } from 'vitest';
import { advanceTeamChemistry, initializeTeamChemistry } from '../../src/engine/league/teamChemistry';
import { createPRNG } from '../../src/engine/math/prng';
import type { Player } from '../../src/types/player';
import type { TeamSeason } from '../../src/types/team';

// ─── Mock builders ───────────────────────────────────────────────────────────

function makePlayer(id: number, teamId: number, overrides: Partial<Player> = {}): Player {
  return {
    playerId: id,
    teamId,
    name: `Player ${id}`,
    firstName: 'Test',
    lastName: `Player${id}`,
    age: 28,
    position: 'SS',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: false,
    hitterAttributes: {
      contact: 300, power: 300, eye: 300, speed: 300,
      baserunningIQ: 300, fielding: 300, armStrength: 300,
      durability: 300, platoonSensitivity: 0,
      offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall: 300,
    potential: 400,
    development: { theta: 0, sigma: 0, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2022,
      signedAge: 24,
      contractYearsRemaining: 3,
      salary: 2_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  } as Player;
}

/** Veteran leader: age 32+, high work ethic + mental toughness */
function makeVeteranLeader(id: number, teamId: number): Player {
  return makePlayer(id, teamId, {
    age: 33,
    hitterAttributes: {
      contact: 300, power: 300, eye: 300, speed: 300,
      baserunningIQ: 300, fielding: 300, armStrength: 300,
      durability: 300, platoonSensitivity: 0,
      offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 85, mentalToughness: 85,
    },
  });
}

/** Clubhouse disruptor: low work ethic + low mental toughness */
function makeDisruptor(id: number, teamId: number): Player {
  return makePlayer(id, teamId, {
    hitterAttributes: {
      contact: 300, power: 300, eye: 300, speed: 300,
      baserunningIQ: 300, fielding: 300, armStrength: 300,
      durability: 300, platoonSensitivity: 0,
      offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 20, mentalToughness: 25,
    },
  });
}

function makeTeamSeason(teamId: number, wins: number, losses: number): TeamSeason {
  return {
    teamId,
    season: 2026,
    wins,
    losses,
    runsScored: wins * 5,
    runsAllowed: losses * 5,
    divisionRank: wins > losses ? 1 : 3,
    playoffResult: wins >= 90 ? 'DS' : null,
  };
}

// ─── initializeTeamChemistry ─────────────────────────────────────────────────

describe('initializeTeamChemistry', () => {
  it('creates default 50/50 chemistry for all teams', () => {
    const chem = initializeTeamChemistry([1, 2, 3], 2026);
    expect(chem.size).toBe(3);
    for (const state of chem.values()) {
      expect(state.cohesion).toBe(50);
      expect(state.morale).toBe(50);
      expect(state.lastUpdatedSeason).toBe(2026);
    }
  });
});

// ─── advanceTeamChemistry ────────────────────────────────────────────────────

describe('advanceTeamChemistry — cohesion', () => {
  it('veteran leaders increase cohesion', () => {
    const players = [
      makeVeteranLeader(1, 1),
      makeVeteranLeader(2, 1),
      ...Array.from({ length: 8 }, (_, i) => makePlayer(10 + i, 1)),
    ];

    const result = advanceTeamChemistry({
      season: 2027,
      players,
      teamSeasons: new Map([[1, makeTeamSeason(1, 81, 81)]]),
      ownerProfiles: new Map(),
      previousChemistry: initializeTeamChemistry([1], 2026),
      gen: createPRNG(42),
      nextEventId: 1,
    });

    const chem = result.chemistry.get(1)!;
    expect(chem.cohesion).toBeGreaterThan(50);
  });

  it('disruptors decrease cohesion', () => {
    const players = [
      makeDisruptor(1, 1),
      makeDisruptor(2, 1),
      makeDisruptor(3, 1),
      ...Array.from({ length: 7 }, (_, i) => makePlayer(10 + i, 1)),
    ];

    const result = advanceTeamChemistry({
      season: 2027,
      players,
      teamSeasons: new Map([[1, makeTeamSeason(1, 81, 81)]]),
      ownerProfiles: new Map(),
      previousChemistry: initializeTeamChemistry([1], 2026),
      gen: createPRNG(42),
      nextEventId: 1,
    });

    const chem = result.chemistry.get(1)!;
    expect(chem.cohesion).toBeLessThan(50);
  });
});

describe('advanceTeamChemistry — morale', () => {
  it('winning teams have higher morale', () => {
    const players = Array.from({ length: 10 }, (_, i) => makePlayer(i + 1, 1));

    const result = advanceTeamChemistry({
      season: 2027,
      players,
      teamSeasons: new Map([[1, makeTeamSeason(1, 100, 62)]]),
      ownerProfiles: new Map(),
      previousChemistry: initializeTeamChemistry([1], 2026),
      gen: createPRNG(42),
      nextEventId: 1,
    });

    const chem = result.chemistry.get(1)!;
    expect(chem.morale).toBeGreaterThan(55);
  });

  it('losing teams have lower morale', () => {
    const players = Array.from({ length: 10 }, (_, i) => makePlayer(i + 1, 1));

    const result = advanceTeamChemistry({
      season: 2027,
      players,
      teamSeasons: new Map([[1, makeTeamSeason(1, 55, 107)]]),
      ownerProfiles: new Map(),
      previousChemistry: initializeTeamChemistry([1], 2026),
      gen: createPRNG(42),
      nextEventId: 1,
    });

    const chem = result.chemistry.get(1)!;
    expect(chem.morale).toBeLessThan(45);
  });
});

describe('advanceTeamChemistry — determinism', () => {
  it('same inputs produce same outputs', () => {
    const players = [
      makeVeteranLeader(1, 1),
      makeDisruptor(2, 1),
      ...Array.from({ length: 8 }, (_, i) => makePlayer(10 + i, 1)),
    ];
    const teamSeasons = new Map([[1, makeTeamSeason(1, 90, 72)]]);
    const prev = initializeTeamChemistry([1], 2026);

    const r1 = advanceTeamChemistry({
      season: 2027, players, teamSeasons,
      ownerProfiles: new Map(), previousChemistry: prev,
      gen: createPRNG(42), nextEventId: 1,
    });

    const r2 = advanceTeamChemistry({
      season: 2027, players, teamSeasons,
      ownerProfiles: new Map(), previousChemistry: prev,
      gen: createPRNG(42), nextEventId: 1,
    });

    const c1 = r1.chemistry.get(1)!;
    const c2 = r2.chemistry.get(1)!;
    expect(c1.cohesion).toBe(c2.cohesion);
    expect(c1.morale).toBe(c2.morale);
    expect(r1.events.length).toBe(r2.events.length);
  });
});

describe('advanceTeamChemistry — multi-team', () => {
  it('processes all teams independently', () => {
    const players = [
      // Team 1: all leaders
      ...Array.from({ length: 5 }, (_, i) => makeVeteranLeader(100 + i, 1)),
      // Team 2: all disruptors
      ...Array.from({ length: 5 }, (_, i) => makeDisruptor(200 + i, 2)),
    ];
    const teamSeasons = new Map([
      [1, makeTeamSeason(1, 95, 67)],
      [2, makeTeamSeason(2, 60, 102)],
    ]);

    const result = advanceTeamChemistry({
      season: 2027,
      players,
      teamSeasons,
      ownerProfiles: new Map(),
      previousChemistry: initializeTeamChemistry([1, 2], 2026),
      gen: createPRNG(42),
      nextEventId: 1,
    });

    const team1 = result.chemistry.get(1)!;
    const team2 = result.chemistry.get(2)!;

    // Team 1 (leaders + winning) should have higher chemistry than Team 2 (disruptors + losing)
    expect(team1.cohesion).toBeGreaterThan(team2.cohesion);
    expect(team1.morale).toBeGreaterThan(team2.morale);
  });
});

describe('advanceTeamChemistry — bounds', () => {
  it('cohesion and morale stay within 0–100', () => {
    // Extreme case: tons of disruptors + terrible record
    const players = Array.from({ length: 15 }, (_, i) => makeDisruptor(i + 1, 1));

    const result = advanceTeamChemistry({
      season: 2027,
      players,
      teamSeasons: new Map([[1, makeTeamSeason(1, 30, 132)]]),
      ownerProfiles: new Map(),
      previousChemistry: new Map([[1, { teamId: 1, cohesion: 5, morale: 5, lastUpdatedSeason: 2026 }]]),
      gen: createPRNG(42),
      nextEventId: 1,
    });

    const chem = result.chemistry.get(1)!;
    expect(chem.cohesion).toBeGreaterThanOrEqual(0);
    expect(chem.cohesion).toBeLessThanOrEqual(100);
    expect(chem.morale).toBeGreaterThanOrEqual(0);
    expect(chem.morale).toBeLessThanOrEqual(100);
  });
});
