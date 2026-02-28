// Bullpen Usage Optimizer — optimize reliever deployment across a series

export interface RelieverAvailability {
  name: string;
  role: string;
  available: boolean;
  restDays: number;
  fatigueLevel: number;   // 0-100
  recentIP: number;       // last 3 days
  optimalUsage: string;   // recommended scenario
  maxPitches: number;
}

export interface SeriesGamePlan {
  game: number;
  opponent: string;
  startingPitcher: string;
  projectedLength: number;  // innings from starter
  relieversNeeded: number;
  plan: { reliever: string; inning: number; pitchLimit: number }[];
}

export interface BullpenUsageOptData {
  teamName: string;
  seriesOpponent: string;
  relievers: RelieverAvailability[];
  gamePlans: SeriesGamePlan[];
  bullpenHealthScore: number; // 0-100
}

export function getAvailabilityColor(available: boolean, fatigue: number): string {
  if (!available) return '#ef4444';
  if (fatigue >= 70) return '#f59e0b';
  return '#22c55e';
}

export function generateDemoBullpenUsageOpt(): BullpenUsageOptData {
  return {
    teamName: 'San Francisco Giants',
    seriesOpponent: 'Los Angeles Dodgers',
    bullpenHealthScore: 72,
    relievers: [
      { name: 'Colton Braithwaite', role: 'CL', available: true, restDays: 1, fatigueLevel: 30, recentIP: 1.0, optimalUsage: '9th inning save situations', maxPitches: 20 },
      { name: 'Derek Solis', role: 'SU', available: true, restDays: 0, fatigueLevel: 55, recentIP: 2.1, optimalUsage: '7th-8th high leverage', maxPitches: 25 },
      { name: 'Marcus Rivera', role: 'MR', available: false, restDays: 0, fatigueLevel: 82, recentIP: 3.2, optimalUsage: 'UNAVAILABLE — needs rest day', maxPitches: 0 },
      { name: 'Tyler Kim', role: 'LR', available: true, restDays: 2, fatigueLevel: 20, recentIP: 0.0, optimalUsage: 'Long relief / mop-up / LOOGY', maxPitches: 40 },
      { name: 'Derek Liu', role: 'MR', available: true, restDays: 1, fatigueLevel: 35, recentIP: 1.0, optimalUsage: '6th-7th vs RHB heavy lineups', maxPitches: 25 },
    ],
    gamePlans: [
      {
        game: 1, opponent: 'LAD', startingPitcher: 'Javier Castillo', projectedLength: 6.0, relieversNeeded: 2,
        plan: [
          { reliever: 'Derek Liu', inning: 7, pitchLimit: 20 },
          { reliever: 'Derek Solis', inning: 8, pitchLimit: 20 },
          { reliever: 'Colton Braithwaite', inning: 9, pitchLimit: 15 },
        ],
      },
      {
        game: 2, opponent: 'LAD', startingPitcher: 'Greg Thornton', projectedLength: 5.0, relieversNeeded: 3,
        plan: [
          { reliever: 'Tyler Kim', inning: 6, pitchLimit: 30 },
          { reliever: 'Derek Solis', inning: 8, pitchLimit: 20 },
          { reliever: 'Colton Braithwaite', inning: 9, pitchLimit: 15 },
        ],
      },
      {
        game: 3, opponent: 'LAD', startingPitcher: 'Jordan Park', projectedLength: 4.2, relieversNeeded: 4,
        plan: [
          { reliever: 'Tyler Kim', inning: 5, pitchLimit: 25 },
          { reliever: 'Marcus Rivera', inning: 7, pitchLimit: 20 },
          { reliever: 'Derek Liu', inning: 8, pitchLimit: 20 },
          { reliever: 'Colton Braithwaite', inning: 9, pitchLimit: 15 },
        ],
      },
    ],
  };
}
