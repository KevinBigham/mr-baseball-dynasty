// ── Double Play Analyzer ─────────────────────────────────────────
// Evaluates team double play efficiency (turning and grounding into)

export interface DPOpportunity {
  situation: string;
  attempts: number;
  converted: number;
  conversionRate: number;
  runsPreventedPerDP: number;
}

export interface InfieldDPPlayer {
  playerName: string;
  position: string;
  dpTurned: number;
  dpAttempts: number;
  pivotSpeed: number;      // seconds
  throwAccuracy: number;   // 0-100
  dpGrade: 'A' | 'B' | 'C' | 'D';
}

export interface DPAnalysis {
  teamName: string;
  totalDPTurned: number;
  dpConversionRate: number;
  gdpInduced: number;       // as pitching staff
  gdpGroundedInto: number;  // as hitting team
  leagueDPRank: number;
  dpOpportunities: DPOpportunity[];
  infieldPlayers: InfieldDPPlayer[];
  pitcherGDPRates: { pitcher: string; gbRate: number; gdpInduced: number; rate: number }[];
  hitterGDPRates: { hitter: string; gdp: number; opportunities: number; rate: number }[];
}

export function getDPGradeColor(grade: string): string {
  if (grade === 'A') return '#22c55e';
  if (grade === 'B') return '#3b82f6';
  if (grade === 'C') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoDPAnalysis(): DPAnalysis {
  return {
    teamName: 'San Francisco Giants',
    totalDPTurned: 128,
    dpConversionRate: 68.4,
    gdpInduced: 112,
    gdpGroundedInto: 95,
    leagueDPRank: 5,
    dpOpportunities: [
      { situation: 'Runner on 1st, 0 outs', attempts: 95, converted: 68, conversionRate: 71.6, runsPreventedPerDP: 0.82 },
      { situation: 'Runners 1st & 2nd, 0 outs', attempts: 42, converted: 26, conversionRate: 61.9, runsPreventedPerDP: 1.15 },
      { situation: 'Runner on 1st, 1 out', attempts: 51, converted: 34, conversionRate: 66.7, runsPreventedPerDP: 0.45 },
    ],
    infieldPlayers: [
      { playerName: 'Julio Herrera', position: 'SS', dpTurned: 52, dpAttempts: 68, pivotSpeed: 0.38, throwAccuracy: 92, dpGrade: 'A' },
      { playerName: 'Chris Nakamura', position: '2B', dpTurned: 48, dpAttempts: 65, pivotSpeed: 0.42, throwAccuracy: 88, dpGrade: 'B' },
      { playerName: 'J.D. Morales', position: '3B', dpTurned: 18, dpAttempts: 28, pivotSpeed: 0.52, throwAccuracy: 85, dpGrade: 'B' },
      { playerName: 'Terrence Baylor', position: '1B', dpTurned: 10, dpAttempts: 27, pivotSpeed: 0.65, throwAccuracy: 78, dpGrade: 'C' },
    ],
    pitcherGDPRates: [
      { pitcher: 'Alejandro Vega', gbRate: 54.2, gdpInduced: 22, rate: 18.5 },
      { pitcher: 'Ryan Whitaker', gbRate: 42.8, gdpInduced: 15, rate: 14.2 },
      { pitcher: 'Tommy Nakamura', gbRate: 58.1, gdpInduced: 28, rate: 22.4 },
      { pitcher: 'Camilo Doval', gbRate: 48.5, gdpInduced: 12, rate: 16.8 },
    ],
    hitterGDPRates: [
      { hitter: 'Terrence Baylor', gdp: 18, opportunities: 85, rate: 21.2 },
      { hitter: 'Tony Reyes', gdp: 14, opportunities: 72, rate: 19.4 },
      { hitter: 'Carlos Delgado Jr.', gdp: 12, opportunities: 90, rate: 13.3 },
      { hitter: 'Marcus Webb', gdp: 5, opportunities: 68, rate: 7.4 },
    ],
  };
}
