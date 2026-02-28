// ── Player Value Tracker ─────────────────────────────────────────
// Tracks player value over time with WAR decomposition and projections

export interface WARComponent {
  component: string;
  value: number;
  percentOfTotal: number;
}

export interface ValueSnapshot {
  month: string;
  war: number;
  offWAR: number;
  defWAR: number;
  bsrWAR: number;
}

export interface PlayerValueProfile {
  playerName: string;
  position: string;
  currentWAR: number;
  projectedWAR: number;
  warPace: number;          // 162-game pace
  costPerWAR: number;       // salary / WAR
  leagueRank: number;
  components: WARComponent[];
  monthlySnapshots: ValueSnapshot[];
  peakAge: number;
  yearsUntilDecline: number;
  careerWAR: number;
}

export interface PlayerValueData {
  teamName: string;
  totalTeamWAR: number;
  avgCostPerWAR: number;
  players: PlayerValueProfile[];
}

export function getCostPerWARColor(cost: number): string {
  if (cost <= 5) return '#22c55e';
  if (cost <= 8) return '#3b82f6';
  if (cost <= 12) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoPlayerValue(): PlayerValueData {
  return {
    teamName: 'San Francisco Giants',
    totalTeamWAR: 28.5,
    avgCostPerWAR: 6.4,
    players: [
      {
        playerName: 'Alejandro Vega',
        position: 'SP',
        currentWAR: 4.8,
        projectedWAR: 6.5,
        warPace: 7.2,
        costPerWAR: 1.3,
        leagueRank: 8,
        components: [
          { component: 'Pitching Value', value: 4.2, percentOfTotal: 87.5 },
          { component: 'Fielding', value: 0.3, percentOfTotal: 6.3 },
          { component: 'Baserunning', value: -0.1, percentOfTotal: -2.1 },
          { component: 'Positional Adj', value: 0.4, percentOfTotal: 8.3 },
        ],
        monthlySnapshots: [
          { month: 'Apr', war: 1.2, offWAR: 0, defWAR: 0.1, bsrWAR: 0 },
          { month: 'May', war: 2.5, offWAR: 0, defWAR: 0.2, bsrWAR: 0 },
          { month: 'Jun', war: 3.8, offWAR: 0, defWAR: 0.2, bsrWAR: -0.1 },
          { month: 'Jul', war: 4.8, offWAR: 0, defWAR: 0.3, bsrWAR: -0.1 },
        ],
        peakAge: 28,
        yearsUntilDecline: 4,
        careerWAR: 18.5,
      },
      {
        playerName: 'Marcus Webb',
        position: 'CF',
        currentWAR: 4.2,
        projectedWAR: 5.8,
        warPace: 6.5,
        costPerWAR: 2.6,
        leagueRank: 15,
        components: [
          { component: 'Batting', value: 2.5, percentOfTotal: 59.5 },
          { component: 'Fielding', value: 1.0, percentOfTotal: 23.8 },
          { component: 'Baserunning', value: 0.5, percentOfTotal: 11.9 },
          { component: 'Positional Adj', value: 0.2, percentOfTotal: 4.8 },
        ],
        monthlySnapshots: [
          { month: 'Apr', war: 0.8, offWAR: 0.5, defWAR: 0.2, bsrWAR: 0.1 },
          { month: 'May', war: 1.8, offWAR: 1.2, defWAR: 0.4, bsrWAR: 0.2 },
          { month: 'Jun', war: 3.0, offWAR: 2.0, defWAR: 0.7, bsrWAR: 0.3 },
          { month: 'Jul', war: 4.2, offWAR: 2.5, defWAR: 1.0, bsrWAR: 0.5 },
        ],
        peakAge: 27,
        yearsUntilDecline: 3,
        careerWAR: 22.0,
      },
      {
        playerName: 'J.D. Morales',
        position: '3B',
        currentWAR: 3.5,
        projectedWAR: 4.5,
        warPace: 5.2,
        costPerWAR: 2.0,
        leagueRank: 22,
        components: [
          { component: 'Batting', value: 2.2, percentOfTotal: 62.9 },
          { component: 'Fielding', value: 0.8, percentOfTotal: 22.9 },
          { component: 'Baserunning', value: 0.1, percentOfTotal: 2.9 },
          { component: 'Positional Adj', value: 0.4, percentOfTotal: 11.4 },
        ],
        monthlySnapshots: [
          { month: 'Apr', war: 0.5, offWAR: 0.3, defWAR: 0.2, bsrWAR: 0 },
          { month: 'May', war: 1.5, offWAR: 1.0, defWAR: 0.4, bsrWAR: 0 },
          { month: 'Jun', war: 2.5, offWAR: 1.6, defWAR: 0.6, bsrWAR: 0.1 },
          { month: 'Jul', war: 3.5, offWAR: 2.2, defWAR: 0.8, bsrWAR: 0.1 },
        ],
        peakAge: 29,
        yearsUntilDecline: 2,
        careerWAR: 25.8,
      },
    ],
  };
}
