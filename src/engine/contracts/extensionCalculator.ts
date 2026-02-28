/**
 * extensionCalculator.ts – Contract Extension Calculator
 *
 * Evaluates potential contract extension scenarios, calculates surplus
 * value, assigns risk ratings, and references comparable deals.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type RiskRating = 'low' | 'medium' | 'high' | 'extreme';

export interface ComparableContract {
  playerName: string;
  years: number;
  aav: number;
  totalValue: number;
}

export interface ExtensionScenario {
  id: string;
  playerName: string;
  currentAge: number;
  position: string;
  currentAAV: number;          // $M
  proposedYears: number;
  proposedAAV: number;         // $M
  totalValue: number;          // $M
  surplusValue: number;        // $M (positive = team-friendly, negative = overpay)
  riskRating: RiskRating;
  comparableContracts: ComparableContract[];
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export const RISK_DISPLAY: Record<RiskRating, { label: string; color: string }> = {
  low: { label: 'LOW', color: '#22c55e' },
  medium: { label: 'MEDIUM', color: '#facc15' },
  high: { label: 'HIGH', color: '#f97316' },
  extreme: { label: 'EXTREME', color: '#ef4444' },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface ExtensionSummary {
  totalScenarios: number;
  totalCommitment: number;
  avgSurplus: number;
  bestValue: string;
  highestRisk: string;
  lowRiskCount: number;
  extremeRiskCount: number;
}

export function getExtensionSummary(scenarios: ExtensionScenario[]): ExtensionSummary {
  const n = scenarios.length;
  const totalCommitment = Math.round(scenarios.reduce((s, sc) => s + sc.totalValue, 0) * 10) / 10;
  const avgSurplus = Math.round(scenarios.reduce((s, sc) => s + sc.surplusValue, 0) / n * 10) / 10;

  let bestVal = scenarios[0];
  let worstRisk = scenarios[0];
  const riskOrder: RiskRating[] = ['low', 'medium', 'high', 'extreme'];
  for (const sc of scenarios) {
    if (sc.surplusValue > bestVal.surplusValue) bestVal = sc;
    if (riskOrder.indexOf(sc.riskRating) > riskOrder.indexOf(worstRisk.riskRating)) worstRisk = sc;
  }

  return {
    totalScenarios: n,
    totalCommitment,
    avgSurplus,
    bestValue: bestVal.playerName,
    highestRisk: worstRisk.playerName,
    lowRiskCount: scenarios.filter(s => s.riskRating === 'low').length,
    extremeRiskCount: scenarios.filter(s => s.riskRating === 'extreme').length,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_SCENARIOS: ExtensionScenario[] = [
  {
    id: 'ext-1',
    playerName: 'Juan Soto',
    currentAge: 26,
    position: 'RF',
    currentAAV: 31.0,
    proposedYears: 13,
    proposedAAV: 46.0,
    totalValue: 598.0,
    surplusValue: 42.5,
    riskRating: 'high',
    comparableContracts: [
      { playerName: 'Mike Trout', years: 12, aav: 35.5, totalValue: 426.5 },
      { playerName: 'Mookie Betts', years: 12, aav: 30.4, totalValue: 365.0 },
    ],
  },
  {
    id: 'ext-2',
    playerName: 'Bobby Witt Jr.',
    currentAge: 24,
    position: 'SS',
    currentAAV: 7.4,
    proposedYears: 11,
    proposedAAV: 28.6,
    totalValue: 314.6,
    surplusValue: 68.0,
    riskRating: 'low',
    comparableContracts: [
      { playerName: 'Corey Seager', years: 10, aav: 32.5, totalValue: 325.0 },
      { playerName: 'Trea Turner', years: 11, aav: 30.0, totalValue: 300.0 },
    ],
  },
  {
    id: 'ext-3',
    playerName: 'Julio Rodriguez',
    currentAge: 23,
    position: 'CF',
    currentAAV: 17.8,
    proposedYears: 12,
    proposedAAV: 32.0,
    totalValue: 384.0,
    surplusValue: 55.2,
    riskRating: 'medium',
    comparableContracts: [
      { playerName: 'Ronald Acuna Jr.', years: 10, aav: 17.0, totalValue: 170.0 },
      { playerName: 'Fernando Tatis Jr.', years: 14, aav: 24.3, totalValue: 340.0 },
    ],
  },
  {
    id: 'ext-4',
    playerName: 'Gerrit Cole',
    currentAge: 34,
    position: 'SP',
    currentAAV: 36.0,
    proposedYears: 3,
    proposedAAV: 34.0,
    totalValue: 102.0,
    surplusValue: -12.5,
    riskRating: 'extreme',
    comparableContracts: [
      { playerName: 'Max Scherzer', years: 3, aav: 43.3, totalValue: 130.0 },
      { playerName: 'Justin Verlander', years: 2, aav: 43.3, totalValue: 86.7 },
    ],
  },
  {
    id: 'ext-5',
    playerName: 'Gunnar Henderson',
    currentAge: 23,
    position: 'SS',
    currentAAV: 1.2,
    proposedYears: 10,
    proposedAAV: 25.0,
    totalValue: 250.0,
    surplusValue: 85.0,
    riskRating: 'low',
    comparableContracts: [
      { playerName: 'Wander Franco', years: 11, aav: 16.4, totalValue: 182.0 },
      { playerName: 'Bobby Witt Jr.', years: 11, aav: 28.6, totalValue: 314.6 },
    ],
  },
  {
    id: 'ext-6',
    playerName: 'Corbin Burnes',
    currentAge: 29,
    position: 'SP',
    currentAAV: 15.6,
    proposedYears: 6,
    proposedAAV: 33.0,
    totalValue: 198.0,
    surplusValue: 8.5,
    riskRating: 'medium',
    comparableContracts: [
      { playerName: 'Jacob deGrom', years: 5, aav: 40.0, totalValue: 200.0 },
      { playerName: 'Aaron Nola', years: 7, aav: 25.7, totalValue: 172.0 },
    ],
  },
  {
    id: 'ext-7',
    playerName: 'Vladimir Guerrero Jr.',
    currentAge: 25,
    position: '1B',
    currentAAV: 19.9,
    proposedYears: 9,
    proposedAAV: 36.0,
    totalValue: 324.0,
    surplusValue: 22.0,
    riskRating: 'medium',
    comparableContracts: [
      { playerName: 'Freddie Freeman', years: 6, aav: 27.0, totalValue: 162.0 },
      { playerName: 'Matt Olson', years: 8, aav: 21.0, totalValue: 168.0 },
    ],
  },
  {
    id: 'ext-8',
    playerName: 'Spencer Strider',
    currentAge: 25,
    position: 'SP',
    currentAAV: 4.8,
    proposedYears: 6,
    proposedAAV: 26.0,
    totalValue: 156.0,
    surplusValue: -18.0,
    riskRating: 'extreme',
    comparableContracts: [
      { playerName: 'Shane Bieber', years: 6, aav: 18.0, totalValue: 108.0 },
      { playerName: 'Luis Castillo', years: 5, aav: 25.0, totalValue: 125.0 },
    ],
  },
];

export function generateDemoExtensionCalc(): ExtensionScenario[] {
  return DEMO_SCENARIOS;
}
