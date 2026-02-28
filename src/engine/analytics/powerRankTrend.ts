// Power Rankings Trend — track team power ranking changes throughout a season

export interface WeeklyRanking {
  week: number;
  rank: number;
  record: string;
  change: number;        // +/- from previous week
  weeklyRecord: string;  // that week's record e.g. "5-2"
  keyEvent: string;
}

export interface PowerRankTrendData {
  teamName: string;
  currentRank: number;
  bestRank: number;
  worstRank: number;
  avgRank: number;
  weeklyRankings: WeeklyRanking[];
  leagueTeams: Array<{
    teamName: string;
    currentRank: number;
    weekAgoRank: number;
    change: number;
    record: string;
    streak: string;
  }>;
}

export function getRankColor(rank: number): string {
  if (rank <= 5) return '#22c55e';
  if (rank <= 10) return '#3b82f6';
  if (rank <= 20) return '#f59e0b';
  return '#ef4444';
}

export function getChangeColor(change: number): string {
  if (change > 0) return '#ef4444';  // rank went up = worse
  if (change < 0) return '#22c55e';  // rank went down = better
  return '#6b7280';
}

export function generateDemoPowerRankTrend(): PowerRankTrendData {
  const weeklyRankings: WeeklyRanking[] = [
    { week: 1, rank: 12, record: '4-3', change: 0, weeklyRecord: '4-3', keyEvent: 'Season opener' },
    { week: 2, rank: 9, record: '9-5', change: -3, weeklyRecord: '5-2', keyEvent: 'Swept Cubs in 3' },
    { week: 3, rank: 7, record: '14-7', change: -2, weeklyRecord: '5-2', keyEvent: 'Henderson 3-HR game' },
    { week: 4, rank: 5, record: '19-9', change: -2, weeklyRecord: '5-2', keyEvent: 'Burnes 8IP shutout' },
    { week: 5, rank: 4, record: '23-12', change: -1, weeklyRecord: '4-3', keyEvent: '7-game win streak starts' },
    { week: 6, rank: 2, record: '29-13', change: -2, weeklyRecord: '6-1', keyEvent: 'Best record in AL' },
    { week: 7, rank: 3, record: '33-17', change: 1, weeklyRecord: '4-4', keyEvent: 'Lost series to NYY' },
    { week: 8, rank: 2, record: '38-19', change: -1, weeklyRecord: '5-2', keyEvent: 'Rodríguez no-hitter' },
    { week: 9, rank: 2, record: '42-22', change: 0, weeklyRecord: '4-3', keyEvent: 'Steady' },
    { week: 10, rank: 1, record: '48-24', change: -1, weeklyRecord: '6-2', keyEvent: 'Swept into first place' },
    { week: 11, rank: 3, record: '51-29', change: 2, weeklyRecord: '3-5', keyEvent: 'Santander DL stint' },
    { week: 12, rank: 3, record: '55-32', change: 0, weeklyRecord: '4-3', keyEvent: 'Holding steady' },
  ];

  const leagueTeams = [
    { teamName: 'New York Yankees', currentRank: 1, weekAgoRank: 2, change: -1, record: '57-30', streak: 'W4' },
    { teamName: 'Los Angeles Dodgers', currentRank: 2, weekAgoRank: 1, change: 1, record: '56-31', streak: 'L1' },
    { teamName: 'Baltimore Orioles', currentRank: 3, weekAgoRank: 3, change: 0, record: '55-32', streak: 'W2' },
    { teamName: 'Atlanta Braves', currentRank: 4, weekAgoRank: 5, change: -1, record: '53-34', streak: 'W5' },
    { teamName: 'Philadelphia Phillies', currentRank: 5, weekAgoRank: 4, change: 1, record: '52-35', streak: 'L2' },
    { teamName: 'Houston Astros', currentRank: 6, weekAgoRank: 7, change: -1, record: '50-37', streak: 'W3' },
    { teamName: 'Tampa Bay Rays', currentRank: 7, weekAgoRank: 6, change: 1, record: '49-38', streak: 'L1' },
    { teamName: 'Milwaukee Brewers', currentRank: 8, weekAgoRank: 9, change: -1, record: '48-39', streak: 'W1' },
    { teamName: 'Minnesota Twins', currentRank: 9, weekAgoRank: 8, change: 1, record: '47-40', streak: 'L3' },
    { teamName: 'Texas Rangers', currentRank: 10, weekAgoRank: 11, change: -1, record: '46-41', streak: 'W2' },
    { teamName: 'San Diego Padres', currentRank: 11, weekAgoRank: 10, change: 1, record: '45-42', streak: 'L1' },
    { teamName: 'Seattle Mariners', currentRank: 12, weekAgoRank: 13, change: -1, record: '44-43', streak: 'W1' },
  ];

  return {
    teamName: 'Baltimore Orioles',
    currentRank: 3,
    bestRank: 1,
    worstRank: 12,
    avgRank: 4.4,
    weeklyRankings,
    leagueTeams,
  };
}
