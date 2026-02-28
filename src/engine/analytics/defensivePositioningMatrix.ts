/**
 * defensivePositioningMatrix.ts – Defensive Positioning Matrix
 *
 * Evaluates team defensive efficiency across field zones.
 * Tracks outs made, expected outs, efficiency percentage, and range runs
 * saved per zone. Summarises total DRS, shift rate, and positioning grade.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface FieldZone {
  zone: string;          // e.g. 'SS Hole', 'Up Middle', etc.
  shortLabel: string;    // abbreviated label for grid
  gridRow: number;       // 0-based row for visual layout
  gridCol: number;       // 0-based col for visual layout
}

export interface ZoneEfficiency {
  zone: string;
  shortLabel: string;
  gridRow: number;
  gridCol: number;
  outsMade: number;
  expectedOuts: number;
  efficiencyPct: number;   // outsMade / expectedOuts * 100
  rangeRunsSaved: number;  // positive = runs saved, negative = runs cost
}

export type PositioningGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface TeamDefPositioning {
  teamName: string;
  teamAbbr: string;
  season: number;
  zones: ZoneEfficiency[];
  totalDRS: number;          // total defensive runs saved
  shiftRate: number;         // percentage of PAs with shift deployed (0-100)
  positioningGrade: PositioningGrade;
  bestZone: string;
  worstZone: string;
  notes: string;
}

// ── Field Zone Definitions ─────────────────────────────────────────────────

export const FIELD_ZONES: FieldZone[] = [
  // Outfield row (row 0)
  { zone: 'Left Field Line',  shortLabel: 'LF Line',  gridRow: 0, gridCol: 0 },
  { zone: 'Left-Center Gap',  shortLabel: 'LCF Gap',  gridRow: 0, gridCol: 1 },
  { zone: 'Center Field',     shortLabel: 'CF',        gridRow: 0, gridCol: 2 },
  { zone: 'Right-Center Gap', shortLabel: 'RCF Gap',   gridRow: 0, gridCol: 3 },
  { zone: 'Right Field Line', shortLabel: 'RF Line',   gridRow: 0, gridCol: 4 },

  // Mid-depth row (row 1)
  { zone: 'Left Field Shallow',  shortLabel: 'LF Shallow', gridRow: 1, gridCol: 0 },
  { zone: 'SS Deep Hole',        shortLabel: 'SS Deep',    gridRow: 1, gridCol: 1 },
  { zone: 'Up Middle',           shortLabel: 'Up Mid',     gridRow: 1, gridCol: 2 },
  { zone: '2B Deep Hole',        shortLabel: '2B Deep',    gridRow: 1, gridCol: 3 },
  { zone: 'Right Field Shallow', shortLabel: 'RF Shallow', gridRow: 1, gridCol: 4 },

  // Infield row (row 2)
  { zone: '3B Line',    shortLabel: '3B Line', gridRow: 2, gridCol: 0 },
  { zone: 'SS Hole',    shortLabel: 'SS Hole', gridRow: 2, gridCol: 1 },
  { zone: 'Up the Mid', shortLabel: 'Mid IF',  gridRow: 2, gridCol: 2 },
  { zone: '2B Hole',    shortLabel: '2B Hole', gridRow: 2, gridCol: 3 },
  { zone: '1B Line',    shortLabel: '1B Line', gridRow: 2, gridCol: 4 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function getEfficiencyColor(pct: number): string {
  if (pct >= 115) return '#22c55e';  // elite
  if (pct >= 105) return '#3b82f6';  // above avg
  if (pct >= 95)  return '#f59e0b';  // average
  if (pct >= 85)  return '#f97316';  // below avg
  return '#ef4444';                   // poor
}

export function getDRSColor(drs: number): string {
  if (drs >= 10) return '#22c55e';
  if (drs >= 0)  return '#3b82f6';
  if (drs >= -5) return '#f59e0b';
  return '#ef4444';
}

export function getPositioningGrade(totalDRS: number, avgEff: number): PositioningGrade {
  const composite = totalDRS * 2 + avgEff;
  if (composite >= 230) return 'A+';
  if (composite >= 220) return 'A';
  if (composite >= 210) return 'A-';
  if (composite >= 200) return 'B+';
  if (composite >= 195) return 'B';
  if (composite >= 190) return 'B-';
  if (composite >= 185) return 'C+';
  if (composite >= 180) return 'C';
  if (composite >= 175) return 'C-';
  if (composite >= 165) return 'D';
  return 'F';
}

export function getGradeColor(grade: PositioningGrade): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  if (grade === 'D') return '#f97316';
  return '#ef4444';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function buildZones(seed: number): ZoneEfficiency[] {
  return FIELD_ZONES.map((fz, i) => {
    const s = seed * 13 + i * 7 + 31;
    const expectedOuts = 25 + Math.round(seededRand(s) * 40);
    const effVariance = seededRand(s + 1) * 30 - 10; // -10 to +20
    const efficiencyPct = Math.round((100 + effVariance) * 10) / 10;
    const outsMade = Math.round(expectedOuts * efficiencyPct / 100);
    const rangeRunsSaved = Math.round((outsMade - expectedOuts) * 0.8 * 10) / 10;

    return {
      zone: fz.zone,
      shortLabel: fz.shortLabel,
      gridRow: fz.gridRow,
      gridCol: fz.gridCol,
      outsMade,
      expectedOuts,
      efficiencyPct,
      rangeRunsSaved,
    };
  });
}

export function generateDemoDefPositioning(): TeamDefPositioning {
  const seed = 77;
  const zones = buildZones(seed);

  const totalDRS = Math.round(zones.reduce((s, z) => s + z.rangeRunsSaved, 0) * 10) / 10;
  const avgEff = Math.round(zones.reduce((s, z) => s + z.efficiencyPct, 0) / zones.length * 10) / 10;
  const grade = getPositioningGrade(totalDRS, avgEff);
  const shiftRate = 32 + Math.round(seededRand(seed + 500) * 20);

  const bestZone = zones.reduce((a, b) => a.efficiencyPct > b.efficiencyPct ? a : b, zones[0]);
  const worstZone = zones.reduce((a, b) => a.efficiencyPct < b.efficiencyPct ? a : b, zones[0]);

  const notes = totalDRS >= 10
    ? 'Elite defensive positioning. Infield alignment and outfield depth are well-calibrated.'
    : totalDRS >= 0
    ? 'Solid positioning overall. Some zones could benefit from more aggressive shifts.'
    : 'Below-average positioning. Multiple zones are leaking runs — realignment needed.';

  return {
    teamName: 'Seattle Mariners',
    teamAbbr: 'SEA',
    season: 2025,
    zones,
    totalDRS,
    shiftRate,
    positioningGrade: grade,
    bestZone: bestZone.zone,
    worstZone: worstZone.zone,
    notes,
  };
}
