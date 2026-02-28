/**
 * pitchDesignLab.ts – Pitch design laboratory
 *
 * Experimental pitch development system where pitchers can work on
 * new pitches, modify grip/approach, and track development progress
 * of pitch prototypes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DevStatus = 'prototype' | 'development' | 'refinement' | 'ready' | 'deployed';

export interface PitchPrototype {
  pitchName: string;
  baseType: string;          // e.g. 'Sweeper', 'Cutter', 'Splitter'
  devStatus: DevStatus;
  progress: number;          // 0-100
  projectedGrade: number;    // 20-80
  currentGrade: number;      // 20-80
  targetVelo: number;
  currentVelo: number;
  targetSpin: number;
  currentSpin: number;
  targetHBreak: number;
  currentHBreak: number;
  targetVBreak: number;
  currentVBreak: number;
  sessionCount: number;
  lastSessionResult: string;
  projectedWhiffRate: number;
  notes: string;
}

export interface PitcherLabProfile {
  id: string;
  name: string;
  team: string;
  pos: string;
  overall: number;
  currentPitches: string[];
  prototypes: PitchPrototype[];
  labGrade: string;          // 'A+', 'A', 'B+', 'B', 'C'
  adaptability: number;      // 20-80 how quickly they learn new pitches
  notes: string;
}

export const DEV_STATUS_DISPLAY: Record<DevStatus, { label: string; color: string; pct: string }> = {
  prototype:   { label: 'Prototype',   color: '#ef4444', pct: '0-20%' },
  development: { label: 'Development', color: '#f97316', pct: '20-50%' },
  refinement:  { label: 'Refinement',  color: '#f59e0b', pct: '50-80%' },
  ready:       { label: 'Ready',       color: '#4ade80', pct: '80-95%' },
  deployed:    { label: 'Deployed',    color: '#22c55e', pct: '100%' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface LabSummary {
  totalPitchers: number;
  activePprototypes: number;
  readyToDeploy: number;
  avgProgress: number;
  topProspect: string;
  topPitch: string;
}

export function getLabSummary(profiles: PitcherLabProfile[]): LabSummary {
  const allPrototypes = profiles.flatMap(p => p.prototypes);
  const active = allPrototypes.filter(p => p.devStatus !== 'deployed');
  const ready = allPrototypes.filter(p => p.devStatus === 'ready').length;
  const avgProg = active.length > 0 ? Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length) : 0;
  const bestProto = allPrototypes.reduce((a, b) => a.projectedGrade > b.projectedGrade ? a : b, allPrototypes[0]);
  const bestPitcher = profiles.find(p => p.prototypes.includes(bestProto));
  return {
    totalPitchers: profiles.length,
    activePprototypes: active.length,
    readyToDeploy: ready,
    avgProgress: avgProg,
    topProspect: bestPitcher?.name ?? '',
    topPitch: bestProto?.pitchName ?? '',
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const PITCHERS: Array<{ name: string; team: string; pos: string; ovr: number; current: string[]; adapt: number }> = [
  { name: 'Spencer Strider', team: 'ATL', pos: 'SP', ovr: 89, current: ['4-Seam', 'Slider'], adapt: 70 },
  { name: 'Logan Gilbert', team: 'SEA', pos: 'SP', ovr: 84, current: ['4-Seam', 'Slider', 'Change'], adapt: 65 },
  { name: 'Hunter Brown', team: 'HOU', pos: 'SP', ovr: 80, current: ['4-Seam', 'Slider', 'Curve'], adapt: 60 },
  { name: 'Bryce Miller', team: 'SEA', pos: 'SP', ovr: 82, current: ['4-Seam', 'Slider', 'Change'], adapt: 68 },
  { name: 'Grayson Rodriguez', team: 'BAL', pos: 'SP', ovr: 83, current: ['4-Seam', 'Slider', 'Change', 'Curve'], adapt: 72 },
  { name: 'Bobby Miller', team: 'LAD', pos: 'SP', ovr: 79, current: ['4-Seam', 'Slider', 'Curve'], adapt: 55 },
];

const PITCH_IDEAS: Array<{ name: string; base: string; targetV: number; targetS: number; targetH: number; targetVB: number; projGrade: number }> = [
  { name: 'Power Sweeper', base: 'Sweeper', targetV: 84, targetS: 2600, targetH: 18, targetVB: -2, projGrade: 65 },
  { name: 'Split-Change', base: 'Splitter', targetV: 86, targetS: 1400, targetH: -2, targetVB: -36, projGrade: 60 },
  { name: 'Gyro Slider', base: 'Slider', targetV: 88, targetS: 2800, targetH: 8, targetVB: 6, projGrade: 55 },
  { name: 'Rising Cutter', base: 'Cutter', targetV: 90, targetS: 2500, targetH: 4, targetVB: 14, projGrade: 60 },
  { name: 'Vulcan Change', base: 'Changeup', targetV: 82, targetS: 1600, targetH: -14, targetVB: -30, projGrade: 55 },
  { name: 'Spike Curve', base: 'Curveball', targetV: 78, targetS: 2900, targetH: -6, targetVB: -56, projGrade: 65 },
  { name: 'Slurve', base: 'Slider', targetV: 81, targetS: 2700, targetH: 10, targetVB: -32, projGrade: 50 },
  { name: 'Power Sinker', base: 'Sinker', targetV: 96, targetS: 2200, targetH: -16, targetVB: 8, projGrade: 60 },
];

const STATUSES: DevStatus[] = ['prototype', 'development', 'refinement', 'ready', 'deployed'];
const RESULTS = [
  'Good feel, added 1\" of break',
  'Velocity consistent, spin up 50 RPM',
  'Struggled with grip consistency',
  'Best session yet — 28% whiff rate in BP',
  'Minor regression, command needs work',
  'Breakthrough — tunnel alignment improved',
];

export function generateDemoPitchDesign(): PitcherLabProfile[] {
  return PITCHERS.map((p, i) => {
    const protoCount = 1 + (i % 3);
    const prototypes: PitchPrototype[] = [];
    for (let j = 0; j < protoCount; j++) {
      const idea = PITCH_IDEAS[(i * 2 + j) % PITCH_IDEAS.length];
      const progress = 15 + ((i * 17 + j * 23) % 70);
      const statusIdx = Math.min(Math.floor(progress / 22), 4);
      const currGrade = Math.round(idea.projGrade * (progress / 100) + 20 * (1 - progress / 100));
      prototypes.push({
        pitchName: idea.name,
        baseType: idea.base,
        devStatus: STATUSES[statusIdx],
        progress,
        projectedGrade: idea.projGrade,
        currentGrade: currGrade,
        targetVelo: idea.targetV,
        currentVelo: idea.targetV - Math.round((100 - progress) * 0.04),
        targetSpin: idea.targetS,
        currentSpin: idea.targetS - Math.round((100 - progress) * 3),
        targetHBreak: idea.targetH,
        currentHBreak: Math.round(idea.targetH * (progress / 100) * 10) / 10,
        targetVBreak: idea.targetVB,
        currentVBreak: Math.round(idea.targetVB * (progress / 100) * 10) / 10,
        sessionCount: 5 + ((i + j * 3) % 15),
        lastSessionResult: RESULTS[(i + j * 5) % RESULTS.length],
        projectedWhiffRate: 22 + ((i * 3 + j * 7) % 16),
        notes: progress >= 80 ? 'Nearly ready for in-game deployment.' :
               progress >= 50 ? 'Making solid progress. Command is developing.' :
               'Early stages. Grip and feel still being established.',
      });
    }

    const labGrade = p.adapt >= 70 ? 'A+' : p.adapt >= 65 ? 'A' : p.adapt >= 60 ? 'B+' : p.adapt >= 55 ? 'B' : 'C';

    return {
      id: `pdl-${i}`,
      name: p.name,
      team: p.team,
      pos: p.pos,
      overall: p.ovr,
      currentPitches: p.current,
      prototypes,
      labGrade,
      adaptability: p.adapt,
      notes: `${p.name} is working on ${protoCount} pitch prototype${protoCount > 1 ? 's' : ''}. Adaptability grade: ${labGrade}.`,
    };
  });
}
