/**
 * pitchArsenalHeatmap.ts – Pitch Arsenal Heatmap
 *
 * Strike zone heatmaps per pitch type for each pitcher.
 * Tracks usage, whiff rate, called-strike-plus-whiff (CSE), exit velocity,
 * and wOBA across a 5x5 zone grid for scouting and game planning.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface ZoneCell {
  row: number;        // 1-5 (top to bottom)
  col: number;        // 1-5 (inside to outside)
  usagePct: number;
  whiffPct: number;
  csePct: number;     // called strike + whiff rate
  avgEV: number;      // average exit velocity
  wOBA: number;
}

export interface PitchArsenalMap {
  pitchType: string;
  avgVelo: number;
  usagePct: number;
  overallWhiff: number;
  zones: ZoneCell[];  // 25 cells (5x5 grid)
}

export interface ArsenalHeatmapProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP' | 'CL';
  throws: 'L' | 'R';
  pitchMaps: PitchArsenalMap[];
  bestZone: string;   // e.g. "Glove-side low"
  worstZone: string;
  notes: string;
}

// ── Zone Label Helpers ─────────────────────────────────────────────────────

const ROW_LABELS = ['Up', 'Upper-mid', 'Middle', 'Lower-mid', 'Low'];
const COL_LABELS = ['Arm-side', 'Inner', 'Center', 'Outer', 'Glove-side'];

export function getZoneLabel(row: number, col: number): string {
  return `${COL_LABELS[col - 1]} ${ROW_LABELS[row - 1].toLowerCase()}`;
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface ArsenalHeatmapSummary {
  totalPitchers: number;
  mostPitches: { name: string; count: number };
  bestZoneControl: string;
  avgPitchTypes: number;
  bestWhiffPitch: { name: string; pitch: string };
}

export function getArsenalHeatmapSummary(profiles: ArsenalHeatmapProfile[]): ArsenalHeatmapSummary {
  const n = profiles.length;

  // Most pitch types
  let mostCount = 0;
  let mostName = '';
  profiles.forEach(p => {
    if (p.pitchMaps.length > mostCount) {
      mostCount = p.pitchMaps.length;
      mostName = p.name;
    }
  });

  // Best zone control = highest avg csePct across all zones
  let bestCSE = 0;
  let bestCSEName = '';
  profiles.forEach(p => {
    const allZones = p.pitchMaps.flatMap(pm => pm.zones);
    const avgCSE = allZones.reduce((s, z) => s + z.csePct, 0) / allZones.length;
    if (avgCSE > bestCSE) {
      bestCSE = avgCSE;
      bestCSEName = p.name;
    }
  });

  // Best whiff pitch
  let bestWhiff = 0;
  let bestWhiffName = '';
  let bestWhiffPitch = '';
  profiles.forEach(p => {
    p.pitchMaps.forEach(pm => {
      if (pm.overallWhiff > bestWhiff) {
        bestWhiff = pm.overallWhiff;
        bestWhiffName = p.name;
        bestWhiffPitch = pm.pitchType;
      }
    });
  });

  // Average pitch types
  const avgTypes = Math.round(profiles.reduce((s, p) => s + p.pitchMaps.length, 0) / n * 10) / 10;

  return {
    totalPitchers: n,
    mostPitches: { name: mostName, count: mostCount },
    bestZoneControl: bestCSEName,
    avgPitchTypes: avgTypes,
    bestWhiffPitch: { name: bestWhiffName, pitch: bestWhiffPitch },
  };
}

// ── Heat Color ─────────────────────────────────────────────────────────────

export function getWhiffHeatColor(value: number): string {
  if (value >= 40) return '#ef4444';
  if (value >= 30) return '#f97316';
  if (value >= 20) return '#f59e0b';
  if (value >= 10) return '#3b82f6';
  return '#1e3a5f';
}

export function getWobaHeatColor(value: number): string {
  // Low wOBA = good for pitcher (red = bad for pitcher)
  if (value >= 0.400) return '#ef4444';
  if (value >= 0.340) return '#f97316';
  if (value >= 0.300) return '#f59e0b';
  if (value >= 0.250) return '#3b82f6';
  return '#22c55e';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const PITCHERS = [
  { name: 'Corbin Burns', team: 'BAL', role: 'SP' as const, throws: 'R' as const, pitches: ['4-Seam', 'Cutter', 'Curveball', 'Changeup'] },
  { name: 'Spencer Strider', team: 'ATL', role: 'SP' as const, throws: 'R' as const, pitches: ['4-Seam', 'Slider', 'Changeup'] },
  { name: 'Zack Wheeler', team: 'PHI', role: 'SP' as const, throws: 'R' as const, pitches: ['4-Seam', 'Slider', 'Curveball', 'Changeup'] },
  { name: 'Emmanuel Clase', team: 'CLE', role: 'CL' as const, throws: 'R' as const, pitches: ['Cutter', 'Sinker', 'Slider'] },
  { name: 'Blake Snell', team: 'LAD', role: 'SP' as const, throws: 'L' as const, pitches: ['4-Seam', 'Slider', 'Curveball', 'Changeup'] },
];

const PITCH_VELO: Record<string, [number, number]> = {
  '4-Seam': [93, 98],
  'Sinker': [92, 96],
  'Cutter': [87, 93],
  'Slider': [84, 90],
  'Curveball': [77, 84],
  'Changeup': [82, 88],
};

function makeZones(seed: number, pitchType: string): ZoneCell[] {
  const zones: ZoneCell[] = [];
  const isFastball = pitchType === '4-Seam' || pitchType === 'Sinker';
  const isBreaking = pitchType === 'Slider' || pitchType === 'Curveball';

  for (let r = 1; r <= 5; r++) {
    for (let c = 1; c <= 5; c++) {
      const inZone = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      const edgeBonus = (r === 1 || r === 5 || c === 1 || c === 5) ? 8 : 0;

      // Usage depends on pitch type and location
      let usage = inZone ? 4.5 + ((seed * 3 + r * c) % 4) * 0.5 : 2.0 + ((seed + r * c) % 3) * 0.5;
      if (isFastball && r <= 2) usage += 1.5;  // fastballs up
      if (isBreaking && r >= 4) usage += 2.0;  // breaking balls down

      const whiff = isBreaking
        ? (inZone ? 18 + ((seed * 2 + r * 3 + c) % 20) : 30 + ((seed + r * 5 + c * 3) % 25))
        : (inZone ? 12 + ((seed * 3 + r + c * 5) % 15) : 22 + ((seed * 2 + r * c) % 18));
      const cse = whiff + (inZone ? 8 + ((seed + r * 2 + c) % 10) : 3 + ((seed * 3 + c) % 5));
      const avgEV = inZone
        ? 88 + ((seed + r * 3 + c * 2) % 8) - edgeBonus * 0.3
        : 84 + ((seed * 2 + r + c) % 6);
      const woba = inZone
        ? 0.280 + ((seed + r * c * 2) % 12) * 0.012 - (isBreaking ? 0.040 : 0)
        : 0.200 + ((seed * 3 + r + c) % 10) * 0.010;

      zones.push({
        row: r,
        col: c,
        usagePct: Math.round(usage * 10) / 10,
        whiffPct: Math.round(whiff * 10) / 10,
        csePct: Math.round(Math.min(cse, 65) * 10) / 10,
        avgEV: Math.round(avgEV * 10) / 10,
        wOBA: Math.round(woba * 1000) / 1000,
      });
    }
  }
  return zones;
}

export function generateDemoArsenalHeatmap(): ArsenalHeatmapProfile[] {
  return PITCHERS.map((p, i) => {
    const pitchMaps: PitchArsenalMap[] = p.pitches.map((pt, j) => {
      const veloRange = PITCH_VELO[pt] ?? [85, 92];
      const avgVelo = Math.round(((veloRange[0] + veloRange[1]) / 2 + ((i * 3 + j) % 3) - 1) * 10) / 10;
      const isPrimary = j === 0;
      const usagePct = isPrimary ? 35 + ((i * 5 + j) % 15) : 15 + ((i * 3 + j * 7) % 15);
      const zones = makeZones(i * 10 + j * 7 + 42, pt);
      const overallWhiff = Math.round(zones.reduce((s, z) => s + z.whiffPct, 0) / zones.length * 10) / 10;

      return {
        pitchType: pt,
        avgVelo,
        usagePct,
        overallWhiff,
        zones,
      };
    });

    // Normalize usage to 100%
    const totalUsage = pitchMaps.reduce((s, pm) => s + pm.usagePct, 0);
    pitchMaps.forEach(pm => {
      pm.usagePct = Math.round(pm.usagePct / totalUsage * 1000) / 10;
    });

    // Find best/worst zones across all pitches
    const allZones = pitchMaps.flatMap(pm => pm.zones);
    const bestZ = allZones.reduce((a, b) => a.csePct > b.csePct ? a : b, allZones[0]);
    const worstZ = allZones.reduce((a, b) => a.wOBA > b.wOBA ? a : b, allZones[0]);

    // Find primary whiff pitch
    const topWhiff = pitchMaps.reduce((a, b) => a.overallWhiff > b.overallWhiff ? a : b, pitchMaps[0]);

    return {
      id: `ah-${i}`,
      name: p.name,
      team: p.team,
      role: p.role,
      throws: p.throws,
      pitchMaps,
      bestZone: getZoneLabel(bestZ.row, bestZ.col),
      worstZone: getZoneLabel(worstZ.row, worstZ.col),
      notes: topWhiff.overallWhiff >= 28
        ? `Elite whiff rate on ${topWhiff.pitchType} (${topWhiff.overallWhiff}%). Commands the zone effectively.`
        : topWhiff.overallWhiff >= 22
        ? `Strong ${topWhiff.pitchType} generates swings and misses. Consistent zone presence.`
        : `Relies on contact management. Pitches to weak contact rather than strikeouts.`,
    };
  });
}
