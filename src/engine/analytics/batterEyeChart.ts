/**
 * batterEyeChart.ts – Batter Eye Chart Engine
 *
 * Visualizes a hitter's plate discipline zones showing swing/take
 * decisions by zone. Uses a 5x5 grid representing the strike zone
 * and surrounding chase areas. Each zone tracks swing%, take%,
 * whiff%, avgEV, xwOBA, and pitches seen.
 *
 * All demo data — no sim engine integration.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type SwingResult = 'whiff' | 'foul' | 'bip_weak' | 'bip_medium' | 'bip_hard';

export type TakeResult = 'ball' | 'called_strike';

export interface EyeZone {
  row: number;        // 0-4, top to bottom
  col: number;        // 0-4, left to right
  swingPct: number;   // 0-100
  takePct: number;    // 0-100
  whiffPct: number;   // 0-100 (of swings)
  avgEV: number;      // mph exit velocity
  xwOBA: number;      // expected wOBA 0.000-0.600
  pitchesSeen: number;
}

export interface BatterEyeProfile {
  playerId: number;
  name: string;
  bats: 'L' | 'R' | 'S';
  zones: EyeZone[];   // 25 zones (5x5 grid)
  overallChaseRate: number;    // 0-100
  overallZoneSwingRate: number; // 0-100
  overallWhiffRate: number;    // 0-100
}

// ── Zone Classification ────────────────────────────────────────────────────

/** Returns true if zone is inside the strike zone (inner 3x3 grid, rows 1-3, cols 1-3) */
function isStrikeZone(row: number, col: number): boolean {
  return row >= 1 && row <= 3 && col >= 1 && col <= 3;
}

/** Returns true if zone is on the edge (border of the inner 3x3) */
function isEdgeZone(row: number, col: number): boolean {
  if (!isStrikeZone(row, col)) return false;
  return row === 1 || row === 3 || col === 1 || col === 3;
}

/** Returns true if zone is a chase zone (outside strike zone) */
function isChaseZone(row: number, col: number): boolean {
  return !isStrikeZone(row, col);
}

// ── Zone Label ─────────────────────────────────────────────────────────────

export function getZoneLabel(row: number, col: number): string {
  if (row === 0) {
    if (col === 0) return 'High-In';
    if (col === 4) return 'High-Out';
    return 'High';
  }
  if (row === 4) {
    if (col === 0) return 'Low-In';
    if (col === 4) return 'Low-Out';
    return 'Low';
  }
  if (col === 0) return 'Inside';
  if (col === 4) return 'Outside';
  if (row === 1 && col === 2) return 'Up-Mid';
  if (row === 2 && col === 2) return 'Heart';
  if (row === 3 && col === 2) return 'Down-Mid';
  return 'Zone';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_HITTERS: Array<{
  name: string;
  bats: 'L' | 'R' | 'S';
  discipline: number;  // 0-100 plate discipline
  power: number;       // 0-100 raw power
  contact: number;     // 0-100 contact ability
}> = [
  { name: 'Juan Soto',       bats: 'L', discipline: 96, power: 82, contact: 78 },
  { name: 'Steven Kwan',     bats: 'L', discipline: 92, power: 48, contact: 94 },
  { name: 'Aaron Judge',     bats: 'R', discipline: 68, power: 98, contact: 62 },
  { name: 'Bobby Witt Jr',   bats: 'R', discipline: 52, power: 76, contact: 74 },
  { name: 'Shohei Ohtani',   bats: 'L', discipline: 65, power: 95, contact: 70 },
  { name: 'Luis Arraez',     bats: 'L', discipline: 94, power: 32, contact: 96 },
  { name: 'Freddie Freeman', bats: 'L', discipline: 82, power: 72, contact: 84 },
  { name: 'Mookie Betts',    bats: 'R', discipline: 80, power: 74, contact: 82 },
  { name: 'Ronald Acuna Jr', bats: 'R', discipline: 72, power: 86, contact: 76 },
  { name: 'Javier Baez',     bats: 'R', discipline: 28, power: 78, contact: 54 },
];

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 11) % 2147483647;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

function buildZones(
  discipline: number,
  power: number,
  contact: number,
  seed: number,
): EyeZone[] {
  const rand = seededRand(seed);
  const zones: EyeZone[] = [];

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const inZone = isStrikeZone(row, col);
      const edge = isEdgeZone(row, col);
      const chase = isChaseZone(row, col);

      // Base swing rate depends on zone location
      let baseSwing: number;
      if (row === 2 && col === 2) {
        baseSwing = 82 + rand() * 12;  // Heart of plate — high swing rate
      } else if (inZone && !edge) {
        baseSwing = 70 + rand() * 15;  // Inner zone
      } else if (edge) {
        baseSwing = 50 + rand() * 20;  // Edge — moderate
      } else {
        // Chase zone — discipline matters
        baseSwing = 45 - discipline * 0.35 + rand() * 15;
      }

      // Apply discipline modifier
      if (chase) {
        baseSwing = Math.max(4, baseSwing - discipline * 0.15);
      } else {
        baseSwing = Math.min(95, baseSwing + discipline * 0.08);
      }

      const swingPct = Math.round(Math.max(3, Math.min(96, baseSwing)));
      const takePct = 100 - swingPct;

      // Whiff rate — depends on contact ability and zone location
      let baseWhiff: number;
      if (row === 2 && col === 2) {
        baseWhiff = 8 + (100 - contact) * 0.15 + rand() * 5;
      } else if (inZone) {
        baseWhiff = 14 + (100 - contact) * 0.2 + rand() * 8;
      } else {
        baseWhiff = 30 + (100 - contact) * 0.3 + rand() * 12;
      }
      const whiffPct = Math.round(Math.max(3, Math.min(65, baseWhiff)));

      // Exit velocity — depends on power and zone location
      let baseEV: number;
      if (row === 2 && col === 2) {
        baseEV = 88 + power * 0.12 + rand() * 4;
      } else if (inZone) {
        baseEV = 84 + power * 0.10 + rand() * 4;
      } else {
        baseEV = 76 + power * 0.06 + rand() * 5;
      }
      const avgEV = Math.round(Math.max(72, Math.min(102, baseEV)) * 10) / 10;

      // xwOBA — based on contact + power + zone
      let baseXwOBA: number;
      if (row === 2 && col === 2) {
        baseXwOBA = 0.320 + (power + contact) * 0.0015 + rand() * 0.05;
      } else if (inZone && !edge) {
        baseXwOBA = 0.280 + (power + contact) * 0.001 + rand() * 0.06;
      } else if (edge) {
        baseXwOBA = 0.220 + (power + contact) * 0.0008 + rand() * 0.06;
      } else {
        baseXwOBA = 0.100 + (power + contact) * 0.0004 + rand() * 0.05;
      }
      const xwOBA = Math.round(Math.max(0.050, Math.min(0.600, baseXwOBA)) * 1000) / 1000;

      // Pitches seen — more in zone and edge
      const basePitches = inZone ? 60 + Math.floor(rand() * 50) : 30 + Math.floor(rand() * 35);

      zones.push({
        row,
        col,
        swingPct,
        takePct,
        whiffPct,
        avgEV,
        xwOBA,
        pitchesSeen: basePitches,
      });
    }
  }

  return zones;
}

export function generateDemoBatterEye(): BatterEyeProfile[] {
  return DEMO_HITTERS.map((h, i) => {
    const zones = buildZones(h.discipline, h.power, h.contact, (i + 1) * 7919);

    // Compute aggregate stats
    const chaseZones = zones.filter(z => isChaseZone(z.row, z.col));
    const strikeZones = zones.filter(z => isStrikeZone(z.row, z.col));

    const totalChasePitches = chaseZones.reduce((s, z) => s + z.pitchesSeen, 0);
    const totalChaseSwings = chaseZones.reduce((s, z) => s + z.pitchesSeen * z.swingPct / 100, 0);
    const overallChaseRate = totalChasePitches > 0
      ? Math.round((totalChaseSwings / totalChasePitches) * 1000) / 10
      : 0;

    const totalZonePitches = strikeZones.reduce((s, z) => s + z.pitchesSeen, 0);
    const totalZoneSwings = strikeZones.reduce((s, z) => s + z.pitchesSeen * z.swingPct / 100, 0);
    const overallZoneSwingRate = totalZonePitches > 0
      ? Math.round((totalZoneSwings / totalZonePitches) * 1000) / 10
      : 0;

    const totalPitches = zones.reduce((s, z) => s + z.pitchesSeen, 0);
    const totalSwings = zones.reduce((s, z) => s + z.pitchesSeen * z.swingPct / 100, 0);
    const totalWhiffs = zones.reduce((s, z) => s + z.pitchesSeen * z.swingPct / 100 * z.whiffPct / 100, 0);
    const overallWhiffRate = totalSwings > 0
      ? Math.round((totalWhiffs / totalSwings) * 1000) / 10
      : 0;

    return {
      playerId: i + 1,
      name: h.name,
      bats: h.bats,
      zones,
      overallChaseRate,
      overallZoneSwingRate,
      overallWhiffRate,
    };
  });
}
