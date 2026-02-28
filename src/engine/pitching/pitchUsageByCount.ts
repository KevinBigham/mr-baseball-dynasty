/**
 * pitchUsageByCount.ts – Pitch Usage Heatmap by Count
 *
 * Tracks pitch type distribution (fastball, breaking, offspeed) across all
 * 12 ball-strike counts. Useful for scouting pitcher tendencies and planning
 * at-bats based on count leverage.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface CountState {
  balls: number;   // 0-3
  strikes: number; // 0-2
}

export interface PitchUsageCell {
  count: string;        // e.g. "0-0", "3-2"
  fastballPct: number;  // 0-100
  breakingPct: number;  // 0-100
  offspeedPct: number;  // 0-100
  sampleSize: number;   // pitches thrown in this count
}

export interface PitcherUsageProfile {
  pitcherId: string;
  name: string;
  team: string;
  throws: 'L' | 'R';
  cells: PitchUsageCell[];    // 12 cells for all counts
  tendencyNote: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getAllCounts(): CountState[] {
  const counts: CountState[] = [];
  for (let b = 0; b <= 3; b++) {
    for (let s = 0; s <= 2; s++) {
      counts.push({ balls: b, strikes: s });
    }
  }
  return counts;
}

export function countLabel(c: CountState): string {
  return `${c.balls}-${c.strikes}`;
}

/** Dominant pitch category color for heatmap rendering */
export function getDominantColor(cell: PitchUsageCell): string {
  if (cell.fastballPct >= cell.breakingPct && cell.fastballPct >= cell.offspeedPct) {
    return '#ef4444'; // red for fastball-heavy
  }
  if (cell.breakingPct >= cell.fastballPct && cell.breakingPct >= cell.offspeedPct) {
    return '#3b82f6'; // blue for breaking-heavy
  }
  return '#22c55e'; // green for offspeed-heavy
}

/** Intensity alpha based on how dominant the top category is */
export function getDominantAlpha(cell: PitchUsageCell): number {
  const max = Math.max(cell.fastballPct, cell.breakingPct, cell.offspeedPct);
  // Range from 0.3 (even split ~33%) to 1.0 (single pitch ~100%)
  return 0.3 + (max - 33) * (0.7 / 67);
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface PitchUsageCountSummary {
  totalPitchers: number;
  avgFirstPitchFB: number;
  avg2StrikeFB: number;
  mostFBHeavy: string;
  mostBreakingHeavy: string;
}

export function getPitchUsageCountSummary(profiles: PitcherUsageProfile[]): PitchUsageCountSummary {
  const n = profiles.length;

  // Average fastball% on 0-0
  const firstPitchFBs = profiles.map(p => {
    const cell = p.cells.find(c => c.count === '0-0');
    return cell ? cell.fastballPct : 0;
  });
  const avgFirstPitchFB = Math.round(firstPitchFBs.reduce((a, b) => a + b, 0) / n * 10) / 10;

  // Average fastball% with 2 strikes
  const twoStrikeCells = profiles.flatMap(p =>
    p.cells.filter(c => c.count.endsWith('-2'))
  );
  const avg2StrikeFB = Math.round(
    twoStrikeCells.reduce((a, b) => a + b.fastballPct, 0) / twoStrikeCells.length * 10
  ) / 10;

  // Most fastball-heavy pitcher (avg across all counts)
  let maxFBAvg = 0;
  let mostFBName = '';
  profiles.forEach(p => {
    const avg = p.cells.reduce((s, c) => s + c.fastballPct, 0) / p.cells.length;
    if (avg > maxFBAvg) { maxFBAvg = avg; mostFBName = p.name; }
  });

  // Most breaking-heavy pitcher
  let maxBrkAvg = 0;
  let mostBrkName = '';
  profiles.forEach(p => {
    const avg = p.cells.reduce((s, c) => s + c.breakingPct, 0) / p.cells.length;
    if (avg > maxBrkAvg) { maxBrkAvg = avg; mostBrkName = p.name; }
  });

  return {
    totalPitchers: n,
    avgFirstPitchFB,
    avg2StrikeFB,
    mostFBHeavy: mostFBName,
    mostBreakingHeavy: mostBrkName,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_PITCHERS = [
  { name: 'Marcus Cole', team: 'NYY', throws: 'R' as const, fbBias: 60, brkBias: 25 },
  { name: 'Ryo Tanaka', team: 'LAD', throws: 'R' as const, fbBias: 45, brkBias: 35 },
  { name: 'Javier Montoya', team: 'HOU', throws: 'L' as const, fbBias: 55, brkBias: 20 },
  { name: 'Derek Faulkner', team: 'ATL', throws: 'R' as const, fbBias: 50, brkBias: 30 },
  { name: 'Chris Whitfield', team: 'SEA', throws: 'L' as const, fbBias: 65, brkBias: 18 },
  { name: 'Andre Baptiste', team: 'CHC', throws: 'R' as const, fbBias: 42, brkBias: 38 },
];

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function buildCells(fbBias: number, brkBias: number, seed: number): PitchUsageCell[] {
  const counts = getAllCounts();
  return counts.map((cs, idx) => {
    const s = seed * 13 + idx * 7;

    // Fastball% shifts: higher early in count, lower with 2 strikes
    let fb = fbBias + (cs.strikes === 0 ? 8 : cs.strikes === 2 ? -12 : 0)
      + (cs.balls >= 2 ? 5 : 0) + Math.round(seededRand(s) * 10 - 5);
    // Breaking% shifts: higher with 2 strikes, lower behind in count
    let brk = brkBias + (cs.strikes === 2 ? 10 : cs.strikes === 0 ? -5 : 0)
      + (cs.balls >= 3 ? -8 : 0) + Math.round(seededRand(s + 1) * 8 - 4);
    // Offspeed is remainder
    let off = 100 - fb - brk;

    // Normalize to 100
    if (off < 5) { off = 5; fb = fb - 3; brk = brk - 2; }
    const total = fb + brk + off;
    fb = Math.round(fb / total * 100);
    brk = Math.round(brk / total * 100);
    off = 100 - fb - brk;

    const sampleSize = 40 + Math.round(seededRand(s + 2) * 80);

    return {
      count: countLabel(cs),
      fastballPct: Math.max(0, Math.min(100, fb)),
      breakingPct: Math.max(0, Math.min(100, brk)),
      offspeedPct: Math.max(0, Math.min(100, off)),
      sampleSize,
    };
  });
}

function generateTendencyNote(cells: PitchUsageCell[], name: string): string {
  const firstPitch = cells.find(c => c.count === '0-0');
  const fullCount = cells.find(c => c.count === '3-2');
  if (!firstPitch || !fullCount) return 'Standard mix across counts.';

  if (firstPitch.fastballPct >= 65) {
    return `${name} is a first-pitch fastball pitcher who turns to secondary stuff when ahead.`;
  }
  if (fullCount.breakingPct >= 35) {
    return `${name} trusts his breaking ball even on full counts — unusual and deceptive.`;
  }
  if (firstPitch.offspeedPct >= 25) {
    return `${name} keeps hitters off-balance early with changeups and offspeed.`;
  }
  return `${name} shows a balanced approach, adjusting pitch mix based on count leverage.`;
}

export function generateDemoPitchUsageByCount(): PitcherUsageProfile[] {
  return DEMO_PITCHERS.map((p, i) => {
    const cells = buildCells(p.fbBias, p.brkBias, i * 100 + 42);
    return {
      pitcherId: `puc-${i}`,
      name: p.name,
      team: p.team,
      throws: p.throws,
      cells,
      tendencyNote: generateTendencyNote(cells, p.name),
    };
  });
}
