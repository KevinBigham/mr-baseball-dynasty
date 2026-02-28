/**
 * Salary Arbitration Projections
 *
 * Projects arbitration salary figures for eligible players
 * based on performance, service time, comparable players,
 * and historical filing trends.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ArbYear = 'arb1' | 'arb2' | 'arb3' | 'super2';
export type FilingOutcome = 'player_wins' | 'team_wins' | 'settled' | 'pending';

export const FILING_DISPLAY: Record<FilingOutcome, { label: string; color: string }> = {
  player_wins: { label: 'Player Wins',  color: '#ef4444' },
  team_wins:   { label: 'Team Wins',    color: '#22c55e' },
  settled:     { label: 'Settled',       color: '#3b82f6' },
  pending:     { label: 'Pending',       color: '#eab308' },
};

export interface ArbComparable {
  name: string;
  year: number;
  salary: number;
  war: number;
}

export interface ArbPlayer {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  arbYear: ArbYear;
  serviceTime: string;        // "3.125" years
  currentSalary: number;      // $M
  projectedSalary: number;    // $M
  teamFiling: number;         // $M team would file
  playerFiling: number;       // $M player would file
  midpoint: number;           // $M likely settlement
  recentWAR: number;
  keyStats: Record<string, string>;
  comparables: ArbComparable[];
  likelyOutcome: FilingOutcome;
  notes: string;
}

export interface ArbSummary {
  totalEligible: number;
  projectedTotal: number;     // total $M for all arb players
  avgRaise: number;           // % raise over current salary
  pendingCount: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getArbSummary(players: ArbPlayer[]): ArbSummary {
  const n = players.length;
  const totalProj = players.reduce((s, p) => s + p.projectedSalary, 0);
  const totalCurrent = players.reduce((s, p) => s + p.currentSalary, 0);
  return {
    totalEligible: n,
    projectedTotal: Math.round(totalProj * 10) / 10,
    avgRaise: totalCurrent > 0 ? Math.round(((totalProj - totalCurrent) / totalCurrent) * 100) : 0,
    pendingCount: players.filter(p => p.likelyOutcome === 'pending').length,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoArbProjections(): ArbPlayer[] {
  return [
    {
      id: 0, name: 'Tanner Houck', pos: 'SP', age: 27, overall: 78, arbYear: 'arb1', serviceTime: '3.085',
      currentSalary: 0.75, projectedSalary: 5.8, teamFiling: 5.2, playerFiling: 6.5, midpoint: 5.8,
      recentWAR: 3.2, keyStats: { ERA: '3.20', IP: '170', K: '155', WHIP: '1.12' },
      comparables: [
        { name: 'Logan Gilbert', year: 2024, salary: 5.2, war: 3.0 },
        { name: 'Joe Musgrove', year: 2021, salary: 4.8, war: 2.8 },
      ],
      likelyOutcome: 'settled', notes: 'Breakout season justifies significant raise. Both sides likely settle near $5.8M.',
    },
    {
      id: 1, name: 'Bryan Reynolds', pos: 'CF', age: 29, overall: 82, arbYear: 'arb3', serviceTime: '5.120',
      currentSalary: 8.5, projectedSalary: 12.0, teamFiling: 10.5, playerFiling: 13.5, midpoint: 12.0,
      recentWAR: 4.0, keyStats: { AVG: '.280', OBP: '.360', SLG: '.480', HR: '22' },
      comparables: [
        { name: 'Kyle Tucker', year: 2024, salary: 12.0, war: 4.5 },
        { name: 'Teoscar Hernandez', year: 2023, salary: 10.5, war: 3.5 },
      ],
      likelyOutcome: 'pending', notes: 'Final arb year. Strong case for $12M+. May pursue extension instead.',
    },
    {
      id: 2, name: 'Andres Gimenez', pos: '2B', age: 25, overall: 80, arbYear: 'arb1', serviceTime: '3.050',
      currentSalary: 0.72, projectedSalary: 7.5, teamFiling: 6.8, playerFiling: 8.2, midpoint: 7.5,
      recentWAR: 5.0, keyStats: { AVG: '.290', OBP: '.340', SLG: '.470', WAR: '5.0' },
      comparables: [
        { name: 'Ozzie Albies', year: 2020, salary: 7.0, war: 4.5 },
        { name: 'Marcus Semien', year: 2019, salary: 5.9, war: 3.8 },
      ],
      likelyOutcome: 'settled', notes: 'Premium production at premium position. Big raise warranted. Extension candidate.',
    },
    {
      id: 3, name: 'Shane Bieber', pos: 'SP', age: 29, overall: 76, arbYear: 'arb3', serviceTime: '5.180',
      currentSalary: 10.2, projectedSalary: 8.5, teamFiling: 7.0, playerFiling: 10.0, midpoint: 8.5,
      recentWAR: 1.5, keyStats: { ERA: '4.10', IP: '120', K: '110', WHIP: '1.25' },
      comparables: [
        { name: 'Nathan Eovaldi', year: 2021, salary: 9.0, war: 1.8 },
      ],
      likelyOutcome: 'pending', notes: 'Down year after injuries. May actually see a salary decrease. Could go to hearing.',
    },
    {
      id: 4, name: 'Nico Hoerner', pos: 'SS', age: 27, overall: 75, arbYear: 'arb2', serviceTime: '4.075',
      currentSalary: 3.4, projectedSalary: 6.2, teamFiling: 5.5, playerFiling: 7.0, midpoint: 6.2,
      recentWAR: 2.5, keyStats: { AVG: '.275', OBP: '.330', SLG: '.380', DRS: '+8' },
      comparables: [
        { name: 'Nick Ahmed', year: 2020, salary: 5.8, war: 2.2 },
        { name: 'Isiah Kiner-Falefa', year: 2022, salary: 4.7, war: 2.0 },
      ],
      likelyOutcome: 'settled', notes: 'Solid everyday SS. Defense boosts value. Fair raise to ~$6M range.',
    },
  ];
}
