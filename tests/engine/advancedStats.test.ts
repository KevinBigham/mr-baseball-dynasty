import { describe, it, expect } from 'vitest';
import {
  computeAdvancedHitting,
  computeAdvancedPitching,
  computeLeagueAverages,
  type LeagueAverages,
} from '../../src/engine/advancedStats';
import type { PlayerSeasonStats } from '../../src/types/player';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeHitterStats(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 1, teamId: 1, season: 2025,
    g: 150, pa: 600, ab: 550, r: 80, h: 160,
    doubles: 30, triples: 5, hr: 25,
    rbi: 90, bb: 50, k: 120, sb: 10, cs: 3, hbp: 5,
    // Pitching fields (zero for position players)
    w: 0, l: 0, sv: 0, hld: 0, bs: 0,
    gp: 0, gs: 0, outs: 0,
    ha: 0, ra: 0, er: 0, bba: 0, ka: 0, hra: 0,
    pitchCount: 0,
    ...overrides,
  };
}

function makePitcherStats(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 2, teamId: 1, season: 2025,
    g: 0, pa: 0, ab: 0, r: 0, h: 0,
    doubles: 0, triples: 0, hr: 0,
    rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0,
    // Pitching stats for a solid starter
    w: 15, l: 8, sv: 0, hld: 0, bs: 0,
    gp: 32, gs: 32, outs: 600, // 200 IP
    ha: 170, ra: 80, er: 70, bba: 50, ka: 200, hra: 20,
    pitchCount: 3000,
    ...overrides,
  };
}

function makeLeagueAvg(): LeagueAverages {
  return {
    avg: 0.260, obp: 0.320, slg: 0.410,
    wOBA: 0.320, rPerPA: 0.11, wOBAScale: 1.0,
    babip: 0.300, hrPerFB: 0.105,
    fip: 4.00, era: 4.00,
    totalPA: 180000, totalIP: 43000,
  };
}

// ─── computeAdvancedHitting ─────────────────────────────────────────────────

describe('computeAdvancedHitting — basic stats', () => {
  it('computes AVG correctly', () => {
    const stats = makeHitterStats();
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    expect(adv.avg).toBeCloseTo(160 / 550, 3);
  });

  it('computes ISO correctly (SLG - AVG)', () => {
    const stats = makeHitterStats();
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    // Singles = 160 - 30 - 5 - 25 = 100
    // TB = 100 + 60 + 15 + 100 = 275
    // SLG = 275/550 = 0.500
    // AVG = 160/550 = 0.291
    // ISO = 0.500 - 0.291 = 0.209
    expect(adv.iso).toBeCloseTo(0.209, 2);
  });

  it('computes BABIP correctly', () => {
    const stats = makeHitterStats();
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    // BABIP = (H - HR) / (AB - K - HR) = (160-25)/(550-120-25) = 135/405 = 0.333
    expect(adv.babip).toBeCloseTo(0.333, 2);
  });

  it('computes wOBA as a positive number', () => {
    const stats = makeHitterStats();
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    expect(adv.wOBA).toBeGreaterThan(0);
    expect(adv.wOBA).toBeLessThan(1);
  });

  it('computes OPS = OBP + SLG', () => {
    const stats = makeHitterStats();
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    expect(adv.ops).toBeCloseTo(adv.obp + adv.slg, 2);
  });
});

describe('computeAdvancedHitting — wRC+', () => {
  it('wRC+ around 100 for league-average player', () => {
    // Create a player with exactly league-average wOBA
    const stats = makeHitterStats();
    const league = makeLeagueAvg();
    const adv = computeAdvancedHitting(stats, league);
    // Our test player is better than average so wRC+ should be above 100
    expect(adv.wRCPlus).toBeGreaterThan(90);
    expect(adv.wRCPlus).toBeLessThan(200);
  });

  it('elite hitter gets wRC+ well above 100', () => {
    const stats = makeHitterStats({
      h: 200, hr: 40, doubles: 40, triples: 8, bb: 80,
      pa: 650, ab: 560, k: 80,
    });
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    expect(adv.wRCPlus).toBeGreaterThan(130);
  });

  it('bad hitter gets wRC+ below 100', () => {
    const stats = makeHitterStats({
      h: 100, hr: 5, doubles: 15, triples: 2, bb: 25,
      pa: 500, ab: 470, k: 180,
    });
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    expect(adv.wRCPlus).toBeLessThan(100);
  });

  it('wRC+ is clamped between 0 and 300', () => {
    const terrible = makeHitterStats({ h: 0, hr: 0, bb: 0, pa: 100, ab: 100, k: 100 });
    const advBad = computeAdvancedHitting(terrible, makeLeagueAvg());
    expect(advBad.wRCPlus).toBeGreaterThanOrEqual(0);

    const god = makeHitterStats({ h: 300, hr: 80, doubles: 60, triples: 15, bb: 100, pa: 500, ab: 400, k: 20 });
    const advGod = computeAdvancedHitting(god, makeLeagueAvg());
    expect(advGod.wRCPlus).toBeLessThanOrEqual(300);
  });
});

describe('computeAdvancedHitting — WAR', () => {
  it('WAR is positive for a good player', () => {
    const stats = makeHitterStats();
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    expect(adv.war).toBeGreaterThan(0);
  });

  it('WAR accounts for baserunning', () => {
    const fast = makeHitterStats({ sb: 40, cs: 5 });
    const slow = makeHitterStats({ sb: 0, cs: 5 });
    const advFast = computeAdvancedHitting(fast, makeLeagueAvg());
    const advSlow = computeAdvancedHitting(slow, makeLeagueAvg());
    expect(advFast.war).toBeGreaterThan(advSlow.war);
  });
});

describe('computeAdvancedHitting — edge cases', () => {
  it('handles zero AB without crashing', () => {
    const stats = makeHitterStats({ ab: 0, pa: 0, h: 0 });
    const adv = computeAdvancedHitting(stats, makeLeagueAvg());
    expect(adv.avg).toBe(0);
    expect(adv.iso).toBe(0);
  });
});

// ─── computeAdvancedPitching ────────────────────────────────────────────────

describe('computeAdvancedPitching — FIP', () => {
  it('computes FIP as a reasonable value', () => {
    const stats = makePitcherStats();
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    // FIP = ((13*20 + 3*50 - 2*200) / 200) + 3.17
    // = (260 + 150 - 400) / 200 + 3.17 = 10/200 + 3.17 = 0.05 + 3.17 = 3.22
    expect(adv.fip).toBeCloseTo(3.22, 1);
  });

  it('FIP is lower for high-K, low-BB pitcher', () => {
    const ace = makePitcherStats({ ka: 250, bba: 30, hra: 15, outs: 600 });
    const avg = makePitcherStats({ ka: 150, bba: 80, hra: 25, outs: 600 });
    const advAce = computeAdvancedPitching(ace, makeLeagueAvg());
    const advAvg = computeAdvancedPitching(avg, makeLeagueAvg());
    expect(advAce.fip).toBeLessThan(advAvg.fip);
  });
});

describe('computeAdvancedPitching — xFIP', () => {
  it('xFIP is a reasonable value', () => {
    const stats = makePitcherStats();
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    expect(adv.xFIP).toBeGreaterThan(0);
    expect(adv.xFIP).toBeLessThan(10);
  });
});

describe('computeAdvancedPitching — rate stats', () => {
  it('K/9 is computed correctly', () => {
    const stats = makePitcherStats();
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    // K/9 = (200 * 9) / 200 = 9.0
    expect(adv.k9).toBeCloseTo(9.0, 1);
  });

  it('BB/9 is computed correctly', () => {
    const stats = makePitcherStats();
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    // BB/9 = (50 * 9) / 200 = 2.25
    expect(adv.bb9).toBeCloseTo(2.25, 1);
  });

  it('K/BB ratio is computed correctly', () => {
    const stats = makePitcherStats();
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    // K/BB = 200/50 = 4.0
    expect(adv.kbb).toBeCloseTo(4.0, 1);
  });

  it('WHIP is computed correctly', () => {
    const stats = makePitcherStats();
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    // WHIP = (170 + 50) / 200 = 1.10
    expect(adv.whip).toBeCloseTo(1.10, 1);
  });
});

describe('computeAdvancedPitching — WAR', () => {
  it('WAR is positive for an above-average pitcher', () => {
    const stats = makePitcherStats();
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    expect(adv.war).toBeGreaterThan(0);
  });
});

describe('computeAdvancedPitching — edge cases', () => {
  it('handles zero IP without crashing', () => {
    const stats = makePitcherStats({ outs: 0 });
    const adv = computeAdvancedPitching(stats, makeLeagueAvg());
    expect(adv.fip).toBe(0);
    expect(adv.era).toBe(0);
  });
});

// ─── computeLeagueAverages ─────────────────────────────────────────────────

describe('computeLeagueAverages', () => {
  it('computes averages from a collection of players', () => {
    const stats: PlayerSeasonStats[] = [];
    for (let i = 0; i < 20; i++) {
      stats.push(makeHitterStats({ playerId: i, pa: 500, ab: 460, h: 120, hr: 15, bb: 40, k: 100, hbp: 3, doubles: 20, triples: 3, r: 60 }));
    }
    for (let i = 20; i < 30; i++) {
      stats.push(makePitcherStats({ playerId: i }));
    }

    const league = computeLeagueAverages(stats);
    expect(league.avg).toBeGreaterThan(0.200);
    expect(league.avg).toBeLessThan(0.350);
    expect(league.obp).toBeGreaterThan(league.avg);
    expect(league.wOBA).toBeGreaterThan(0);
    expect(league.fip).toBeGreaterThan(0);
    expect(league.totalPA).toBeGreaterThan(0);
  });

  it('returns reasonable defaults with empty input', () => {
    const league = computeLeagueAverages([]);
    expect(league.avg).toBeCloseTo(0.260, 1);
    expect(league.obp).toBeCloseTo(0.320, 1);
  });
});
