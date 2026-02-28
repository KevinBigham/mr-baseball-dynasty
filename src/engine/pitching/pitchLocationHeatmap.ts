/**
 * pitchLocationHeatmap.ts – Pitch Location Heatmap
 *
 * 5x5 strike zone grid showing pitch frequency, whiff rates,
 * xwOBA, and velocity by location for individual pitchers.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HeatmapCell {
  row: number;        // 0-4 (top to bottom)
  col: number;        // 0-4 (left to right)
  pitchCount: number;
  whiffRate: number;  // 0-100
  xwOBA: number;
  avgVelo: number;
}

export interface PitcherHeatmapProfile {
  pitcherId: string;
  name: string;
  cells: HeatmapCell[];       // 25 cells (5x5 grid)
  favoriteLoc: string;        // e.g. "Low-Away"
  avoidLoc: string;           // e.g. "Up-Middle"
  overallCommand: number;     // 0-100
}

// ─── Display Helpers ────────────────────────────────────────────────────────

const ROW_LABELS = ['High', 'Upper', 'Middle', 'Lower', 'Low'];
const COL_LABELS = ['Inside', 'Inner', 'Center', 'Outer', 'Away'];

export function getLocationLabel(row: number, col: number): string {
  return `${ROW_LABELS[row]}-${COL_LABELS[col]}`;
}

export function commandColor(xwOBA: number): string {
  // Low xwOBA = good for pitcher = green; high = bad = red
  if (xwOBA <= 0.230) return '#22c55e';
  if (xwOBA <= 0.290) return '#4ade80';
  if (xwOBA <= 0.330) return '#facc15';
  if (xwOBA <= 0.380) return '#f97316';
  return '#ef4444';
}

export function pitchCountColor(count: number, maxCount: number): string {
  const pct = maxCount > 0 ? count / maxCount : 0;
  if (pct >= 0.8) return '#3b82f6';
  if (pct >= 0.5) return '#6366f1';
  if (pct >= 0.3) return '#8b5cf6';
  if (pct >= 0.1) return '#1e293b';
  return '#0f172a';
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface HeatmapSummary {
  totalPitchers: number;
  bestCommand: { name: string; score: number };
  worstCommand: { name: string; score: number };
  lowestXwOBA: { name: string; loc: string; value: number };
  highestXwOBA: { name: string; loc: string; value: number };
}

export function getHeatmapSummary(profiles: PitcherHeatmapProfile[]): HeatmapSummary {
  let bestCmd = profiles[0];
  let worstCmd = profiles[0];
  let lowestWobaVal = 1.0;
  let lowestWobaName = '';
  let lowestWobaLoc = '';
  let highestWobaVal = 0;
  let highestWobaName = '';
  let highestWobaLoc = '';

  for (const p of profiles) {
    if (p.overallCommand > bestCmd.overallCommand) bestCmd = p;
    if (p.overallCommand < worstCmd.overallCommand) worstCmd = p;
    for (const c of p.cells) {
      if (c.xwOBA < lowestWobaVal && c.pitchCount > 10) {
        lowestWobaVal = c.xwOBA;
        lowestWobaName = p.name;
        lowestWobaLoc = getLocationLabel(c.row, c.col);
      }
      if (c.xwOBA > highestWobaVal && c.pitchCount > 10) {
        highestWobaVal = c.xwOBA;
        highestWobaName = p.name;
        highestWobaLoc = getLocationLabel(c.row, c.col);
      }
    }
  }

  return {
    totalPitchers: profiles.length,
    bestCommand: { name: bestCmd.name, score: bestCmd.overallCommand },
    worstCommand: { name: worstCmd.name, score: worstCmd.overallCommand },
    lowestXwOBA: { name: lowestWobaName, loc: lowestWobaLoc, value: lowestWobaVal },
    highestXwOBA: { name: highestWobaName, loc: highestWobaLoc, value: highestWobaVal },
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface PitcherSeed {
  id: string;
  name: string;
  command: number;
  baseVelo: number;
  favoriteRow: number;
  favoriteCol: number;
  avoidRow: number;
  avoidCol: number;
}

const PITCHER_SEEDS: PitcherSeed[] = [
  { id: 'p1', name: 'Marcus Rivera', command: 82, baseVelo: 95.2, favoriteRow: 3, favoriteCol: 4, avoidRow: 0, avoidCol: 2 },
  { id: 'p2', name: 'Takeshi Yamamoto', command: 91, baseVelo: 93.8, favoriteRow: 4, favoriteCol: 3, avoidRow: 0, avoidCol: 0 },
  { id: 'p3', name: 'Derek Sullivan', command: 68, baseVelo: 97.1, favoriteRow: 0, favoriteCol: 1, avoidRow: 2, avoidCol: 2 },
  { id: 'p4', name: 'Carlos Mendez', command: 76, baseVelo: 94.5, favoriteRow: 2, favoriteCol: 2, avoidRow: 0, avoidCol: 4 },
  { id: 'p5', name: 'Jordan Blake', command: 85, baseVelo: 92.3, favoriteRow: 4, favoriteCol: 4, avoidRow: 1, avoidCol: 0 },
];

function makeCells(seed: PitcherSeed): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const idx = r * 5 + c;
      const rand = (off: number) => seededRand(idx * 17 + off + seed.command);

      const isFavorite = r === seed.favoriteRow && c === seed.favoriteCol;
      const isAvoid = r === seed.avoidRow && c === seed.avoidCol;
      const inZone = r >= 1 && r <= 3 && c >= 1 && c <= 3;

      // Pitch count: favorite locations get more pitches
      let countBase = inZone ? 40 + rand(1) * 60 : 10 + rand(2) * 30;
      if (isFavorite) countBase += 50;
      if (isAvoid) countBase = Math.max(5, countBase - 30);
      const pitchCount = Math.round(countBase);

      // Whiff rate: edges/outside get higher whiff rates
      let whiffBase = inZone ? 15 + rand(3) * 15 : 25 + rand(4) * 20;
      if (isFavorite) whiffBase += 8;
      const whiffRate = Math.round(whiffBase * 10) / 10;

      // xwOBA: favorite locations = lower xwOBA (good for pitcher)
      let wobaBase = inZone ? 0.280 + rand(5) * 0.100 : 0.220 + rand(6) * 0.080;
      if (isFavorite) wobaBase -= 0.060;
      if (isAvoid) wobaBase += 0.080;
      // Command affects xwOBA
      wobaBase -= (seed.command - 75) * 0.002;
      const xwOBA = Math.round(Math.max(0.150, Math.min(0.480, wobaBase)) * 1000) / 1000;

      // Velocity varies slightly by location
      const veloVariance = (r - 2) * 0.3 + rand(7) * 0.8 - 0.4;
      const avgVelo = Math.round((seed.baseVelo + veloVariance) * 10) / 10;

      cells.push({ row: r, col: c, pitchCount, whiffRate, xwOBA, avgVelo });
    }
  }
  return cells;
}

export function generateDemoPitchLocationHeatmap(): PitcherHeatmapProfile[] {
  return PITCHER_SEEDS.map(seed => ({
    pitcherId: seed.id,
    name: seed.name,
    cells: makeCells(seed),
    favoriteLoc: getLocationLabel(seed.favoriteRow, seed.favoriteCol),
    avoidLoc: getLocationLabel(seed.avoidRow, seed.avoidCol),
    overallCommand: seed.command,
  }));
}
