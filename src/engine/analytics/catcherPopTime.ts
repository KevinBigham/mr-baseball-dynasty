// Catcher Pop Time Analysis — throw-down metrics, caught stealing rates, and arm grading

export interface CatcherArmProfile {
  name: string;
  team: string;
  avgPopTime: number;       // seconds (1B to 2B)
  bestPopTime: number;
  exchangeTime: number;     // glove to release
  throwVelo: number;        // mph to 2B
  csPct: number;            // caught stealing %
  sbAttempts: number;
  caughtStealing: number;
  armGrade: number;         // 20-80
  rank: number;
  throwAccuracy: number;    // 0-100
  gamesStarted: number;
}

export interface CatcherPopTimeData {
  leagueAvgPopTime: number;
  leagueAvgCSPct: number;
  catchers: CatcherArmProfile[];
}

export function getPopTimeColor(time: number): string {
  if (time <= 1.90) return '#22c55e';
  if (time <= 2.00) return '#3b82f6';
  if (time <= 2.10) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoCatcherPopTime(): CatcherPopTimeData {
  return {
    leagueAvgPopTime: 2.01,
    leagueAvgCSPct: 27.5,
    catchers: [
      { name: 'Adley Rutschman', team: 'BAL', avgPopTime: 1.88, bestPopTime: 1.82, exchangeTime: 0.68, throwVelo: 84.2, csPct: 38.5, sbAttempts: 78, caughtStealing: 30, armGrade: 70, rank: 1, throwAccuracy: 92, gamesStarted: 118 },
      { name: 'J.T. Realmuto', team: 'PHI', avgPopTime: 1.85, bestPopTime: 1.78, exchangeTime: 0.65, throwVelo: 85.8, csPct: 42.1, sbAttempts: 82, caughtStealing: 34, armGrade: 75, rank: 2, throwAccuracy: 88, gamesStarted: 108 },
      { name: 'Salvador Perez', team: 'KC', avgPopTime: 1.91, bestPopTime: 1.84, exchangeTime: 0.70, throwVelo: 83.5, csPct: 35.2, sbAttempts: 71, caughtStealing: 25, armGrade: 65, rank: 3, throwAccuracy: 85, gamesStarted: 125 },
      { name: 'Sean Murphy', team: 'ATL', avgPopTime: 1.92, bestPopTime: 1.86, exchangeTime: 0.71, throwVelo: 82.8, csPct: 33.8, sbAttempts: 68, caughtStealing: 23, armGrade: 60, rank: 4, throwAccuracy: 86, gamesStarted: 112 },
      { name: 'Will Smith', team: 'LAD', avgPopTime: 1.95, bestPopTime: 1.88, exchangeTime: 0.72, throwVelo: 82.0, csPct: 31.2, sbAttempts: 64, caughtStealing: 20, armGrade: 55, rank: 5, throwAccuracy: 84, gamesStarted: 120 },
      { name: 'William Contreras', team: 'MIL', avgPopTime: 1.98, bestPopTime: 1.91, exchangeTime: 0.74, throwVelo: 81.5, csPct: 28.8, sbAttempts: 66, caughtStealing: 19, armGrade: 55, rank: 6, throwAccuracy: 80, gamesStarted: 115 },
      { name: 'Tyler Stephenson', team: 'CIN', avgPopTime: 2.02, bestPopTime: 1.94, exchangeTime: 0.76, throwVelo: 80.2, csPct: 25.4, sbAttempts: 59, caughtStealing: 15, armGrade: 50, rank: 7, throwAccuracy: 78, gamesStarted: 98 },
      { name: 'Jonah Heim', team: 'TEX', avgPopTime: 2.05, bestPopTime: 1.96, exchangeTime: 0.78, throwVelo: 79.8, csPct: 24.0, sbAttempts: 62, caughtStealing: 15, armGrade: 45, rank: 8, throwAccuracy: 76, gamesStarted: 105 },
    ],
  };
}
