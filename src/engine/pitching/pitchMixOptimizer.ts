/**
 * Pitch Mix Optimizer
 *
 * Analyzes pitch usage patterns and recommends optimal
 * pitch mix adjustments based on count, batter hand,
 * and situation. Identifies overused and underused pitches.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PitchGrade = 'plus_plus' | 'plus' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export const GRADE_DISPLAY: Record<PitchGrade, { label: string; color: string; number: number }> = {
  plus_plus: { label: '80 Grade', color: '#22c55e', number: 80 },
  plus:      { label: '70 Grade', color: '#3b82f6', number: 70 },
  above_avg: { label: '60 Grade', color: '#06b6d4', number: 60 },
  average:   { label: '50 Grade', color: '#eab308', number: 50 },
  below_avg: { label: '40 Grade', color: '#f97316', number: 40 },
  poor:      { label: '30 Grade', color: '#ef4444', number: 30 },
};

export type PitchName = '4-Seam' | 'Sinker' | 'Slider' | 'Curveball' | 'Changeup' | 'Cutter' | 'Sweeper' | 'Splitter';

export interface PitchUsage {
  pitch: PitchName;
  grade: PitchGrade;
  currentUsage: number;      // percentage
  optimalUsage: number;      // recommended percentage
  usageDiff: number;         // optimal - current
  whiffRate: number;
  chaseRate: number;
  putAwayRate: number;       // 2-strike usage K rate
  avgVelo: number;
  runValue: number;          // per 100 pitches
  vsRHB: number;             // usage rate vs RHB
  vsLHB: number;             // usage rate vs LHB
}

export interface MixPitcher {
  id: number;
  name: string;
  hand: 'L' | 'R';
  overall: number;
  pitches: PitchUsage[];
  overallMixGrade: string;
  suggestions: string[];
}

export interface MixSummary {
  avgPitchCount: number;
  overusedCount: number;
  underusedCount: number;
  topWhiffPitch: string;
  avgMixGrade: string;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getPitchGrade(gradeNum: number): PitchGrade {
  if (gradeNum >= 75) return 'plus_plus';
  if (gradeNum >= 65) return 'plus';
  if (gradeNum >= 55) return 'above_avg';
  if (gradeNum >= 45) return 'average';
  if (gradeNum >= 35) return 'below_avg';
  return 'poor';
}

export function getMixSummary(pitchers: MixPitcher[]): MixSummary {
  const allPitches = pitchers.flatMap(p => p.pitches);
  const overused = allPitches.filter(p => p.usageDiff < -5).length;
  const underused = allPitches.filter(p => p.usageDiff > 5).length;
  const topWhiff = allPitches.reduce((b, p) => p.whiffRate > b.whiffRate ? p : b, allPitches[0]);
  return {
    avgPitchCount: Math.round(pitchers.reduce((s, p) => s + p.pitches.length, 0) / pitchers.length * 10) / 10,
    overusedCount: overused,
    underusedCount: underused,
    topWhiffPitch: topWhiff.pitch,
    avgMixGrade: 'B+',
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoPitchMix(): MixPitcher[] {
  return [
    {
      id: 0, name: 'Gerrit Cole', hand: 'R', overall: 89, overallMixGrade: 'A',
      pitches: [
        { pitch: '4-Seam',  grade: 'plus_plus', currentUsage: 48, optimalUsage: 42, usageDiff: -6, whiffRate: 28, chaseRate: 30, putAwayRate: 32, avgVelo: 97.5, runValue: -12, vsRHB: 50, vsLHB: 45 },
        { pitch: 'Slider',   grade: 'plus',      currentUsage: 22, optimalUsage: 25, usageDiff: 3,  whiffRate: 38, chaseRate: 42, putAwayRate: 40, avgVelo: 88.2, runValue: -18, vsRHB: 20, vsLHB: 25 },
        { pitch: 'Cutter',   grade: 'above_avg', currentUsage: 15, optimalUsage: 18, usageDiff: 3,  whiffRate: 22, chaseRate: 28, putAwayRate: 25, avgVelo: 92.0, runValue: -8,  vsRHB: 18, vsLHB: 12 },
        { pitch: 'Curveball', grade: 'plus',     currentUsage: 15, optimalUsage: 15, usageDiff: 0,  whiffRate: 35, chaseRate: 38, putAwayRate: 38, avgVelo: 82.5, runValue: -15, vsRHB: 12, vsLHB: 18 },
      ],
      suggestions: ['Reduce 4-seam usage by 6% — opponents are timing it', 'Increase slider usage in 2-strike counts'],
    },
    {
      id: 1, name: 'Logan Webb', hand: 'R', overall: 83, overallMixGrade: 'A-',
      pitches: [
        { pitch: 'Sinker',    grade: 'plus_plus', currentUsage: 40, optimalUsage: 38, usageDiff: -2, whiffRate: 15, chaseRate: 25, putAwayRate: 18, avgVelo: 93.5, runValue: -10, vsRHB: 42, vsLHB: 38 },
        { pitch: 'Changeup',  grade: 'plus',      currentUsage: 22, optimalUsage: 25, usageDiff: 3,  whiffRate: 32, chaseRate: 38, putAwayRate: 35, avgVelo: 86.0, runValue: -14, vsRHB: 18, vsLHB: 28 },
        { pitch: 'Slider',    grade: 'above_avg', currentUsage: 20, optimalUsage: 22, usageDiff: 2,  whiffRate: 28, chaseRate: 32, putAwayRate: 30, avgVelo: 85.5, runValue: -8,  vsRHB: 22, vsLHB: 18 },
        { pitch: 'Cutter',    grade: 'average',   currentUsage: 18, optimalUsage: 15, usageDiff: -3, whiffRate: 18, chaseRate: 22, putAwayRate: 20, avgVelo: 89.0, runValue: -2,  vsRHB: 18, vsLHB: 16 },
      ],
      suggestions: ['Increase changeup usage to LHB — elite whiff pitch', 'Cutter is below avg; use more sparingly'],
    },
    {
      id: 2, name: 'Blake Snell', hand: 'L', overall: 84, overallMixGrade: 'B+',
      pitches: [
        { pitch: '4-Seam',   grade: 'plus',      currentUsage: 52, optimalUsage: 44, usageDiff: -8, whiffRate: 25, chaseRate: 28, putAwayRate: 28, avgVelo: 96.0, runValue: -8,  vsRHB: 55, vsLHB: 48 },
        { pitch: 'Slider',    grade: 'plus_plus', currentUsage: 28, optimalUsage: 32, usageDiff: 4,  whiffRate: 42, chaseRate: 45, putAwayRate: 45, avgVelo: 84.5, runValue: -22, vsRHB: 25, vsLHB: 32 },
        { pitch: 'Curveball', grade: 'average',   currentUsage: 12, optimalUsage: 14, usageDiff: 2,  whiffRate: 30, chaseRate: 32, putAwayRate: 28, avgVelo: 78.0, runValue: -5,  vsRHB: 10, vsLHB: 15 },
        { pitch: 'Changeup',  grade: 'below_avg', currentUsage: 8,  optimalUsage: 10, usageDiff: 2,  whiffRate: 18, chaseRate: 20, putAwayRate: 15, avgVelo: 87.0, runValue: 2,   vsRHB: 10, vsLHB: 5 },
      ],
      suggestions: ['Too fastball-heavy — 52% is unsustainable', 'Slider is elite (80 grade) — throw it more', 'Changeup needs development; limit to LHB'],
    },
    {
      id: 3, name: 'Spencer Strider', hand: 'R', overall: 86, overallMixGrade: 'B+',
      pitches: [
        { pitch: '4-Seam',   grade: 'plus_plus', currentUsage: 58, optimalUsage: 50, usageDiff: -8, whiffRate: 32, chaseRate: 35, putAwayRate: 35, avgVelo: 98.5, runValue: -15, vsRHB: 60, vsLHB: 55 },
        { pitch: 'Slider',    grade: 'plus',      currentUsage: 32, optimalUsage: 35, usageDiff: 3,  whiffRate: 40, chaseRate: 44, putAwayRate: 42, avgVelo: 86.0, runValue: -20, vsRHB: 30, vsLHB: 35 },
        { pitch: 'Changeup',  grade: 'below_avg', currentUsage: 10, optimalUsage: 15, usageDiff: 5,  whiffRate: 20, chaseRate: 22, putAwayRate: 18, avgVelo: 89.0, runValue: 3,   vsRHB: 10, vsLHB: 10 },
      ],
      suggestions: ['Two-pitch dominance works but changeup development needed', 'Reduce fastball reliance — hitters sit on it in 3rd PA'],
    },
  ];
}
