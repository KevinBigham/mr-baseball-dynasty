// Payroll Distribution Analyzer — breakdown by position group and performance tier

export interface PositionGroupPayroll {
  group: string;           // e.g. 'Starting Pitching', 'Outfield', 'Infield'
  totalSalary: number;     // millions
  pctOfPayroll: number;
  playerCount: number;
  warProduced: number;
  costPerWAR: number;
  players: Array<{
    name: string;
    salary: number;
    war: number;
    tier: 'ace' | 'core' | 'role' | 'depth' | 'dead money';
  }>;
}

export interface PayrollDistributionData {
  teamName: string;
  totalPayroll: number;
  luxuryTaxPayroll: number;
  threshold: number;
  positionGroups: PositionGroupPayroll[];
  tierBreakdown: Array<{
    tier: string;
    totalSalary: number;
    pctOfPayroll: number;
    playerCount: number;
    warProduced: number;
  }>;
  leagueRank: number;
  leagueAvgPayroll: number;
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'ace': return '#f59e0b';
    case 'core': return '#22c55e';
    case 'role': return '#3b82f6';
    case 'depth': return '#9ca3af';
    case 'dead money': return '#ef4444';
    default: return '#6b7280';
  }
}

export function generateDemoPayrollDistribution(): PayrollDistributionData {
  return {
    teamName: 'Baltimore Orioles',
    totalPayroll: 185.4,
    luxuryTaxPayroll: 192.1,
    threshold: 237,
    leagueRank: 12,
    leagueAvgPayroll: 178.5,
    positionGroups: [
      {
        group: 'Starting Pitching', totalSalary: 62.5, pctOfPayroll: 33.7, playerCount: 5, warProduced: 14.2, costPerWAR: 4.4,
        players: [
          { name: 'Corbin Burnes', salary: 25.0, war: 5.8, tier: 'ace' },
          { name: 'Grayson Rodriguez', salary: 3.2, war: 3.5, tier: 'core' },
          { name: 'Dean Kremer', salary: 5.8, war: 2.1, tier: 'role' },
          { name: 'Cole Irvin', salary: 7.5, war: 1.4, tier: 'role' },
          { name: 'Kyle Gibson', salary: 21.0, war: 1.4, tier: 'role' },
        ],
      },
      {
        group: 'Bullpen', totalSalary: 28.2, pctOfPayroll: 15.2, playerCount: 7, warProduced: 5.8, costPerWAR: 4.9,
        players: [
          { name: 'Félix Bautista', salary: 4.5, war: 2.0, tier: 'core' },
          { name: 'Yennier Cano', salary: 2.8, war: 1.5, tier: 'core' },
          { name: 'Danny Coulombe', salary: 5.0, war: 0.8, tier: 'role' },
          { name: 'Cionel Pérez', salary: 4.2, war: 0.6, tier: 'role' },
          { name: 'Jacob Webb', salary: 1.2, war: 0.4, tier: 'depth' },
          { name: 'Mike Baumann', salary: 0.8, war: 0.3, tier: 'depth' },
          { name: 'Craig Kimbrel', salary: 9.7, war: 0.2, tier: 'dead money' },
        ],
      },
      {
        group: 'Infield', totalSalary: 48.5, pctOfPayroll: 26.2, playerCount: 5, warProduced: 16.2, costPerWAR: 3.0,
        players: [
          { name: 'Gunnar Henderson', salary: 5.5, war: 7.2, tier: 'ace' },
          { name: 'Ryan Mountcastle', salary: 8.2, war: 2.8, tier: 'core' },
          { name: 'Jorge Mateo', salary: 3.8, war: 2.5, tier: 'core' },
          { name: 'Adley Rutschman', salary: 7.0, war: 3.2, tier: 'ace' },
          { name: 'Jordan Westburg', salary: 24.0, war: 0.5, tier: 'role' },
        ],
      },
      {
        group: 'Outfield', totalSalary: 38.2, pctOfPayroll: 20.6, playerCount: 4, warProduced: 8.5, costPerWAR: 4.5,
        players: [
          { name: 'Anthony Santander', salary: 20.0, war: 3.5, tier: 'core' },
          { name: 'Cedric Mullins', salary: 12.5, war: 3.2, tier: 'core' },
          { name: 'Colton Cowser', salary: 1.2, war: 1.2, tier: 'role' },
          { name: 'Austin Hays', salary: 4.5, war: 0.6, tier: 'depth' },
        ],
      },
      {
        group: 'DH / Bench', totalSalary: 8.0, pctOfPayroll: 4.3, playerCount: 3, warProduced: 1.2, costPerWAR: 6.7,
        players: [
          { name: 'Ryan O\'Hearn', salary: 3.5, war: 0.6, tier: 'depth' },
          { name: 'Ramón Urías', salary: 2.5, war: 0.4, tier: 'depth' },
          { name: 'James McCann', salary: 2.0, war: 0.2, tier: 'depth' },
        ],
      },
    ],
    tierBreakdown: [
      { tier: 'Ace/Star', totalSalary: 57.5, pctOfPayroll: 31.0, playerCount: 3, warProduced: 16.2 },
      { tier: 'Core', totalSalary: 56.2, pctOfPayroll: 30.3, playerCount: 6, warProduced: 14.0 },
      { tier: 'Role', totalSalary: 47.7, pctOfPayroll: 25.7, playerCount: 7, warProduced: 7.1 },
      { tier: 'Depth', totalSalary: 14.2, pctOfPayroll: 7.7, playerCount: 6, warProduced: 2.1 },
      { tier: 'Dead Money', totalSalary: 9.7, pctOfPayroll: 5.2, playerCount: 1, warProduced: 0.2 },
    ],
  };
}
