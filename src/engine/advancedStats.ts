/**
 * advancedStats.ts — Sabermetric computations.
 *
 * Computes wRC+, wOBA, BABIP, ISO, FIP, xFIP, and simplified WAR
 * from the raw PlayerSeasonStats tracked by the season simulator.
 */

import type { PlayerSeasonStats } from '../types/player';

// ─── Linear weights (2024 FanGraphs-style constants) ─────────────────────────
// These are stable across eras; slight year-to-year variation is negligible.

const W_BB = 0.690;
const W_HBP = 0.722;
const W_1B = 0.878;
const W_2B = 1.242;
const W_3B = 1.568;
const W_HR = 2.004;

const FIP_CONSTANT = 3.17; // League-calibrated FIP constant
const RUNS_PER_WIN = 10;   // Standard ~10 runs per marginal win
const REPLACEMENT_LEVEL_RUNS_PER_600PA = -20; // Below average by 20 runs

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeagueAverages {
  /** League-wide batting average */
  avg: number;
  /** League-wide OBP */
  obp: number;
  /** League-wide SLG */
  slg: number;
  /** League-wide wOBA */
  wOBA: number;
  /** League-wide R/PA */
  rPerPA: number;
  /** wOBA scale factor (wOBA / OBP) */
  wOBAScale: number;
  /** League-wide BABIP */
  babip: number;
  /** League-wide HR/FB rate (approximate) */
  hrPerFB: number;
  /** League-wide FIP */
  fip: number;
  /** League-wide ERA */
  era: number;
  /** Total PA across league */
  totalPA: number;
  /** Total IP across league */
  totalIP: number;
}

export interface AdvancedHittingStats {
  /** Batting Average on Balls in Play */
  babip: number;
  /** Isolated Power (SLG - AVG) */
  iso: number;
  /** Weighted On-Base Average */
  wOBA: number;
  /** Weighted Runs Created Plus (100 = league avg) */
  wRCPlus: number;
  /** Wins Above Replacement (simplified) */
  war: number;
  /** On-base Plus Slugging */
  ops: number;
  /** Basic stats for convenience */
  avg: number;
  obp: number;
  slg: number;
}

export interface AdvancedPitchingStats {
  /** Fielding Independent Pitching */
  fip: number;
  /** Expected FIP (normalizes HR to league FB rate) */
  xFIP: number;
  /** BABIP against */
  babip: number;
  /** Walks + Hits per Inning Pitched */
  whip: number;
  /** Strikeouts per 9 innings */
  k9: number;
  /** Walks per 9 innings */
  bb9: number;
  /** HR per 9 innings */
  hr9: number;
  /** K/BB ratio */
  kbb: number;
  /** Wins Above Replacement (simplified) */
  war: number;
  /** Basic ERA for convenience */
  era: number;
}

// ─── Utility helpers ─────────────────────────────────────────────────────────

function safeDiv(num: number, den: number, fallback = 0): number {
  return den > 0 ? num / den : fallback;
}

function outsToIP(outs: number): number {
  return outs / 3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Batting helpers ─────────────────────────────────────────────────────────

function computeAVG(s: PlayerSeasonStats): number {
  return safeDiv(s.h, s.ab);
}

function computeOBP(s: PlayerSeasonStats): number {
  const num = s.h + s.bb + s.hbp;
  const den = s.ab + s.bb + s.hbp; // no SF in our stats, approximate
  return safeDiv(num, den);
}

function computeSLG(s: PlayerSeasonStats): number {
  const singles = s.h - s.doubles - s.triples - s.hr;
  const tb = singles + 2 * s.doubles + 3 * s.triples + 4 * s.hr;
  return safeDiv(tb, s.ab);
}

function computeBABIP(s: PlayerSeasonStats): number {
  const num = s.h - s.hr;
  const den = s.ab - s.k - s.hr; // Approximation without SF
  return safeDiv(num, den);
}

function computeISO(s: PlayerSeasonStats): number {
  return computeSLG(s) - computeAVG(s);
}

function computeWOBA(s: PlayerSeasonStats): number {
  const singles = s.h - s.doubles - s.triples - s.hr;
  const num = W_BB * s.bb + W_HBP * s.hbp + W_1B * singles +
              W_2B * s.doubles + W_3B * s.triples + W_HR * s.hr;
  const den = s.ab + s.bb + s.hbp; // no SF
  return safeDiv(num, den);
}

// ─── Pitching helpers ────────────────────────────────────────────────────────

function computeERA(s: PlayerSeasonStats): number {
  const ip = outsToIP(s.outs);
  return safeDiv(s.er * 9, ip);
}

function computeFIP(s: PlayerSeasonStats): number {
  const ip = outsToIP(s.outs);
  if (ip <= 0) return 0;
  return ((13 * s.hra + 3 * s.bba - 2 * s.ka) / ip) + FIP_CONSTANT;
}

function computeXFIP(s: PlayerSeasonStats, leagueHRPerFB: number): number {
  const ip = outsToIP(s.outs);
  if (ip <= 0) return 0;
  // Estimate fly balls: rough approximation using batted balls
  // Batted balls ≈ AB - K (approximately)
  const battedBalls = Math.max(1, (s.ha + s.hra) - 0); // hits allowed + HR
  // Use league HR/FB rate instead of actual
  const expectedHR = battedBalls * 0.35 * leagueHRPerFB; // ~35% of batted balls are FBs
  return ((13 * expectedHR + 3 * s.bba - 2 * s.ka) / ip) + FIP_CONSTANT;
}

function computePitcherBABIP(s: PlayerSeasonStats): number {
  const num = s.ha - s.hra;
  // Approximate: BF ≈ IP*3 + H + BB (batters faced)
  const ip = outsToIP(s.outs);
  const approxBF = ip * 3 + s.ha + s.bba;
  const den = approxBF - s.ka - s.hra - s.bba;
  return safeDiv(num, Math.max(1, den));
}

// ─── League averages computation ─────────────────────────────────────────────

export function computeLeagueAverages(allStats: PlayerSeasonStats[]): LeagueAverages {
  // Aggregate across all players with significant playing time
  const hitters = allStats.filter(s => s.pa >= 50);
  const pitchers = allStats.filter(s => s.outs >= 30); // 10+ IP

  // Hitting aggregates
  let totalH = 0, totalAB = 0, totalBB = 0, totalHBP = 0, totalPA = 0;
  let totalDoubles = 0, totalTriples = 0, totalHR = 0, totalR = 0, totalK = 0;

  for (const s of hitters) {
    totalH += s.h; totalAB += s.ab; totalBB += s.bb; totalHBP += s.hbp;
    totalPA += s.pa; totalDoubles += s.doubles; totalTriples += s.triples;
    totalHR += s.hr; totalR += s.r; totalK += s.k;
  }

  const lgAVG = safeDiv(totalH, totalAB, 0.260);
  const lgOBP = safeDiv(totalH + totalBB + totalHBP, totalAB + totalBB + totalHBP, 0.320);
  const lgSingles = totalH - totalDoubles - totalTriples - totalHR;
  const lgTB = lgSingles + 2 * totalDoubles + 3 * totalTriples + 4 * totalHR;
  const lgSLG = safeDiv(lgTB, totalAB, 0.400);
  const lgBABIP = safeDiv(totalH - totalHR, Math.max(1, totalAB - totalK - totalHR), 0.300);
  const lgRPerPA = safeDiv(totalR, totalPA, 0.11);

  // League wOBA
  const lgWOBANum = W_BB * totalBB + W_HBP * totalHBP + W_1B * lgSingles +
                    W_2B * totalDoubles + W_3B * totalTriples + W_HR * totalHR;
  const lgWOBADen = totalAB + totalBB + totalHBP;
  const lgWOBA = safeDiv(lgWOBANum, lgWOBADen, 0.320);
  const lgWOBAScale = safeDiv(lgWOBA, lgOBP, 1.0);

  // Pitching aggregates
  let totalOuts = 0, totalER = 0, totalBBA = 0, totalKA = 0, totalHRA = 0, totalHA = 0;
  for (const s of pitchers) {
    totalOuts += s.outs; totalER += s.er; totalBBA += s.bba;
    totalKA += s.ka; totalHRA += s.hra; totalHA += s.ha;
  }

  const lgIP = outsToIP(totalOuts);
  const lgERA = safeDiv(totalER * 9, lgIP, 4.00);
  const lgFIP = lgIP > 0 ? ((13 * totalHRA + 3 * totalBBA - 2 * totalKA) / lgIP) + FIP_CONSTANT : 4.00;

  // Estimate league HR/FB rate
  const lgBattedBalls = Math.max(1, totalHA);
  const lgHRPerFB = safeDiv(totalHRA, lgBattedBalls * 0.35, 0.105);

  return {
    avg: lgAVG,
    obp: lgOBP,
    slg: lgSLG,
    wOBA: lgWOBA,
    rPerPA: lgRPerPA,
    wOBAScale: lgWOBAScale,
    babip: lgBABIP,
    hrPerFB: clamp(lgHRPerFB, 0.05, 0.20),
    fip: lgFIP,
    era: lgERA,
    totalPA,
    totalIP: lgIP,
  };
}

// ─── Advanced hitting stats ──────────────────────────────────────────────────

export function computeAdvancedHitting(
  stats: PlayerSeasonStats,
  league: LeagueAverages,
): AdvancedHittingStats {
  const avg = computeAVG(stats);
  const obp = computeOBP(stats);
  const slg = computeSLG(stats);
  const babip = computeBABIP(stats);
  const iso = computeISO(stats);
  const wOBA = computeWOBA(stats);
  const ops = obp + slg;

  // wRC+ = ((wRAA/PA + lgR/PA) / (lgR/PA)) * 100
  // where wRAA = ((wOBA - lgwOBA) / wOBAScale) * PA
  const pa = stats.pa || 1;
  const wRAA = ((wOBA - league.wOBA) / (league.wOBAScale || 1)) * pa;
  const wRAAPerPA = wRAA / pa;
  const lgRPerPA = league.rPerPA || 0.11;
  const wRCPlus = lgRPerPA > 0
    ? Math.round(((wRAAPerPA + lgRPerPA) / lgRPerPA) * 100)
    : 100;

  // WAR (simplified position player):
  // batting_runs = wRAA
  // baserunning_runs ≈ (SB * 0.2 - CS * 0.4) -- rough approximation
  // positional_adj ≈ 0 (would need position factors)
  // replacement_level = REPLACEMENT_LEVEL_RUNS_PER_600PA * (PA/600)
  const baserunningRuns = stats.sb * 0.2 - stats.cs * 0.4;
  const replacementRuns = REPLACEMENT_LEVEL_RUNS_PER_600PA * (pa / 600);
  const war = (wRAA + baserunningRuns - replacementRuns) / RUNS_PER_WIN;

  return {
    babip: Number(babip.toFixed(3)),
    iso: Number(iso.toFixed(3)),
    wOBA: Number(wOBA.toFixed(3)),
    wRCPlus: clamp(wRCPlus, 0, 300),
    war: Number(war.toFixed(1)),
    ops: Number(ops.toFixed(3)),
    avg: Number(avg.toFixed(3)),
    obp: Number(obp.toFixed(3)),
    slg: Number(slg.toFixed(3)),
  };
}

// ─── Advanced pitching stats ─────────────────────────────────────────────────

export function computeAdvancedPitching(
  stats: PlayerSeasonStats,
  league: LeagueAverages,
): AdvancedPitchingStats {
  const ip = outsToIP(stats.outs);
  const era = computeERA(stats);
  const fip = computeFIP(stats);
  const xfip = computeXFIP(stats, league.hrPerFB);
  const babip = computePitcherBABIP(stats);

  const whip = safeDiv(stats.ha + stats.bba, ip);
  const k9 = safeDiv(stats.ka * 9, ip);
  const bb9 = safeDiv(stats.bba * 9, ip);
  const hr9 = safeDiv(stats.hra * 9, ip);
  const kbb = safeDiv(stats.ka, Math.max(1, stats.bba));

  // WAR (simplified pitcher):
  // FIP-based runs saved = ((lgFIP - FIP) / 9) * IP
  // replacement_level = lgERA * 1.2 (replacement level pitcher is 20% worse)
  const lgFIP = league.fip || 4.00;
  const runsAboveReplacement = ((lgFIP * 1.2 - fip) / 9) * ip;
  const war = runsAboveReplacement / RUNS_PER_WIN;

  return {
    fip: Number(fip.toFixed(2)),
    xFIP: Number(xfip.toFixed(2)),
    babip: Number(babip.toFixed(3)),
    whip: Number(whip.toFixed(2)),
    k9: Number(k9.toFixed(1)),
    bb9: Number(bb9.toFixed(1)),
    hr9: Number(hr9.toFixed(1)),
    kbb: Number(kbb.toFixed(2)),
    war: Number(war.toFixed(1)),
    era: Number(era.toFixed(2)),
  };
}
