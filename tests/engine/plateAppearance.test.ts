import { describe, it, expect, beforeAll } from 'vitest';
import { createPRNG } from '../../src/engine/math/prng';
import { resolvePlateAppearance } from '../../src/engine/sim/plateAppearance';
import { blankHitterAttributes, blankPitcherAttributes } from '../../src/engine/player/attributes';
import { PARK_FACTORS } from '../../src/data/parkFactors';
import type { Player, HitterAttributes, PitcherAttributes } from '../../src/types/player';
import type { RandomGenerator } from 'pure-rand';

// Neutral park (index 4 = Riverside Arena, all factors ~1.0)
const NEUTRAL_PARK = PARK_FACTORS[4];
const AVG_DEFENSE = 400;

// ─── Mock player builders ──────────────────────────────────────────────────────

function makeHitter(overrides: Partial<HitterAttributes> = {}): Player {
  return {
    playerId: 1,
    teamId: 1,
    name: 'Test Hitter',
    age: 28,
    position: 'CF',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: false,
    hitterAttributes: { ...blankHitterAttributes(), ...overrides },
    pitcherAttributes: null,
    overall: 400,
    potential: 420,
    development: { theta: 0, sigma: 20, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 1,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 26,
      contractYearsRemaining: 2,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  };
}

function makePitcher(overrides: Partial<PitcherAttributes> = {}): Player {
  return {
    playerId: 2,
    teamId: 2,
    name: 'Test Pitcher',
    age: 27,
    position: 'SP',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: true,
    hitterAttributes: null,
    pitcherAttributes: { ...blankPitcherAttributes(), ...overrides },
    overall: 400,
    potential: 440,
    development: { theta: 0, sigma: 20, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 1,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 700,
      serviceTimeCurrentTeamDays: 700,
      rule5Selected: false,
      signedSeason: 2023,
      signedAge: 25,
      contractYearsRemaining: 3,
      salary: 10_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function runManyPAs(
  n: number,
  hitter: Player,
  pitcher: Player,
  seed = 0,
): Record<string, number> {
  const counts: Record<string, number> = {};
  let gen: RandomGenerator = createPRNG(seed);

  for (let i = 0; i < n; i++) {
    const [result, nextGen] = resolvePlateAppearance(gen, {
      batter: hitter,
      pitcher,
      runners: 0,
      outs: 0,
      pitchCount: 0,
      timesThrough: 1,
      parkFactor: NEUTRAL_PARK,
      defenseRating: AVG_DEFENSE,
    });
    gen = nextGen;
    counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;
  }

  return counts;
}

function rate(counts: Record<string, number>, key: string, total: number): number {
  return (counts[key] ?? 0) / total;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Plate Appearance Engine — outcome distribution', () => {
  const N = 10_000;
  const hitter = makeHitter({ contact: 400, power: 380, eye: 380 });
  const pitcher = makePitcher({ stuff: 400, command: 400 });
  let counts: Record<string, number>;

  beforeAll(() => {
    counts = runManyPAs(N, hitter, pitcher, 12345);
  });

  it('produces valid outcomes only', () => {
    const VALID_OUTCOMES = new Set([
      'K', 'BB', 'HBP', 'HR', '1B', '2B', '3B',
      'GB_OUT', 'FB_OUT', 'LD_OUT', 'PU_OUT', 'GDP', 'SF', 'E',
    ]);
    for (const key of Object.keys(counts)) {
      expect(VALID_OUTCOMES.has(key), `Unknown outcome: ${key}`).toBe(true);
    }
  });

  it('all PAs are accounted for', () => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(N);
  });

  it('strikeout rate is roughly 18–30%', () => {
    const kRate = rate(counts, 'K', N);
    expect(kRate).toBeGreaterThan(0.18);
    expect(kRate).toBeLessThan(0.30);
  });

  it('walk rate is roughly 6–13%', () => {
    const bbRate = rate(counts, 'BB', N);
    expect(bbRate).toBeGreaterThan(0.06);
    expect(bbRate).toBeLessThan(0.13);
  });

  it('home run rate is roughly 2.5–7%', () => {
    const hrRate = rate(counts, 'HR', N);
    expect(hrRate).toBeGreaterThan(0.025);
    expect(hrRate).toBeLessThan(0.07);
  });

  it('singles are the most common hit type', () => {
    expect(counts['1B'] ?? 0).toBeGreaterThan(counts['2B'] ?? 0);
    expect(counts['2B'] ?? 0).toBeGreaterThan(counts['3B'] ?? 0);
  });

  it('HBP is rare (0.3–2.5%)', () => {
    const hbpRate = rate(counts, 'HBP', N);
    expect(hbpRate).toBeGreaterThan(0.003);
    expect(hbpRate).toBeLessThan(0.025);
  });
});

describe('Plate Appearance Engine — high strikeout pitcher', () => {
  const N = 5_000;

  it('elite stuff pitcher generates 28%+ K rate vs average hitter', () => {
    const hitter = makeHitter({ contact: 400, eye: 380 });
    const elitePitcher = makePitcher({ stuff: 520, command: 450 });
    const counts = runManyPAs(N, hitter, elitePitcher, 77);
    const kRate = rate(counts, 'K', N);
    expect(kRate).toBeGreaterThan(0.28);
  });
});

describe('Plate Appearance Engine — platoon splits', () => {
  const N = 5_000;

  it('LHB vs RHP gets more or equal hits vs LHB vs LHP', () => {
    const lhb = { ...makeHitter({ contact: 400, power: 380, eye: 380 }), bats: 'L' as const };
    const rhp = makePitcher({ stuff: 400, command: 400 });
    const lhp = { ...makePitcher({ stuff: 400, command: 400 }), throws: 'L' as const };

    const vsRHP = runManyPAs(N, lhb, rhp, 999);
    const vsLHP = runManyPAs(N, lhb, lhp, 999);

    const hitsVsRHP = (vsRHP['1B'] ?? 0) + (vsRHP['2B'] ?? 0) + (vsRHP['3B'] ?? 0) + (vsRHP['HR'] ?? 0);
    const hitsVsLHP = (vsLHP['1B'] ?? 0) + (vsLHP['2B'] ?? 0) + (vsLHP['3B'] ?? 0) + (vsLHP['HR'] ?? 0);

    // Platoon advantage: LHB should hit at least as well vs RHP (within 10%)
    expect(hitsVsRHP).toBeGreaterThanOrEqual(hitsVsLHP * 0.90);
  });
});

describe('Plate Appearance Engine — determinism', () => {
  it('same seed produces identical sequence', () => {
    const hitter = makeHitter({ contact: 400, power: 380, eye: 380 });
    const pitcher = makePitcher({ stuff: 400, command: 400 });
    const counts1 = runManyPAs(1000, hitter, pitcher, 42);
    const counts2 = runManyPAs(1000, hitter, pitcher, 42);
    expect(counts1).toEqual(counts2);
  });

  it('different seeds produce different sequences', () => {
    const hitter = makeHitter({ contact: 400, power: 380, eye: 380 });
    const pitcher = makePitcher({ stuff: 400, command: 400 });
    const counts1 = runManyPAs(1000, hitter, pitcher, 1);
    const counts2 = runManyPAs(1000, hitter, pitcher, 2);
    expect(JSON.stringify(counts1)).not.toBe(JSON.stringify(counts2));
  });
});
