/**
 * Stolen Base Analytics
 *
 * Advanced analysis of base-stealing efficiency, breakeven rates,
 * catcher pop times, pitcher hold times, and optimal steal situations.
 * Uses the ~70% breakeven threshold for run expectancy.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type StealGrade = 'elite' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export const STEAL_GRADE_DISPLAY: Record<StealGrade, { label: string; color: string; minRate: number }> = {
  elite:     { label: 'Elite',     color: '#22c55e', minRate: 85 },
  above_avg: { label: 'Above Avg', color: '#3b82f6', minRate: 78 },
  average:   { label: 'Average',   color: '#eab308', minRate: 70 },
  below_avg: { label: 'Below Avg', color: '#f97316', minRate: 60 },
  poor:      { label: 'Poor',      color: '#ef4444', minRate: 0 },
};

export interface StealCandidate {
  id: number;
  name: string;
  pos: string;
  speed: number;        // 20-80
  stealing: number;     // 20-80 base-stealing skill
  attempts: number;
  successes: number;
  successRate: number;  // percentage
  grade: StealGrade;
  runValue: number;     // total run value from steals
  greenLight: boolean;  // auto green light on steal attempts
  bestBase: '2B' | '3B';
  reactionTime: number; // seconds (lower is better)
}

export interface CatcherArm {
  id: number;
  name: string;
  popTime: number;      // seconds to 2B
  csRate: number;       // caught stealing percentage
  throwStrength: number; // 20-80
  attempts: number;
  caughtStealing: number;
  grade: StealGrade;
}

export interface StealSituation {
  id: number;
  inning: number;
  base: '1st' | '2nd';
  runner: string;
  runnerSpeed: number;
  catcher: string;
  catcherPopTime: number;
  pitcher: string;
  pitcherHoldTime: number;
  successProb: number;
  breakeven: number;
  recommendation: 'green_light' | 'situational' | 'hold';
  runExpectancyGain: number;
}

export interface StealSummary {
  totalAttempts: number;
  totalSuccesses: number;
  teamSuccessRate: number;
  teamRunValue: number;
  greenLightCount: number;
  avgSpeed: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getStealGrade(successRate: number): StealGrade {
  if (successRate >= 85) return 'elite';
  if (successRate >= 78) return 'above_avg';
  if (successRate >= 70) return 'average';
  if (successRate >= 60) return 'below_avg';
  return 'poor';
}

export function getCatcherGrade(csRate: number): StealGrade {
  if (csRate >= 35) return 'elite';
  if (csRate >= 28) return 'above_avg';
  if (csRate >= 22) return 'average';
  if (csRate >= 15) return 'below_avg';
  return 'poor';
}

export function getStealSummary(candidates: StealCandidate[]): StealSummary {
  const totalAttempts = candidates.reduce((s, c) => s + c.attempts, 0);
  const totalSuccesses = candidates.reduce((s, c) => s + c.successes, 0);
  return {
    totalAttempts,
    totalSuccesses,
    teamSuccessRate: totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 100) : 0,
    teamRunValue: Math.round(candidates.reduce((s, c) => s + c.runValue, 0) * 10) / 10,
    greenLightCount: candidates.filter(c => c.greenLight).length,
    avgSpeed: Math.round(candidates.reduce((s, c) => s + c.speed, 0) / candidates.length),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoStealCandidates(): StealCandidate[] {
  const data = [
    { name: 'Elly De La Cruz',  pos: 'SS',  spd: 80, stl: 75, att: 68, suc: 58, rv: 4.2, gl: true,  best: '2B' as const, rt: 0.28 },
    { name: 'Bobby Witt Jr.',   pos: 'SS',  spd: 75, stl: 70, att: 42, suc: 35, rv: 2.8, gl: true,  best: '2B' as const, rt: 0.30 },
    { name: 'Ronald Acuna Jr.', pos: 'RF',  spd: 78, stl: 72, att: 55, suc: 48, rv: 3.5, gl: true,  best: '2B' as const, rt: 0.29 },
    { name: 'Cedric Mullins',   pos: 'CF',  spd: 72, stl: 65, att: 35, suc: 27, rv: 1.2, gl: false, best: '2B' as const, rt: 0.32 },
    { name: 'Trea Turner',      pos: 'SS',  spd: 75, stl: 68, att: 30, suc: 24, rv: 1.8, gl: true,  best: '2B' as const, rt: 0.30 },
    { name: 'Jazz Chisholm',    pos: '3B',  spd: 70, stl: 62, att: 28, suc: 20, rv: 0.6, gl: false, best: '2B' as const, rt: 0.33 },
    { name: 'Jorge Mateo',      pos: 'SS',  spd: 78, stl: 58, att: 22, suc: 14, rv: -0.4, gl: false, best: '3B' as const, rt: 0.31 },
    { name: 'Kyle Tucker',      pos: 'LF',  spd: 62, stl: 55, att: 18, suc: 13, rv: 0.3, gl: false, best: '2B' as const, rt: 0.35 },
  ];

  return data.map((d, i) => {
    const successRate = Math.round((d.suc / d.att) * 100);
    return {
      id: i,
      name: d.name,
      pos: d.pos,
      speed: d.spd,
      stealing: d.stl,
      attempts: d.att,
      successes: d.suc,
      successRate,
      grade: getStealGrade(successRate),
      runValue: d.rv,
      greenLight: d.gl,
      bestBase: d.best,
      reactionTime: d.rt,
    };
  });
}

export function generateDemoCatchers(): CatcherArm[] {
  const data = [
    { name: 'J.T. Realmuto',    pop: 1.85, cs: 34, str: 75, att: 92, caught: 31 },
    { name: 'Adley Rutschman',  pop: 1.92, cs: 28, str: 68, att: 85, caught: 24 },
    { name: 'Will Smith',       pop: 1.95, cs: 25, str: 62, att: 78, caught: 20 },
    { name: 'Salvador Perez',   pop: 2.00, cs: 22, str: 60, att: 70, caught: 15 },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    popTime: d.pop,
    csRate: d.cs,
    throwStrength: d.str,
    attempts: d.att,
    caughtStealing: d.caught,
    grade: getCatcherGrade(d.cs),
  }));
}

export function generateDemoSituations(): StealSituation[] {
  return [
    { id: 0, inning: 3, base: '1st', runner: 'Elly De La Cruz', runnerSpeed: 80, catcher: 'Will Smith', catcherPopTime: 1.95, pitcher: 'Yu Darvish', pitcherHoldTime: 1.35, successProb: 82, breakeven: 70, recommendation: 'green_light', runExpectancyGain: 0.18 },
    { id: 1, inning: 5, base: '2nd', runner: 'Bobby Witt Jr.', runnerSpeed: 75, catcher: 'J.T. Realmuto', catcherPopTime: 1.85, pitcher: 'Aaron Nola', pitcherHoldTime: 1.25, successProb: 58, breakeven: 72, recommendation: 'hold', runExpectancyGain: -0.12 },
    { id: 2, inning: 7, base: '1st', runner: 'Ronald Acuna Jr.', runnerSpeed: 78, catcher: 'Salvador Perez', catcherPopTime: 2.00, pitcher: 'Framber Valdez', pitcherHoldTime: 1.40, successProb: 76, breakeven: 70, recommendation: 'situational', runExpectancyGain: 0.08 },
  ];
}
