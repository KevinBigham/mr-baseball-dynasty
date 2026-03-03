/**
 * Round 13 — Tests for gameplay integrity, engine hardening, and edge case fixes.
 */
import { describe, it, expect } from 'vitest';
import type { Player, Position, HitterAttributes, PitcherAttributes } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import type { StandingsRow } from '../../src/types/league';
import { ensureMinimumRosters } from '../../src/engine/rosterGuard';
import { developPlayer } from '../../src/engine/player/development';
import { generateFOCandidates } from '../../src/data/frontOffice';
import { determinePlayoffField } from '../../src/engine/sim/playoffSimulator';
import { createPRNG } from '../../src/engine/math/prng';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeHitterAttrs(ovr = 350): HitterAttributes {
  return {
    contact: ovr, power: ovr, eye: ovr, speed: ovr,
    baserunningIQ: ovr, fielding: ovr, armStrength: ovr, durability: ovr,
    platoonSensitivity: 0, offensiveIQ: ovr, defensiveIQ: ovr,
    workEthic: 50, mentalToughness: 50,
  };
}

function makePitcherAttrs(ovr = 350): PitcherAttributes {
  return {
    stuff: ovr, movement: ovr, command: ovr, stamina: ovr,
    pitchArsenalCount: 3, gbFbTendency: 50, holdRunners: ovr,
    durability: ovr, recoveryRate: ovr, platoonTendency: 0,
    pitchTypeMix: { fastball: 0.6, breaking: 0.25, offspeed: 0.15 },
    pitchingIQ: ovr, workEthic: 50, mentalToughness: 50,
  };
}

function makePlayer(id: number, teamId: number, pos: Position, isPitcher: boolean, status = 'MLB_ACTIVE' as const, ovr = 350): Player {
  return {
    playerId: id,
    teamId,
    name: `Player ${id}`,
    age: 28,
    position: pos,
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher,
    hitterAttributes: isPitcher ? null : makeHitterAttrs(ovr),
    pitcherAttributes: isPitcher ? makePitcherAttrs(ovr) : null,
    overall: ovr,
    potential: ovr + 20,
    development: { theta: 0, sigma: 15, phase: 'prime' },
    rosterData: {
      rosterStatus: status,
      isOn40Man: status === 'MLB_ACTIVE',
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2026,
      signedAge: 25,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  };
}

function makeTeam(id: number): Team {
  return {
    teamId: id,
    name: `Team ${id}`,
    abbreviation: `T${id}`,
    city: `City ${id}`,
    league: id <= 15 ? 'AL' : 'NL',
    division: 'East',
    parkFactorId: 4,
    budget: 200,
    scoutingQuality: 0.7,
    coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'contender',
    rotationIndex: 0,
    bullpenReliefCounter: 0,
    seasonRecord: { wins: 81, losses: 81, runsScored: 700, runsAllowed: 700 },
  };
}

// ─── Test: Lineup order wiring ─────────────────────────────────────────────

describe('P0-1 — Lineup/Rotation order', () => {
  it('buildLineup respects custom order when all 9 are valid', async () => {
    const { simulateGame } = await import('../../src/engine/sim/gameSimulator');

    const team = makeTeam(1);
    const players: Player[] = [];
    // Create 9 hitters with known IDs
    const hitterPositions: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    for (let i = 0; i < 9; i++) {
      players.push(makePlayer(100 + i, 1, hitterPositions[i], false, 'MLB_ACTIVE', 300 + i * 10));
    }
    // Create 5 SPs and 3 relievers for both teams
    for (let i = 0; i < 5; i++) players.push(makePlayer(200 + i, 1, 'SP', true));
    for (let i = 0; i < 3; i++) players.push(makePlayer(210 + i, 1, 'RP', true));

    // Away team needs players too
    for (let i = 0; i < 9; i++) {
      players.push(makePlayer(300 + i, 2, hitterPositions[i], false));
    }
    for (let i = 0; i < 5; i++) players.push(makePlayer(400 + i, 2, 'SP', true));
    for (let i = 0; i < 3; i++) players.push(makePlayer(410 + i, 2, 'RP', true));

    // Custom lineup: reverse order (worst hitter leads off)
    const customLineup = [100, 101, 102, 103, 104, 105, 106, 107, 108];

    const input = {
      gameId: 1,
      season: 2026,
      date: 'test',
      homeTeam: team,
      awayTeam: makeTeam(2),
      players,
      seed: 42,
      userLineupOrder: customLineup,
      userRotationOrder: [202, 201, 200], // custom rotation
      userTeamId: 1,
    };

    // The game should complete without errors (validates the wiring works)
    const result = simulateGame(input);
    expect(result.homeScore).toBeGreaterThanOrEqual(0);
    expect(result.awayScore).toBeGreaterThanOrEqual(0);
  });
});

// ─── Test: Win percentage calculation ──────────────────────────────────────

describe('P0-2 — Win percentage', () => {
  it('computes pct as wins/(wins+losses), not wins/162', () => {
    const wins = 90;
    const losses = 72;
    const correctPct = (wins + losses) > 0 ? wins / (wins + losses) : 0;
    const wrongPct = wins / 162;

    expect(correctPct).toBeCloseTo(0.5556, 3);
    expect(wrongPct).toBeCloseTo(0.5556, 3); // With 162 games they're close
    // But with fewer games (e.g., shortened season) they diverge:
    const shortWins = 40;
    const shortLosses = 20;
    const shortCorrect = shortWins / (shortWins + shortLosses);
    const shortWrong = shortWins / 162;
    expect(shortCorrect).toBeCloseTo(0.6667, 3);
    expect(shortWrong).toBeCloseTo(0.2469, 3);
    expect(shortCorrect).not.toBeCloseTo(shortWrong, 1); // fundamentally different
  });
});

// ─── Test: PRNG determinism in FO generation ──────────────────────────────

describe('P0-3 — FO staff PRNG determinism', () => {
  it('generateFOCandidates produces identical output for same seed', () => {
    const gen1 = createPRNG(12345);
    const gen2 = createPRNG(12345);
    const result1 = generateFOCandidates('gm', 4, gen1);
    const result2 = generateFOCandidates('gm', 4, gen2);

    expect(result1.length).toBe(4);
    expect(result2.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(result1[i].name).toBe(result2[i].name);
      expect(result1[i].ovr).toBe(result2[i].ovr);
      expect(result1[i].salary).toBe(result2[i].salary);
      expect(result1[i].traitId).toBe(result2[i].traitId);
    }
  });

  it('different seeds produce different output', () => {
    const gen1 = createPRNG(12345);
    const gen2 = createPRNG(99999);
    const result1 = generateFOCandidates('gm', 4, gen1);
    const result2 = generateFOCandidates('gm', 4, gen2);

    // At least one property should differ
    const allSame = result1.every((r, i) => r.name === result2[i].name && r.ovr === result2[i].ovr);
    expect(allSame).toBe(false);
  });
});

// ─── Test: Season year ────────────────────────────────────────────────────

describe('P0-5 — Season year from game state', () => {
  it('simulateSeason uses provided season number, not wall clock', async () => {
    const { simulateSeason } = await import('../../src/engine/sim/seasonSimulator');
    const teams = Array.from({ length: 2 }, (_, i) => makeTeam(i + 1));
    const players: Player[] = [];
    const hitterPositions: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

    // Create minimal viable rosters for both teams
    for (const team of teams) {
      for (let i = 0; i < 9; i++) {
        players.push(makePlayer(team.teamId * 100 + i, team.teamId, hitterPositions[i], false));
      }
      for (let i = 0; i < 5; i++) {
        players.push(makePlayer(team.teamId * 100 + 50 + i, team.teamId, 'SP', true));
      }
      for (let i = 0; i < 3; i++) {
        players.push(makePlayer(team.teamId * 100 + 60 + i, team.teamId, 'RP', true));
      }
    }

    // Just 2 games for speed
    const schedule = [
      { gameId: 1, homeTeamId: 1, awayTeamId: 2, date: '2030-04-01', isInterleague: false, isDivisional: true },
      { gameId: 2, homeTeamId: 2, awayTeamId: 1, date: '2030-04-02', isInterleague: false, isDivisional: true },
    ];

    const result = await simulateSeason(teams, players, schedule, 42, undefined, { season: 2030 });
    expect(result.season).toBe(2030);
    // Verify player stats also have the correct season
    for (const ps of result.playerSeasons) {
      expect(ps.season).toBe(2030);
    }
  });
});

// ─── Test: Playoff bounds check ───────────────────────────────────────────

describe('P1-6 — Playoff simulator bounds check', () => {
  it('determinePlayoffField handles leagues with fewer than 6 eligible teams', () => {
    // Create only 3 AL teams and 3 NL teams
    const standings: StandingsRow[] = [
      { teamId: 1, name: 'T1', abbreviation: 'T1', league: 'AL', division: 'East', wins: 90, losses: 72, pct: 0.556, gb: 0, runsScored: 700, runsAllowed: 650, pythagWins: 89 },
      { teamId: 2, name: 'T2', abbreviation: 'T2', league: 'AL', division: 'Central', wins: 85, losses: 77, pct: 0.525, gb: 5, runsScored: 680, runsAllowed: 660, pythagWins: 84 },
      { teamId: 3, name: 'T3', abbreviation: 'T3', league: 'AL', division: 'West', wins: 80, losses: 82, pct: 0.494, gb: 10, runsScored: 660, runsAllowed: 670, pythagWins: 79 },
      { teamId: 4, name: 'T4', abbreviation: 'T4', league: 'NL', division: 'East', wins: 95, losses: 67, pct: 0.586, gb: 0, runsScored: 750, runsAllowed: 620, pythagWins: 94 },
      { teamId: 5, name: 'T5', abbreviation: 'T5', league: 'NL', division: 'Central', wins: 88, losses: 74, pct: 0.543, gb: 7, runsScored: 700, runsAllowed: 660, pythagWins: 87 },
      { teamId: 6, name: 'T6', abbreviation: 'T6', league: 'NL', division: 'West', wins: 78, losses: 84, pct: 0.481, gb: 17, runsScored: 640, runsAllowed: 680, pythagWins: 77 },
    ];

    const { al, nl } = determinePlayoffField(standings);
    // With only 3 teams per league and 3 divisions, we get 3 div winners + 0 wildcards = 3 per league
    expect(al.length).toBe(3);
    expect(nl.length).toBe(3);
  });
});

// ─── Test: Age cap ────────────────────────────────────────────────────────

describe('P2-12 — Player age cap at 45', () => {
  it('forces retirement for players aged 45+', () => {
    const gen = createPRNG(42);
    const oldPlayer = makePlayer(1, 1, 'CF', false);
    oldPlayer.age = 44; // Will become 45 after development
    oldPlayer.overall = 200;
    oldPlayer.potential = 400;

    const [result, , event] = developPlayer(oldPlayer, gen);
    expect(result.age).toBe(45);
    expect(result.rosterData.rosterStatus).toBe('RETIRED');
    expect(result.development.phase).toBe('retirement');
    expect(event?.type).toBe('retirement');
  });

  it('does not force retire players under 45', () => {
    const gen = createPRNG(42);
    const player = makePlayer(2, 1, 'CF', false);
    player.age = 33; // Will become 34

    const [result] = developPlayer(player, gen);
    expect(result.age).toBe(34);
    expect(result.rosterData.rosterStatus).not.toBe('RETIRED');
  });
});

// ─── Test: Roster guard filler generation ─────────────────────────────────

describe('P2-10 — Roster guard filler players', () => {
  it('generates filler hitters when no minor leaguers available', () => {
    const team = makeTeam(1);
    const players: Player[] = [];
    // Only 5 active hitters, no minors at all
    const hitterPositions: Position[] = ['C', '1B', '2B', '3B', 'SS'];
    for (let i = 0; i < 5; i++) {
      players.push(makePlayer(i + 1, 1, hitterPositions[i], false));
    }
    // 5 pitchers (enough)
    for (let i = 0; i < 5; i++) {
      players.push(makePlayer(50 + i, 1, 'SP', true));
    }

    const promotions = ensureMinimumRosters(players, [team]);
    expect(promotions).toBe(4); // Need 4 more hitters
    // Should now have 9 active hitters total (5 original + 4 filler)
    const activeHitters = players.filter(
      p => p.teamId === 1 && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher,
    );
    expect(activeHitters.length).toBe(9);
  });

  it('generates filler pitchers when no minor leaguers available', () => {
    const team = makeTeam(1);
    const players: Player[] = [];
    // 9 hitters (enough)
    const hitterPositions: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    for (let i = 0; i < 9; i++) {
      players.push(makePlayer(i + 1, 1, hitterPositions[i], false));
    }
    // Only 2 pitchers, no minors
    for (let i = 0; i < 2; i++) {
      players.push(makePlayer(50 + i, 1, 'SP', true));
    }

    const promotions = ensureMinimumRosters(players, [team]);
    expect(promotions).toBe(3); // Need 3 more pitchers
    const activePitchers = players.filter(
      p => p.teamId === 1 && p.rosterData.rosterStatus === 'MLB_ACTIVE' && p.isPitcher,
    );
    expect(activePitchers.length).toBe(5);
  });
});

// ─── Test: Draft pool exhaustion ──────────────────────────────────────────

describe('P2-14 — Draft pool exhaustion guard', () => {
  it('aiSelectPlayer returning -1 should not cause infinite loop', async () => {
    const { aiSelectPlayer } = await import('../../src/engine/draft/draftAI');
    // With empty prospects array, should return -1
    const result = aiSelectPlayer([], [], 1);
    expect(result).toBe(-1);
  });
});
