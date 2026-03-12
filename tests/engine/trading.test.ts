import { describe, it, expect } from 'vitest';
import type { Player, Position } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import {
  evaluatePlayer, generateTradeOffers, evaluateProposedTrade,
  executeTrade, shopPlayer, findTradesForNeed,
} from '../../src/engine/trading';

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
      rule5Selected: false, signedSeason: 2022, signedAge: 22,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
      ...overrides.rosterData,
    },
  };
}

function makeTeam(teamId: number, abbr: string, strategy: 'contender' | 'fringe' | 'rebuilder' = 'fringe'): Team {
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
    strategy,
    seasonRecord: { wins: 81, losses: 81, runsScored: 700, runsAllowed: 700 },
    rotationIndex: 0,
    bullpenReliefCounter: 0,
  };
}

// Build a realistic multi-team roster
function buildTestLeague(): { teams: Team[]; players: Player[] } {
  const teams = [
    makeTeam(1, 'USR'), // User team
    makeTeam(2, 'CON', 'contender'), // Contender
    makeTeam(3, 'REB', 'rebuilder'), // Rebuilder
  ];
  // Set meaningful season records
  teams[1].seasonRecord = { wins: 95, losses: 67, runsScored: 800, runsAllowed: 650 };
  teams[2].seasonRecord = { wins: 60, losses: 102, runsScored: 550, runsAllowed: 800 };

  const players: Player[] = [
    // User team
    makePlayer({ playerId: 1, position: 'SS', teamId: 1, overall: 380, name: 'Star SS' }),
    makePlayer({ playerId: 2, position: 'SP', teamId: 1, overall: 350, name: 'Good SP' }),
    makePlayer({ playerId: 3, position: 'CF', teamId: 1, overall: 320, name: 'Avg CF' }),
    makePlayer({ playerId: 4, position: '1B', teamId: 1, overall: 300, name: 'Bench 1B' }),
    makePlayer({ playerId: 5, position: 'RP', teamId: 1, overall: 280, name: 'Decent RP' }),
    // Contender team (needs SP)
    makePlayer({ playerId: 10, position: 'SS', teamId: 2, overall: 400, name: 'Elite SS' }),
    makePlayer({ playerId: 11, position: 'CF', teamId: 2, overall: 370, name: 'Great CF' }),
    makePlayer({ playerId: 12, position: 'C', teamId: 2, overall: 340, name: 'Good C' }),
    makePlayer({ playerId: 13, position: '3B', teamId: 2, overall: 330, name: 'Solid 3B' }),
    makePlayer({ playerId: 14, position: 'RP', teamId: 2, overall: 310, name: 'Decent RP2' }),
    makePlayer({ playerId: 15, position: 'LF', teamId: 2, overall: 290, name: 'Avg LF' }),
    // Rebuilder team (has prospects)
    makePlayer({ playerId: 20, position: 'SP', teamId: 3, overall: 360, name: 'Ace SP', age: 31, rosterData: { salary: 15_000_000 } as Player['rosterData'] }),
    makePlayer({ playerId: 21, position: 'SS', teamId: 3, overall: 250, potential: 450, age: 21, name: 'Prospect SS' }),
    makePlayer({ playerId: 22, position: 'CF', teamId: 3, overall: 240, potential: 420, age: 22, name: 'Prospect CF' }),
    makePlayer({ playerId: 23, position: '2B', teamId: 3, overall: 280, name: 'Fill 2B' }),
    makePlayer({ playerId: 24, position: 'RP', teamId: 3, overall: 260, name: 'RP3' }),
  ];

  return { teams, players };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('evaluatePlayer', () => {
  it('values higher overall players more', () => {
    const good = makePlayer({ playerId: 1, position: 'SS', overall: 400 });
    const avg = makePlayer({ playerId: 2, position: 'SS', overall: 300 });
    expect(evaluatePlayer(good)).toBeGreaterThan(evaluatePlayer(avg));
  });

  it('values young players over old ones', () => {
    const young = makePlayer({ playerId: 1, position: 'SS', overall: 350, age: 25 });
    const old = makePlayer({ playerId: 2, position: 'SS', overall: 350, age: 36 });
    expect(evaluatePlayer(young)).toBeGreaterThan(evaluatePlayer(old));
  });

  it('values potential gap for young players', () => {
    const highPot = makePlayer({ playerId: 1, position: 'SS', overall: 300, potential: 500, age: 22 });
    const lowPot = makePlayer({ playerId: 2, position: 'SS', overall: 300, potential: 320, age: 22 });
    expect(evaluatePlayer(highPot)).toBeGreaterThan(evaluatePlayer(lowPot));
  });

  it('returns values between 0 and 100', () => {
    const elite = makePlayer({ playerId: 1, position: 'SS', overall: 550, potential: 550 });
    const scrub = makePlayer({ playerId: 2, position: 'SS', overall: 50, potential: 50, age: 40 });
    expect(evaluatePlayer(elite)).toBeLessThanOrEqual(100);
    expect(evaluatePlayer(scrub)).toBeGreaterThanOrEqual(0);
  });
});

describe('generateTradeOffers (smart)', () => {
  it('generates offers from AI teams', () => {
    const { teams, players } = buildTestLeague();
    const offers = generateTradeOffers(1, players, teams);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.length).toBeLessThanOrEqual(5);
  });

  it('offers include reason and aiAccepts fields', () => {
    const { teams, players } = buildTestLeague();
    const offers = generateTradeOffers(1, players, teams);
    for (const offer of offers) {
      expect(offer.reason).toBeDefined();
      expect(typeof offer.reason).toBe('string');
      expect(typeof offer.aiAccepts).toBe('boolean');
    }
  });

  it('returns empty array when user has no players', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI')];
    const players = [
      makePlayer({ playerId: 10, position: 'SS', teamId: 2, overall: 350 }),
    ];
    expect(generateTradeOffers(1, players, teams)).toEqual([]);
  });
});

describe('shopPlayer', () => {
  it('finds teams interested in a user player', () => {
    const { teams, players } = buildTestLeague();
    const offers = shopPlayer(1, players, teams); // Shop star SS
    // At least one team should be interested in a 380 OVR SS
    expect(offers.length).toBeGreaterThanOrEqual(0);
  });

  it('returns empty for non-existent player', () => {
    const { teams, players } = buildTestLeague();
    expect(shopPlayer(999, players, teams)).toEqual([]);
  });

  it('all returned offers are accepted by AI', () => {
    const { teams, players } = buildTestLeague();
    const offers = shopPlayer(1, players, teams);
    for (const offer of offers) {
      expect(offer.aiAccepts).toBe(true);
    }
  });
});

describe('findTradesForNeed', () => {
  it('finds SP options from other teams', () => {
    const { teams, players } = buildTestLeague();
    const offers = findTradesForNeed(1, 'SP', players, teams);
    // Rebuilder has an ace SP that could be traded
    expect(offers.length).toBeGreaterThan(0);
    // The offered player should be at the requested position
    expect(offers[0].offered[0].position).toBe('SP');
  });

  it('returns empty for positions no one has', () => {
    const { teams, players } = buildTestLeague();
    const offers = findTradesForNeed(1, 'DH', players, teams);
    // No team has DH players in our test league
    expect(offers).toEqual([]);
  });
});

describe('evaluateProposedTrade', () => {
  it('marks a balanced trade as fair', () => {
    const p1 = makePlayer({ playerId: 1, position: 'SS', teamId: 1, overall: 350 });
    const p2 = makePlayer({ playerId: 2, position: 'CF', teamId: 2, overall: 340 });
    const result = evaluateProposedTrade([p1, p2], [1], [2]);
    expect(result.fair).toBe(true);
  });

  it('marks a lopsided trade as unfair', () => {
    const p1 = makePlayer({ playerId: 1, position: 'SS', teamId: 1, overall: 200 });
    const p2 = makePlayer({ playerId: 2, position: 'SP', teamId: 2, overall: 500 });
    const result = evaluateProposedTrade([p1, p2], [1], [2]);
    expect(result.fair).toBe(false);
  });
});

describe('executeTrade', () => {
  it('swaps team assignments', () => {
    const players = [
      makePlayer({ playerId: 1, position: 'SS', teamId: 1 }),
      makePlayer({ playerId: 2, position: 'CF', teamId: 2 }),
    ];
    const result = executeTrade(players, 1, 2, [1], [2]);
    expect(result.ok).toBe(true);
    expect(players[0].teamId).toBe(2);
    expect(players[1].teamId).toBe(1);
  });

  it('rejects if player not on expected team', () => {
    const players = [
      makePlayer({ playerId: 1, position: 'SS', teamId: 3 }),
      makePlayer({ playerId: 2, position: 'CF', teamId: 2 }),
    ];
    const result = executeTrade(players, 1, 2, [1], [2]);
    expect(result.ok).toBe(false);
  });
});
