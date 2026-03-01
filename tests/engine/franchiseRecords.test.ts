import { describe, it, expect } from 'vitest';
import { emptyRecordBook, updateFranchiseRecords } from '../../src/engine/franchiseRecords';
import type { PlayerSeasonStats, Player } from '../../src/types/player';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSeason(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 1, teamId: 1, season: 2026,
    g: 0, pa: 0, ab: 0, r: 0, h: 0,
    doubles: 0, triples: 0, hr: 0,
    rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0,
    w: 0, l: 0, sv: 0, hld: 0, bs: 0,
    gp: 0, gs: 0, outs: 0,
    ha: 0, ra: 0, er: 0, bba: 0, ka: 0, hra: 0,
    pitchCount: 0,
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    playerId: 1,
    teamId: 1,
    name: 'Test Player',
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
      serviceTimeDays: 1000,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2020,
      signedAge: 22,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  } as Player;
}

const USER_TEAM_ID = 1;

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('emptyRecordBook', () => {
  it('returns empty arrays for all categories', () => {
    const book = emptyRecordBook();
    expect(book.singleSeasonHitting).toEqual([]);
    expect(book.singleSeasonPitching).toEqual([]);
    expect(book.careerHitting).toEqual([]);
    expect(book.careerPitching).toEqual([]);
    expect(book.teamRecords).toEqual([]);
  });
});

describe('updateFranchiseRecords', () => {
  it('first season sets all records', () => {
    const stats = makeSeason({
      playerId: 1, teamId: USER_TEAM_ID, season: 2026,
      g: 150, pa: 600, ab: 550, h: 170,
      doubles: 30, triples: 5, hr: 30,
      rbi: 100, bb: 40, hbp: 5, k: 120, sb: 10,
    });

    const seasonStats = new Map([[1, stats]]);
    const careerHistory = new Map([[1, [stats]]]);
    const playerMap = new Map([[1, makePlayer({ playerId: 1, name: 'Slugger' })]]);
    const teamRecord = { wins: 90, losses: 72 };

    const { records, newRecords } = updateFranchiseRecords(
      emptyRecordBook(), seasonStats, careerHistory, playerMap,
      teamRecord, 2026, USER_TEAM_ID,
    );

    // Should have created single-season hitting records
    expect(records.singleSeasonHitting.length).toBeGreaterThan(0);
    // HR record should be 30
    const hrRecord = records.singleSeasonHitting.find(r => r.category === 'HR');
    expect(hrRecord).toBeDefined();
    expect(hrRecord!.value).toBe(30);
    expect(hrRecord!.playerName).toBe('Slugger');

    // Team records should be populated
    expect(records.teamRecords.length).toBeGreaterThanOrEqual(2);

    // New records array should be non-empty on first run
    expect(newRecords.length).toBeGreaterThan(0);
  });

  it('better value replaces existing record', () => {
    // First season: 30 HR
    const stats1 = makeSeason({
      playerId: 1, teamId: USER_TEAM_ID, season: 2026,
      g: 150, pa: 600, ab: 550, h: 170,
      doubles: 30, triples: 5, hr: 30,
      rbi: 100, bb: 40, hbp: 5, sb: 10,
    });

    const playerMap = new Map([
      [1, makePlayer({ playerId: 1, name: 'Slugger' })],
      [2, makePlayer({ playerId: 2, name: 'Power Hitter' })],
    ]);

    const { records: book1 } = updateFranchiseRecords(
      emptyRecordBook(),
      new Map([[1, stats1]]),
      new Map([[1, [stats1]]]),
      playerMap,
      { wins: 85, losses: 77 },
      2026,
      USER_TEAM_ID,
    );

    // Second season: 45 HR by a different player — should replace
    const stats2 = makeSeason({
      playerId: 2, teamId: USER_TEAM_ID, season: 2027,
      g: 155, pa: 650, ab: 580, h: 180,
      doubles: 25, triples: 3, hr: 45,
      rbi: 120, bb: 50, hbp: 8, sb: 5,
    });

    const { records: book2 } = updateFranchiseRecords(
      book1,
      new Map([[2, stats2]]),
      new Map([[2, [stats2]]]),
      playerMap,
      { wins: 92, losses: 70 },
      2027,
      USER_TEAM_ID,
    );

    const hrRecord = book2.singleSeasonHitting.find(r => r.category === 'HR');
    expect(hrRecord).toBeDefined();
    expect(hrRecord!.value).toBe(45);
    expect(hrRecord!.playerName).toBe('Power Hitter');
  });

  it('worse value does not replace existing record', () => {
    const stats1 = makeSeason({
      playerId: 1, teamId: USER_TEAM_ID, season: 2026,
      g: 150, pa: 600, ab: 550, h: 170,
      doubles: 30, triples: 5, hr: 40,
      rbi: 100, bb: 40, hbp: 5, sb: 10,
    });

    const playerMap = new Map([
      [1, makePlayer({ playerId: 1, name: 'Original Record Holder' })],
      [2, makePlayer({ playerId: 2, name: 'Challenger' })],
    ]);

    const { records: book1 } = updateFranchiseRecords(
      emptyRecordBook(),
      new Map([[1, stats1]]),
      new Map([[1, [stats1]]]),
      playerMap,
      { wins: 90, losses: 72 },
      2026,
      USER_TEAM_ID,
    );

    // Worse HR total: 20 < 40
    const stats2 = makeSeason({
      playerId: 2, teamId: USER_TEAM_ID, season: 2027,
      g: 140, pa: 550, ab: 480, h: 120,
      doubles: 20, triples: 2, hr: 20,
      rbi: 60, bb: 40, hbp: 5, sb: 5,
    });

    const { records: book2 } = updateFranchiseRecords(
      book1,
      new Map([[2, stats2]]),
      new Map([[2, [stats2]]]),
      playerMap,
      { wins: 80, losses: 82 },
      2027,
      USER_TEAM_ID,
    );

    const hrRecord = book2.singleSeasonHitting.find(r => r.category === 'HR');
    expect(hrRecord).toBeDefined();
    expect(hrRecord!.value).toBe(40);
    expect(hrRecord!.playerName).toBe('Original Record Holder');
  });

  it('only user team players are tracked', () => {
    const opponentStats = makeSeason({
      playerId: 99, teamId: 999, season: 2026,   // Different team
      g: 160, pa: 700, ab: 620, h: 220,
      doubles: 40, triples: 8, hr: 55,
      rbi: 150, bb: 60, hbp: 10, sb: 30,
    });

    const playerMap = new Map([
      [99, makePlayer({ playerId: 99, teamId: 999, name: 'Opponent Star' })],
    ]);

    const { records } = updateFranchiseRecords(
      emptyRecordBook(),
      new Map([[99, opponentStats]]),
      new Map([[99, [opponentStats]]]),
      playerMap,
      { wins: 90, losses: 72 },
      2026,
      USER_TEAM_ID,
    );

    // No hitting records should be set from opponent players
    expect(records.singleSeasonHitting).toHaveLength(0);
  });

  it('team records track best and worst records', () => {
    const playerMap = new Map([
      [1, makePlayer({ playerId: 1, name: 'Player' })],
    ]);
    const dummyStats = makeSeason({ playerId: 1, teamId: USER_TEAM_ID, season: 2026 });

    // Season 1: 95-67
    const { records: book1 } = updateFranchiseRecords(
      emptyRecordBook(),
      new Map([[1, dummyStats]]),
      new Map([[1, [dummyStats]]]),
      playerMap,
      { wins: 95, losses: 67 },
      2026,
      USER_TEAM_ID,
    );

    // Season 2: 70-92 (worse)
    const dummyStats2 = makeSeason({ playerId: 1, teamId: USER_TEAM_ID, season: 2027 });
    const { records: book2 } = updateFranchiseRecords(
      book1,
      new Map([[1, dummyStats2]]),
      new Map([[1, [dummyStats, dummyStats2]]]),
      playerMap,
      { wins: 70, losses: 92 },
      2027,
      USER_TEAM_ID,
    );

    const best = book2.teamRecords.find(r => r.category === 'Best Record');
    const worst = book2.teamRecords.find(r => r.category === 'Worst Record');

    expect(best).toBeDefined();
    expect(best!.value).toBe('95-67');
    expect(best!.season).toBe(2026);

    expect(worst).toBeDefined();
    expect(worst!.value).toBe('70-92');
    expect(worst!.season).toBe(2027);
  });
});
