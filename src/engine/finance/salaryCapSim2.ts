// Salary Cap Simulator v2 — model future payroll scenarios with prospect promotions and FA signings

export interface CapScenarioPlayer {
  name: string;
  position: string;
  salary: number;
  yearsRemaining: number;
  type: 'guaranteed' | 'arb' | 'pre-arb' | 'fa-target';
}

export interface CapScenario {
  name: string;
  description: string;
  totalPayroll: number;
  luxuryTaxPayroll: number;
  overThreshold: boolean;
  taxPenalty: number;
  players: CapScenarioPlayer[];
  projectedWins: number;
}

export interface SalaryCapSimData {
  threshold: number;
  currentPayroll: number;
  scenarios: CapScenario[];
  yearProjections: Array<{ year: number; payroll: number; threshold: number; buffer: number }>;
}

export function getCapColor(payroll: number, threshold: number): string {
  const pct = payroll / threshold;
  if (pct < 0.85) return '#22c55e';
  if (pct < 0.95) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoSalaryCapSim2(): SalaryCapSimData {
  const base: CapScenarioPlayer[] = [
    { name: 'Carlos Delgado Jr.', position: 'DH', salary: 32.0, yearsRemaining: 4, type: 'guaranteed' },
    { name: 'Jaylen Torres', position: 'SS', salary: 24.5, yearsRemaining: 3, type: 'guaranteed' },
    { name: 'Greg Thornton', position: 'SP', salary: 18.0, yearsRemaining: 1, type: 'guaranteed' },
    { name: 'Victor Robles III', position: 'RF', salary: 15.0, yearsRemaining: 2, type: 'guaranteed' },
    { name: 'Derek Hartley', position: 'SS', salary: 14.5, yearsRemaining: 1, type: 'guaranteed' },
    { name: 'Brandon Oakes', position: 'CF', salary: 11.2, yearsRemaining: 2, type: 'guaranteed' },
    { name: 'Dimitri Kazakov', position: '1B', salary: 8.5, yearsRemaining: 1, type: 'arb' },
    { name: 'Travis Keller', position: 'C', salary: 8.0, yearsRemaining: 1, type: 'guaranteed' },
    { name: 'Hector Macias', position: 'RP', salary: 6.5, yearsRemaining: 1, type: 'guaranteed' },
    { name: 'Others (bench+pen)', position: 'UTIL', salary: 28.8, yearsRemaining: 1, type: 'guaranteed' },
  ];

  const scenarioA: CapScenario = {
    name: 'Status Quo',
    description: 'Keep current roster, replace expiring contracts with min salary',
    totalPayroll: 167.0,
    luxuryTaxPayroll: 172.5,
    overThreshold: false,
    taxPenalty: 0,
    players: base,
    projectedWins: 84,
  };

  const scenarioB: CapScenario = {
    name: 'Promote Prospects',
    description: 'Graduate Delgado, Castillo, Braithwaite; trade Hartley & Thornton',
    totalPayroll: 138.2,
    luxuryTaxPayroll: 144.8,
    overThreshold: false,
    taxPenalty: 0,
    players: [
      ...base.filter(p => !['Derek Hartley', 'Greg Thornton', 'Hector Macias'].includes(p.name)),
      { name: 'Marcus Delgado', position: 'SS', salary: 0.74, yearsRemaining: 6, type: 'pre-arb' },
      { name: 'Javier Castillo', position: 'SP', salary: 0.74, yearsRemaining: 6, type: 'pre-arb' },
      { name: 'Colton Braithwaite', position: 'RP', salary: 0.74, yearsRemaining: 6, type: 'pre-arb' },
    ],
    projectedWins: 88,
  };

  const scenarioC: CapScenario = {
    name: 'All-In Push',
    description: 'Keep vets + sign top FA SP + promote Delgado',
    totalPayroll: 205.4,
    luxuryTaxPayroll: 212.0,
    overThreshold: true,
    taxPenalty: 14.8,
    players: [
      ...base.filter(p => p.name !== 'Derek Hartley'),
      { name: 'Marcus Delgado', position: 'SS', salary: 0.74, yearsRemaining: 6, type: 'pre-arb' },
      { name: 'FA Ace (target)', position: 'SP', salary: 35.0, yearsRemaining: 5, type: 'fa-target' },
    ],
    projectedWins: 95,
  };

  return {
    threshold: 197.0,
    currentPayroll: 167.0,
    scenarios: [scenarioA, scenarioB, scenarioC],
    yearProjections: [
      { year: 2026, payroll: 167.0, threshold: 197.0, buffer: 30.0 },
      { year: 2027, payroll: 148.5, threshold: 202.0, buffer: 53.5 },
      { year: 2028, payroll: 132.0, threshold: 207.0, buffer: 75.0 },
      { year: 2029, payroll: 118.8, threshold: 212.0, buffer: 93.2 },
    ],
  };
}
