// Revenue Forecaster — project team revenue by source over multiple seasons

export interface RevenueSource {
  source: string;
  current: number;         // millions
  projected: number;       // next year millions
  growth: number;          // percentage
  trend: 'up' | 'down' | 'flat';
}

export interface SeasonRevenue {
  season: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface RevenueForecasterData {
  teamName: string;
  currentSeasonRevenue: number;
  projectedNextSeason: number;
  revenueGrowth: number;
  sources: RevenueSource[];
  forecast: SeasonRevenue[];
  riskFactors: string[];
}

export function getTrendColor(trend: string): string {
  if (trend === 'up') return '#22c55e';
  if (trend === 'flat') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoRevenueForecaster(): RevenueForecasterData {
  return {
    teamName: 'San Francisco Giants',
    currentSeasonRevenue: 385.2,
    projectedNextSeason: 402.8,
    revenueGrowth: 4.6,
    sources: [
      { source: 'Gate Revenue', current: 112.5, projected: 118.2, growth: 5.1, trend: 'up' },
      { source: 'Broadcasting', current: 95.0, projected: 98.5, growth: 3.7, trend: 'up' },
      { source: 'Merchandise', current: 48.2, projected: 52.1, growth: 8.1, trend: 'up' },
      { source: 'Sponsorships', current: 62.8, projected: 64.5, growth: 2.7, trend: 'flat' },
      { source: 'Concessions', current: 38.5, projected: 40.2, growth: 4.4, trend: 'up' },
      { source: 'Revenue Sharing', current: 28.2, projected: 29.3, growth: 3.9, trend: 'flat' },
    ],
    forecast: [
      { season: 2026, totalRevenue: 385.2, totalExpenses: 342.0, netIncome: 43.2 },
      { season: 2027, totalRevenue: 402.8, totalExpenses: 358.5, netIncome: 44.3 },
      { season: 2028, totalRevenue: 418.5, totalExpenses: 375.0, netIncome: 43.5 },
      { season: 2029, totalRevenue: 430.2, totalExpenses: 388.0, netIncome: 42.2 },
      { season: 2030, totalRevenue: 445.8, totalExpenses: 402.5, netIncome: 43.3 },
    ],
    riskFactors: [
      'TV deal expires after 2028 — renegotiation needed',
      'Attendance could dip if team falls out of contention',
      'Stadium maintenance costs rising 6% annually',
      'Luxury tax penalties may apply if payroll exceeds threshold',
    ],
  };
}
