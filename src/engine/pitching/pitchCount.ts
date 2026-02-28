/**
 * Pitch Count Management
 *
 * Tracks pitcher workload, fatigue-based effectiveness curves,
 * and pitch count thresholds for removal decisions. Monitors
 * times through the order penalty and high-leverage situations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PitchCountZone = 'green' | 'yellow' | 'orange' | 'red' | 'danger';

export const ZONE_DISPLAY: Record<PitchCountZone, { label: string; color: string; desc: string }> = {
  green:  { label: 'Cruising',    color: '#22c55e', desc: 'Low pitch count, full effectiveness' },
  yellow: { label: 'Monitoring',  color: '#eab308', desc: 'Approaching comfort zone limit' },
  orange: { label: 'Tiring',     color: '#f97316', desc: 'Fatigue setting in, velocity dropping' },
  red:    { label: 'Pull Soon',  color: '#ef4444', desc: 'High risk of blowup, go to bullpen' },
  danger: { label: 'Emergency',  color: '#dc2626', desc: 'Well past limit, injury risk elevated' },
};

export type TimesThrough = 1 | 2 | 3 | 4;

export interface PitcherWorkload {
  id: number;
  name: string;
  pos: 'SP' | 'RP';
  overall: number;
  pitchCount: number;
  pitchLimit: number;       // soft limit based on stamina
  hardLimit: number;        // absolute max
  zone: PitchCountZone;
  inning: number;
  outs: number;
  timesThrough: TimesThrough;
  velocityCurrent: number;
  velocityStart: number;
  velocityDrop: number;
  effectiveness: number;    // 0-100, drops as pitch count rises
  hittersRetired: number;
  hitsAllowed: number;
  walksAllowed: number;
  ksThrown: number;
  earnedRuns: number;
  strikeRate: number;       // % of pitches that are strikes
  lineScore: string;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getZone(pitchCount: number, softLimit: number, hardLimit: number): PitchCountZone {
  const pct = pitchCount / softLimit;
  if (pitchCount >= hardLimit) return 'danger';
  if (pct >= 1.0) return 'red';
  if (pct >= 0.85) return 'orange';
  if (pct >= 0.65) return 'yellow';
  return 'green';
}

export function calcEffectiveness(pitchCount: number, softLimit: number, timesThrough: TimesThrough): number {
  const baseFatigue = Math.max(0, (pitchCount / softLimit) * 30);
  const ttoBonus = timesThrough >= 3 ? 15 : timesThrough >= 2 ? 5 : 0;
  return Math.max(10, Math.round(100 - baseFatigue - ttoBonus));
}

export function calcVelocityDrop(pitchCount: number, softLimit: number): number {
  const pct = pitchCount / softLimit;
  if (pct >= 1.0) return 3;
  if (pct >= 0.85) return 2;
  if (pct >= 0.65) return 1;
  return 0;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoPitchers(): PitcherWorkload[] {
  const data = [
    { name: 'Gerrit Cole', ovr: 89, pc: 87, limit: 100, hard: 115, inn: 6, outs: 1, tto: 3 as TimesThrough, velo: 97 },
    { name: 'Zack Wheeler', ovr: 86, pc: 65, limit: 105, hard: 120, inn: 5, outs: 0, tto: 2 as TimesThrough, velo: 96 },
    { name: 'Spencer Strider', ovr: 84, pc: 52, limit: 90, hard: 105, inn: 4, outs: 1, tto: 2 as TimesThrough, velo: 98 },
    { name: 'Tarik Skubal', ovr: 88, pc: 98, limit: 100, hard: 112, inn: 7, outs: 0, tto: 3 as TimesThrough, velo: 94 },
    { name: 'Logan Webb', ovr: 82, pc: 78, limit: 110, hard: 125, inn: 6, outs: 2, tto: 3 as TimesThrough, velo: 92 },
  ];

  return data.map((p, i) => {
    const veloDrop = calcVelocityDrop(p.pc, p.limit);
    const effectiveness = calcEffectiveness(p.pc, p.limit, p.tto);
    const zone = getZone(p.pc, p.limit, p.hard);

    return {
      id: i,
      name: p.name,
      pos: 'SP' as const,
      overall: p.ovr,
      pitchCount: p.pc,
      pitchLimit: p.limit,
      hardLimit: p.hard,
      zone,
      inning: p.inn,
      outs: p.outs,
      timesThrough: p.tto,
      velocityCurrent: p.velo - veloDrop,
      velocityStart: p.velo,
      velocityDrop: veloDrop,
      effectiveness,
      hittersRetired: 3 * (p.inn - 1) + p.outs,
      hitsAllowed: 2 + (i % 4),
      walksAllowed: i % 3,
      ksThrown: 3 + (i * 2) % 8,
      earnedRuns: i % 3,
      strikeRate: 58 + (i * 5) % 12,
      lineScore: `${p.inn - 1}.${p.outs} IP, ${2 + i % 4} H, ${i % 3} ER, ${3 + (i * 2) % 8} K, ${i % 3} BB`,
    };
  });
}
