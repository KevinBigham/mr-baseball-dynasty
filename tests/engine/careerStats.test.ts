import { describe, it, expect } from 'vitest';
import {
  avg, obp, era, ip, whip, fmt,
  hittingRow, pitchingRow,
  totalsHitting, totalsPitching,
} from '../../src/components/stats/CareerStatsTable';
import type { PlayerSeasonStats } from '../../src/types/player';

// ─── Helper: blank season stats ──────────────────────────────────────────────

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

// ─── Pure math helpers ───────────────────────────────────────────────────────

describe('Career stats — fmt()', () => {
  it('formats integer with no decimals', () => {
    expect(fmt(42)).toBe('42');
  });

  it('formats with decimal places', () => {
    expect(fmt(3.14159, 2)).toBe('3.14');
  });

  it('handles zero', () => {
    expect(fmt(0)).toBe('0');
  });
});

describe('Career stats — avg()', () => {
  it('calculates batting average correctly', () => {
    expect(avg(150, 500)).toBe('0.300');
  });

  it('returns .000 when AB is 0', () => {
    expect(avg(0, 0)).toBe('.000');
  });

  it('formats to three decimal places', () => {
    expect(avg(1, 3)).toBe('0.333');
  });
});

describe('Career stats — obp()', () => {
  it('calculates on-base percentage', () => {
    // OBP = (H + BB + HBP) / PA
    // (150 + 60 + 10) / 600 = 220/600 = 0.367
    expect(obp(150, 60, 10, 600)).toBe('0.367');
  });

  it('returns .000 when PA is 0', () => {
    expect(obp(0, 0, 0, 0)).toBe('.000');
  });
});

describe('Career stats — era()', () => {
  it('calculates ERA correctly', () => {
    // ERA = (ER / outs) * 27
    // 60 ER in 600 outs (200 IP) = (60/600)*27 = 2.70
    expect(era(60, 600)).toBe('2.70');
  });

  it('returns 0.00 when outs is 0', () => {
    expect(era(0, 0)).toBe('0.00');
  });

  it('handles high ERA', () => {
    // 90 ER in 300 outs = (90/300)*27 = 8.10
    expect(era(90, 300)).toBe('8.10');
  });
});

describe('Career stats — ip()', () => {
  it('formats whole innings', () => {
    expect(ip(27)).toBe('9.0'); // 9 IP
  });

  it('formats partial innings', () => {
    expect(ip(28)).toBe('9.1'); // 9.1 IP
    expect(ip(29)).toBe('9.2'); // 9.2 IP
  });

  it('formats zero innings', () => {
    expect(ip(0)).toBe('0.0');
  });

  it('formats large innings count', () => {
    expect(ip(600)).toBe('200.0'); // 200 IP
  });
});

describe('Career stats — whip()', () => {
  it('calculates WHIP correctly', () => {
    // WHIP = (H + BB) / IP = (180 + 60) / (600/3) = 240/200 = 1.20
    expect(whip(180, 60, 600)).toBe('1.20');
  });

  it('returns 0.00 when outs is 0', () => {
    expect(whip(0, 0, 0)).toBe('0.00');
  });
});

// ─── Row formatters ──────────────────────────────────────────────────────────

describe('Career stats — hittingRow()', () => {
  it('formats a hitting season correctly', () => {
    const season = makeSeason({
      season: 2026, g: 150, pa: 600, ab: 500, h: 150,
      bb: 60, hbp: 10, hr: 30, rbi: 95, sb: 15, k: 120, r: 90,
    });
    const row = hittingRow(season);

    expect(row.season).toBe('2026');
    expect(row.g).toBe('150');
    expect(row.pa).toBe('600');
    expect(row.avg).toBe('0.300'); // 150/500
    expect(row.hr).toBe('30');
    expect(row.rbi).toBe('95');
    expect(row.sb).toBe('15');
  });
});

describe('Career stats — pitchingRow()', () => {
  it('formats a pitching season correctly', () => {
    const season = makeSeason({
      season: 2026, gp: 32, gs: 32, w: 15, l: 8, sv: 0,
      er: 60, outs: 600, ha: 180, bba: 50, ka: 200,
    });
    const row = pitchingRow(season);

    expect(row.season).toBe('2026');
    expect(row.g).toBe('32');
    expect(row.gs).toBe('32');
    expect(row.w).toBe('15');
    expect(row.l).toBe('8');
    expect(row.era).toBe('2.70'); // (60/600)*27
    expect(row.ip).toBe('200.0'); // 600/3
    expect(row.ka).toBe('200');
  });
});

// ─── Totals aggregation ─────────────────────────────────────────────────────

describe('Career stats — totalsHitting()', () => {
  it('sums multiple hitting seasons', () => {
    const s1 = makeSeason({ season: 2026, g: 150, pa: 600, ab: 500, h: 150, bb: 50, hbp: 10, hr: 30, rbi: 90, sb: 10, k: 100, r: 80 });
    const s2 = makeSeason({ season: 2027, g: 140, pa: 550, ab: 470, h: 130, bb: 45, hbp: 5, hr: 25, rbi: 85, sb: 8, k: 95, r: 75 });

    const totals = totalsHitting([s1, s2]);

    expect(totals.season).toBe('2yr');
    expect(totals.g).toBe('290');
    expect(totals.pa).toBe('1150');
    expect(totals.hr).toBe('55');
    expect(totals.rbi).toBe('175');
    // AVG = (150+130)/(500+470) = 280/970
    expect(totals.avg).toBe((280 / 970).toFixed(3));
  });

  it('handles single season', () => {
    const s1 = makeSeason({ season: 2026, g: 100, pa: 400, ab: 350, h: 100, hr: 15 });
    const totals = totalsHitting([s1]);
    expect(totals.season).toBe('1yr');
    expect(totals.g).toBe('100');
  });
});

describe('Career stats — totalsPitching()', () => {
  it('sums multiple pitching seasons', () => {
    const s1 = makeSeason({ season: 2026, gp: 32, gs: 32, w: 15, l: 8, sv: 0, er: 60, outs: 600, ha: 180, bba: 50, ka: 200 });
    const s2 = makeSeason({ season: 2027, gp: 30, gs: 30, w: 12, l: 10, sv: 0, er: 75, outs: 540, ha: 170, bba: 55, ka: 180 });

    const totals = totalsPitching([s1, s2]);

    expect(totals.season).toBe('2yr');
    expect(totals.g).toBe('62');
    expect(totals.w).toBe('27');
    expect(totals.l).toBe('18');
    // ERA = (60+75)/(600+540) * 27 = 135/1140 * 27
    expect(totals.era).toBe(((135 / 1140) * 27).toFixed(2));
    // IP = (600+540)/3 = 380.0
    expect(totals.ip).toBe('380.0');
  });
});
