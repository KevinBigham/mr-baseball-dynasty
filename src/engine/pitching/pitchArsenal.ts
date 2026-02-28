/**
 * Pitch Arsenal Grading
 *
 * Individual pitch type grades on the 20-80 scouting scale
 * with movement profiles, velocity tracking, and usage rates.
 * Core tool for evaluating pitcher repertoire quality.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PitchGradeLabel = 'elite' | 'plus_plus' | 'plus' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export function getPitchGradeLabel(grade: number): PitchGradeLabel {
  if (grade >= 75) return 'elite';
  if (grade >= 65) return 'plus_plus';
  if (grade >= 60) return 'plus';
  if (grade >= 55) return 'above_avg';
  if (grade >= 45) return 'average';
  if (grade >= 35) return 'below_avg';
  return 'poor';
}

export function gradeColor(grade: number): string {
  if (grade >= 70) return '#22c55e';
  if (grade >= 60) return '#3b82f6';
  if (grade >= 50) return '#eab308';
  if (grade >= 40) return '#f97316';
  return '#ef4444';
}

export interface PitchMovement {
  horizBreak: number;     // inches horizontal
  vertBreak: number;      // inches vertical (induced)
  spinRate: number;       // RPM
  spinAxis: number;       // degrees
}

export interface ArsenalPitch {
  name: string;
  grade: number;          // 20-80 scale
  velocity: number;       // avg mph
  maxVelo: number;
  usage: number;          // % of pitches thrown
  whiffRate: number;
  putAwayRate: number;    // K% when thrown with 2 strikes
  battingAvgAgainst: number;
  movement: PitchMovement;
}

export interface PitcherArsenal {
  id: number;
  name: string;
  team: string;
  pos: string;
  overall: number;
  arsenalGrade: number;   // weighted avg pitch grade
  pitches: ArsenalPitch[];
  bestPitch: string;
  worstPitch: string;
  notes: string;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoArsenals(): PitcherArsenal[] {
  return [
    {
      id: 0, name: 'Gerrit Cole', team: 'NYY', pos: 'SP', overall: 89, arsenalGrade: 68,
      pitches: [
        { name: '4-Seam Fastball', grade: 75, velocity: 97.2, maxVelo: 99.5, usage: 48, whiffRate: 28, putAwayRate: 32, battingAvgAgainst: .205, movement: { horizBreak: -5.2, vertBreak: 16.8, spinRate: 2550, spinAxis: 215 } },
        { name: 'Slider', grade: 70, velocity: 88.5, maxVelo: 91.0, usage: 28, whiffRate: 38, putAwayRate: 42, battingAvgAgainst: .165, movement: { horizBreak: 3.5, vertBreak: 2.0, spinRate: 2680, spinAxis: 45 } },
        { name: 'Knuckle Curve', grade: 60, velocity: 82.0, maxVelo: 85.0, usage: 14, whiffRate: 32, putAwayRate: 35, battingAvgAgainst: .195, movement: { horizBreak: 4.8, vertBreak: -8.5, spinRate: 2900, spinAxis: 55 } },
        { name: 'Changeup', grade: 50, velocity: 90.0, maxVelo: 92.0, usage: 10, whiffRate: 22, putAwayRate: 25, battingAvgAgainst: .240, movement: { horizBreak: -8.0, vertBreak: 5.2, spinRate: 1650, spinAxis: 235 } },
      ],
      bestPitch: '4-Seam Fastball', worstPitch: 'Changeup',
      notes: 'Elite fastball-slider combo. Curve gives different look. Changeup is usable but below-average.',
    },
    {
      id: 1, name: 'Logan Webb', team: 'SF', pos: 'SP', overall: 82, arsenalGrade: 60,
      pitches: [
        { name: 'Sinker', grade: 65, velocity: 92.5, maxVelo: 95.0, usage: 38, whiffRate: 12, putAwayRate: 15, battingAvgAgainst: .235, movement: { horizBreak: -14.5, vertBreak: 8.2, spinRate: 2100, spinAxis: 200 } },
        { name: 'Changeup', grade: 65, velocity: 85.5, maxVelo: 88.0, usage: 28, whiffRate: 30, putAwayRate: 34, battingAvgAgainst: .180, movement: { horizBreak: -16.0, vertBreak: 3.5, spinRate: 1550, spinAxis: 220 } },
        { name: 'Slider', grade: 55, velocity: 84.0, maxVelo: 87.0, usage: 20, whiffRate: 28, putAwayRate: 30, battingAvgAgainst: .200, movement: { horizBreak: 2.8, vertBreak: 1.5, spinRate: 2450, spinAxis: 35 } },
        { name: 'Curveball', grade: 50, velocity: 78.0, maxVelo: 81.0, usage: 14, whiffRate: 25, putAwayRate: 28, battingAvgAgainst: .220, movement: { horizBreak: 6.0, vertBreak: -10.0, spinRate: 2800, spinAxis: 60 } },
      ],
      bestPitch: 'Changeup', worstPitch: 'Curveball',
      notes: 'Sinker-changeup tunnel is elite. Gets tons of ground balls. 4-pitch mix keeps hitters honest.',
    },
    {
      id: 2, name: 'Spencer Strider', team: 'ATL', pos: 'SP', overall: 85, arsenalGrade: 62,
      pitches: [
        { name: '4-Seam Fastball', grade: 80, velocity: 98.0, maxVelo: 101.2, usage: 58, whiffRate: 35, putAwayRate: 38, battingAvgAgainst: .175, movement: { horizBreak: -3.8, vertBreak: 18.5, spinRate: 2600, spinAxis: 210 } },
        { name: 'Slider', grade: 65, velocity: 86.0, maxVelo: 89.0, usage: 32, whiffRate: 42, putAwayRate: 45, battingAvgAgainst: .145, movement: { horizBreak: 4.2, vertBreak: 0.5, spinRate: 2750, spinAxis: 40 } },
        { name: 'Changeup', grade: 40, velocity: 89.0, maxVelo: 91.0, usage: 10, whiffRate: 18, putAwayRate: 20, battingAvgAgainst: .265, movement: { horizBreak: -9.5, vertBreak: 4.0, spinRate: 1700, spinAxis: 240 } },
      ],
      bestPitch: '4-Seam Fastball', worstPitch: 'Changeup',
      notes: 'Dominant 2-pitch mix. Fastball may be best in baseball. Needs changeup to be complete.',
    },
    {
      id: 3, name: 'Emmanuel Clase', team: 'CLE', pos: 'CL', overall: 88, arsenalGrade: 66,
      pitches: [
        { name: 'Cutter', grade: 80, velocity: 99.5, maxVelo: 102.0, usage: 72, whiffRate: 30, putAwayRate: 35, battingAvgAgainst: .160, movement: { horizBreak: 1.5, vertBreak: 10.0, spinRate: 2350, spinAxis: 180 } },
        { name: 'Slider', grade: 55, velocity: 90.0, maxVelo: 93.0, usage: 28, whiffRate: 25, putAwayRate: 28, battingAvgAgainst: .210, movement: { horizBreak: 3.0, vertBreak: 1.2, spinRate: 2500, spinAxis: 40 } },
      ],
      bestPitch: 'Cutter', worstPitch: 'Slider',
      notes: 'The cutter is the best single pitch in baseball. 100mph with cutting action — unhittable.',
    },
  ];
}
