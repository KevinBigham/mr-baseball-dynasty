/**
 * defAlignment.ts – Defensive alignment strategy manager
 *
 * Configure infield/outfield depth & positioning per batter type.
 * Tracks alignment effectiveness: outs gained, hits allowed, BABIP
 * by alignment vs standard. Allows custom presets.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type AlignmentPreset = 'standard' | 'noshift' | 'pull_heavy' | 'oppo_heavy' | 'bunt_defense' | 'double_play' | 'outfield_deep' | 'outfield_shallow';

export interface AlignmentResult {
  preset: AlignmentPreset;
  timesUsed: number;
  outsGained: number;
  hitsAllowed: number;
  babip: number;
  expectedBabip: number;
  runsSaved: number;
}

export interface BatterAlignment {
  id: string;
  batterName: string;
  batterTeam: string;
  batterHand: 'L' | 'R' | 'S';
  pullPct: number;
  centerPct: number;
  oppoPct: number;
  groundBallPct: number;
  currentAlignment: AlignmentPreset;
  optimalAlignment: AlignmentPreset;
  isOptimal: boolean;
  results: AlignmentResult[];
  runsAboveStandard: number;
  notes: string;
}

export const ALIGNMENT_DISPLAY: Record<AlignmentPreset, { label: string; color: string; abbr: string }> = {
  standard:        { label: 'Standard',        color: '#888',    abbr: 'STD' },
  noshift:         { label: 'No Shift',        color: '#f59e0b', abbr: 'NO' },
  pull_heavy:      { label: 'Pull Heavy',      color: '#ef4444', abbr: 'PULL' },
  oppo_heavy:      { label: 'Oppo Heavy',      color: '#3b82f6', abbr: 'OPP' },
  bunt_defense:    { label: 'Bunt Defense',    color: '#a855f7', abbr: 'BNT' },
  double_play:     { label: 'Double Play',     color: '#22c55e', abbr: 'DP' },
  outfield_deep:   { label: 'OF Deep',         color: '#06b6d4', abbr: 'DEEP' },
  outfield_shallow:{ label: 'OF Shallow',      color: '#f97316', abbr: 'SHAL' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface AlignmentSummary {
  totalMatched: number;
  totalMisaligned: number;
  optimalRate: number;
  totalRunsSaved: number;
  bestAlignment: string;
  worstAlignment: string;
}

export function getAlignmentSummary(batters: BatterAlignment[]): AlignmentSummary {
  const matched = batters.filter(b => b.isOptimal).length;
  const misaligned = batters.length - matched;
  const totalRuns = Math.round(batters.reduce((s, b) => s + b.runsAboveStandard, 0) * 10) / 10;
  const allResults = batters.flatMap(b => b.results);
  const byPreset = new Map<string, number>();
  allResults.forEach(r => byPreset.set(r.preset, (byPreset.get(r.preset) ?? 0) + r.runsSaved));
  let bestK = '', bestV = -Infinity, worstK = '', worstV = Infinity;
  byPreset.forEach((v, k) => {
    if (v > bestV) { bestV = v; bestK = k; }
    if (v < worstV) { worstV = v; worstK = k; }
  });
  return {
    totalMatched: matched,
    totalMisaligned: misaligned,
    optimalRate: Math.round((matched / batters.length) * 100),
    totalRunsSaved: totalRuns,
    bestAlignment: ALIGNMENT_DISPLAY[bestK as AlignmentPreset]?.label ?? bestK,
    worstAlignment: ALIGNMENT_DISPLAY[worstK as AlignmentPreset]?.label ?? worstK,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const BATTERS = [
  { name: 'Kyle Schwarber', team: 'PHI', hand: 'L' as const, pull: 48, center: 32, oppo: 20, gb: 35 },
  { name: 'Joey Gallo', team: 'MIN', hand: 'L' as const, pull: 52, center: 28, oppo: 20, gb: 30 },
  { name: 'Aaron Judge', team: 'NYY', hand: 'R' as const, pull: 45, center: 30, oppo: 25, gb: 32 },
  { name: 'Freddie Freeman', team: 'LAD', hand: 'L' as const, pull: 38, center: 34, oppo: 28, gb: 44 },
  { name: 'Juan Soto', team: 'NYM', hand: 'L' as const, pull: 35, center: 36, oppo: 29, gb: 38 },
  { name: 'Yordan Alvarez', team: 'HOU', hand: 'L' as const, pull: 42, center: 33, oppo: 25, gb: 40 },
  { name: 'Mookie Betts', team: 'LAD', hand: 'R' as const, pull: 40, center: 32, oppo: 28, gb: 42 },
  { name: 'Pete Alonso', team: 'NYM', hand: 'R' as const, pull: 44, center: 30, oppo: 26, gb: 36 },
  { name: 'Matt Olson', team: 'ATL', hand: 'L' as const, pull: 46, center: 30, oppo: 24, gb: 38 },
  { name: 'Vladimir Guerrero Jr.', team: 'TOR', hand: 'R' as const, pull: 36, center: 35, oppo: 29, gb: 46 },
];

const PRESETS: AlignmentPreset[] = ['standard', 'pull_heavy', 'noshift', 'oppo_heavy', 'double_play'];

function makeResults(seed: number): AlignmentResult[] {
  return PRESETS.slice(0, 3 + (seed % 2)).map((p, j) => {
    const used = 20 + ((seed + j * 7) % 30);
    const outs = ((seed * 3 + j * 11) % 8) - 2;
    const hits = 5 + ((seed + j * 5) % 10);
    const babip = 0.280 + ((seed + j) % 8) * 0.01 - (outs > 0 ? 0.02 : 0);
    const xbabip = 0.300;
    return {
      preset: p,
      timesUsed: used,
      outsGained: outs,
      hitsAllowed: hits,
      babip: Math.round(babip * 1000) / 1000,
      expectedBabip: xbabip,
      runsSaved: Math.round(outs * 0.7 * 10) / 10,
    };
  });
}

export function generateDemoAlignments(): BatterAlignment[] {
  return BATTERS.map((b, i) => {
    const optimal: AlignmentPreset = b.pull >= 45 ? 'pull_heavy' : b.gb >= 44 ? 'double_play' : b.oppo >= 28 ? 'standard' : 'noshift';
    const current: AlignmentPreset = i % 3 === 0 ? optimal : (i % 3 === 1 ? 'standard' : 'pull_heavy');
    const ras = Math.round((3 - i * 0.5 + ((i * 7) % 4)) * 10) / 10;
    return {
      id: `da-${i}`,
      batterName: b.name,
      batterTeam: b.team,
      batterHand: b.hand,
      pullPct: b.pull,
      centerPct: b.center,
      oppoPct: b.oppo,
      groundBallPct: b.gb,
      currentAlignment: current,
      optimalAlignment: optimal,
      isOptimal: current === optimal,
      results: makeResults(i),
      runsAboveStandard: ras,
      notes: b.pull >= 45 ? `Extreme pull tendency (${b.pull}%). Shift-heavy approach recommended.` :
             b.gb >= 44 ? `High ground ball rate. DP depth beneficial.` :
             `Balanced spray chart. Standard alignment effective.`,
    };
  });
}
