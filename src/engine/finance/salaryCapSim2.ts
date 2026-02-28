/**
 * salaryCapSim2.ts – Salary Cap Simulator v2
 *
 * Projects future payroll obligations for the next 5 seasons. Breaks down
 * committed salary vs projected arbitration raises vs free agent slots.
 * Identifies financial flexibility windows and models "what if" scenarios:
 * extend a player, trade a salary, or sign a free agent.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ContractType = 'guaranteed' | 'arbitration' | 'pre-arb' | 'free-agent-slot' | 'option';

export interface RosterObligation {
  name: string;
  position: string;
  contractType: ContractType;
  salaries: number[];         // salary for each of next 5 seasons ($M), 0 if expired
  totalRemaining: number;     // total $ remaining on deal
  yearsRemaining: number;
  age: number;
  note: string;
}

export interface SeasonProjection {
  year: number;
  committedSalary: number;    // guaranteed contracts
  arbProjection: number;      // projected arbitration raises
  preArbCost: number;         // pre-arb minimum salaries
  faSlotCost: number;         // estimated cost to fill FA slots
  totalProjected: number;
  luxuryThreshold: number;
  capSpace: number;           // threshold - total
  openRosterSpots: number;
  flexibility: 'tight' | 'moderate' | 'flexible' | 'wide_open';
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  type: 'extension' | 'trade' | 'free-agent';
  impactByYear: number[];     // payroll delta per year (positive = added cost)
  totalCost: number;
  riskLevel: 'low' | 'medium' | 'high';
  projectedWARGain: number;
  note: string;
}

export interface SalaryCapSimData {
  teamName: string;
  teamAbbr: string;
  currentYear: number;
  luxuryThreshold: number;
  currentPayroll: number;
  roster: RosterObligation[];
  seasons: SeasonProjection[];
  scenarios: WhatIfScenario[];
  bestFlexibilityYear: number;
  biggestObligationPlayer: string;
}

// ── Display Helpers ────────────────────────────────────────────────────────

export const CONTRACT_TYPE_DISPLAY: Record<ContractType, { label: string; color: string }> = {
  'guaranteed':      { label: 'Guaranteed',  color: '#ef4444' },
  'arbitration':     { label: 'Arbitration', color: '#f59e0b' },
  'pre-arb':         { label: 'Pre-Arb',     color: '#22c55e' },
  'free-agent-slot': { label: 'FA Slot',     color: '#6b7280' },
  'option':          { label: 'Option',      color: '#8b5cf6' },
};

export const FLEXIBILITY_DISPLAY: Record<SeasonProjection['flexibility'], { label: string; color: string }> = {
  tight:     { label: 'Tight',     color: '#ef4444' },
  moderate:  { label: 'Moderate',  color: '#f59e0b' },
  flexible:  { label: 'Flexible',  color: '#4ade80' },
  wide_open: { label: 'Wide Open', color: '#22c55e' },
};

export function capSpaceColor(space: number): string {
  if (space >= 50) return '#22c55e';
  if (space >= 20) return '#4ade80';
  if (space >= 0) return '#f59e0b';
  return '#ef4444';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface CapSimSummary {
  currentPayroll: number;
  currentCapSpace: number;
  peakPayrollYear: number;
  peakPayrollAmount: number;
  bestFlexYear: number;
  bestFlexSpace: number;
  totalCommitted5Yr: number;
  scenarioCount: number;
}

export function getCapSimSummary(data: SalaryCapSimData): CapSimSummary {
  const peakSeason = [...data.seasons].sort((a, b) => b.totalProjected - a.totalProjected)[0];
  const bestFlex = [...data.seasons].sort((a, b) => b.capSpace - a.capSpace)[0];
  const total5Yr = data.seasons.reduce((s, yr) => s + yr.committedSalary, 0);

  return {
    currentPayroll: data.currentPayroll,
    currentCapSpace: data.luxuryThreshold - data.currentPayroll,
    peakPayrollYear: peakSeason.year,
    peakPayrollAmount: peakSeason.totalProjected,
    bestFlexYear: bestFlex.year,
    bestFlexSpace: bestFlex.capSpace,
    totalCommitted5Yr: Math.round(total5Yr * 10) / 10,
    scenarioCount: data.scenarios.length,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function calcFlexibility(space: number): SeasonProjection['flexibility'] {
  if (space >= 60) return 'wide_open';
  if (space >= 30) return 'flexible';
  if (space >= 0) return 'moderate';
  return 'tight';
}

export function generateDemoSalaryCapSim2(): SalaryCapSimData {
  const THRESHOLD = 241;
  const CURRENT_YEAR = 2026;

  const roster: RosterObligation[] = [
    {
      name: 'Gunnar Henderson', position: 'SS', contractType: 'pre-arb',
      salaries: [0.72, 0.72, 5.5, 10.0, 15.0], totalRemaining: 31.94, yearsRemaining: 5, age: 25,
      note: 'Pre-arb through 2027, arb eligible 2028-2030. Extension candidate.',
    },
    {
      name: 'Adley Rutschman', position: 'C', contractType: 'pre-arb',
      salaries: [0.72, 5.0, 8.5, 12.0, 16.0], totalRemaining: 42.22, yearsRemaining: 5, age: 26,
      note: 'Arb-eligible starting 2027. Franchise catcher, priority extension target.',
    },
    {
      name: 'Corbin Burnes', position: 'SP', contractType: 'guaranteed',
      salaries: [15.64, 0, 0, 0, 0], totalRemaining: 15.64, yearsRemaining: 1, age: 29,
      note: 'Final year of control. Free agent after 2026. Extension or trade decision looming.',
    },
    {
      name: 'Anthony Santander', position: 'RF', contractType: 'guaranteed',
      salaries: [20.0, 20.0, 20.0, 20.0, 20.0], totalRemaining: 100.0, yearsRemaining: 5, age: 29,
      note: 'Signed 5yr/$100M extension. Consistent 30+ HR power but aging curve a concern.',
    },
    {
      name: 'Ryan Mountcastle', position: '1B', contractType: 'arbitration',
      salaries: [4.6, 7.2, 0, 0, 0], totalRemaining: 11.8, yearsRemaining: 2, age: 27,
      note: 'Arb-eligible, final two years before free agency. Modest production relative to cost.',
    },
    {
      name: 'Cedric Mullins', position: 'LF', contractType: 'arbitration',
      salaries: [6.75, 0, 0, 0, 0], totalRemaining: 6.75, yearsRemaining: 1, age: 29,
      note: 'Final arb year. Declining performance, trade candidate to clear salary.',
    },
    {
      name: 'Grayson Rodriguez', position: 'SP', contractType: 'pre-arb',
      salaries: [0.72, 0.72, 0.72, 6.0, 10.0], totalRemaining: 18.16, yearsRemaining: 5, age: 24,
      note: 'Pre-arb through 2029. Emerging ace with elite upside. Long-term lock-up candidate.',
    },
    {
      name: 'Jordan Westburg', position: '3B', contractType: 'pre-arb',
      salaries: [0.72, 0.72, 4.5, 8.0, 12.0], totalRemaining: 25.94, yearsRemaining: 5, age: 25,
      note: 'Pre-arb through 2028. Versatile infielder with growing power.',
    },
    {
      name: 'Colton Cowser', position: 'CF', contractType: 'pre-arb',
      salaries: [0.72, 0.72, 0.72, 4.0, 7.0], totalRemaining: 13.16, yearsRemaining: 5, age: 24,
      note: 'Pre-arb through 2029. Strong OBP with plus defense in center.',
    },
    {
      name: 'Jackson Holliday', position: '2B', contractType: 'pre-arb',
      salaries: [0.72, 0.72, 0.72, 0.72, 4.0], totalRemaining: 6.88, yearsRemaining: 5, age: 22,
      note: 'Top prospect recently promoted. Pre-arb through 2030. Future franchise player.',
    },
    {
      name: 'Dean Kremer', position: 'SP', contractType: 'arbitration',
      salaries: [3.4, 5.5, 0, 0, 0], totalRemaining: 8.9, yearsRemaining: 2, age: 28,
      note: 'Back-end starter, arb years remaining. Could be non-tendered if better options emerge.',
    },
    {
      name: 'Craig Kimbrel', position: 'RP', contractType: 'guaranteed',
      salaries: [13.0, 0, 0, 0, 0], totalRemaining: 13.0, yearsRemaining: 1, age: 36,
      note: 'Final year of deal. Expensive for production. $13M comes off books after 2026.',
    },
    {
      name: 'Kyle Bradish', position: 'SP', contractType: 'pre-arb',
      salaries: [0.72, 4.0, 7.0, 10.0, 0], totalRemaining: 21.72, yearsRemaining: 4, age: 27,
      note: 'Returning from injury. Pre-arb in 2026, arb after. High upside if healthy.',
    },
    {
      name: 'Danny Coulombe', position: 'RP', contractType: 'guaranteed',
      salaries: [3.0, 3.0, 0, 0, 0], totalRemaining: 6.0, yearsRemaining: 2, age: 32,
      note: 'Reliable lefty reliever on team-friendly deal.',
    },
    {
      name: '(Open Slot #1)', position: 'SP', contractType: 'free-agent-slot',
      salaries: [0, 15.0, 15.0, 15.0, 15.0], totalRemaining: 60.0, yearsRemaining: 4, age: 0,
      note: 'Projected FA SP signing for 2027 rotation. Budget ~$15M AAV.',
    },
    {
      name: '(Open Slot #2)', position: 'RP', contractType: 'free-agent-slot',
      salaries: [0, 5.0, 5.0, 0, 0], totalRemaining: 10.0, yearsRemaining: 2, age: 0,
      note: 'Projected bullpen addition for 2027. Budget ~$5M AAV.',
    },
  ];

  const seasons: SeasonProjection[] = [
    {
      year: 2026, committedSalary: 52.64, arbProjection: 14.75, preArbCost: 5.76,
      faSlotCost: 0, totalProjected: 168.15, luxuryThreshold: THRESHOLD,
      capSpace: THRESHOLD - 168.15, openRosterSpots: 0,
      flexibility: calcFlexibility(THRESHOLD - 168.15),
    },
    {
      year: 2027, committedSalary: 23.0, arbProjection: 18.42, preArbCost: 3.60,
      faSlotCost: 20.0, totalProjected: 145.02, luxuryThreshold: THRESHOLD + 5,
      capSpace: (THRESHOLD + 5) - 145.02, openRosterSpots: 3,
      flexibility: calcFlexibility((THRESHOLD + 5) - 145.02),
    },
    {
      year: 2028, committedSalary: 20.0, arbProjection: 25.7, preArbCost: 2.16,
      faSlotCost: 20.0, totalProjected: 142.86, luxuryThreshold: THRESHOLD + 10,
      capSpace: (THRESHOLD + 10) - 142.86, openRosterSpots: 4,
      flexibility: calcFlexibility((THRESHOLD + 10) - 142.86),
    },
    {
      year: 2029, committedSalary: 20.0, arbProjection: 34.72, preArbCost: 1.44,
      faSlotCost: 15.0, totalProjected: 156.16, luxuryThreshold: THRESHOLD + 15,
      capSpace: (THRESHOLD + 15) - 156.16, openRosterSpots: 5,
      flexibility: calcFlexibility((THRESHOLD + 15) - 156.16),
    },
    {
      year: 2030, committedSalary: 20.0, arbProjection: 42.0, preArbCost: 4.0,
      faSlotCost: 15.0, totalProjected: 164.0, luxuryThreshold: THRESHOLD + 20,
      capSpace: (THRESHOLD + 20) - 164.0, openRosterSpots: 6,
      flexibility: calcFlexibility((THRESHOLD + 20) - 164.0),
    },
  ];

  const scenarios: WhatIfScenario[] = [
    {
      id: 'sc-1',
      name: 'Extend Gunnar Henderson',
      description: 'Lock up Henderson on a 10-year, $280M extension starting 2028, buying out arb years and 5 FA years.',
      type: 'extension',
      impactByYear: [0, 0, 22.5, 18.0, 13.0],
      totalCost: 280,
      riskLevel: 'low',
      projectedWARGain: 0,
      note: 'Replaces arb projections with guaranteed AAV of $28M. Low risk given elite track record. Provides cost certainty and retains franchise player.',
    },
    {
      id: 'sc-2',
      name: 'Trade Craig Kimbrel',
      description: 'Move Kimbrel at the deadline, eating $4M of remaining salary. Acquiring team gets a veteran closer.',
      type: 'trade',
      impactByYear: [-9.0, 0, 0, 0, 0],
      totalCost: -9.0,
      riskLevel: 'low',
      projectedWARGain: -0.5,
      note: 'Saves $9M in 2026 after eating $4M. Minor production loss offset by internal options (Cano, Akin). Frees roster spot for prospect.',
    },
    {
      id: 'sc-3',
      name: 'Trade Cedric Mullins',
      description: 'Deal Mullins to a contender at the deadline. Salary dump with small prospect return.',
      type: 'trade',
      impactByYear: [-4.0, 0, 0, 0, 0],
      totalCost: -4.0,
      riskLevel: 'low',
      projectedWARGain: -0.8,
      note: 'Saves ~$4M remaining on 2026 salary. Declining production makes this a clear win. Opens CF for Cowser full-time.',
    },
    {
      id: 'sc-4',
      name: 'Sign FA Ace (Corbin Burnes re-sign)',
      description: 'Re-sign Burnes to a 6-year, $210M deal after 2026 season. Keeps ace in rotation long-term.',
      type: 'free-agent',
      impactByYear: [0, 35.0, 35.0, 35.0, 35.0],
      totalCost: 210,
      riskLevel: 'high',
      projectedWARGain: 4.5,
      note: 'Major commitment at $35M AAV. Keeps rotation anchored but limits future flexibility significantly. Injury risk for a pitcher entering his 30s.',
    },
    {
      id: 'sc-5',
      name: 'Extend Adley Rutschman',
      description: 'Sign Rutschman to an 8-year, $200M extension starting 2027, buying out arb and FA years.',
      type: 'extension',
      impactByYear: [0, 20.0, 16.5, 13.0, 9.0],
      totalCost: 200,
      riskLevel: 'medium',
      projectedWARGain: 0,
      note: 'Locks up franchise catcher at $25M AAV. Replaces arb projections. Catcher durability is the risk factor -- long-term deals for catchers carry inherent risk.',
    },
    {
      id: 'sc-6',
      name: 'Sign Mid-Tier FA SP',
      description: 'Sign a #3 starter on a 3-year, $45M deal for 2027 to replace Burnes if he leaves.',
      type: 'free-agent',
      impactByYear: [0, 15.0, 15.0, 15.0, 0],
      totalCost: 45,
      riskLevel: 'medium',
      projectedWARGain: 2.5,
      note: 'Budget-friendly rotation insurance at $15M AAV. Less upside than Burnes re-sign but far lower risk and preserves flexibility.',
    },
  ];

  const bestFlexSeason = [...seasons].sort((a, b) => b.capSpace - a.capSpace)[0];
  const biggestObligation = [...roster]
    .filter(r => r.contractType !== 'free-agent-slot')
    .sort((a, b) => b.totalRemaining - a.totalRemaining)[0];

  return {
    teamName: 'Baltimore Orioles',
    teamAbbr: 'BAL',
    currentYear: CURRENT_YEAR,
    luxuryThreshold: THRESHOLD,
    currentPayroll: 168.15,
    roster,
    seasons,
    scenarios,
    bestFlexibilityYear: bestFlexSeason.year,
    biggestObligationPlayer: biggestObligation.name,
  };
}
