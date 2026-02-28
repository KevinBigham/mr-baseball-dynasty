// Streak Predictor — predict likelihood of hot/cold streaks continuing

export interface StreakPlayer {
  name: string;
  position: string;
  currentStreak: 'hot' | 'cold' | 'neutral';
  streakLength: number;        // games
  recentAVG: number;           // last 15 games
  seasonAVG: number;
  xBA: number;                 // expected batting avg based on quality of contact
  regressionProb: number;      // probability of regression to mean (0-100)
  sustainProb: number;         // probability streak continues (0-100)
  keyFactor: string;           // what's driving the streak
}

export interface StreakPredictorData {
  teamName: string;
  players: StreakPlayer[];
  hotStreakers: number;
  coldStreakers: number;
}

export function getStreakColor(streak: string): string {
  if (streak === 'hot') return '#ef4444';
  if (streak === 'cold') return '#3b82f6';
  return '#6b7280';
}

export function generateDemoStreakPredictor(): StreakPredictorData {
  return {
    teamName: 'San Francisco Giants',
    hotStreakers: 3,
    coldStreakers: 2,
    players: [
      { name: 'Carlos Delgado Jr.', position: 'DH', currentStreak: 'hot', streakLength: 12, recentAVG: .385, seasonAVG: .288, xBA: .322, regressionProb: 68, sustainProb: 32, keyFactor: 'BABIP .420 — running unsustainably high' },
      { name: 'Jaylen Torres', position: 'SS', currentStreak: 'hot', streakLength: 8, recentAVG: .345, seasonAVG: .272, xBA: .310, regressionProb: 45, sustainProb: 55, keyFactor: 'Hard hit rate up 12% — real improvement in contact quality' },
      { name: 'Marcus Webb', position: 'CF', currentStreak: 'cold', streakLength: 10, recentAVG: .185, seasonAVG: .268, xBA: .258, regressionProb: 72, sustainProb: 28, keyFactor: 'Chasing breaking balls out of zone at 38% rate' },
      { name: 'Victor Robles III', position: 'RF', currentStreak: 'hot', streakLength: 6, recentAVG: .330, seasonAVG: .265, xBA: .295, regressionProb: 55, sustainProb: 45, keyFactor: 'Launch angle adjustment — more line drives' },
      { name: 'Tomas Herrera', position: '3B', currentStreak: 'cold', streakLength: 9, recentAVG: .198, seasonAVG: .258, xBA: .250, regressionProb: 80, sustainProb: 20, keyFactor: 'Nagging wrist soreness affecting bat speed' },
      { name: 'Ricky Sandoval', position: '2B', currentStreak: 'neutral', streakLength: 0, recentAVG: .275, seasonAVG: .272, xBA: .270, regressionProb: 10, sustainProb: 90, keyFactor: 'Performing in line with expected metrics' },
    ],
  };
}
