/**
 * pitchGrading.ts – Pitch Grading System
 *
 * Grades individual pitches on a 0-100 scale based on location,
 * movement, velocity, and outcome. Each pitch receives a letter
 * grade (A+ through F). Aggregated per-pitcher grading profiles
 * show grade distributions, best/worst pitch types, and notes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PitchGradeLevel = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

export type PitchOutcome =
  | 'strike_looking'
  | 'strike_swinging'
  | 'ball'
  | 'foul'
  | 'in_play_out'
  | 'in_play_hit';

export interface GradedPitch {
  id: string;
  pitchType: string;
  velocity: number;
  location: { x: number; y: number };
  movement: { hBreak: number; vBreak: number };
  grade: number;          // 0-100
  gradeLevel: PitchGradeLevel;
  outcome: PitchOutcome;
  sequenceNum: number;
}

export interface PitcherGradingProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP' | 'CL';
  avgGrade: number;
  gradeDistribution: Record<PitchGradeLevel, number>;
  pitches: GradedPitch[];
  bestPitchType: string;
  worstPitchType: string;
  notes: string;
}

// ── Grade Display Map ──────────────────────────────────────────────────────

export const PITCH_GRADE_DISPLAY: Record<PitchGradeLevel, { label: string; color: string }> = {
  'A+': { label: 'A+  Elite',       color: '#22c55e' },
  'A':  { label: 'A   Excellent',   color: '#22c55e' },
  'B+': { label: 'B+  Above Avg',   color: '#3b82f6' },
  'B':  { label: 'B   Solid',       color: '#3b82f6' },
  'C':  { label: 'C   Average',     color: '#f59e0b' },
  'D':  { label: 'D   Below Avg',   color: '#ef4444' },
  'F':  { label: 'F   Poor',        color: '#ef4444' },
};

// ── Grade Helpers ──────────────────────────────────────────────────────────

export function pitchGradeFromScore(score: number): PitchGradeLevel {
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 78) return 'B+';
  if (score >= 68) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface PitchGradingSummary {
  totalPitchers: number;
  highestAvg: { name: string; grade: number };
  mostAPlus: { name: string; count: number };
  avgGradeAll: number;
}

export function getPitchGradingSummary(profiles: PitcherGradingProfile[]): PitchGradingSummary {
  const n = profiles.length;

  let bestAvgName = '';
  let bestAvg = 0;
  let mostAPlusName = '';
  let mostAPlusCount = 0;
  let totalGrade = 0;

  for (const p of profiles) {
    totalGrade += p.avgGrade;
    if (p.avgGrade > bestAvg) {
      bestAvg = p.avgGrade;
      bestAvgName = p.name;
    }
    const apCount = p.gradeDistribution['A+'];
    if (apCount > mostAPlusCount) {
      mostAPlusCount = apCount;
      mostAPlusName = p.name;
    }
  }

  return {
    totalPitchers: n,
    highestAvg: { name: bestAvgName, grade: Math.round(bestAvg * 10) / 10 },
    mostAPlus: { name: mostAPlusName, count: mostAPlusCount },
    avgGradeAll: Math.round((totalGrade / n) * 10) / 10,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_PITCHERS: { name: string; team: string; role: 'SP' | 'RP' | 'CL'; pitchTypes: string[] }[] = [
  { name: 'Gerrit Cole',       team: 'NYY', role: 'SP', pitchTypes: ['4-Seam', 'Slider', 'Knuckle-Curve', 'Changeup'] },
  { name: 'Corbin Burnes',     team: 'BAL', role: 'SP', pitchTypes: ['Cutter', 'Curveball', 'Sinker', 'Changeup'] },
  { name: 'Josh Hader',        team: 'HOU', role: 'CL', pitchTypes: ['4-Seam', 'Slider'] },
  { name: 'Framber Valdez',    team: 'HOU', role: 'SP', pitchTypes: ['Sinker', 'Curveball', 'Changeup'] },
  { name: 'Devin Williams',    team: 'NYY', role: 'RP', pitchTypes: ['Changeup', '4-Seam', 'Slider'] },
  { name: 'Logan Webb',        team: 'SF',  role: 'SP', pitchTypes: ['Sinker', 'Slider', 'Changeup', '4-Seam'] },
];

const PITCH_VELO: Record<string, [number, number]> = {
  '4-Seam':       [93, 99],
  'Sinker':       [91, 97],
  'Cutter':       [87, 94],
  'Slider':       [83, 91],
  'Curveball':    [76, 84],
  'Knuckle-Curve':[77, 85],
  'Changeup':     [83, 89],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateDemoPitchGrading(): PitcherGradingProfile[] {
  return DEMO_PITCHERS.map((dp, pi) => {
    const rng = seededRandom(pi * 777 + 42);
    const pitchCount = 20 + Math.floor(rng() * 11); // 20-30 pitches
    const pitches: GradedPitch[] = [];

    for (let seq = 1; seq <= pitchCount; seq++) {
      const pitchType = dp.pitchTypes[Math.floor(rng() * dp.pitchTypes.length)];
      const veloRange = PITCH_VELO[pitchType] ?? [88, 94];
      const velocity = Math.round((veloRange[0] + rng() * (veloRange[1] - veloRange[0])) * 10) / 10;

      // Location: x in [-1,1], y in [0,3.5] — zone-ish
      const x = Math.round((rng() * 2 - 1) * 100) / 100;
      const y = Math.round((rng() * 3.5) * 100) / 100;
      const hBreak = Math.round((rng() * 20 - 10) * 10) / 10;
      const vBreak = Math.round((rng() * 20 - 5) * 10) / 10;

      // Grade: influenced by location and outcome randomness
      const inZone = Math.abs(x) < 0.7 && y > 1.0 && y < 3.0;
      const edge = Math.abs(x) > 0.5 && Math.abs(x) < 0.85;
      let base = 55 + rng() * 30; // 55-85 base
      if (inZone && edge) base += 12;     // painting corners
      if (!inZone && y < 0.5) base -= 15; // ball in the dirt
      if (!inZone && y > 3.2) base -= 10; // high ball
      base += pi * 2; // better pitchers get slight boost

      const grade = clamp(Math.round(base), 0, 100);
      const gradeLevel = pitchGradeFromScore(grade);

      // Outcome influenced by grade
      let outcome: PitchOutcome;
      const r = rng();
      if (grade >= 80) {
        outcome = r < 0.30 ? 'strike_swinging' : r < 0.55 ? 'strike_looking' : r < 0.70 ? 'foul' : r < 0.85 ? 'in_play_out' : 'ball';
      } else if (grade >= 60) {
        outcome = r < 0.20 ? 'strike_swinging' : r < 0.35 ? 'strike_looking' : r < 0.50 ? 'foul' : r < 0.65 ? 'in_play_out' : r < 0.80 ? 'ball' : 'in_play_hit';
      } else {
        outcome = r < 0.10 ? 'strike_looking' : r < 0.40 ? 'ball' : r < 0.55 ? 'foul' : r < 0.70 ? 'in_play_hit' : r < 0.85 ? 'in_play_out' : 'strike_swinging';
      }

      pitches.push({
        id: `pg-${pi}-${seq}`,
        pitchType,
        velocity,
        location: { x, y },
        movement: { hBreak, vBreak },
        grade,
        gradeLevel,
        outcome,
        sequenceNum: seq,
      });
    }

    // Grade distribution
    const dist: Record<PitchGradeLevel, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    for (const p of pitches) {
      dist[p.gradeLevel]++;
    }

    // Average grade
    const avgGrade = Math.round(pitches.reduce((s, p) => s + p.grade, 0) / pitches.length * 10) / 10;

    // Best / worst pitch type by average grade
    const typeGrades = new Map<string, { total: number; count: number }>();
    for (const p of pitches) {
      const entry = typeGrades.get(p.pitchType) ?? { total: 0, count: 0 };
      entry.total += p.grade;
      entry.count++;
      typeGrades.set(p.pitchType, entry);
    }

    let bestType = dp.pitchTypes[0];
    let worstType = dp.pitchTypes[0];
    let bestAvg = 0;
    let worstAvg = 100;
    for (const [type, data] of typeGrades) {
      const avg = data.total / data.count;
      if (avg > bestAvg) { bestAvg = avg; bestType = type; }
      if (avg < worstAvg) { worstAvg = avg; worstType = type; }
    }

    // Notes
    const aPlusCount = dist['A+'] + dist['A'];
    const notes = aPlusCount >= 8
      ? `Elite command. ${bestType} is the primary weapon with a ${Math.round(bestAvg)} avg grade. Consistently paints corners.`
      : aPlusCount >= 4
      ? `Solid outing. ${bestType} graded well (${Math.round(bestAvg)} avg). Some inconsistency with the ${worstType}.`
      : `Struggled with command. ${worstType} averaged only ${Math.round(worstAvg)}. Needs sharper location.`;

    return {
      id: `pgp-${pi}`,
      name: dp.name,
      team: dp.team,
      role: dp.role,
      avgGrade,
      gradeDistribution: dist,
      pitches,
      bestPitchType: bestType,
      worstPitchType: worstType,
      notes,
    };
  });
}
