/**
 * pivIndex.ts – Pitch Induced Vertigo (PIV) index
 *
 * Measures the degree of vertical/horizontal movement differential
 * between sequential pitches, quantifying how disorienting a pitcher's
 * arsenal is to hitters. Higher PIV = more deceptive combinations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PIVGrade = 'elite' | 'plus' | 'above_avg' | 'average' | 'below_avg';

export interface PitchPair {
  pitch1: string;
  pitch2: string;
  horzDiff: number;      // inches of horizontal movement difference
  vertDiff: number;      // inches of vertical movement difference
  totalDiff: number;     // total movement differential
  usagePct: number;      // how often this pair is thrown sequentially
  whiffRate: number;     // whiff rate on pitch2 after pitch1
  pivScore: number;      // 0-100
}

export interface PitcherPIVProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP';
  throws: 'L' | 'R';
  overallPIV: number;         // 0-100
  pivGrade: PIVGrade;
  pairs: PitchPair[];
  bestCombo: string;
  worstCombo: string;
  avgMovementDiff: number;    // inches
  deceptionRank: number;      // rank among peers (1 = best)
  notes: string;
}

export const PIV_GRADE_DISPLAY: Record<PIVGrade, { label: string; color: string }> = {
  elite: { label: 'ELITE', color: '#22c55e' },
  plus: { label: 'PLUS', color: '#4ade80' },
  above_avg: { label: 'ABOVE AVG', color: '#a3e635' },
  average: { label: 'AVERAGE', color: '#facc15' },
  below_avg: { label: 'BELOW AVG', color: '#f97316' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreToPIVGrade(s: number): PIVGrade {
  if (s >= 85) return 'elite';
  if (s >= 70) return 'plus';
  if (s >= 55) return 'above_avg';
  if (s >= 40) return 'average';
  return 'below_avg';
}

export function pivGradeColor(g: PIVGrade): string {
  return PIV_GRADE_DISPLAY[g].color;
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface PIVSummary {
  totalPitchers: number;
  bestPIV: string;
  avgPIV: number;
  eliteCount: number;
  bestPair: string;
}

export function getPIVSummary(pitchers: PitcherPIVProfile[]): PIVSummary {
  const best = pitchers.reduce((a, b) => a.overallPIV > b.overallPIV ? a : b);
  const avg = pitchers.reduce((s, p) => s + p.overallPIV, 0) / pitchers.length;

  let bestPairScore = 0;
  let bestPairDesc = '';
  for (const p of pitchers) {
    for (const pair of p.pairs) {
      if (pair.pivScore > bestPairScore) {
        bestPairScore = pair.pivScore;
        bestPairDesc = `${p.name}: ${pair.pitch1}→${pair.pitch2}`;
      }
    }
  }

  return {
    totalPitchers: pitchers.length,
    bestPIV: best.name,
    avgPIV: Math.round(avg),
    eliteCount: pitchers.filter(p => p.pivGrade === 'elite').length,
    bestPair: bestPairDesc,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoPIVIndex(): PitcherPIVProfile[] {
  const data: Array<Omit<PitcherPIVProfile, 'id' | 'pivGrade'>> = [
    {
      name: 'Marcus Webb', team: 'NYM', role: 'SP', throws: 'R', overallPIV: 88, deceptionRank: 2,
      avgMovementDiff: 18.5,
      pairs: [
        { pitch1: 'FF', pitch2: 'SL', horzDiff: 14.2, vertDiff: 12.8, totalDiff: 19.1, usagePct: 28, whiffRate: 38.5, pivScore: 92 },
        { pitch1: 'FF', pitch2: 'CH', horzDiff: 12.5, vertDiff: 8.2, totalDiff: 14.9, usagePct: 18, whiffRate: 32.1, pivScore: 78 },
        { pitch1: 'SL', pitch2: 'FF', horzDiff: 14.2, vertDiff: 12.8, totalDiff: 19.1, usagePct: 22, whiffRate: 28.2, pivScore: 85 },
        { pitch1: 'FF', pitch2: 'CU', horzDiff: 10.8, vertDiff: 16.5, totalDiff: 19.7, usagePct: 12, whiffRate: 30.5, pivScore: 88 },
        { pitch1: 'SL', pitch2: 'CH', horzDiff: 8.5, vertDiff: 4.8, totalDiff: 9.8, usagePct: 10, whiffRate: 24.5, pivScore: 55 },
      ],
      bestCombo: 'FF → SL', worstCombo: 'SL → CH',
      notes: 'Elite PIV. Fastball/slider combo creates massive movement differential. Curveball adds vertical deception layer.',
    },
    {
      name: 'Javier Ortiz', team: 'LAD', role: 'SP', throws: 'L', overallPIV: 92, deceptionRank: 1,
      avgMovementDiff: 20.2,
      pairs: [
        { pitch1: 'SI', pitch2: 'ST', horzDiff: 18.5, vertDiff: 10.2, totalDiff: 21.1, usagePct: 30, whiffRate: 42.1, pivScore: 96 },
        { pitch1: 'SI', pitch2: 'CH', horzDiff: 14.8, vertDiff: 8.5, totalDiff: 17.1, usagePct: 20, whiffRate: 35.8, pivScore: 82 },
        { pitch1: 'ST', pitch2: 'SI', horzDiff: 18.5, vertDiff: 10.2, totalDiff: 21.1, usagePct: 18, whiffRate: 18.5, pivScore: 78 },
        { pitch1: 'ST', pitch2: 'CH', horzDiff: 6.2, vertDiff: 3.8, totalDiff: 7.3, usagePct: 12, whiffRate: 22.5, pivScore: 48 },
      ],
      bestCombo: 'SI → ST', worstCombo: 'ST → CH',
      notes: 'Best PIV in the league. Sinker-to-sweeper creates 21+ inches of movement difference. Near-impossible to track both.',
    },
    {
      name: 'Ryan Kowalski', team: 'ATL', role: 'RP', throws: 'R', overallPIV: 85, deceptionRank: 3,
      avgMovementDiff: 17.8,
      pairs: [
        { pitch1: 'FF', pitch2: 'SL', horzDiff: 16.2, vertDiff: 14.5, totalDiff: 21.7, usagePct: 45, whiffRate: 42.5, pivScore: 95 },
        { pitch1: 'SL', pitch2: 'FF', horzDiff: 16.2, vertDiff: 14.5, totalDiff: 21.7, usagePct: 35, whiffRate: 32.5, pivScore: 88 },
        { pitch1: 'FF', pitch2: 'CH', horzDiff: 10.5, vertDiff: 6.8, totalDiff: 12.5, usagePct: 10, whiffRate: 28.2, pivScore: 62 },
      ],
      bestCombo: 'FF → SL', worstCombo: 'FF → CH',
      notes: 'Two-pitch reliever with elite PIV between FB and slider. The two pitches create maximum vertigo when sequenced.',
    },
    {
      name: 'Terrence Miles', team: 'CWS', role: 'SP', throws: 'R', overallPIV: 45, deceptionRank: 8,
      avgMovementDiff: 10.2,
      pairs: [
        { pitch1: 'FF', pitch2: 'SL', horzDiff: 8.5, vertDiff: 7.2, totalDiff: 11.1, usagePct: 25, whiffRate: 22.5, pivScore: 48 },
        { pitch1: 'FF', pitch2: 'CU', horzDiff: 6.8, vertDiff: 10.5, totalDiff: 12.5, usagePct: 15, whiffRate: 24.2, pivScore: 52 },
        { pitch1: 'FF', pitch2: 'CH', horzDiff: 8.2, vertDiff: 5.5, totalDiff: 9.9, usagePct: 12, whiffRate: 20.8, pivScore: 42 },
        { pitch1: 'SL', pitch2: 'FF', horzDiff: 8.5, vertDiff: 7.2, totalDiff: 11.1, usagePct: 20, whiffRate: 18.5, pivScore: 40 },
      ],
      bestCombo: 'FF → CU', worstCombo: 'SL → FF',
      notes: 'Below-average PIV. Pitches lack enough movement differential to truly deceive. Hitters can sit on pitch shapes.',
    },
    {
      name: 'Carlos Medina', team: 'SD', role: 'SP', throws: 'L', overallPIV: 78, deceptionRank: 4,
      avgMovementDiff: 16.5,
      pairs: [
        { pitch1: 'FF', pitch2: 'CU', horzDiff: 8.5, vertDiff: 18.2, totalDiff: 20.1, usagePct: 30, whiffRate: 35.5, pivScore: 90 },
        { pitch1: 'CU', pitch2: 'FF', horzDiff: 8.5, vertDiff: 18.2, totalDiff: 20.1, usagePct: 20, whiffRate: 26.8, pivScore: 82 },
        { pitch1: 'FF', pitch2: 'CH', horzDiff: 12.2, vertDiff: 6.5, totalDiff: 13.8, usagePct: 22, whiffRate: 30.2, pivScore: 72 },
        { pitch1: 'CU', pitch2: 'CH', horzDiff: 5.8, vertDiff: 12.5, totalDiff: 13.8, usagePct: 15, whiffRate: 28.5, pivScore: 68 },
      ],
      bestCombo: 'FF → CU', worstCombo: 'CU → CH',
      notes: 'Excellent vertical PIV. Fastball-to-curveball creates 18+ inches of vertical separation. Classic up-down approach.',
    },
    {
      name: 'Derek Calloway', team: 'HOU', role: 'SP', throws: 'R', overallPIV: 72, deceptionRank: 5,
      avgMovementDiff: 15.2,
      pairs: [
        { pitch1: 'FF', pitch2: 'SL', horzDiff: 12.8, vertDiff: 10.5, totalDiff: 16.5, usagePct: 35, whiffRate: 34.8, pivScore: 82 },
        { pitch1: 'SL', pitch2: 'FF', horzDiff: 12.8, vertDiff: 10.5, totalDiff: 16.5, usagePct: 25, whiffRate: 28.5, pivScore: 75 },
        { pitch1: 'FF', pitch2: 'CH', horzDiff: 10.2, vertDiff: 7.8, totalDiff: 12.8, usagePct: 18, whiffRate: 25.2, pivScore: 62 },
      ],
      bestCombo: 'FF → SL', worstCombo: 'FF → CH',
      notes: 'Good PIV from power arsenal. Fastball/slider combo does the heavy lifting. Changeup doesn\'t add much deception.',
    },
  ];

  return data.map((d, i) => ({
    ...d,
    id: `piv-${i}`,
    pivGrade: scoreToPIVGrade(d.overallPIV),
  }));
}
