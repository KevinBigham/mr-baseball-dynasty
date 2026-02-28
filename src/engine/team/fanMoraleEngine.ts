/**
 * Fan Morale & Attendance Engine
 *
 * Tracks fan satisfaction, attendance trends, and revenue impact.
 * Morale is driven by winning, star players, ticket prices, stadium
 * quality, rivalry games, and promotional activity.
 *
 * Models season ticket holder retention, attendance forecasting,
 * and the financial impact of fan sentiment changes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MoraleFactor {
  id: string;
  name: string;
  category: 'performance' | 'roster' | 'pricing' | 'stadium' | 'scheduling' | 'promotion';
  currentValue: number;       // current metric value
  impact: number;             // -30 to +30 impact on morale score
  trend: 'up' | 'down' | 'flat';
  description: string;
  weight: number;             // 0-1 how important this factor is
}

export interface AttendanceTrendPoint {
  month: string;
  averageAttendance: number;
  capacity: number;
  capacityPct: number;
  gamesPlayed: number;
  record: string;             // e.g., "14-8"
  morale: number;             // morale score at that time
}

export interface RevenueImpact {
  category: string;
  currentRevenue: number;     // $M
  projectedRevenue: number;   // $M with current morale trajectory
  delta: number;              // $M change
  deltaPercent: number;       // % change
}

export interface SeasonTicketRetention {
  totalHolders: number;
  renewalRate: number;         // 0-100%
  projectedRenewals: number;
  atRiskHolders: number;
  topReasons: string[];        // top reasons for non-renewal
  revenueAtRisk: number;      // $M
}

export interface RivalryGameBoost {
  opponent: string;
  attendanceBoost: number;     // % increase
  moraleBoost: number;         // morale points
  gamesRemaining: number;
  avgAttendance: number;       // historical avg vs this opponent
}

export interface FanMoraleData {
  moraleScore: number;          // 0-100 overall fan satisfaction
  moraleGrade: string;
  moraleTrend: 'rising' | 'falling' | 'stable';
  moraleTrendDelta: number;     // change over last 30 days
  factors: MoraleFactor[];
  attendanceTrend: AttendanceTrendPoint[];
  revenueImpact: RevenueImpact[];
  seasonTickets: SeasonTicketRetention;
  rivalryBoosts: RivalryGameBoost[];
  currentAttendance: number;
  stadiumCapacity: number;
  avgTicketPrice: number;
  fanbaseSize: number;          // thousands
  socialSentiment: number;      // 0-100
  merchandiseIndex: number;     // 0-100
}

// ─── Utility ────────────────────────────────────────────────────────────────

export function getMoraleGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 82) return 'A';
  if (score >= 74) return 'B+';
  if (score >= 66) return 'B';
  if (score >= 58) return 'C+';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function getMoraleColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#4ade80';
  if (score >= 50) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}

export function getTrendColor(trend: 'rising' | 'falling' | 'stable' | 'up' | 'down' | 'flat'): string {
  if (trend === 'rising' || trend === 'up') return '#22c55e';
  if (trend === 'falling' || trend === 'down') return '#ef4444';
  return '#6b7280';
}

export function getTrendArrow(trend: 'rising' | 'falling' | 'stable' | 'up' | 'down' | 'flat'): string {
  if (trend === 'rising' || trend === 'up') return '\u2191';    // up arrow
  if (trend === 'falling' || trend === 'down') return '\u2193'; // down arrow
  return '\u2192';                                                // right arrow (flat)
}

export function getCategoryColor(category: MoraleFactor['category']): string {
  switch (category) {
    case 'performance': return '#22c55e';
    case 'roster': return '#3b82f6';
    case 'pricing': return '#f59e0b';
    case 'stadium': return '#8b5cf6';
    case 'scheduling': return '#06b6d4';
    case 'promotion': return '#ec4899';
  }
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoFanMorale(): FanMoraleData {
  const factors: MoraleFactor[] = [
    {
      id: 'win-pct',
      name: 'Winning Percentage',
      category: 'performance',
      currentValue: 58.5,
      impact: 18,
      trend: 'up',
      description: 'Team is 55-39 (.585), 3 games above last year pace. Fans respond strongly to winning.',
      weight: 0.25,
    },
    {
      id: 'playoff-odds',
      name: 'Playoff Probability',
      category: 'performance',
      currentValue: 82,
      impact: 14,
      trend: 'up',
      description: '82% playoff probability per projections. Pennant race excitement driving late-season interest.',
      weight: 0.15,
    },
    {
      id: 'run-diff',
      name: 'Run Differential',
      category: 'performance',
      currentValue: 68,
      impact: 6,
      trend: 'up',
      description: '+68 run differential indicates underlying team quality. Blowout wins excite the fanbase.',
      weight: 0.08,
    },
    {
      id: 'star-power',
      name: 'Star Player Presence',
      category: 'roster',
      currentValue: 85,
      impact: 12,
      trend: 'flat',
      description: 'Two All-Stars and an MVP candidate on roster. Star power drives jersey sales and attendance.',
      weight: 0.12,
    },
    {
      id: 'prospect-hype',
      name: 'Prospect Call-ups',
      category: 'roster',
      currentValue: 70,
      impact: 8,
      trend: 'up',
      description: '#2 prospect called up in June, generating significant fan buzz and media coverage.',
      weight: 0.06,
    },
    {
      id: 'trade-deadline',
      name: 'Trade Deadline Moves',
      category: 'roster',
      currentValue: 75,
      impact: 10,
      trend: 'up',
      description: 'Acquired impact starter and setup man at deadline. "Going for it" narrative boosts morale.',
      weight: 0.08,
    },
    {
      id: 'ticket-price',
      name: 'Ticket Affordability',
      category: 'pricing',
      currentValue: 55,
      impact: -8,
      trend: 'down',
      description: 'Average ticket $48 (+12% YoY). Dynamic pricing on weekends frustrating casual fans.',
      weight: 0.10,
    },
    {
      id: 'concession-price',
      name: 'Concession Pricing',
      category: 'pricing',
      currentValue: 40,
      impact: -6,
      trend: 'down',
      description: '$14 beers and $9 hot dogs. Cost-of-attending complaints growing on social media.',
      weight: 0.05,
    },
    {
      id: 'stadium-quality',
      name: 'Stadium Experience',
      category: 'stadium',
      currentValue: 72,
      impact: 5,
      trend: 'flat',
      description: 'New jumbotron and improved Wi-Fi in Year 2. Craft beer section popular. Restroom lines still long.',
      weight: 0.06,
    },
    {
      id: 'rivalry-schedule',
      name: 'Rivalry Games',
      category: 'scheduling',
      currentValue: 80,
      impact: 7,
      trend: 'up',
      description: '6 rivalry games remaining in August-September. Historically 15-20% attendance boost.',
      weight: 0.05,
    },
    {
      id: 'promo-nights',
      name: 'Promotional Events',
      category: 'promotion',
      currentValue: 65,
      impact: 4,
      trend: 'flat',
      description: 'Bobblehead nights averaging 38,000. 4 more giveaway nights scheduled this season.',
      weight: 0.05,
    },
    {
      id: 'community',
      name: 'Community Engagement',
      category: 'promotion',
      currentValue: 60,
      impact: 3,
      trend: 'up',
      description: 'Player charity appearances up 30%. Youth baseball clinic initiative well-received.',
      weight: 0.04,
    },
  ];

  const attendanceTrend: AttendanceTrendPoint[] = [
    { month: 'April', averageAttendance: 32400, capacity: 42500, capacityPct: 76.2, gamesPlayed: 13, record: '8-5', morale: 62 },
    { month: 'May', averageAttendance: 34800, capacity: 42500, capacityPct: 81.9, gamesPlayed: 14, record: '9-5', morale: 68 },
    { month: 'June', averageAttendance: 36200, capacity: 42500, capacityPct: 85.2, gamesPlayed: 13, record: '10-3', morale: 74 },
    { month: 'July', averageAttendance: 38100, capacity: 42500, capacityPct: 89.6, gamesPlayed: 15, record: '9-6', morale: 72 },
    { month: 'Aug (proj)', averageAttendance: 39500, capacity: 42500, capacityPct: 92.9, gamesPlayed: 14, record: '10-4', morale: 78 },
    { month: 'Sep (proj)', averageAttendance: 40800, capacity: 42500, capacityPct: 96.0, gamesPlayed: 12, record: '9-3', morale: 82 },
  ];

  const revenueImpact: RevenueImpact[] = [
    { category: 'Gate Revenue', currentRevenue: 52.8, projectedRevenue: 58.2, delta: 5.4, deltaPercent: 10.2 },
    { category: 'Concessions', currentRevenue: 18.5, projectedRevenue: 20.4, delta: 1.9, deltaPercent: 10.3 },
    { category: 'Merchandise', currentRevenue: 14.2, projectedRevenue: 16.8, delta: 2.6, deltaPercent: 18.3 },
    { category: 'Season Tickets', currentRevenue: 38.0, projectedRevenue: 40.5, delta: 2.5, deltaPercent: 6.6 },
    { category: 'Parking', currentRevenue: 8.2, projectedRevenue: 9.0, delta: 0.8, deltaPercent: 9.8 },
    { category: 'Sponsorships', currentRevenue: 22.0, projectedRevenue: 24.5, delta: 2.5, deltaPercent: 11.4 },
    { category: 'Local TV/Radio', currentRevenue: 45.0, projectedRevenue: 47.2, delta: 2.2, deltaPercent: 4.9 },
  ];

  const seasonTickets: SeasonTicketRetention = {
    totalHolders: 18500,
    renewalRate: 84.2,
    projectedRenewals: 15577,
    atRiskHolders: 2923,
    topReasons: [
      'Ticket price increase (38% of at-risk)',
      'Inconvenient game times (22%)',
      'Concession costs too high (18%)',
      'Team not competitive enough (12%)',
      'Moving out of area (10%)',
    ],
    revenueAtRisk: 5.8,
  };

  const rivalryBoosts: RivalryGameBoost[] = [
    { opponent: 'Chicago Cubs', attendanceBoost: 18, moraleBoost: 5, gamesRemaining: 3, avgAttendance: 41200 },
    { opponent: 'St. Louis Cardinals', attendanceBoost: 22, moraleBoost: 7, gamesRemaining: 2, avgAttendance: 42100 },
    { opponent: 'New York Mets', attendanceBoost: 12, moraleBoost: 3, gamesRemaining: 1, avgAttendance: 39800 },
  ];

  const moraleScore = 73;
  const totalRevenueImpact = revenueImpact.reduce((s, r) => s + r.delta, 0);

  return {
    moraleScore,
    moraleGrade: getMoraleGrade(moraleScore),
    moraleTrend: 'rising',
    moraleTrendDelta: 6,
    factors,
    attendanceTrend,
    revenueImpact,
    seasonTickets,
    rivalryBoosts,
    currentAttendance: 37400,
    stadiumCapacity: 42500,
    avgTicketPrice: 48,
    fanbaseSize: 1250,
    socialSentiment: 71,
    merchandiseIndex: 78,
  };
}
