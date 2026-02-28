// Fan Morale Engine — tracks fan happiness, attendance impact, and engagement drivers

export interface FanMoraleDriver {
  factor: string;
  impact: number;         // -20 to +20
  description: string;
  category: 'performance' | 'roster' | 'finance' | 'culture';
}

export interface FanMoraleData {
  overallMorale: number;  // 0-100
  moraleGrade: string;
  trend: 'rising' | 'falling' | 'stable';
  attendancePct: number;  // % of capacity
  seasonTicketRenewal: number;
  merchSalesIndex: number;
  socialSentiment: number;  // -100 to 100
  drivers: FanMoraleDriver[];
  monthlyMorale: Array<{ month: string; morale: number; attendance: number }>;
}

export function getMoraleColor(morale: number): string {
  if (morale >= 75) return '#22c55e';
  if (morale >= 55) return '#3b82f6';
  if (morale >= 35) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoFanMorale(): FanMoraleData {
  return {
    overallMorale: 72,
    moraleGrade: 'B+',
    trend: 'rising',
    attendancePct: 82.5,
    seasonTicketRenewal: 88.2,
    merchSalesIndex: 115,
    socialSentiment: 42,
    drivers: [
      { factor: '5-game win streak', impact: 12, description: 'Hot streak energized fanbase', category: 'performance' },
      { factor: 'Prospect callup (Delgado)', impact: 15, description: 'Top prospect debut generated buzz', category: 'roster' },
      { factor: 'Playoff contention', impact: 10, description: 'Team in wild card race', category: 'performance' },
      { factor: 'Star player extension', impact: 8, description: 'Torres signed 5-year deal', category: 'finance' },
      { factor: 'Ace injury (Thornton)', impact: -8, description: 'Starting pitcher out 6 weeks', category: 'performance' },
      { factor: 'Ticket price increase', impact: -5, description: '8% average ticket price hike', category: 'finance' },
      { factor: 'Rivalry win', impact: 6, description: 'Swept division rival Dodgers', category: 'culture' },
      { factor: 'Fan appreciation night', impact: 4, description: 'Bobblehead + fireworks drew sellout', category: 'culture' },
    ],
    monthlyMorale: [
      { month: 'Apr', morale: 58, attendance: 74.2 },
      { month: 'May', morale: 62, attendance: 78.5 },
      { month: 'Jun', morale: 72, attendance: 82.5 },
    ],
  };
}
