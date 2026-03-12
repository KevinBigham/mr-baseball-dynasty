import { describe, it, expect } from 'vitest';
import {
  computeHOFScore,
  identifyHOFCandidates,
  simulateHOFVoting,
} from '../../src/engine/hallOfFame';
import type { PlayerSeasonStats } from '../../src/types/player';

// ─── Helper: blank season stats ─────────────────────────────────────────────

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

// ─── computeHOFScore ────────────────────────────────────────────────────────

describe('computeHOFScore', () => {
  it('returns 0 for empty career', () => {
    expect(computeHOFScore([], false)).toBe(0);
    expect(computeHOFScore([], true)).toBe(0);
  });

  it('strong hitter gets high score', () => {
    // 15-year career, ~.310 AVG, 35 HR per year, high OPS
    const career = Array.from({ length: 15 }, (_, i) =>
      makeSeason({
        season: 2026 + i,
        g: 155, pa: 650, ab: 570, h: 177,     // .311 AVG
        doubles: 35, triples: 5, hr: 35,
        rbi: 110, bb: 60, hbp: 10, k: 100,
        sb: 15, cs: 5,
      }),
    );

    const score = computeHOFScore(career, false);
    // A career this strong should produce a high HOF score
    expect(score).toBeGreaterThan(60);
  });

  it('strong pitcher gets high score', () => {
    // 15-year career, ~3.00 ERA, 200 IP per season, 15 W per season
    const career = Array.from({ length: 15 }, (_, i) =>
      makeSeason({
        season: 2026 + i,
        gp: 33, gs: 33,
        w: 15, l: 8,
        outs: 600,       // 200 IP
        er: 66,          // ERA = (66/600)*27 = 2.97
        ha: 170, bba: 50, ka: 210,
      }),
    );

    const score = computeHOFScore(career, true);
    expect(score).toBeGreaterThan(60);
  });

  it('weak player gets low score', () => {
    // 3-year career, mediocre stats
    const career = Array.from({ length: 3 }, (_, i) =>
      makeSeason({
        season: 2026 + i,
        g: 80, pa: 250, ab: 220, h: 50,  // .227 AVG
        doubles: 8, triples: 1, hr: 5,
        rbi: 25, bb: 20, hbp: 2, k: 60,
      }),
    );

    const score = computeHOFScore(career, false);
    expect(score).toBeLessThan(30);
  });
});

// ─── identifyHOFCandidates ──────────────────────────────────────────────────

describe('identifyHOFCandidates', () => {
  it('player retired <5 seasons ago is not eligible', () => {
    const retiredPlayers = new Map([
      [
        100,
        {
          name: 'Recent Retiree',
          position: '1B',
          seasons: [
            makeSeason({ playerId: 100, season: 2044, g: 150, pa: 600, ab: 550, h: 180, hr: 35, bb: 40, hbp: 5 }),
          ],
        },
      ],
    ]);

    // Current season is 2047, retired in 2044 — only 3 years ago, not eligible
    const candidates = identifyHOFCandidates(retiredPlayers, 2047, new Set());
    expect(candidates).toHaveLength(0);
  });

  it('eligible candidate with good score is included', () => {
    // Build a strong 15-year career
    const seasons = Array.from({ length: 15 }, (_, i) =>
      makeSeason({
        playerId: 200,
        teamId: 1,
        season: 2026 + i,
        g: 155, pa: 650, ab: 570, h: 177,
        doubles: 35, triples: 5, hr: 35,
        rbi: 110, bb: 60, hbp: 10, k: 100,
      }),
    );

    const retiredPlayers = new Map([
      [200, { name: 'Hall of Famer', position: 'RF', seasons }],
    ]);

    // Last season was 2040, current season is 2046 — 6 years past retirement (eligible)
    const candidates = identifyHOFCandidates(retiredPlayers, 2046, new Set());
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates[0].playerId).toBe(200);
    expect(candidates[0].hofScore).toBeGreaterThan(30);
  });

  it('already inducted players are excluded', () => {
    const seasons = Array.from({ length: 15 }, (_, i) =>
      makeSeason({
        playerId: 300,
        teamId: 1,
        season: 2026 + i,
        g: 155, pa: 650, ab: 570, h: 177,
        doubles: 35, triples: 5, hr: 35,
        rbi: 110, bb: 60, hbp: 10, k: 100,
      }),
    );

    const retiredPlayers = new Map([
      [300, { name: 'Already In', position: 'CF', seasons }],
    ]);

    const existingInductees = new Set([300]);
    const candidates = identifyHOFCandidates(retiredPlayers, 2046, existingInductees);
    expect(candidates).toHaveLength(0);
  });
});

// ─── simulateHOFVoting ──────────────────────────────────────────────────────

describe('simulateHOFVoting', () => {
  it('high-score candidate gets inducted (votePct >= 75)', () => {
    // hofScore of 100 -> baseVote = 100*0.85 + yearBonus = 85 + 2 = 87
    // noise ranges from -10 to +9, so votePct ranges from 77 to 96
    // Even worst case 77 >= 75, so should always be inducted
    const candidate = {
      playerId: 400,
      name: 'Sure Thing',
      position: 'SS',
      retiredSeason: 2035,
      eligibleSeason: 2040,
      yearsOnBallot: 1,
      isPitcher: false,
      hofScore: 100,
      careerStats: {
        seasons: 15, g: 2300, pa: 9750, ab: 8550,
        h: 2650, hr: 525, rbi: 1650, bb: 900, hbp: 150,
        doubles: 500, triples: 50, sb: 200,
        w: 0, l: 0, sv: 0, outs: 0, er: 0, ka: 0,
      },
    };

    // Try multiple seeds — a score of 100 should always produce induction
    for (let seed = 0; seed < 10; seed++) {
      const result = simulateHOFVoting([candidate], seed);
      expect(result.inducted.length).toBe(1);
      expect(result.inducted[0].votePct).toBeGreaterThanOrEqual(75);
    }
  });

  it('deterministic — same seed produces same result', () => {
    const candidate = {
      playerId: 500,
      name: 'Consistent',
      position: '3B',
      retiredSeason: 2030,
      eligibleSeason: 2035,
      yearsOnBallot: 3,
      isPitcher: false,
      hofScore: 70,
      careerStats: {
        seasons: 12, g: 1800, pa: 7200, ab: 6400,
        h: 1900, hr: 350, rbi: 1200, bb: 600, hbp: 100,
        doubles: 380, triples: 30, sb: 80,
        w: 0, l: 0, sv: 0, outs: 0, er: 0, ka: 0,
      },
    };

    const seed = 42;
    const result1 = simulateHOFVoting([candidate], seed);
    const result2 = simulateHOFVoting([candidate], seed);

    // Same seed + same candidate = identical outcome
    expect(result1.inducted.length).toBe(result2.inducted.length);
    expect(result1.remaining.length).toBe(result2.remaining.length);

    if (result1.inducted.length > 0) {
      expect(result1.inducted[0].votePct).toBe(result2.inducted[0].votePct);
    }
  });
});
