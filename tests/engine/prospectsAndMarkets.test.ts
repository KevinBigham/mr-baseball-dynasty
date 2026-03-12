import { describe, it, expect } from 'vitest';
import { generateTop100 } from '../../src/engine/league/prospects';
import { assignMarketSizes } from '../../src/engine/roster/financials';
import { createPRNG } from '../../src/engine/math/prng';
import type { Player } from '../../src/types/player';

function makeProspect(id: number, teamId: number, age: number, overall: number, potential: number): Player {
  return {
    playerId: id,
    teamId,
    name: `Prospect ${id}`,
    firstName: 'P',
    lastName: `${id}`,
    age,
    position: 'SS',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: false,
    hitterAttributes: {
      contact: overall, power: overall, eye: overall, speed: overall,
      baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 300,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall,
    potential,
    development: { theta: 0, sigma: 25, phase: 'prospect' },
    rosterData: {
      rosterStatus: 'MINORS_AA',
      isOn40Man: false,
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 0,
      serviceTimeCurrentTeamDays: 0,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: age - 2,
      contractYearsRemaining: 6,
      salary: 700_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  } as Player;
}

describe('generateTop100 — prospect rankings', () => {
  it('returns ranked prospects sorted by score', () => {
    const playerMap = new Map<number, Player>();
    for (let i = 1; i <= 20; i++) {
      playerMap.set(i, makeProspect(i, 1, 20, 200 + i * 10, 350 + i * 5));
    }
    const [rankings] = generateTop100(playerMap, createPRNG(42), 2026);
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings[0].rank).toBe(1);
    // Higher potential should rank higher
    expect(rankings[0].potential).toBeGreaterThanOrEqual(rankings[rankings.length - 1].potential);
  });

  it('includes ETA, grade, and risk level', () => {
    const playerMap = new Map<number, Player>();
    playerMap.set(1, makeProspect(1, 1, 19, 200, 450));
    const [rankings] = generateTop100(playerMap, createPRNG(42), 2026);
    expect(rankings.length).toBe(1);
    expect(rankings[0].eta).toBeTruthy();
    expect(rankings[0].grade).toMatch(/^[ABC]\+?$/);
    expect(rankings[0].riskLevel).toMatch(/^(Low|Medium|High)$/);
  });

  it('excludes MLB active players', () => {
    const playerMap = new Map<number, Player>();
    const mlbPlayer = makeProspect(1, 1, 22, 400, 500);
    mlbPlayer.rosterData.rosterStatus = 'MLB_ACTIVE';
    playerMap.set(1, mlbPlayer);
    const [rankings] = generateTop100(playerMap, createPRNG(42), 2026);
    expect(rankings.length).toBe(0);
  });

  it('excludes players over 28', () => {
    const playerMap = new Map<number, Player>();
    playerMap.set(1, makeProspect(1, 1, 30, 300, 400));
    const [rankings] = generateTop100(playerMap, createPRNG(42), 2026);
    expect(rankings.length).toBe(0);
  });

  it('caps at 100 entries', () => {
    const playerMap = new Map<number, Player>();
    for (let i = 1; i <= 150; i++) {
      playerMap.set(i, makeProspect(i, (i % 30) + 1, 19, 250, 400));
    }
    const [rankings] = generateTop100(playerMap, createPRNG(42), 2026);
    expect(rankings.length).toBeLessThanOrEqual(100);
  });
});

describe('assignMarketSizes — team budgets', () => {
  it('assigns varied market sizes', () => {
    const ids = Array.from({ length: 30 }, (_, i) => i + 1);
    const budgets = assignMarketSizes(ids);
    expect(budgets.size).toBe(30);
    const sizes = new Set(Array.from(budgets.values()).map(b => b.marketSize));
    expect(sizes.size).toBe(3); // large, medium, small
  });

  it('large markets have higher budgets than small markets', () => {
    const ids = Array.from({ length: 30 }, (_, i) => i + 1);
    const budgets = assignMarketSizes(ids);
    const values = Array.from(budgets.values());
    const large = values.find(b => b.marketSize === 'large')!;
    const small = values.find(b => b.marketSize === 'small')!;
    expect(large.payrollTarget).toBeGreaterThan(small.payrollTarget);
    expect(large.hardCap).toBeGreaterThan(small.hardCap);
  });
});
