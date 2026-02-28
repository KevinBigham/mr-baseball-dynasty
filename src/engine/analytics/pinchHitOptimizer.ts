// ── Pinch Hit Optimizer ──────────────────────────────────────────
// Advanced PH decision engine with matchup and leverage analysis

export interface PHCandidate {
  playerName: string;
  bats: 'L' | 'R' | 'S';
  seasonBA: number;
  seasonOPS: number;
  vsCurrentPitcher: { pa: number; avg: number };
  platoonAdvantage: boolean;
  clutchRating: number;      // 0-100
  recentForm: string;        // "Hot" | "Cold" | "Normal"
  matchupScore: number;      // 0-100
  recommendation: string;
}

export interface PHScenario {
  inning: number;
  outs: number;
  runners: string;
  score: string;
  leverage: number;
  currentBatter: string;
  currentBatterOPS: number;
  opposingPitcher: string;
  pitcherThrows: 'L' | 'R';
  candidates: PHCandidate[];
  bestChoice: string;
  expectedRunIncrease: number;
  winProbIncrease: number;
}

export interface PHOptimizerData {
  teamName: string;
  scenarios: PHScenario[];
  phStats: { stat: string; value: string }[];
}

export function getFormColor(form: string): string {
  if (form === 'Hot') return '#22c55e';
  if (form === 'Cold') return '#ef4444';
  return '#9ca3af';
}

export function generateDemoPHOptimizer(): PHOptimizerData {
  return {
    teamName: 'San Francisco Giants',
    phStats: [
      { stat: 'PH Batting Avg', value: '.248' },
      { stat: 'PH OPS', value: '.702' },
      { stat: 'PH HR', value: '5' },
      { stat: 'PH RBI', value: '18' },
      { stat: 'PH Success Rate', value: '32%' },
    ],
    scenarios: [
      {
        inning: 7,
        outs: 1,
        runners: '1st & 2nd',
        score: 'Tied 3-3',
        leverage: 82,
        currentBatter: 'Chris Nakamura',
        currentBatterOPS: 0.620,
        opposingPitcher: 'Blake Snell',
        pitcherThrows: 'L',
        bestChoice: 'Carlos Delgado Jr.',
        expectedRunIncrease: 0.35,
        winProbIncrease: 4.2,
        candidates: [
          { playerName: 'Carlos Delgado Jr.', bats: 'R', seasonBA: 0.278, seasonOPS: 0.842, vsCurrentPitcher: { pa: 12, avg: 0.333 }, platoonAdvantage: true, clutchRating: 85, recentForm: 'Hot', matchupScore: 92, recommendation: 'TOP CHOICE — R vs L, strong history, hot streak' },
          { playerName: 'Tony Reyes', bats: 'R', seasonBA: 0.262, seasonOPS: 0.780, vsCurrentPitcher: { pa: 8, avg: 0.250 }, platoonAdvantage: true, clutchRating: 72, recentForm: 'Normal', matchupScore: 75, recommendation: 'Solid backup option — R vs L advantage' },
          { playerName: 'Derek Palmer', bats: 'L', seasonBA: 0.255, seasonOPS: 0.725, vsCurrentPitcher: { pa: 15, avg: 0.200 }, platoonAdvantage: false, clutchRating: 65, recentForm: 'Cold', matchupScore: 35, recommendation: 'AVOID — L vs L, cold streak, poor history' },
        ],
      },
      {
        inning: 9,
        outs: 2,
        runners: '2nd',
        score: 'Down 4-3',
        leverage: 95,
        currentBatter: 'Sam Trevino',
        currentBatterOPS: 0.580,
        opposingPitcher: 'Evan Phillips',
        pitcherThrows: 'R',
        bestChoice: 'Marcus Webb',
        expectedRunIncrease: 0.28,
        winProbIncrease: 6.8,
        candidates: [
          { playerName: 'Marcus Webb', bats: 'L', seasonBA: 0.302, seasonOPS: 0.860, vsCurrentPitcher: { pa: 5, avg: 0.400 }, platoonAdvantage: true, clutchRating: 90, recentForm: 'Hot', matchupScore: 95, recommendation: 'PREMIUM PH — Best hitter, elite clutch, favorable matchup' },
          { playerName: 'J.D. Morales', bats: 'R', seasonBA: 0.290, seasonOPS: 0.810, vsCurrentPitcher: { pa: 3, avg: 0.333 }, platoonAdvantage: false, clutchRating: 78, recentForm: 'Normal', matchupScore: 72, recommendation: 'Strong option if Webb unavailable' },
        ],
      },
    ],
  };
}
