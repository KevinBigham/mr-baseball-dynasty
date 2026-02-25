import { PYTHAG_EXPONENT, SERVICE_DAYS_PER_YEAR } from './constants';

// ─── Number Formatting ────────────────────────────────────────────────────────

export function fmtAvg(value: number): string {
  return value.toFixed(3).replace(/^0/, '');
}

export function fmtEra(value: number): string {
  return value.toFixed(2);
}

export function fmtSalary(dollars: number): string {
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000)    return `$${(dollars / 1_000).toFixed(0)}K`;
  return `$${dollars}`;
}

export function fmtPct(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

export function fmtIP(outs: number): string {
  const full = Math.floor(outs / 3);
  const rem = outs % 3;
  return rem === 0 ? `${full}.0` : `${full}.${rem}`;
}

// ─── Service Time ─────────────────────────────────────────────────────────────

export function serviceYears(days: number): number {
  return Math.floor(days / SERVICE_DAYS_PER_YEAR);
}

export function fmtServiceTime(days: number): string {
  const years = Math.floor(days / SERVICE_DAYS_PER_YEAR);
  const rem   = days % SERVICE_DAYS_PER_YEAR;
  return `${years}Y ${rem}D`;
}

// ─── Win Probability ─────────────────────────────────────────────────────────

export function pythagoreanWinPct(runsScored: number, runsAllowed: number): number {
  if (runsAllowed === 0) return 1.0;
  const rs = Math.pow(runsScored, PYTHAG_EXPONENT);
  const ra = Math.pow(runsAllowed, PYTHAG_EXPONENT);
  return rs / (rs + ra);
}

export function expectedWins(runsScored: number, runsAllowed: number, games: number): number {
  return Math.round(pythagoreanWinPct(runsScored, runsAllowed) * games);
}

// ─── GB / PCT formatting ─────────────────────────────────────────────────────

export function gamesBehind(leaderW: number, leaderL: number, teamW: number, teamL: number): string {
  const gb = ((leaderW - teamW) + (teamL - leaderL)) / 2;
  if (gb <= 0) return '—';
  return gb % 1 === 0 ? String(gb) : gb.toFixed(1);
}

export function winPct(w: number, l: number): string {
  const total = w + l;
  if (total === 0) return '.000';
  return (w / total).toFixed(3).replace(/^0/, '');
}

// ─── Stat Aggregation ─────────────────────────────────────────────────────────

export function calcAVG(hits: number, atBats: number): number {
  return atBats === 0 ? 0 : hits / atBats;
}

export function calcOBP(hits: number, walks: number, hbp: number, atBats: number, sf: number): number {
  const denom = atBats + walks + hbp + sf;
  return denom === 0 ? 0 : (hits + walks + hbp) / denom;
}

export function calcSLG(
  singles: number,
  doubles: number,
  triples: number,
  homers: number,
  atBats: number,
): number {
  const totalBases = singles + 2 * doubles + 3 * triples + 4 * homers;
  return atBats === 0 ? 0 : totalBases / atBats;
}

export function calcOPS(obp: number, slg: number): number {
  return obp + slg;
}

export function calcERA(earnedRuns: number, outs: number): number {
  if (outs === 0) return 0;
  return (earnedRuns / (outs / 3)) * 9;
}

export function calcWHIP(walks: number, hits: number, outs: number): number {
  if (outs === 0) return 0;
  return (walks + hits) / (outs / 3);
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : sum(arr) / arr.length;
}

export function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function pearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] - mx;
    const y = ys[i] - my;
    num += x * y;
    dx  += x * x;
    dy  += y * y;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : (plural ?? `${singular}s`);
}
