// Trade Deadline Simulator — simulate trade deadline scenarios and outcomes

export interface TradeScenario {
  scenarioName: string;
  description: string;
  playersAcquired: { name: string; position: string; team: string }[];
  prospectsCost: { name: string; rank: number }[];
  salaryImpact: number;       // millions
  winImpact: number;          // projected additional wins
  playoffOddsDelta: number;   // percentage point change
  risk: 'low' | 'medium' | 'high';
  recommendation: 'strong-buy' | 'buy' | 'hold' | 'pass';
}

export interface TradeDeadlineSimData {
  teamName: string;
  currentWins: number;
  currentLosses: number;
  playoffOdds: number;
  scenarios: TradeScenario[];
  bestScenario: string;
}

export function getRiskBadgeColor(risk: string): string {
  if (risk === 'low') return '#22c55e';
  if (risk === 'medium') return '#f59e0b';
  return '#ef4444';
}

export function getRecBadgeColor(rec: string): string {
  if (rec === 'strong-buy') return '#22c55e';
  if (rec === 'buy') return '#3b82f6';
  if (rec === 'hold') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoTradeDeadlineSim(): TradeDeadlineSimData {
  return {
    teamName: 'San Francisco Giants',
    currentWins: 52,
    currentLosses: 38,
    playoffOdds: 72,
    bestScenario: 'All-In Push',
    scenarios: [
      {
        scenarioName: 'All-In Push',
        description: 'Acquire frontline reliever and corner OF bat for October run',
        playersAcquired: [
          { name: 'Emmanuel Clase', position: 'RP', team: 'CLE' },
          { name: 'Tommy Edman', position: 'UTL', team: 'STL' },
        ],
        prospectsCost: [
          { name: 'Ryan Alvarez', rank: 8 },
          { name: 'Chris Bennett', rank: 14 },
          { name: 'Marcus Young', rank: 22 },
        ],
        salaryImpact: 8.5,
        winImpact: 4.2,
        playoffOddsDelta: 12,
        risk: 'high',
        recommendation: 'strong-buy',
      },
      {
        scenarioName: 'Targeted Add',
        description: 'Add one quality reliever without depleting the farm',
        playersAcquired: [
          { name: 'Andrew Chafin', position: 'LRP', team: 'DET' },
        ],
        prospectsCost: [
          { name: 'Marcus Young', rank: 22 },
        ],
        salaryImpact: 2.1,
        winImpact: 1.5,
        playoffOddsDelta: 5,
        risk: 'low',
        recommendation: 'buy',
      },
      {
        scenarioName: 'Stand Pat',
        description: 'Trust the current roster and keep prospects for future',
        playersAcquired: [],
        prospectsCost: [],
        salaryImpact: 0,
        winImpact: 0,
        playoffOddsDelta: 0,
        risk: 'low',
        recommendation: 'hold',
      },
    ],
  };
}
