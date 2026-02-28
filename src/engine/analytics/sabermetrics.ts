/**
 * Advanced Sabermetrics Engine — Mr. Baseball Dynasty
 *
 * Computes modern advanced statistics from raw season stats:
 *   - wRC+ (Weighted Runs Created Plus) — park/league-adjusted offense
 *   - WAR  (Wins Above Replacement) — total player value
 *   - FIP  (Fielding Independent Pitching) — pitcher quality
 *   - OPS+ (OPS adjusted to league average = 100)
 *   - ERA+ (ERA adjusted to league average = 100)
 *   - BABIP, ISO, K%, BB%, HR/9, K/BB
 *
 * All stats normalized to league average (100 = average, >100 = above average).
 * Inspired by FanGraphs / Baseball Reference methodologies.
 */

import type { PlayerSeasonStats } from '../../types/player';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AdvancedHitterStats {
  playerId:  number;
  name:      string;
  teamAbbr:  string;
  position:  string;
  // Rate stats
  avg:       number;
  obp:       number;
  slg:       number;
  ops:       number;
  iso:       number;   // Isolated Power = SLG - AVG
  babip:     number;   // Batting Average on Balls in Play
  kPct:      number;   // Strikeout %
  bbPct:     number;   // Walk %
  // Advanced
  woba:      number;   // Weighted On-Base Average
  wrcPlus:   number;   // wRC+ (100 = league average)
  opsPlus:   number;   // OPS+ (100 = league average)
  war:       number;   // Wins Above Replacement
  // Counting
  pa:        number;
  hr:        number;
  rbi:       number;
  sb:        number;
  r:         number;
}

export interface AdvancedPitcherStats {
  playerId:  number;
  name:      string;
  teamAbbr:  string;
  position:  string;
  // Rate stats
  era:       number;
  whip:      number;
  fip:       number;   // Fielding Independent Pitching
  k9:        number;   // Strikeouts per 9
  bb9:       number;   // Walks per 9
  hr9:       number;   // HR per 9
  kbb:       number;   // K/BB ratio
  kPct:      number;   // K%
  bbPct:     number;   // BB%
  // Advanced
  eraPlus:   number;   // ERA+ (100 = league average, higher is better)
  fipMinus:  number;   // FIP- (100 = league average, lower is better)
  war:       number;   // Wins Above Replacement
  // Counting
  ip:        number;
  w:         number;
  l:         number;
  sv:        number;
  k:         number;
}

export interface LeagueEnvironment {
  lgBA:      number;
  lgOBP:     number;
  lgSLG:     number;
  lgERA:     number;
  lgFIP:     number;
  lgR9:      number;   // Runs per 9 innings
  lgHR:      number;   // Total HR
  lgBB:      number;   // Total BB
  lgK:       number;   // Total K
  lgIP:      number;   // Total IP
  lgHBP:     number;   // Total HBP
  fipConstant: number; // lgERA - rawFIP
}

// ─── wOBA weights (simplified FanGraphs-style) ──────────────────────────────────

const WOBA_SCALE = 1.15; // wOBA to runs scaling
const WOBA_WEIGHTS = {
  bb:     0.690,
  hbp:    0.720,
  single: 0.880,
  double: 1.240,
  triple: 1.560,
  hr:     2.010,
};

// ─── Compute league environment from all player stats ───────────────────────────

export function computeLeagueEnvironment(
  stats: Map<number, PlayerSeasonStats>,
  isPitcherMap: Map<number, boolean>,
): LeagueEnvironment {
  let totalPA = 0, totalAB = 0, totalH = 0, totalBB = 0, totalK = 0;
  let totalHR = 0, totalHBP = 0, total2B = 0, total3B = 0;
  let totalOuts = 0, totalER = 0;

  for (const [pid, s] of stats) {
    const isPitcher = isPitcherMap.get(pid) ?? false;
    // Hitter stats
    if (!isPitcher && s.pa > 0) {
      totalPA += s.pa;
      totalAB += s.ab;
      totalH += s.h;
      totalBB += s.bb;
      totalK += s.k;
      totalHR += s.hr;
      totalHBP += s.hbp;
      total2B += s.doubles;
      total3B += s.triples;
    }
    // Pitcher stats
    if (isPitcher && s.outs > 0) {
      totalOuts += s.outs;
      totalER += s.er;
    }
  }

  const lgBA = totalAB > 0 ? totalH / totalAB : 0.250;
  const lgOBP = totalPA > 0 ? (totalH + totalBB + totalHBP) / totalPA : 0.320;
  const lgSLG = totalAB > 0 ?
    (totalH - total2B - total3B - totalHR + total2B * 2 + total3B * 3 + totalHR * 4) / totalAB : 0.400;
  const lgIP = totalOuts / 3;
  const lgERA = lgIP > 0 ? (totalER / lgIP) * 9 : 4.00;
  const lgR9 = lgIP > 0 ? (totalER * 1.1 / lgIP) * 9 : 4.50; // Unearned runs ~10%

  // FIP constant: lgERA - raw league FIP
  const rawLgFIP = lgIP > 0
    ? (13 * totalHR + 3 * totalBB - 2 * totalK) / lgIP
    : 0;
  const fipConstant = lgERA - rawLgFIP;

  // Pitcher K/BB from pitcher stats
  let pitcherK = 0, pitcherBB = 0, pitcherHR = 0;
  for (const [pid, s] of stats) {
    if ((isPitcherMap.get(pid) ?? false) && s.outs > 0) {
      pitcherK += s.ka;
      pitcherBB += s.bba;
      pitcherHR += s.hra;
    }
  }

  return {
    lgBA, lgOBP, lgSLG, lgERA, lgR9,
    lgFIP: lgERA, // Approximation
    lgHR: pitcherHR, lgBB: pitcherBB, lgK: pitcherK,
    lgIP, lgHBP: totalHBP, fipConstant,
  };
}

// ─── Compute advanced hitter stats ──────────────────────────────────────────────

export function computeAdvancedHitterStats(
  s: PlayerSeasonStats,
  env: LeagueEnvironment,
  meta?: { name: string; teamAbbr: string; position: string },
): AdvancedHitterStats {
  const avg = s.ab > 0 ? s.h / s.ab : 0;
  const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
  const singles = s.h - s.doubles - s.triples - s.hr;
  const slg = s.ab > 0
    ? (singles + s.doubles * 2 + s.triples * 3 + s.hr * 4) / s.ab
    : 0;
  const ops = obp + slg;
  const iso = slg - avg;
  const kPct = s.pa > 0 ? s.k / s.pa : 0;
  const bbPct = s.pa > 0 ? s.bb / s.pa : 0;

  // BABIP = (H - HR) / (AB - K - HR + SF) — approximate SF as 0
  const babipDenom = s.ab - s.k - s.hr;
  const babip = babipDenom > 0 ? (s.h - s.hr) / babipDenom : 0;

  // wOBA
  const woba = s.pa > 0
    ? (WOBA_WEIGHTS.bb * s.bb + WOBA_WEIGHTS.hbp * s.hbp
       + WOBA_WEIGHTS.single * singles + WOBA_WEIGHTS.double * s.doubles
       + WOBA_WEIGHTS.triple * s.triples + WOBA_WEIGHTS.hr * s.hr) / s.pa
    : 0;

  // wRC+ = ((wOBA - lgwOBA) / wOBA_SCALE + lgR/PA) / (lgR/PA) * 100
  const lgWoba = env.lgOBP * 0.95; // Approximation
  const lgRPA = env.lgR9 / 40; // ~40 PA per 9 innings
  const wrcPlus = lgRPA > 0
    ? Math.round(((woba - lgWoba) / WOBA_SCALE + lgRPA) / lgRPA * 100)
    : 100;

  // OPS+
  const lgOPS = env.lgOBP + env.lgSLG;
  const opsPlus = lgOPS > 0
    ? Math.round((obp / env.lgOBP + slg / env.lgSLG - 1) * 100)
    : 100;

  // WAR (simplified position-player WAR)
  // WAR ≈ (wRC+ based runs above avg + positional adj + replacement adj) / RPW
  const runsPerWin = 10; // ~10 runs per win
  const wrcRuns = s.pa > 0
    ? ((woba - lgWoba) / WOBA_SCALE) * s.pa
    : 0;
  const replacementRuns = s.pa * 0.03; // ~3% of PA as replacement level
  const war = (wrcRuns + replacementRuns) / runsPerWin;

  return {
    playerId: s.playerId,
    name: meta?.name ?? String(s.playerId),
    teamAbbr: meta?.teamAbbr ?? '---',
    position: meta?.position ?? '??',
    avg: round3(avg), obp: round3(obp), slg: round3(slg), ops: round3(ops),
    iso: round3(iso), babip: round3(babip),
    kPct: round3(kPct), bbPct: round3(bbPct),
    woba: round3(woba), wrcPlus: clamp(wrcPlus, -50, 300),
    opsPlus: clamp(opsPlus, -50, 300),
    war: round1(war),
    pa: s.pa, hr: s.hr, rbi: s.rbi, sb: s.sb, r: s.r,
  };
}

// ─── Compute advanced pitcher stats ─────────────────────────────────────────────

export function computeAdvancedPitcherStats(
  s: PlayerSeasonStats,
  env: LeagueEnvironment,
  meta?: { name: string; teamAbbr: string; position: string },
): AdvancedPitcherStats {
  const ip = s.outs / 3;
  const era = ip > 0 ? (s.er / ip) * 9 : 0;
  const whip = ip > 0 ? (s.bba + s.ha) / ip : 0;
  const k9 = ip > 0 ? (s.ka / ip) * 9 : 0;
  const bb9 = ip > 0 ? (s.bba / ip) * 9 : 0;
  const hr9 = ip > 0 ? (s.hra / ip) * 9 : 0;
  const kbb = s.bba > 0 ? s.ka / s.bba : s.ka > 0 ? 99 : 0;

  // FIP = (13*HR + 3*BB - 2*K) / IP + FIP constant
  const fip = ip > 0
    ? (13 * s.hra + 3 * s.bba - 2 * s.ka) / ip + env.fipConstant
    : 0;

  // Batters faced approximation
  const bf = ip * 3 + s.ha + s.bba; // Approximate
  const kPct = bf > 0 ? s.ka / bf : 0;
  const bbPct = bf > 0 ? s.bba / bf : 0;

  // ERA+ = (lgERA / ERA) * 100 (inverted so higher = better)
  const eraPlus = era > 0 ? Math.round((env.lgERA / era) * 100) : 100;

  // FIP- = (FIP / lgFIP) * 100 (lower = better)
  const fipMinus = env.lgFIP > 0 ? Math.round((fip / env.lgFIP) * 100) : 100;

  // Pitcher WAR (simplified)
  // WAR ≈ ((lgR9 - playerR9) / RPW) * (IP / 9) + replacement
  const runsPerWin = 10;
  const playerR9 = ip > 0 ? (s.er * 1.1 / ip) * 9 : env.lgR9; // Include unearned
  const war = ip > 0
    ? ((env.lgR9 - playerR9) / runsPerWin) * (ip / 9) + (ip / 9) * 0.03
    : 0;

  return {
    playerId: s.playerId,
    name: meta?.name ?? String(s.playerId),
    teamAbbr: meta?.teamAbbr ?? '---',
    position: meta?.position ?? '??',
    era: round2(era), whip: round2(whip), fip: round2(fip),
    k9: round1(k9), bb9: round1(bb9), hr9: round1(hr9),
    kbb: round2(kbb), kPct: round3(kPct), bbPct: round3(bbPct),
    eraPlus: clamp(eraPlus, -50, 500), fipMinus: clamp(fipMinus, -50, 500),
    war: round1(war),
    ip: round1(ip), w: s.w, l: s.l, sv: s.sv, k: s.ka,
  };
}

// ─── Batch compute for all players ──────────────────────────────────────────────

export function computeAllAdvancedStats(
  stats: Map<number, PlayerSeasonStats>,
  isPitcherMap: Map<number, boolean>,
  playerMeta?: Map<number, { name: string; teamAbbr: string; position: string }>,
): { hitters: AdvancedHitterStats[]; pitchers: AdvancedPitcherStats[]; env: LeagueEnvironment } {
  const env = computeLeagueEnvironment(stats, isPitcherMap);
  const hitters: AdvancedHitterStats[] = [];
  const pitchers: AdvancedPitcherStats[] = [];

  for (const [pid, s] of stats) {
    const isPitcher = isPitcherMap.get(pid) ?? false;
    const meta = playerMeta?.get(pid);
    if (!isPitcher && s.pa >= 50) {
      hitters.push(computeAdvancedHitterStats(s, env, meta));
    }
    if (isPitcher && s.outs >= 15) {
      pitchers.push(computeAdvancedPitcherStats(s, env, meta));
    }
  }

  // Sort by WAR descending
  hitters.sort((a, b) => b.war - a.war);
  pitchers.sort((a, b) => b.war - a.war);

  return { hitters, pitchers, env };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }
function round3(n: number): number { return Math.round(n * 1000) / 1000; }
function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }
