/**
 * pitchValueMatrix.ts – Pitch value analysis by pitch type
 *
 * Calculates run values per 100 pitches for each pitch type,
 * usage rates, whiff rates, and effectiveness grades.
 * All demo data — no sim engine changes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PitchType = 'FF' | 'SI' | 'FC' | 'SL' | 'CU' | 'CH' | 'FS' | 'KC' | 'ST';

export interface PitchValueEntry {
  pitchType: PitchType;
  pitchName: string;
  usage: number;        // % 0-100
  velocity: number;     // mph
  spinRate: number;     // rpm
  whiffPct: number;     // %
  cswPct: number;       // called-strike + whiff %
  putAwayPct: number;   // % with 2 strikes
  avgEV: number;        // exit velo against
  xBA: number;          // expected BA against
  runValue: number;     // run value per 100 pitches (negative = better for pitcher)
  grade: PitchGrade;
}

export type PitchGrade = 'elite' | 'plus' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export interface PitcherPitchValues {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP';
  throws: 'L' | 'R';
  overallGrade: PitchGrade;
  pitches: PitchValueEntry[];
  bestPitch: string;
  worstPitch: string;
  totalRV100: number;
  notes: string;
}

export const PITCH_GRADE_DISPLAY: Record<PitchGrade, { label: string; color: string }> = {
  elite: { label: 'ELITE', color: '#22c55e' },
  plus: { label: 'PLUS', color: '#4ade80' },
  above_avg: { label: 'ABOVE AVG', color: '#a3e635' },
  average: { label: 'AVERAGE', color: '#facc15' },
  below_avg: { label: 'BELOW AVG', color: '#f97316' },
  poor: { label: 'POOR', color: '#ef4444' },
};

const PITCH_NAMES: Record<PitchType, string> = {
  FF: '4-Seam Fastball', SI: 'Sinker', FC: 'Cutter',
  SL: 'Slider', CU: 'Curveball', CH: 'Changeup',
  FS: 'Splitter', KC: 'Knuckle Curve', ST: 'Sweeper',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function gradeFromRV(rv: number): PitchGrade {
  if (rv <= -2.0) return 'elite';
  if (rv <= -1.0) return 'plus';
  if (rv <= -0.3) return 'above_avg';
  if (rv <= 0.5) return 'average';
  if (rv <= 1.5) return 'below_avg';
  return 'poor';
}

function overallGradeFromRV(rv: number): PitchGrade {
  if (rv <= -1.5) return 'elite';
  if (rv <= -0.8) return 'plus';
  if (rv <= -0.2) return 'above_avg';
  if (rv <= 0.4) return 'average';
  if (rv <= 1.0) return 'below_avg';
  return 'poor';
}

export function pitchGradeColor(g: PitchGrade): string {
  return PITCH_GRADE_DISPLAY[g].color;
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface PitchValueSummary {
  totalPitchers: number;
  elitePitchCount: number;
  bestOverall: string;
  avgTeamRV100: number;
  mostUsedPitch: string;
}

export function getPitchValueSummary(pitchers: PitcherPitchValues[]): PitchValueSummary {
  let eliteCount = 0;
  const pitchUsage: Record<string, number> = {};

  for (const p of pitchers) {
    for (const pt of p.pitches) {
      if (pt.grade === 'elite') eliteCount++;
      pitchUsage[pt.pitchName] = (pitchUsage[pt.pitchName] || 0) + pt.usage;
    }
  }

  const best = pitchers.reduce((a, b) => a.totalRV100 < b.totalRV100 ? a : b);
  const avgRV = pitchers.reduce((s, p) => s + p.totalRV100, 0) / pitchers.length;
  const mostUsed = Object.entries(pitchUsage).sort((a, b) => b[1] - a[1])[0][0];

  return {
    totalPitchers: pitchers.length,
    elitePitchCount: eliteCount,
    bestOverall: best.name,
    avgTeamRV100: Math.round(avgRV * 10) / 10,
    mostUsedPitch: mostUsed,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

function makePitch(type: PitchType, usage: number, velo: number, spin: number, whiff: number, csw: number, putaway: number, avgEV: number, xba: number, rv: number): PitchValueEntry {
  return {
    pitchType: type, pitchName: PITCH_NAMES[type],
    usage, velocity: velo, spinRate: spin, whiffPct: whiff, cswPct: csw,
    putAwayPct: putaway, avgEV, xBA: xba, runValue: rv, grade: gradeFromRV(rv),
  };
}

export function generateDemoPitchValues(): PitcherPitchValues[] {
  const data: Array<{ name: string; team: string; role: 'SP' | 'RP'; throws: 'L' | 'R'; pitches: PitchValueEntry[]; notes: string }> = [
    {
      name: 'Marcus Webb', team: 'NYM', role: 'SP', throws: 'R',
      pitches: [
        makePitch('FF', 42, 96.2, 2340, 28.5, 32.1, 35.2, 88.4, .218, -1.8),
        makePitch('SL', 28, 87.1, 2680, 38.2, 36.4, 42.1, 82.1, .172, -2.4),
        makePitch('CH', 18, 87.8, 1640, 32.1, 30.8, 38.5, 85.2, .198, -1.2),
        makePitch('CU', 12, 79.4, 2820, 30.5, 33.2, 36.8, 84.0, .205, -0.8),
      ],
      notes: 'Elite slider anchors the arsenal. FB plays up with extension and ride. CU gives hitters different look.',
    },
    {
      name: 'Javier Ortiz', team: 'LAD', role: 'SP', throws: 'L',
      pitches: [
        makePitch('SI', 38, 93.8, 2180, 18.2, 26.5, 28.4, 90.2, .248, -0.4),
        makePitch('ST', 30, 82.4, 2550, 40.1, 38.2, 44.8, 78.5, .155, -3.1),
        makePitch('CH', 22, 84.2, 1580, 34.8, 32.5, 40.2, 83.8, .188, -1.8),
        makePitch('FC', 10, 89.2, 2420, 22.4, 28.1, 30.5, 87.1, .232, -0.2),
      ],
      notes: 'Sweeper is one of the best pitches in baseball. Sinker/changeup combo devastates RHH.',
    },
    {
      name: 'Derek Calloway', team: 'HOU', role: 'SP', throws: 'R',
      pitches: [
        makePitch('FF', 50, 97.8, 2420, 30.2, 34.5, 37.1, 87.2, .210, -2.1),
        makePitch('SL', 32, 88.5, 2720, 35.8, 35.2, 40.5, 80.8, .178, -2.0),
        makePitch('CH', 18, 88.2, 1720, 25.4, 28.8, 32.1, 87.5, .228, -0.5),
      ],
      notes: 'Power fastball/slider combo is devastating. Changeup is third pitch but serviceable.',
    },
    {
      name: 'Ryan Kowalski', team: 'ATL', role: 'RP', throws: 'R',
      pitches: [
        makePitch('FF', 55, 98.4, 2380, 32.5, 35.8, 38.4, 86.5, .202, -2.5),
        makePitch('SL', 35, 89.2, 2750, 42.1, 40.2, 48.5, 78.2, .148, -3.5),
        makePitch('CH', 10, 89.8, 1680, 28.2, 30.1, 34.2, 86.8, .218, -0.8),
      ],
      notes: 'Elite reliever with two dominant pitches. Slider whiff rate is otherworldly.',
    },
    {
      name: 'Terrence Miles', team: 'CWS', role: 'SP', throws: 'R',
      pitches: [
        makePitch('FF', 48, 93.2, 2180, 20.1, 24.5, 26.8, 91.5, .268, 1.2),
        makePitch('SL', 25, 84.5, 2380, 28.4, 30.2, 34.5, 85.2, .215, -0.4),
        makePitch('CU', 15, 77.8, 2650, 24.2, 28.5, 30.1, 86.8, .228, 0.2),
        makePitch('CH', 12, 85.1, 1520, 22.5, 26.8, 28.4, 89.5, .252, 0.8),
      ],
      notes: 'Below-average fastball limits ceiling. Slider has potential but inconsistent command.',
    },
    {
      name: 'Carlos Medina', team: 'SD', role: 'SP', throws: 'L',
      pitches: [
        makePitch('FF', 35, 94.5, 2280, 26.8, 30.5, 33.2, 88.8, .225, -1.0),
        makePitch('CU', 30, 80.2, 2880, 34.5, 35.8, 40.2, 82.5, .175, -2.2),
        makePitch('CH', 25, 85.8, 1620, 30.2, 31.5, 36.8, 84.5, .195, -1.5),
        makePitch('FC', 10, 90.1, 2450, 18.5, 25.2, 26.4, 89.2, .240, 0.4),
      ],
      notes: 'Elite curveball is his bread and butter. Three-pitch mix works well, cutter is fringy.',
    },
    {
      name: 'Austin Pierce', team: 'BOS', role: 'RP', throws: 'R',
      pitches: [
        makePitch('FF', 60, 99.2, 2480, 34.8, 38.2, 41.5, 85.8, .195, -2.8),
        makePitch('FS', 40, 90.5, 1420, 36.2, 34.5, 42.8, 83.2, .182, -2.2),
      ],
      notes: 'Two-pitch power reliever. Fastball/splitter combo is one of the best in the game.',
    },
    {
      name: 'Nate Livingston', team: 'SEA', role: 'SP', throws: 'R',
      pitches: [
        makePitch('SI', 40, 95.2, 2220, 15.8, 22.4, 24.5, 91.8, .258, 0.5),
        makePitch('SL', 28, 86.8, 2620, 32.5, 34.2, 38.8, 83.5, .192, -1.5),
        makePitch('CH', 20, 86.5, 1580, 28.8, 30.2, 34.5, 86.2, .212, -0.8),
        makePitch('CU', 12, 78.5, 2750, 26.2, 30.8, 32.1, 85.5, .222, -0.2),
      ],
      notes: 'Ground ball machine with the sinker. Slider gives him a wipeout out-pitch. Solid 4-pitch mix.',
    },
  ];

  return data.map((d, i) => {
    const totalRV = d.pitches.reduce((s, p) => s + p.runValue * (p.usage / 100), 0);
    const best = d.pitches.reduce((a, b) => a.runValue < b.runValue ? a : b);
    const worst = d.pitches.reduce((a, b) => a.runValue > b.runValue ? a : b);
    return {
      id: `pv-${i}`,
      name: d.name,
      team: d.team,
      role: d.role,
      throws: d.throws,
      overallGrade: overallGradeFromRV(totalRV),
      pitches: d.pitches,
      bestPitch: best.pitchName,
      worstPitch: worst.pitchName,
      totalRV100: Math.round(totalRV * 10) / 10,
      notes: d.notes,
    };
  });
}
