// ── Run Scoring Projector ────────────────────────────────────────
// Projects expected runs per game based on lineup construction & matchups

export interface InningProjection {
  inning: number;
  expectedRuns: number;
  highScenario: number;
  lowScenario: number;
  keyBatter: string;
  leverage: number;    // 0-100
}

export interface ProjectedLineup {
  slot: number;
  playerName: string;
  avgRunContribution: number;
  onBaseContribution: number;
  rbiExpected: number;
}

export interface RunScoringData {
  teamName: string;
  opponent: string;
  projectedRuns: number;
  winProbFromOffense: number;
  inningProjections: InningProjection[];
  lineupContributions: ProjectedLineup[];
  overUnder: number;
  overProbability: number;
}

export function getRunColor(runs: number): string {
  if (runs >= 5) return '#22c55e';
  if (runs >= 3) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoRunScoring(): RunScoringData {
  return {
    teamName: 'San Francisco Giants',
    opponent: 'Los Angeles Dodgers',
    projectedRuns: 4.2,
    winProbFromOffense: 54.3,
    overUnder: 8.5,
    overProbability: 47.8,
    inningProjections: [
      { inning: 1, expectedRuns: 0.55, highScenario: 2, lowScenario: 0, keyBatter: 'Carlos Delgado Jr.', leverage: 45 },
      { inning: 2, expectedRuns: 0.42, highScenario: 2, lowScenario: 0, keyBatter: 'Gavin Lux', leverage: 35 },
      { inning: 3, expectedRuns: 0.48, highScenario: 3, lowScenario: 0, keyBatter: 'Marcus Webb', leverage: 40 },
      { inning: 4, expectedRuns: 0.50, highScenario: 2, lowScenario: 0, keyBatter: 'Terrence Baylor', leverage: 50 },
      { inning: 5, expectedRuns: 0.52, highScenario: 3, lowScenario: 0, keyBatter: 'Carlos Delgado Jr.', leverage: 55 },
      { inning: 6, expectedRuns: 0.45, highScenario: 2, lowScenario: 0, keyBatter: 'J.D. Morales', leverage: 48 },
      { inning: 7, expectedRuns: 0.48, highScenario: 3, lowScenario: 0, keyBatter: 'Marcus Webb', leverage: 60 },
      { inning: 8, expectedRuns: 0.42, highScenario: 2, lowScenario: 0, keyBatter: 'Terrence Baylor', leverage: 65 },
      { inning: 9, expectedRuns: 0.38, highScenario: 2, lowScenario: 0, keyBatter: 'Carlos Delgado Jr.', leverage: 75 },
    ],
    lineupContributions: [
      { slot: 1, playerName: 'Marcus Webb', avgRunContribution: 0.52, onBaseContribution: 0.380, rbiExpected: 0.35 },
      { slot: 2, playerName: 'J.D. Morales', avgRunContribution: 0.48, onBaseContribution: 0.365, rbiExpected: 0.42 },
      { slot: 3, playerName: 'Carlos Delgado Jr.', avgRunContribution: 0.65, onBaseContribution: 0.358, rbiExpected: 0.68 },
      { slot: 4, playerName: 'Terrence Baylor', avgRunContribution: 0.60, onBaseContribution: 0.340, rbiExpected: 0.72 },
      { slot: 5, playerName: 'Tony Reyes', avgRunContribution: 0.42, onBaseContribution: 0.328, rbiExpected: 0.50 },
      { slot: 6, playerName: 'Derek Palmer', avgRunContribution: 0.38, onBaseContribution: 0.310, rbiExpected: 0.38 },
      { slot: 7, playerName: 'Sam Trevino', avgRunContribution: 0.30, onBaseContribution: 0.295, rbiExpected: 0.30 },
      { slot: 8, playerName: 'Chris Nakamura', avgRunContribution: 0.25, onBaseContribution: 0.280, rbiExpected: 0.22 },
      { slot: 9, playerName: 'Gavin Lux', avgRunContribution: 0.22, onBaseContribution: 0.268, rbiExpected: 0.18 },
    ],
  };
}
