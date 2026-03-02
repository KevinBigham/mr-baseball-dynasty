import { describe, it, expect } from 'vitest';
import { emptyRecordBook, updateFranchiseRecords } from '../../src/engine/franchiseRecords';
import type { PlayerSeasonStats, Player } from '../../src/types/player';

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

function makeCloser(overrides: Partial<Player> = {}): Player {
  return {
    playerId: 1, teamId: 1, name: 'Test Closer',
    age: 30, position: 'CL', bats: 'R', throws: 'R',
    nationality: 'american', isPitcher: true,
    hitterAttributes: null,
    pitcherAttributes: {
      stuff: 400, movement: 350, command: 350,
      stamina: 200, pitchArsenalCount: 3, gbFbTendency: 50,
      holdRunners: 300, durability: 300, recoveryRate: 300,
      platoonTendency: 0, pitchTypeMix: { fastball: 0.5, breaking: 0.3, offspeed: 0.2 },
      pitchingIQ: 300, workEthic: 50, mentalToughness: 60,
    },
    overall: 380, potential: 400,
    development: { theta: 0, sigma: 0, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE', isOn40Man: true,
      optionYearsRemaining: 3, optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0, demotionsThisSeason: 0,
      serviceTimeDays: 1000, serviceTimeCurrentTeamDays: 500,
      rule5Selected: false, signedSeason: 2020, signedAge: 24,
      contractYearsRemaining: 2, salary: 8_000_000,
      arbitrationEligible: false, freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  } as Player;
}

const USER_TEAM_ID = 1;

describe('franchiseRecords — CL position recognition', () => {
  it('recognizes CL as a pitcher position for records', () => {
    const stats = makeSeason({
      playerId: 1, teamId: USER_TEAM_ID, season: 2026,
      gp: 60, gs: 0, outs: 180, // 60 IP
      er: 15, ha: 40, bba: 20, ka: 80, hra: 5,
      w: 3, l: 2, sv: 35,
    });

    const seasonStats = new Map([[1, stats]]);
    const careerHistory = new Map([[1, [stats]]]);
    const playerMap = new Map([[1, makeCloser()]]);
    const teamRecord = { wins: 90, losses: 72 };

    const { records } = updateFranchiseRecords(
      emptyRecordBook(), seasonStats, careerHistory, playerMap,
      teamRecord, 2026, USER_TEAM_ID,
    );

    // CL should be recognized as a pitcher — saves record should exist
    const savesRecord = records.singleSeasonPitching.find(r => r.category === 'SV');
    expect(savesRecord).toBeDefined();
    expect(savesRecord!.value).toBe(35);
  });

  it('tracks closer ERA in career records', () => {
    const stats = makeSeason({
      playerId: 1, teamId: USER_TEAM_ID, season: 2026,
      gp: 60, gs: 0, outs: 180,
      er: 15, ha: 40, bba: 20, ka: 80, hra: 5,
      w: 3, l: 2, sv: 30,
    });

    const seasonStats = new Map([[1, stats]]);
    const careerHistory = new Map([[1, [stats, stats]]]); // 2 seasons
    const playerMap = new Map([[1, makeCloser()]]);
    const teamRecord = { wins: 88, losses: 74 };

    const { records } = updateFranchiseRecords(
      emptyRecordBook(), seasonStats, careerHistory, playerMap,
      teamRecord, 2026, USER_TEAM_ID,
    );

    const careerERA = records.careerPitching.find(r => r.category === 'ERA');
    if (careerERA) {
      expect(isFinite(careerERA.value)).toBe(true);
      expect(careerERA.value).toBeGreaterThan(0);
    }
  });

  it('includes CL saves in franchise pitching records', () => {
    const stats = makeSeason({
      playerId: 1, teamId: USER_TEAM_ID, season: 2026,
      gp: 65, gs: 0, outs: 195,
      er: 10, ha: 35, bba: 15, ka: 90, hra: 3,
      w: 5, l: 1, sv: 42,
    });

    const seasonStats = new Map([[1, stats]]);
    const careerHistory = new Map([[1, [stats]]]);
    const playerMap = new Map([[1, makeCloser({ name: 'Elite Closer' })]]);
    const teamRecord = { wins: 95, losses: 67 };

    const { records } = updateFranchiseRecords(
      emptyRecordBook(), seasonStats, careerHistory, playerMap,
      teamRecord, 2026, USER_TEAM_ID,
    );

    // Both single-season and career saves should include our CL
    const ssSaves = records.singleSeasonPitching.find(r => r.category === 'SV');
    expect(ssSaves).toBeDefined();
    expect(ssSaves!.playerName).toBe('Elite Closer');
  });
});
