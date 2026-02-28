/**
 * baserunningIQ.ts – Baserunning intelligence & decision analysis
 *
 * Tracks baserunning decisions: tagging up, extra bases, lead distances,
 * first-to-third success, scoring from second on singles, and overall
 * baserunning runs above average (BsR).
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type BsrGrade = 'elite' | 'plus' | 'average' | 'below' | 'poor';

export interface BaserunningDecision {
  situation: string;        // e.g. "Single to RF, runner on 2nd"
  decision: string;         // e.g. "Held at 3rd" or "Scored"
  correct: boolean;
  valueAdded: number;       // runs above average from this play
  inning: number;
  opponent: string;
}

export interface BaserunnerProfile {
  id: string;
  name: string;
  pos: string;
  team: string;
  overall: number;
  speed: number;            // 20-80 scale
  bsr: number;              // baserunning runs above average
  bsrGrade: BsrGrade;
  extraBaseTakenPct: number; // % of times took extra base
  firstToThirdPct: number;  // success rate on 1st-to-3rd
  scoringFromSecondPct: number;
  tagUpSuccessRate: number;
  stolenBaseAttempts: number;
  stolenBaseSuccessRate: number;
  outsOnBases: number;
  decisions: BaserunningDecision[];
  notes: string;
}

export const BSR_DISPLAY: Record<BsrGrade, { label: string; color: string; emoji: string }> = {
  elite:   { label: 'Elite Baserunner', color: '#22c55e', emoji: '⚡' },
  plus:    { label: 'Plus Baserunner',  color: '#4ade80', emoji: '🏃' },
  average: { label: 'Average',          color: '#f59e0b', emoji: '▬' },
  below:   { label: 'Below Average',    color: '#f97316', emoji: '▼' },
  poor:    { label: 'Poor Baserunner',  color: '#ef4444', emoji: '🐌' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface BaserunningTeamSummary {
  teamBsR: number;
  bestBaserunner: string;
  extraBasePct: number;
  totalOutsOnBases: number;
  avgTagUpRate: number;
  eliteRunners: number;
}

export function getBaserunningTeamSummary(runners: BaserunnerProfile[]): BaserunningTeamSummary {
  const teamBsR = runners.reduce((s, r) => s + r.bsr, 0);
  const best = runners.reduce((a, b) => a.bsr > b.bsr ? a : b, runners[0]);
  const avgExtra = runners.reduce((s, r) => s + r.extraBaseTakenPct, 0) / runners.length;
  const totalOuts = runners.reduce((s, r) => s + r.outsOnBases, 0);
  const avgTag = runners.reduce((s, r) => s + r.tagUpSuccessRate, 0) / runners.length;
  const elites = runners.filter(r => r.bsrGrade === 'elite').length;
  return {
    teamBsR: Math.round(teamBsR * 10) / 10,
    bestBaserunner: best.name,
    extraBasePct: Math.round(avgExtra),
    totalOutsOnBases: totalOuts,
    avgTagUpRate: Math.round(avgTag),
    eliteRunners: elites,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const NAMES = [
  'Trea Turner', 'Ronald Acuña Jr.', 'Bobby Witt Jr.', 'Elly De La Cruz',
  'Mookie Betts', 'José Ramírez', 'Luis Robert Jr.', 'Julio Rodríguez',
  'Corbin Carroll', 'Fernando Tatis Jr.', 'Jazz Chisholm', 'CJ Abrams',
];

const POSITIONS = ['SS', 'CF', 'SS', 'SS', 'RF', '3B', 'CF', 'CF', 'CF', 'RF', '3B', 'SS'];
const TEAMS = ['PHI', 'ATL', 'KC', 'CIN', 'LAD', 'CLE', 'CHW', 'SEA', 'ARI', 'SD', 'NYY', 'WSH'];

const SITUATIONS = [
  'Single to RF, runner on 2nd',
  'Double to LF gap, runner on 1st',
  'Fly ball to CF, runner on 3rd',
  'Ground ball to SS, runner on 1st',
  'Wild pitch, runner on 2nd',
  'Passed ball, runner on 3rd',
  'Single to CF, runner on 1st',
  'Double to RF, runner on 2nd',
];

function makeBsrGrade(bsr: number): BsrGrade {
  if (bsr >= 6) return 'elite';
  if (bsr >= 3) return 'plus';
  if (bsr >= -1) return 'average';
  if (bsr >= -4) return 'below';
  return 'poor';
}

function makeDecisions(seed: number): BaserunningDecision[] {
  const count = 5 + (seed % 4);
  const decisions: BaserunningDecision[] = [];
  for (let i = 0; i < count; i++) {
    const sit = SITUATIONS[(seed + i * 3) % SITUATIONS.length];
    const correct = ((seed * 7 + i * 13) % 10) > 2;
    const va = correct ? Math.round(((seed + i) % 15) * 0.1 * 10) / 10 : -Math.round(((seed + i) % 8) * 0.15 * 10) / 10;
    decisions.push({
      situation: sit,
      decision: correct ? 'Advanced successfully' : 'Out on bases',
      correct,
      valueAdded: va,
      inning: 1 + ((seed + i) % 9),
      opponent: TEAMS[(seed + i) % TEAMS.length],
    });
  }
  return decisions;
}

export function generateDemoBaserunning(): BaserunnerProfile[] {
  return NAMES.map((name, i) => {
    const speed = 75 - (i * 4) + ((i * 7) % 10);
    const bsr = Math.round((8 - i * 1.2 + ((i * 3) % 5)) * 10) / 10;
    const extra = 58 + ((i * 7) % 25) - (i > 6 ? 12 : 0);
    const f2t = 60 + ((i * 11) % 20) - (i > 5 ? 10 : 0);
    const s2 = 55 + ((i * 9) % 25) - (i > 7 ? 15 : 0);
    const tag = 70 + ((i * 5) % 20) - (i > 8 ? 15 : 0);
    const sbAtt = 15 + ((i * 13) % 30);
    const sbRate = 75 + ((i * 3) % 15) - (i > 6 ? 10 : 0);
    return {
      id: `br-${i}`,
      name,
      pos: POSITIONS[i],
      team: TEAMS[i],
      overall: 92 - i * 3 + ((i * 5) % 8),
      speed,
      bsr,
      bsrGrade: makeBsrGrade(bsr),
      extraBaseTakenPct: extra,
      firstToThirdPct: f2t,
      scoringFromSecondPct: s2,
      tagUpSuccessRate: tag,
      stolenBaseAttempts: sbAtt,
      stolenBaseSuccessRate: sbRate,
      outsOnBases: 1 + (i % 5),
      decisions: makeDecisions(i + 10),
      notes: bsr >= 5 ? 'Elite instincts and speed create consistent extra-base opportunities.' :
             bsr >= 2 ? 'Good reads on balls in play. Reliable on the bases.' :
             bsr >= 0 ? 'Average baserunner. Makes few mistakes but doesn\'t add extra value.' :
             'Needs improvement in reads and decisions. Too many outs on bases.',
    };
  });
}
