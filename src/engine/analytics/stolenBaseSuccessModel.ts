/**
 * stolenBaseSuccessModel.ts – Stolen Base Success Model
 *
 * Models stolen-base success probability based on runner speed,
 * lead distance, pitcher delivery time, and catcher pop time.
 * Computes break-even rates, net value, and runner profiles.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type SpeedGrade = 'Elite' | 'Above Avg' | 'Average' | 'Below Avg' | 'Slow';
export type BaseStolen = '2B' | '3B' | 'Home';

export interface SBAttempt {
  id: string;
  runnerId: string;
  runnerSpeedGrade: SpeedGrade;
  leadDistance: number;       // feet
  pitcherDeliveryTime: number; // seconds
  catcherPopTime: number;     // seconds
  baseStolen: BaseStolen;
  success: boolean;
  inning: number;
  outs: number;
  scoreDiff: number;
}

export interface RunnerSBProfile {
  playerId: string;
  name: string;
  attempts: number;
  successes: number;
  rate: number;               // 0-1
  breakEven: number;          // break-even rate (0-1)
  netValue: number;           // runs above break-even
  speedGrade: SpeedGrade;
  attemptHistory: SBAttempt[];
  avgLeadDistance: number;
  avgPitcherDelivery: number;
  avgCatcherPop: number;
  successVs2B: number;
  successVs3B: number;
}

export interface SBSuccessModelResult {
  teamName: string;
  runners: RunnerSBProfile[];
  teamSBRate: number;
  teamNetValue: number;
  bestStealer: string;
  totalAttempts: number;
  totalSuccesses: number;
}

// ── Logic ──────────────────────────────────────────────────────────────────

export function getBreakEven(base: BaseStolen): number {
  // Break-even rates based on run expectancy
  switch (base) {
    case '2B': return 0.72;
    case '3B': return 0.80;
    case 'Home': return 0.90;
  }
}

export function computeNetValue(successes: number, attempts: number, breakEven: number): number {
  const successRuns = successes * 0.175;
  const failureRuns = (attempts - successes) * -0.467;
  return Math.round((successRuns + failureRuns) * 100) / 100;
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface RunnerSeed {
  id: string;
  name: string;
  speed: SpeedGrade;
  att: number;
  suc: number;
  avgLead: number;
  avgPD: number;
  avgPop: number;
  vs2B: number;
  vs3B: number;
}

const RUNNER_SEEDS: RunnerSeed[] = [
  { id: 'r01', name: 'Terrence Vega',    speed: 'Elite',     att: 42, suc: 37, avgLead: 13.2, avgPD: 1.32, avgPop: 1.95, vs2B: 0.91, vs3B: 0.80 },
  { id: 'r02', name: 'DeShawn Brooks',   speed: 'Elite',     att: 38, suc: 32, avgLead: 12.8, avgPD: 1.35, avgPop: 1.98, vs2B: 0.87, vs3B: 0.75 },
  { id: 'r03', name: 'Marcus Chen',      speed: 'Above Avg', att: 28, suc: 22, avgLead: 12.1, avgPD: 1.38, avgPop: 1.92, vs2B: 0.82, vs3B: 0.67 },
  { id: 'r04', name: 'Jaylen Torres',    speed: 'Above Avg', att: 25, suc: 19, avgLead: 11.9, avgPD: 1.34, avgPop: 1.96, vs2B: 0.80, vs3B: 0.60 },
  { id: 'r05', name: 'Kyle Nakamura',    speed: 'Average',   att: 18, suc: 13, avgLead: 11.5, avgPD: 1.40, avgPop: 1.94, vs2B: 0.75, vs3B: 0.57 },
  { id: 'r06', name: 'Adrian Reyes',     speed: 'Average',   att: 15, suc: 10, avgLead: 11.2, avgPD: 1.36, avgPop: 1.97, vs2B: 0.71, vs3B: 0.50 },
  { id: 'r07', name: 'Colton Marsh',     speed: 'Above Avg', att: 22, suc: 16, avgLead: 12.0, avgPD: 1.42, avgPop: 1.90, vs2B: 0.76, vs3B: 0.62 },
  { id: 'r08', name: 'Rafael Dominguez', speed: 'Elite',     att: 35, suc: 28, avgLead: 13.0, avgPD: 1.30, avgPop: 1.93, vs2B: 0.83, vs3B: 0.71 },
  { id: 'r09', name: 'Tyler Washington', speed: 'Average',   att: 12, suc: 8,  avgLead: 11.0, avgPD: 1.44, avgPop: 1.99, vs2B: 0.70, vs3B: 0.50 },
  { id: 'r10', name: 'Brendan O\'Neill', speed: 'Below Avg', att: 8,  suc: 4,  avgLead: 10.5, avgPD: 1.38, avgPop: 1.91, vs2B: 0.55, vs3B: 0.33 },
  { id: 'r11', name: 'Jordan Whitfield', speed: 'Above Avg', att: 20, suc: 15, avgLead: 12.3, avgPD: 1.36, avgPop: 1.95, vs2B: 0.78, vs3B: 0.64 },
  { id: 'r12', name: 'Sammy Castillo',   speed: 'Below Avg', att: 6,  suc: 3,  avgLead: 10.2, avgPD: 1.46, avgPop: 2.02, vs2B: 0.50, vs3B: 0.00 },
];

function generateAttempts(seed: RunnerSeed): SBAttempt[] {
  const attempts: SBAttempt[] = [];
  for (let i = 0; i < seed.att; i++) {
    const is3B = i % 5 === 0 && seed.vs3B > 0;
    const base: BaseStolen = is3B ? '3B' : '2B';
    const success = i < seed.suc;
    attempts.push({
      id: `${seed.id}-att-${i}`,
      runnerId: seed.id,
      runnerSpeedGrade: seed.speed,
      leadDistance: seed.avgLead + (Math.random() - 0.5) * 2,
      pitcherDeliveryTime: seed.avgPD + (Math.random() - 0.5) * 0.1,
      catcherPopTime: seed.avgPop + (Math.random() - 0.5) * 0.08,
      baseStolen: base,
      success,
      inning: (i % 9) + 1,
      outs: i % 3,
      scoreDiff: (i % 7) - 3,
    });
  }
  return attempts;
}

export function generateDemoSBSuccessModel(): SBSuccessModelResult {
  const runners: RunnerSBProfile[] = RUNNER_SEEDS.map(seed => {
    const rate = seed.suc / seed.att;
    const breakEvenRate = 0.72; // weighted average break-even
    const netVal = computeNetValue(seed.suc, seed.att, breakEvenRate);
    const history = generateAttempts(seed);

    return {
      playerId: seed.id,
      name: seed.name,
      attempts: seed.att,
      successes: seed.suc,
      rate: Math.round(rate * 1000) / 1000,
      breakEven: breakEvenRate,
      netValue: netVal,
      speedGrade: seed.speed,
      attemptHistory: history,
      avgLeadDistance: seed.avgLead,
      avgPitcherDelivery: seed.avgPD,
      avgCatcherPop: seed.avgPop,
      successVs2B: seed.vs2B,
      successVs3B: seed.vs3B,
    };
  });

  const totalAtt = runners.reduce((s, r) => s + r.attempts, 0);
  const totalSuc = runners.reduce((s, r) => s + r.successes, 0);
  const teamRate = Math.round((totalSuc / totalAtt) * 1000) / 1000;
  const teamNet = Math.round(runners.reduce((s, r) => s + r.netValue, 0) * 100) / 100;
  const best = runners.reduce((a, b) => a.netValue > b.netValue ? a : b);

  return {
    teamName: 'Houston Astros',
    runners: runners.sort((a, b) => b.netValue - a.netValue),
    teamSBRate: teamRate,
    teamNetValue: teamNet,
    bestStealer: best.name,
    totalAttempts: totalAtt,
    totalSuccesses: totalSuc,
  };
}
