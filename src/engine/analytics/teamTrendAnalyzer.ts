// Team Trend Analyzer — track team performance trends across multiple periods

export interface TrendPeriod {
  period: string;
  wins: number;
  losses: number;
  runDiff: number;
  avgRuns: number;
  avgRunsAllowed: number;
  teamERA: number;
  teamBA: number;
  trend: 'hot' | 'cold' | 'neutral';
}

export interface TrendMetric {
  metric: string;
  last7: number;
  last15: number;
  last30: number;
  season: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface TeamTrendData {
  teamName: string;
  currentStreak: string;
  overallTrend: 'hot' | 'cold' | 'neutral';
  periods: TrendPeriod[];
  metrics: TrendMetric[];
}

export function getTrendBadgeColor(trend: string): string {
  if (trend === 'hot' || trend === 'improving') return '#22c55e';
  if (trend === 'cold' || trend === 'declining') return '#ef4444';
  return '#6b7280';
}

export function generateDemoTeamTrend(): TeamTrendData {
  return {
    teamName: 'San Francisco Giants',
    currentStreak: 'W5',
    overallTrend: 'hot',
    periods: [
      { period: 'Last 7', wins: 5, losses: 2, runDiff: 12, avgRuns: 5.4, avgRunsAllowed: 3.7, teamERA: 3.42, teamBA: .278, trend: 'hot' },
      { period: 'Last 15', wins: 10, losses: 5, runDiff: 18, avgRuns: 4.8, avgRunsAllowed: 3.6, teamERA: 3.55, teamBA: .265, trend: 'hot' },
      { period: 'Last 30', wins: 18, losses: 12, runDiff: 22, avgRuns: 4.5, avgRunsAllowed: 3.8, teamERA: 3.68, teamBA: .258, trend: 'neutral' },
      { period: 'Season', wins: 52, losses: 38, runDiff: 65, avgRuns: 4.3, avgRunsAllowed: 3.6, teamERA: 3.52, teamBA: .255, trend: 'hot' },
    ],
    metrics: [
      { metric: 'Team BA', last7: .278, last15: .265, last30: .258, season: .255, trend: 'improving' },
      { metric: 'Team ERA', last7: 3.42, last15: 3.55, last30: 3.68, season: 3.52, trend: 'improving' },
      { metric: 'HR/Game', last7: 1.6, last15: 1.4, last30: 1.3, season: 1.2, trend: 'improving' },
      { metric: 'K/9 (Staff)', last7: 9.2, last15: 8.8, last30: 8.5, season: 8.6, trend: 'improving' },
      { metric: 'BB/9 (Staff)', last7: 2.8, last15: 3.1, last30: 3.2, season: 3.0, trend: 'stable' },
      { metric: 'RISP AVG', last7: .295, last15: .272, last30: .260, season: .258, trend: 'improving' },
      { metric: 'Bullpen ERA', last7: 2.85, last15: 3.20, last30: 3.45, season: 3.15, trend: 'improving' },
      { metric: 'Errors/Game', last7: 0.4, last15: 0.6, last30: 0.7, season: 0.65, trend: 'improving' },
    ],
  };
}
