// ── Luxury Tax Calculator ────────────────────────────────────────
// Calculates CBT (competitive balance tax) implications

export interface CBTThreshold {
  tier: string;
  threshold: number;       // millions
  taxRate: number;         // percentage
  currentOver: number;     // how much over this tier
  status: 'below' | 'at' | 'above';
}

export interface SalaryEntry {
  playerName: string;
  position: string;
  aav: number;             // average annual value (millions)
  yearsRemaining: number;
  cbtContribution: number;
  pctOfPayroll: number;
}

export interface LuxuryTaxData {
  teamName: string;
  currentPayroll: number;
  cbtPayroll: number;        // may differ from actual due to AAV calculations
  firstThreshold: number;
  currentTaxBill: number;
  consecutiveYearsOver: number;
  thresholds: CBTThreshold[];
  topContracts: SalaryEntry[];
  projectedNextYear: number;
  recommendations: string[];
}

export function getTaxStatusColor(status: string): string {
  if (status === 'below') return '#22c55e';
  if (status === 'at') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoLuxuryTax(): LuxuryTaxData {
  return {
    teamName: 'San Francisco Giants',
    currentPayroll: 182.5,
    cbtPayroll: 195.8,
    firstThreshold: 237,
    currentTaxBill: 0,
    consecutiveYearsOver: 0,
    thresholds: [
      { tier: 'Base CBT', threshold: 237, taxRate: 20, currentOver: -41.2, status: 'below' },
      { tier: 'Second Tier', threshold: 257, taxRate: 32, currentOver: -61.2, status: 'below' },
      { tier: 'Surcharge', threshold: 277, taxRate: 62.5, currentOver: -81.2, status: 'below' },
      { tier: 'Super Tax', threshold: 297, taxRate: 80, currentOver: -101.2, status: 'below' },
    ],
    topContracts: [
      { playerName: 'Brandon Crawford', position: 'SS', aav: 16.0, yearsRemaining: 1, cbtContribution: 16.0, pctOfPayroll: 8.2 },
      { playerName: 'Marcus Webb', position: 'CF', aav: 15.0, yearsRemaining: 2, cbtContribution: 15.0, pctOfPayroll: 7.7 },
      { playerName: 'Tony Reyes', position: 'RF', aav: 11.0, yearsRemaining: 1, cbtContribution: 11.0, pctOfPayroll: 5.6 },
      { playerName: 'Derek Palmer', position: 'LF', aav: 10.0, yearsRemaining: 1, cbtContribution: 10.0, pctOfPayroll: 5.1 },
      { playerName: 'Carlos Delgado Jr.', position: 'DH', aav: 9.5, yearsRemaining: 2, cbtContribution: 9.5, pctOfPayroll: 4.9 },
      { playerName: 'Alejandro Vega', position: 'SP', aav: 8.5, yearsRemaining: 3, cbtContribution: 8.5, pctOfPayroll: 4.3 },
      { playerName: 'Camilo Doval', position: 'CL', aav: 7.0, yearsRemaining: 2, cbtContribution: 7.0, pctOfPayroll: 3.6 },
    ],
    projectedNextYear: 168.0,
    recommendations: [
      '$41.2M room under CBT — can add significant salary at deadline',
      'Crawford coming off books saves $16M for next season',
      'Could absorb $20M+ in salary via trade deadline acquisitions',
      'Projected $168M next year creates flexibility for FA splash',
    ],
  };
}
