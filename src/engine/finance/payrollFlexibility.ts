/**
 * Payroll Flexibility Analysis
 *
 * Tracks luxury tax thresholds, committed salary by year,
 * available spending room, and flexibility grades.
 * Essential for long-term financial planning.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type FlexGrade = 'max_flex' | 'comfortable' | 'tight' | 'capped' | 'over';

export const FLEX_DISPLAY: Record<FlexGrade, { label: string; color: string; emoji: string }> = {
  max_flex:     { label: 'Max Flexibility', color: '#22c55e', emoji: '💰' },
  comfortable:  { label: 'Comfortable',     color: '#3b82f6', emoji: '✅' },
  tight:        { label: 'Tight',           color: '#eab308', emoji: '⚠️' },
  capped:       { label: 'Capped',          color: '#f97316', emoji: '🔒' },
  over:         { label: 'Over Tax',        color: '#ef4444', emoji: '🚨' },
};

export interface YearCommitment {
  year: number;
  committed: number;       // $ millions committed
  options: number;         // $ millions in options
  arbitration: number;     // estimated arb costs
  projected: number;       // total projected payroll
  luxuryTaxLine: number;   // CBT threshold
  room: number;            // space under tax
  flexGrade: FlexGrade;
}

export interface ContractBlock {
  name: string;
  pos: string;
  aav: number;             // avg annual value $M
  yearsLeft: number;
  isMovable: boolean;
  tradeValue: string;      // 'positive' | 'neutral' | 'negative'
}

export interface PayrollFlexData {
  teamName: string;
  currentPayroll: number;
  luxuryTaxThreshold: number;
  currentRoom: number;
  currentFlexGrade: FlexGrade;
  yearProjections: YearCommitment[];
  biggestContracts: ContractBlock[];
  deadMoney: number;
  preArbPlayers: number;
  arbEligible: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getFlexGrade(room: number, threshold: number): FlexGrade {
  const pct = (room / threshold) * 100;
  if (pct >= 15) return 'max_flex';
  if (pct >= 8) return 'comfortable';
  if (pct >= 2) return 'tight';
  if (pct >= 0) return 'capped';
  return 'over';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoPayrollFlex(): PayrollFlexData {
  const threshold = 237;
  const currentPayroll = 212;

  const years: YearCommitment[] = [
    { year: 2024, committed: 185, options: 12, arbitration: 18, projected: 215, luxuryTaxLine: 237, room: 22, flexGrade: 'comfortable' },
    { year: 2025, committed: 155, options: 20, arbitration: 25, projected: 200, luxuryTaxLine: 241, room: 41, flexGrade: 'max_flex' },
    { year: 2026, committed: 120, options: 15, arbitration: 30, projected: 165, luxuryTaxLine: 245, room: 80, flexGrade: 'max_flex' },
    { year: 2027, committed: 85,  options: 10, arbitration: 35, projected: 130, luxuryTaxLine: 249, room: 119, flexGrade: 'max_flex' },
    { year: 2028, committed: 55,  options: 5,  arbitration: 38, projected: 98,  luxuryTaxLine: 253, room: 155, flexGrade: 'max_flex' },
  ];

  const contracts: ContractBlock[] = [
    { name: 'Trea Turner',     pos: 'SS',  aav: 30.0, yearsLeft: 8,  isMovable: false, tradeValue: 'negative' },
    { name: 'Bryce Harper',    pos: '1B',  aav: 25.4, yearsLeft: 6,  isMovable: false, tradeValue: 'neutral' },
    { name: 'Kyle Schwarber',  pos: 'LF',  aav: 20.0, yearsLeft: 2,  isMovable: true,  tradeValue: 'neutral' },
    { name: 'Nick Castellanos', pos: 'RF', aav: 20.0, yearsLeft: 3,  isMovable: true,  tradeValue: 'negative' },
    { name: 'Aaron Nola',      pos: 'SP',  aav: 18.0, yearsLeft: 1,  isMovable: true,  tradeValue: 'positive' },
    { name: 'Zack Wheeler',    pos: 'SP',  aav: 23.6, yearsLeft: 1,  isMovable: true,  tradeValue: 'positive' },
    { name: 'J.T. Realmuto',   pos: 'C',   aav: 23.9, yearsLeft: 2,  isMovable: false, tradeValue: 'negative' },
  ];

  return {
    teamName: 'Philadelphia Phillies',
    currentPayroll,
    luxuryTaxThreshold: threshold,
    currentRoom: threshold - currentPayroll,
    currentFlexGrade: getFlexGrade(threshold - currentPayroll, threshold),
    yearProjections: years,
    biggestContracts: contracts,
    deadMoney: 8.5,
    preArbPlayers: 8,
    arbEligible: 5,
  };
}
