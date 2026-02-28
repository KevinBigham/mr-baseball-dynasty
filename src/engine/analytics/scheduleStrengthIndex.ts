// Schedule Strength Index — remaining schedule difficulty and win projection impact

export interface ScheduleSegment {
  period: string;
  games: number;
  avgOppWinPct: number;
  homeGames: number;
  awayGames: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'brutal';
  projWins: number;
  projLosses: number;
  keyOpponents: string[];
}

export interface ScheduleStrengthData {
  teamName: string;
  overallSOS: number;         // strength of schedule 0-100 (50 = avg)
  sosRank: number;
  remainingGames: number;
  projRemainingWins: number;
  projRemainingLosses: number;
  segments: ScheduleSegment[];
  easiestStretch: string;
  hardestStretch: string;
}

export function getDifficultyColor(d: string): string {
  if (d === 'easy') return '#22c55e';
  if (d === 'medium') return '#3b82f6';
  if (d === 'hard') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoScheduleStrength(): ScheduleStrengthData {
  return {
    teamName: 'San Francisco Giants',
    overallSOS: 44,
    sosRank: 6,
    remainingGames: 65,
    projRemainingWins: 35,
    projRemainingLosses: 30,
    segments: [
      { period: 'Jul 1-15', games: 14, avgOppWinPct: .485, homeGames: 8, awayGames: 6, difficulty: 'easy', projWins: 9, projLosses: 5, keyOpponents: ['COL', 'MIA', 'OAK'] },
      { period: 'Jul 16-31', games: 15, avgOppWinPct: .535, homeGames: 6, awayGames: 9, difficulty: 'hard', projWins: 7, projLosses: 8, keyOpponents: ['LAD', 'ATL', 'PHI'] },
      { period: 'Aug 1-15', games: 14, avgOppWinPct: .510, homeGames: 8, awayGames: 6, difficulty: 'medium', projWins: 8, projLosses: 6, keyOpponents: ['SD', 'CLE', 'ARI'] },
      { period: 'Aug 16-31', games: 12, avgOppWinPct: .475, homeGames: 7, awayGames: 5, difficulty: 'easy', projWins: 7, projLosses: 5, keyOpponents: ['COL', 'WSH', 'CIN'] },
      { period: 'Sep 1-28', games: 10, avgOppWinPct: .540, homeGames: 5, awayGames: 5, difficulty: 'hard', projWins: 4, projLosses: 6, keyOpponents: ['LAD', 'SD', 'LAD'] },
    ],
    easiestStretch: 'Jul 1-15: 8 home games vs sub-.500 teams',
    hardestStretch: 'Sep 1-28: Close with 6 games vs LAD',
  };
}
