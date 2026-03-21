/**
 * Round 1 — Specific wOBA / FIP / WAR test cases with known input/output values.
 * These complement the existing advancedStats.test.ts with exact formula verification.
 */
import { describe, it, expect } from 'vitest';
import {
  computeAdvancedHitting,
  computeAdvancedPitching,
  type LeagueAverages,
} from '../../src/engine/advancedStats';
import type { PlayerSeasonStats } from '../../src/types/player';

function makeHitter(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 1, teamId: 1, season: 2025,
    g: 150, pa: 600, ab: 550, r: 80, h: 150,
    doubles: 30, triples: 5, hr: 20,
    rbi: 80, bb: 45, k: 110, sb: 5, cs: 2, hbp: 5,
    w: 0, l: 0, sv: 0, hld: 0, bs: 0,
    gp: 0, gs: 0, outs: 0,
    ha: 0, ra: 0, er: 0, bba: 0, ka: 0, hra: 0,
    pitchCount: 0,
    ...overrides,
  };
}

function makePitcher(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 2, teamId: 1, season: 2025,
    g: 0, pa: 0, ab: 0, r: 0, h: 0,
    doubles: 0, triples: 0, hr: 0,
    rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0,
    w: 12, l: 6, sv: 0, hld: 0, bs: 0,
    gp: 30, gs: 30, outs: 540, // 180 IP
    ha: 160, ra: 70, er: 65, bba: 55, ka: 180, hra: 18,
    pitchCount: 2700,
    ...overrides,
  };
}

function leagueAvg(): LeagueAverages {
  return {
    avg: 0.260, obp: 0.320, slg: 0.410,
    wOBA: 0.320, rPerPA: 0.11, wOBAScale: 1.0,
    babip: 0.300, hrPerFB: 0.105,
    fip: 4.00, era: 4.00,
    totalPA: 180000, totalIP: 43000,
  };
}

// ─── wOBA Tests ─────────────────────────────────────────────────────────────

describe('wOBA — known input/output verification', () => {
  it('computes wOBA for an average hitter', () => {
    // Singles = 150 - 30 - 5 - 20 = 95
    // Numerator = 0.690*45 + 0.722*5 + 0.878*95 + 1.242*30 + 1.568*5 + 2.004*20
    //           = 31.05 + 3.61 + 83.41 + 37.26 + 7.84 + 40.08 = 203.25
    // Denominator = 550 + 45 + 5 = 600
    // wOBA = 203.25 / 600 = 0.33875
    const adv = computeAdvancedHitting(makeHitter(), leagueAvg());
    expect(adv.wOBA).toBeCloseTo(0.339, 2);
  });

  it('wOBA increases with more extra-base hits', () => {
    const singles = computeAdvancedHitting(makeHitter({ h: 160, hr: 5, doubles: 10, triples: 2 }), leagueAvg());
    const power = computeAdvancedHitting(makeHitter({ h: 160, hr: 35, doubles: 40, triples: 5 }), leagueAvg());
    expect(power.wOBA).toBeGreaterThan(singles.wOBA);
  });

  it('wOBA increases with more walks', () => {
    const noWalk = computeAdvancedHitting(makeHitter({ bb: 10 }), leagueAvg());
    const walks = computeAdvancedHitting(makeHitter({ bb: 80 }), leagueAvg());
    expect(walks.wOBA).toBeGreaterThan(noWalk.wOBA);
  });

  it('wOBA is 0 for a hitless player', () => {
    const adv = computeAdvancedHitting(makeHitter({ h: 0, hr: 0, doubles: 0, triples: 0, bb: 0, hbp: 0 }), leagueAvg());
    expect(adv.wOBA).toBe(0);
  });

  it('elite hitter wOBA > .400', () => {
    const elite = makeHitter({ h: 200, hr: 45, doubles: 45, triples: 8, bb: 90, hbp: 8, pa: 700, ab: 600 });
    const adv = computeAdvancedHitting(elite, leagueAvg());
    expect(adv.wOBA).toBeGreaterThan(0.400);
  });
});

// ─── FIP Tests ──────────────────────────────────────────────────────────────

describe('FIP — known input/output verification', () => {
  it('computes FIP with known values', () => {
    // FIP = (13*HR + 3*(BB+HBP) - 2*K) / IP + constant
    // Note: our formula uses (13*HR + 3*BB - 2*K) / IP + 3.17 (no HBP in pitching FIP)
    // FIP = (13*18 + 3*55 - 2*180) / 180 + 3.17
    //     = (234 + 165 - 360) / 180 + 3.17
    //     = 39 / 180 + 3.17 = 0.217 + 3.17 = 3.387
    const adv = computeAdvancedPitching(makePitcher(), leagueAvg());
    expect(adv.fip).toBeCloseTo(3.39, 1);
  });

  it('FIP penalizes home runs heavily', () => {
    const lowHR = computeAdvancedPitching(makePitcher({ hra: 10 }), leagueAvg());
    const highHR = computeAdvancedPitching(makePitcher({ hra: 30 }), leagueAvg());
    expect(highHR.fip).toBeGreaterThan(lowHR.fip);
    // 20 more HR at 13 weight = 260 more / 180 IP = 1.44 higher FIP
    expect(highHR.fip - lowHR.fip).toBeCloseTo(1.44, 1);
  });

  it('FIP rewards strikeouts', () => {
    const lowK = computeAdvancedPitching(makePitcher({ ka: 100 }), leagueAvg());
    const highK = computeAdvancedPitching(makePitcher({ ka: 250 }), leagueAvg());
    expect(highK.fip).toBeLessThan(lowK.fip);
  });

  it('FIP is 0 for zero IP', () => {
    const adv = computeAdvancedPitching(makePitcher({ outs: 0 }), leagueAvg());
    expect(adv.fip).toBe(0);
  });

  it('elite closer FIP < 2.50', () => {
    const closer = makePitcher({ outs: 180, ka: 90, bba: 10, hra: 3 }); // 60 IP
    const adv = computeAdvancedPitching(closer, leagueAvg());
    expect(adv.fip).toBeLessThan(2.50);
  });
});

// ─── WAR Tests ──────────────────────────────────────────────────────────────

describe('WAR — known input/output verification', () => {
  it('position player WAR is positive for above-average hitter', () => {
    const adv = computeAdvancedHitting(makeHitter(), leagueAvg());
    expect(adv.war).toBeGreaterThan(0);
  });

  it('position player WAR scales with PA', () => {
    const half = computeAdvancedHitting(makeHitter({ pa: 300, ab: 275, h: 75, hr: 10, doubles: 15, triples: 2, bb: 22, hbp: 3, k: 55 }), leagueAvg());
    const full = computeAdvancedHitting(makeHitter(), leagueAvg());
    // Full-season player should have higher WAR than half-season with same rates
    expect(full.war).toBeGreaterThan(half.war);
  });

  it('pitcher WAR is positive for FIP below league average', () => {
    const adv = computeAdvancedPitching(makePitcher(), leagueAvg());
    // Our pitcher has FIP ~3.39 vs league 4.00 → positive WAR
    expect(adv.war).toBeGreaterThan(0);
  });

  it('pitcher WAR scales with innings', () => {
    const short = computeAdvancedPitching(makePitcher({ outs: 270, ka: 90, bba: 28, hra: 9 }), leagueAvg());
    const long = computeAdvancedPitching(makePitcher(), leagueAvg());
    expect(long.war).toBeGreaterThan(short.war);
  });

  it('replacement-level hitter has negative or near-zero WAR', () => {
    const bad = makeHitter({
      h: 90, hr: 3, doubles: 10, triples: 1, bb: 20, hbp: 2,
      pa: 450, ab: 425, k: 150, sb: 0, cs: 0,
    });
    const adv = computeAdvancedHitting(bad, leagueAvg());
    expect(adv.war).toBeLessThan(1.0); // Below-average hitter
  });
});
