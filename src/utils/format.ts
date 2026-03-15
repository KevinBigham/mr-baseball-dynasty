/**
 * format.ts — Shared formatting utilities.
 *
 * Extracted from multiple components to eliminate duplication.
 */

/** Format a salary value as $X.XM / $XXK / $X */
export function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

/** Convert internal 0-550 OVR to 20-80 scouting grade */
export function formatOVR(internalOvr: number): number {
  return Math.round(20 + (internalOvr / 550) * 60);
}

/** Format win-loss record as "W-L" */
export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

/** Format a season label using the full calendar year, with optional preseason text. */
export function formatSeasonLabel(season: number, preseasonLabel = 'PRE'): string {
  return season === 0 ? preseasonLabel : String(season);
}

/** Format innings pitched from outs (e.g., 18 outs → "6.0") */
export function formatIP(outs: number): string {
  const full = Math.floor(outs / 3);
  const partial = outs % 3;
  return `${full}.${partial}`;
}
