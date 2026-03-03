import { describe, it, expect } from 'vitest';
import type { Player, Position } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import {
  computePayrollReport, generateArbitrationCases, resolveArbitration,
  canAffordMove, computeTeamPayroll,
} from '../../src/engine/finances';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> & { playerId: number; position: Position }): Player {
  const isPitcher = ['SP', 'RP', 'CL'].includes(overrides.position);
  return {
    playerId: overrides.playerId,
    teamId: overrides.teamId ?? 1,
    name: overrides.name ?? `Player ${overrides.playerId}`,
    age: overrides.age ?? 27,
    position: overrides.position,
    bats: 'R', throws: 'R', nationality: 'american', isPitcher,
    hitterAttributes: null, pitcherAttributes: null,
    overall: overrides.overall ?? 350,
    potential: 380,
    development: { theta: 0, sigma: 8, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true, optionYearsRemaining: 3, optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0, demotionsThisSeason: 0,
      serviceTimeDays: overrides.rosterData?.serviceTimeDays ?? 172 * 4,
      serviceTimeCurrentTeamDays: 172 * 4,
      rule5Selected: false, signedSeason: 2022, signedAge: 22,
      contractYearsRemaining: 2,
      salary: overrides.rosterData?.salary ?? 5_000_000,
      arbitrationEligible: overrides.rosterData?.arbitrationEligible ?? false,
      freeAgentEligible: overrides.rosterData?.freeAgentEligible ?? false,
      hasTenAndFive: false,
      ...overrides.rosterData,
    },
  };
}

function makeTeam(teamId: number, budget: number): Team {
  return {
    teamId, name: 'Test Team', abbreviation: 'TST', city: 'Test City',
    league: 'AL', division: 'East', parkFactorId: 0, budget,
    scoutingQuality: 0.7,
    coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'fringe',
    seasonRecord: { wins: 81, losses: 81, runsScored: 700, runsAllowed: 700 },
    rotationIndex: 0, bullpenReliefCounter: 0,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('computeTeamPayroll', () => {
  it('sums salaries for the given team', () => {
    const players = [
      makePlayer({ playerId: 1, position: 'SS', teamId: 1, rosterData: { salary: 10_000_000 } as Player['rosterData'] }),
      makePlayer({ playerId: 2, position: 'SP', teamId: 1, rosterData: { salary: 15_000_000 } as Player['rosterData'] }),
      makePlayer({ playerId: 3, position: 'CF', teamId: 2, rosterData: { salary: 20_000_000 } as Player['rosterData'] }),
    ];
    expect(computeTeamPayroll(players, 1)).toBe(25_000_000);
    expect(computeTeamPayroll(players, 2)).toBe(20_000_000);
  });
});

describe('computePayrollReport', () => {
  it('reports tier 0 when under CBT', () => {
    const team = makeTeam(1, 300_000_000);
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 100_000_000 } as Player['rosterData'] }),
    ];
    const report = computePayrollReport(players, team);
    expect(report.cbtTier).toBe(0);
    expect(report.taxPenalty).toBe(0);
    expect(report.totalPenalty).toBe(0);
  });

  it('reports tier 1 when over $237M but under $257M', () => {
    const team = makeTeam(1, 300_000_000);
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 250_000_000 } as Player['rosterData'] }),
    ];
    const report = computePayrollReport(players, team);
    expect(report.cbtTier).toBe(1);
    expect(report.taxRate).toBe(0.20);
  });

  it('reports correct tax penalties', () => {
    const team = makeTeam(1, 300_000_000);
    // Payroll = $250M → Tier 1 (20% on excess over $237M = $13M * 0.20 = $2.6M)
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 250_000_000 } as Player['rosterData'] }),
    ];
    const report = computePayrollReport(players, team);
    expect(report.cbtTier).toBe(1);
    expect(report.taxRate).toBe(0.20);
    expect(report.taxPenalty).toBe(Math.round(13_000_000 * 0.20));
  });

  it('applies tier 3 penalties with draft pick movement', () => {
    const team = makeTeam(1, 350_000_000);
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 290_000_000 } as Player['rosterData'] }),
    ];
    const report = computePayrollReport(players, team);
    expect(report.cbtTier).toBe(3);
    expect(report.taxRate).toBe(0.50);
    expect(report.draftPickPenalty).toBe(10);
  });

  it('applies repeater surcharge for consecutive CBT years', () => {
    const team = makeTeam(1, 300_000_000);
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 250_000_000 } as Player['rosterData'] }),
    ];
    const reportNoRepeat = computePayrollReport(players, team, 0);
    const reportRepeat = computePayrollReport(players, team, 2);

    expect(reportRepeat.isRepeater).toBe(true);
    expect(reportRepeat.repeaterSurcharge).toBeGreaterThan(0);
    expect(reportRepeat.totalPenalty).toBeGreaterThan(reportNoRepeat.totalPenalty);
  });

  it('calculates budget remaining correctly', () => {
    const team = makeTeam(1, 200_000_000);
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 120_000_000 } as Player['rosterData'] }),
    ];
    const report = computePayrollReport(players, team);
    expect(report.budgetRemaining).toBe(80_000_000);
  });
});

describe('generateArbitrationCases', () => {
  it('generates cases for eligible players', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS', overall: 380, age: 26,
        rosterData: {
          arbitrationEligible: true, freeAgentEligible: false,
          rosterStatus: 'MLB_ACTIVE', salary: 2_000_000,
          serviceTimeDays: 172 * 4,
        } as Player['rosterData'],
      }),
    ];
    const cases = generateArbitrationCases(players, 1);
    expect(cases).toHaveLength(1);
    expect(cases[0].playerAsk).toBeGreaterThan(cases[0].teamOffer);
    expect(cases[0].hearingResult).toBeGreaterThanOrEqual(cases[0].teamOffer);
    expect(cases[0].hearingResult).toBeLessThanOrEqual(cases[0].playerAsk);
  });

  it('skips free-agent-eligible players', () => {
    const players = [
      makePlayer({
        playerId: 1, position: 'SS',
        rosterData: {
          arbitrationEligible: true, freeAgentEligible: true,
          rosterStatus: 'MLB_ACTIVE', salary: 10_000_000,
        } as Player['rosterData'],
      }),
    ];
    const cases = generateArbitrationCases(players, 1);
    expect(cases).toHaveLength(0);
  });

  it('awards higher raises to elite players', () => {
    const elite = makePlayer({
      playerId: 1, position: 'SS', overall: 420, age: 27,
      rosterData: {
        arbitrationEligible: true, freeAgentEligible: false,
        rosterStatus: 'MLB_ACTIVE', salary: 5_000_000,
        serviceTimeDays: 172 * 4,
      } as Player['rosterData'],
    });
    const average = makePlayer({
      playerId: 2, position: '1B', overall: 280, age: 27,
      rosterData: {
        arbitrationEligible: true, freeAgentEligible: false,
        rosterStatus: 'MLB_ACTIVE', salary: 5_000_000,
        serviceTimeDays: 172 * 4,
      } as Player['rosterData'],
    });

    const [eliteCase] = generateArbitrationCases([elite], 1);
    const [avgCase] = generateArbitrationCases([average], 1);
    expect(eliteCase.hearingResult).toBeGreaterThan(avgCase.hearingResult);
  });
});

describe('resolveArbitration', () => {
  it('sets salary and 1-year contract', () => {
    const player = makePlayer({
      playerId: 1, position: 'SS',
      rosterData: { salary: 2_000_000, contractYearsRemaining: 0 } as Player['rosterData'],
    });
    resolveArbitration(player, 5_000_000);
    expect(player.rosterData.salary).toBe(5_000_000);
    expect(player.rosterData.contractYearsRemaining).toBe(1);
  });
});

describe('canAffordMove', () => {
  it('returns true when payroll + new salary is under budget', () => {
    const team = makeTeam(1, 200_000_000);
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 100_000_000 } as Player['rosterData'] }),
    ];
    expect(canAffordMove(players, team, 50_000_000)).toBe(true);
  });

  it('returns false when over 110% budget', () => {
    const team = makeTeam(1, 100_000_000);
    const players = [
      makePlayer({ playerId: 1, position: 'SS', rosterData: { salary: 100_000_000 } as Player['rosterData'] }),
    ];
    expect(canAffordMove(players, team, 20_000_000)).toBe(false);
  });
});
