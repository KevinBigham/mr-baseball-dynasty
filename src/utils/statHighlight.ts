/**
 * Elite stat highlighting — gold text for standout statistical achievements.
 * Thresholds mirror real-world MLB elite benchmarks.
 */

const ELITE_THRESHOLDS: Record<string, { min?: number; max?: number }> = {
  // Batting (higher is better)
  avg: { min: 0.300 },
  obp: { min: 0.380 },
  slg: { min: 0.500 },
  ops: { min: 0.900 },
  hr: { min: 35 },
  rbi: { min: 100 },
  r: { min: 100 },
  sb: { min: 30 },
  h: { min: 180 },
  // Pitching (lower is better for ERA/WHIP/BB9)
  era: { max: 3.00 },
  whip: { max: 1.10 },
  bb9: { max: 2.00 },
  // Pitching (higher is better for K/9, W, SV)
  k9: { min: 10.0 },
  w: { min: 18 },
  sv: { min: 35 },
  ip: { min: 200 },
  // Advanced
  'wrc+': { min: 140 },
  woba: { min: 0.380 },
  war: { min: 5.0 },
  fip: { max: 3.00 },
};

/** Check if a stat value qualifies as "elite". */
export function isEliteStat(stat: string, value: number): boolean {
  const key = stat.toLowerCase().replace(/[^a-z0-9+]/g, '');
  const threshold = ELITE_THRESHOLDS[key];
  if (!threshold) return false;
  if (threshold.min !== undefined && value >= threshold.min) return true;
  if (threshold.max !== undefined && value <= threshold.max) return true;
  return false;
}

/** Returns Tailwind class string for elite stat highlighting. */
export function eliteStatClass(stat: string, value: number): string {
  return isEliteStat(stat, value) ? 'text-orange-400 font-bold' : '';
}
