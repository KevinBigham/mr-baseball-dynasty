// ── Option Year Analyzer ─────────────────────────────────────────
// Evaluates club/player options and vesting thresholds

export interface OptionDetail {
  playerName: string;
  position: string;
  optionType: 'club' | 'player' | 'mutual' | 'vesting';
  optionYear: number;
  optionSalary: number;       // millions
  buyout: number;             // millions
  currentSalary: number;
  vestingThreshold?: string;
  vestingProgress?: number;   // 0-100
  recommendation: 'exercise' | 'decline' | 'negotiate' | 'wait';
  projectedWAR: number;
  marketValue: number;        // millions
  costBenefitDelta: number;   // positive = good deal to exercise
  analysis: string;
}

export interface OptionYearData {
  teamName: string;
  totalOptions: number;
  optionCostIfAllExercised: number;
  optionDetails: OptionDetail[];
  timeline: { date: string; event: string }[];
}

export function getRecColor(rec: string): string {
  if (rec === 'exercise') return '#22c55e';
  if (rec === 'decline') return '#ef4444';
  if (rec === 'negotiate') return '#3b82f6';
  return '#f59e0b';
}

export function generateDemoOptionAnalysis(): OptionYearData {
  const optionDetails: OptionDetail[] = [
    {
      playerName: 'Brandon Crawford',
      position: 'SS',
      optionType: 'club',
      optionYear: 2027,
      optionSalary: 16.0,
      buyout: 2.0,
      currentSalary: 16.0,
      recommendation: 'decline',
      projectedWAR: 1.2,
      marketValue: 8.0,
      costBenefitDelta: -8.0,
      analysis: 'Declining defense and bat — $16M significantly above projected market value. Decline and deploy $14M savings elsewhere.',
    },
    {
      playerName: 'Alejandro Vega',
      position: 'SP',
      optionType: 'club',
      optionYear: 2027,
      optionSalary: 12.0,
      buyout: 1.0,
      currentSalary: 8.5,
      recommendation: 'exercise',
      projectedWAR: 3.8,
      marketValue: 22.0,
      costBenefitDelta: 10.0,
      analysis: 'Elite value — getting $22M arm for $12M. Easy exercise. Explore extension to lock up through age-32.',
    },
    {
      playerName: 'Tony Reyes',
      position: 'RF',
      optionType: 'vesting',
      optionYear: 2027,
      optionSalary: 14.0,
      buyout: 1.5,
      currentSalary: 11.0,
      vestingThreshold: '550 PA',
      vestingProgress: 78,
      recommendation: 'wait',
      projectedWAR: 2.5,
      marketValue: 14.0,
      costBenefitDelta: 0,
      analysis: 'Vesting option at 550 PA — currently at 429 PA (78%). Fair market value if vests. Monitor health and playing time.',
    },
    {
      playerName: 'Marcus Webb',
      position: 'CF',
      optionType: 'player',
      optionYear: 2027,
      optionSalary: 18.0,
      buyout: 0,
      currentSalary: 15.0,
      recommendation: 'negotiate',
      projectedWAR: 4.2,
      marketValue: 25.0,
      costBenefitDelta: 7.0,
      analysis: 'Player likely to opt out — worth $25M on open market. Proactively offer 4yr/$90M extension to avoid losing him.',
    },
    {
      playerName: 'Derek Palmer',
      position: 'LF',
      optionType: 'mutual',
      optionYear: 2027,
      optionSalary: 10.0,
      buyout: 1.0,
      currentSalary: 10.0,
      recommendation: 'exercise',
      projectedWAR: 2.0,
      marketValue: 12.0,
      costBenefitDelta: 2.0,
      analysis: 'Slightly below market value — good role player at reasonable cost. Exercise unless prospect is ready.',
    },
  ];

  return {
    teamName: 'San Francisco Giants',
    totalOptions: optionDetails.length,
    optionCostIfAllExercised: optionDetails.reduce((s, o) => s + o.optionSalary, 0),
    optionDetails,
    timeline: [
      { date: 'Oct 15', event: 'Club options must be exercised/declined' },
      { date: 'Nov 1', event: 'Player opt-out deadline' },
      { date: 'Nov 5', event: 'Mutual option decisions due' },
      { date: 'Nov 15', event: 'Vesting option thresholds finalized' },
    ],
  };
}
