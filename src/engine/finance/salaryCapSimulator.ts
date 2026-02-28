/**
 * salaryCapSimulator.ts – Salary Cap Simulator
 *
 * Luxury tax threshold analysis engine. Models payroll scenarios against
 * CBT thresholds, calculates tier-based penalties, draft pick loss,
 * revenue sharing impact, and projects future cap situations.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface TaxTier {
  threshold: number;   // $M
  rate: number;        // %
  overage: number;     // $M over this tier
  penalty: number;     // $M penalty for this tier
}

export interface PayrollScenario {
  label: string;
  totalPayroll: number;
  taxStatus: 'under' | 'first_time' | 'repeat' | 'super';
  penalties: TaxTier[];
  totalPenalty: number;
  draftPickPenalty: string;
  revenueShareLoss: number;
}

export interface SalaryCapData {
  id: string;
  teamName: string;
  abbr: string;
  currentPayroll: number;
  luxuryThreshold: number;
  currentScenario: PayrollScenario;
  projectedScenario: PayrollScenario;
  biggestContracts: Array<{ name: string; aav: number; yearsLeft: number }>;
  capSpace: number;
  notes: string;
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface SalaryCapSummary {
  totalTeams: number;
  highestPayroll: { abbr: string; amount: number };
  lowestPayroll: { abbr: string; amount: number };
  avgPayroll: number;
  overThreshold: number;
  totalPenalties: number;
}

export function getSalaryCapSummary(teams: SalaryCapData[]): SalaryCapSummary {
  const n = teams.length;
  const sorted = [...teams].sort((a, b) => b.currentPayroll - a.currentPayroll);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const avgPayroll = Math.round(teams.reduce((s, t) => s + t.currentPayroll, 0) / n * 10) / 10;
  const overCount = teams.filter(t => t.currentPayroll > t.luxuryThreshold).length;
  const totalPenalties = Math.round(teams.reduce((s, t) => s + t.currentScenario.totalPenalty, 0) * 10) / 10;

  return {
    totalTeams: n,
    highestPayroll: { abbr: highest.abbr, amount: highest.currentPayroll },
    lowestPayroll: { abbr: lowest.abbr, amount: lowest.currentPayroll },
    avgPayroll,
    overThreshold: overCount,
    totalPenalties,
  };
}

// ── Scenario Builder ───────────────────────────────────────────────────────

const BASE_THRESHOLD = 237;
const TIER2_THRESHOLD = 257;
const TIER3_THRESHOLD = 277;
const SUPER_THRESHOLD = 297;

function buildScenario(label: string, payroll: number, consecutiveYears: number): PayrollScenario {
  const penalties: TaxTier[] = [];
  let totalPenalty = 0;

  if (payroll <= BASE_THRESHOLD) {
    return {
      label,
      totalPayroll: payroll,
      taxStatus: 'under',
      penalties: [],
      totalPenalty: 0,
      draftPickPenalty: 'None',
      revenueShareLoss: 0,
    };
  }

  // Tier 1: base to second
  const tier1Overage = Math.min(payroll - BASE_THRESHOLD, TIER2_THRESHOLD - BASE_THRESHOLD);
  if (tier1Overage > 0) {
    const rate = consecutiveYears >= 3 ? 110 : consecutiveYears >= 2 ? 30 : 20;
    const penalty = Math.round(tier1Overage * rate / 100 * 10) / 10;
    penalties.push({ threshold: BASE_THRESHOLD, rate, overage: Math.round(tier1Overage * 10) / 10, penalty });
    totalPenalty += penalty;
  }

  // Tier 2: second to third
  if (payroll > TIER2_THRESHOLD) {
    const tier2Overage = Math.min(payroll - TIER2_THRESHOLD, TIER3_THRESHOLD - TIER2_THRESHOLD);
    const rate = consecutiveYears >= 3 ? 130 : consecutiveYears >= 2 ? 42 : 32;
    const penalty = Math.round(tier2Overage * rate / 100 * 10) / 10;
    penalties.push({ threshold: TIER2_THRESHOLD, rate, overage: Math.round(tier2Overage * 10) / 10, penalty });
    totalPenalty += penalty;
  }

  // Tier 3: third to super
  if (payroll > TIER3_THRESHOLD) {
    const tier3Overage = Math.min(payroll - TIER3_THRESHOLD, SUPER_THRESHOLD - TIER3_THRESHOLD);
    const rate = consecutiveYears >= 2 ? 95 : 75;
    const penalty = Math.round(tier3Overage * rate / 100 * 10) / 10;
    penalties.push({ threshold: TIER3_THRESHOLD, rate, overage: Math.round(tier3Overage * 10) / 10, penalty });
    totalPenalty += penalty;
  }

  // Super tier
  if (payroll > SUPER_THRESHOLD) {
    const superOverage = payroll - SUPER_THRESHOLD;
    const rate = 100;
    const penalty = Math.round(superOverage * rate / 100 * 10) / 10;
    penalties.push({ threshold: SUPER_THRESHOLD, rate, overage: Math.round(superOverage * 10) / 10, penalty });
    totalPenalty += penalty;
  }

  const taxStatus: PayrollScenario['taxStatus'] = consecutiveYears >= 3 ? 'super'
    : consecutiveYears >= 1 ? 'repeat'
    : 'first_time';

  const draftPickPenalty = payroll > TIER2_THRESHOLD
    ? 'Highest 1st-round pick drops 10 spots'
    : payroll > BASE_THRESHOLD
    ? 'None (under 2nd tier)'
    : 'None';

  const revenueShareLoss = payroll > TIER2_THRESHOLD
    ? Math.round((payroll - TIER2_THRESHOLD) * 0.15 * 10) / 10
    : 0;

  return {
    label,
    totalPayroll: payroll,
    taxStatus,
    penalties,
    totalPenalty: Math.round(totalPenalty * 10) / 10,
    draftPickPenalty,
    revenueShareLoss,
  };
}

// ── Tax Status Display ─────────────────────────────────────────────────────

export const TAX_STATUS_DISPLAY: Record<PayrollScenario['taxStatus'], { label: string; color: string }> = {
  under:      { label: 'Under',      color: '#22c55e' },
  first_time: { label: '1st Time',   color: '#f59e0b' },
  repeat:     { label: 'Repeat',     color: '#f97316' },
  super:      { label: 'Super Tax',  color: '#ef4444' },
};

// ── Demo Data ──────────────────────────────────────────────────────────────

const TEAM_DATA = [
  {
    name: 'New York Mets', abbr: 'NYM', payroll: 314, projected: 328, consec: 2,
    contracts: [
      { name: 'Francisco Lindor', aav: 34.1, yearsLeft: 7 },
      { name: 'Justin Verlander', aav: 43.3, yearsLeft: 1 },
      { name: 'Brandon Nimmo', aav: 20.5, yearsLeft: 6 },
      { name: 'Edwin Diaz', aav: 21.0, yearsLeft: 4 },
    ],
  },
  {
    name: 'Los Angeles Dodgers', abbr: 'LAD', payroll: 298, projected: 310, consec: 3,
    contracts: [
      { name: 'Shohei Ohtani', aav: 70.0, yearsLeft: 8 },
      { name: 'Mookie Betts', aav: 30.4, yearsLeft: 9 },
      { name: 'Freddie Freeman', aav: 27.0, yearsLeft: 4 },
      { name: 'Yoshinobu Yamamoto', aav: 32.5, yearsLeft: 10 },
    ],
  },
  {
    name: 'New York Yankees', abbr: 'NYY', payroll: 282, projected: 275, consec: 4,
    contracts: [
      { name: 'Juan Soto', aav: 51.0, yearsLeft: 14 },
      { name: 'Aaron Judge', aav: 40.0, yearsLeft: 6 },
      { name: 'Gerrit Cole', aav: 36.0, yearsLeft: 4 },
      { name: 'Carlos Rodon', aav: 27.0, yearsLeft: 4 },
    ],
  },
  {
    name: 'San Diego Padres', abbr: 'SD', payroll: 232, projected: 225, consec: 0,
    contracts: [
      { name: 'Manny Machado', aav: 35.0, yearsLeft: 8 },
      { name: 'Xander Bogaerts', aav: 25.5, yearsLeft: 8 },
      { name: 'Yu Darvish', aav: 18.0, yearsLeft: 3 },
      { name: 'Joe Musgrove', aav: 20.0, yearsLeft: 4 },
    ],
  },
  {
    name: 'Tampa Bay Rays', abbr: 'TB', payroll: 98, projected: 105, consec: 0,
    contracts: [
      { name: 'Wander Franco', aav: 11.0, yearsLeft: 9 },
      { name: 'Brandon Lowe', aav: 8.5, yearsLeft: 2 },
      { name: 'Tyler Glasnow', aav: 5.3, yearsLeft: 1 },
      { name: 'Jeffrey Springs', aav: 4.2, yearsLeft: 3 },
    ],
  },
  {
    name: 'Philadelphia Phillies', abbr: 'PHI', payroll: 262, projected: 270, consec: 1,
    contracts: [
      { name: 'Trea Turner', aav: 30.0, yearsLeft: 8 },
      { name: 'Bryce Harper', aav: 25.4, yearsLeft: 8 },
      { name: 'Kyle Schwarber', aav: 20.0, yearsLeft: 2 },
      { name: 'Zack Wheeler', aav: 24.0, yearsLeft: 2 },
    ],
  },
];

export function generateDemoSalaryCapSimulator(): SalaryCapData[] {
  return TEAM_DATA.map((t, i) => {
    const currentScenario = buildScenario('Current', t.payroll, t.consec);
    const projectedScenario = buildScenario('Projected', t.projected, t.consec > 0 ? t.consec + 1 : 0);
    const capSpace = Math.round((BASE_THRESHOLD - t.payroll) * 10) / 10;

    let notes: string;
    if (t.payroll > SUPER_THRESHOLD) {
      notes = `${t.abbr} is deep into super-tax territory. Massive penalties and draft pick losses. Consider shedding salary.`;
    } else if (t.payroll > TIER3_THRESHOLD) {
      notes = `${t.abbr} is above the 3rd threshold at $${t.payroll}M. Significant penalties apply. Approaching super-tax danger zone.`;
    } else if (t.payroll > TIER2_THRESHOLD) {
      notes = `${t.abbr} has crossed the 2nd tier at $${t.payroll}M. Draft pick and IFA penalties now in effect.`;
    } else if (t.payroll > BASE_THRESHOLD) {
      notes = `${t.abbr} is over the base threshold. ${t.consec > 0 ? `${t.consec} consecutive years over — repeat offender rates.` : 'First-time offender rates apply.'}`;
    } else {
      notes = `${t.abbr} is under the luxury tax at $${t.payroll}M with $${Math.abs(capSpace)}M of space. Full draft pick and IFA access.`;
    }

    return {
      id: `sc-${i}`,
      teamName: t.name,
      abbr: t.abbr,
      currentPayroll: t.payroll,
      luxuryThreshold: BASE_THRESHOLD,
      currentScenario,
      projectedScenario,
      biggestContracts: t.contracts,
      capSpace,
      notes,
    };
  });
}
