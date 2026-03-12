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

function makePitcher(overrides: Partial<Player> = {}): Player {
  return {
    playerId: 1,
    teamId: 1,
    name: 'Test Pitcher',
    age: 28,
    position: 'SP',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: true,
    hitterAttributes: null,
    pitcherAttributes: {
      velocity: 300, control: 300, movement: 300,
      stamina: 300, armSlot: 300,
      durability: 300, mentalToughness: 50,
      workEthic: 50, platoonSensitivity: 0,
    },
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

describe('franchiseRecords — Infinity fix for 0 outs', () => {
  it('should not produce Infinity ERA for pitcher with 0 outs', () => {
    // A pitcher with 0 outs would previously produce Infinity ERA.
    // The fix returns 99.99 instead, which is then filtered by the
    // !isFinite check in checkCandidate (99.99 IS finite, but
    // it's a sentinel value — the key point is no Infinity leaks).
    const stats = makeSeason({
      playerId: 1,
      teamId: USER_TEAM_ID,
      season: 2026,
      gp: 1,
      gs: 0,
      outs: 0,      // 0 outs — edge case
      er: 5,
      ha: 3,
      bba: 2,
      ka: 0,
      hra: 1,
      w: 0,
      l: 1,
      sv: 0,
    });

    const seasonStats = new Map([[1, stats]]);
    const careerHistory = new Map([[1, [stats]]]);
    const playerMap = new Map([[1, makePitcher({ playerId: 1, name: 'Zero Outs Guy' })]]);
    const teamRecord = { wins: 80, losses: 82 };

    const { records } = updateFranchiseRecords(
      emptyRecordBook(), seasonStats, careerHistory, playerMap,
      teamRecord, 2026, USER_TEAM_ID,
    );

    // With 0 outs (< 100 outs threshold), no single-season pitching
    // candidates are generated, so no records should appear.
    // But even in the career path, ERA should not be Infinity.
    for (const rec of records.singleSeasonPitching) {
      expect(rec.value).not.toBe(Infinity);
      expect(rec.value).not.toBe(-Infinity);
      expect(isFinite(rec.value)).toBe(true);
    }
    for (const rec of records.careerPitching) {
      expect(rec.value).not.toBe(Infinity);
      expect(rec.value).not.toBe(-Infinity);
      expect(isFinite(rec.value)).toBe(true);
    }
  });

  it('should not produce Infinity WHIP for pitcher with 0 outs', () => {
    // Even via career aggregation, 0 total outs should not produce
    // Infinity WHIP in any record.
    const stats = makeSeason({
      playerId: 1,
      teamId: USER_TEAM_ID,
      season: 2026,
      gp: 1,
      gs: 0,
      outs: 0,
      er: 3,
      ha: 4,
      bba: 3,
      ka: 0,
      hra: 0,
      w: 0,
      l: 1,
      sv: 0,
    });

    const seasonStats = new Map([[1, stats]]);
    const careerHistory = new Map([[1, [stats]]]);
    const playerMap = new Map([[1, makePitcher({ playerId: 1, name: 'No Innings' })]]);
    const teamRecord = { wins: 81, losses: 81 };

    const { records } = updateFranchiseRecords(
      emptyRecordBook(), seasonStats, careerHistory, playerMap,
      teamRecord, 2026, USER_TEAM_ID,
    );

    // Verify no WHIP record has Infinity
    const whipRecords = [
      ...records.singleSeasonPitching.filter(r => r.category === 'WHIP'),
      ...records.careerPitching.filter(r => r.category === 'WHIP'),
    ];
    for (const rec of whipRecords) {
      expect(isFinite(rec.value)).toBe(true);
      expect(rec.value).not.toBe(Infinity);
    }
  });

  it('computeERA returns finite value for normal stats', () => {
    // A pitcher with normal stats should produce valid records
    // with finite ERA values.
    const stats = makeSeason({
      playerId: 1,
      teamId: USER_TEAM_ID,
      season: 2026,
      gp: 32,
      gs: 32,
      outs: 600,    // 200 IP
      er: 70,
      ha: 170,
      bba: 50,
      ka: 200,
      hra: 20,
      w: 15,
      l: 8,
      sv: 0,
    });

    const seasonStats = new Map([[1, stats]]);
    const careerHistory = new Map([[1, [stats]]]);
    const playerMap = new Map([[1, makePitcher({ playerId: 1, name: 'Ace Pitcher' })]]);
    const teamRecord = { wins: 95, losses: 67 };

    const { records } = updateFranchiseRecords(
      emptyRecordBook(), seasonStats, careerHistory, playerMap,
      teamRecord, 2026, USER_TEAM_ID,
    );

    // Should have pitching records since outs >= 100
    expect(records.singleSeasonPitching.length).toBeGreaterThan(0);

    // ERA should be a finite, reasonable value
    const eraRecord = records.singleSeasonPitching.find(r => r.category === 'ERA');
    expect(eraRecord).toBeDefined();
    expect(isFinite(eraRecord!.value)).toBe(true);
    // ERA = (70 / 600) * 27 = 3.15
    expect(eraRecord!.value).toBeCloseTo(3.15, 1);
  });
});
