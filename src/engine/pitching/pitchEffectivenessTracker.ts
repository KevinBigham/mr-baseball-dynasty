// ── Pitch Effectiveness Tracker ──────────────────────────────────
// Tracks effectiveness of each pitch type across game situations

export interface PitchEffData {
  pitchType: string;
  velocity: number;
  spinRate: number;
  usage: number;          // percentage
  whiffRate: number;
  putAwayRate: number;
  battingAvgAgainst: number;
  sluggingAgainst: number;
  groundBallRate: number;
  xwOBA: number;
  trendVsLastMonth: 'improving' | 'stable' | 'declining';
}

export interface SituationalPitchEff {
  situation: string;
  bestPitch: string;
  worstPitch: string;
  bestWhiffRate: number;
  worstBAA: number;
}

export interface PitcherEffProfile {
  pitcherName: string;
  role: string;
  pitches: PitchEffData[];
  situationalData: SituationalPitchEff[];
  overallEfficiency: number;   // 0-100
  keyInsight: string;
}

export interface PitchEffectivenessData {
  teamName: string;
  pitchers: PitcherEffProfile[];
}

export function getTrendColor(trend: string): string {
  if (trend === 'improving') return '#22c55e';
  if (trend === 'declining') return '#ef4444';
  return '#9ca3af';
}

export function generateDemoPitchEffectiveness(): PitchEffectivenessData {
  const pitchers: PitcherEffProfile[] = [
    {
      pitcherName: 'Alejandro Vega',
      role: 'SP',
      overallEfficiency: 82,
      keyInsight: 'Sinker/slider combo is devastating — changeup needs development vs LHH',
      pitches: [
        { pitchType: 'Sinker', velocity: 95.2, spinRate: 2180, usage: 35, whiffRate: 18.5, putAwayRate: 14.2, battingAvgAgainst: 0.232, sluggingAgainst: 0.355, groundBallRate: 58.4, xwOBA: 0.295, trendVsLastMonth: 'stable' },
        { pitchType: 'Slider', velocity: 87.8, spinRate: 2580, usage: 25, whiffRate: 35.2, putAwayRate: 22.8, battingAvgAgainst: 0.175, sluggingAgainst: 0.275, groundBallRate: 42.1, xwOBA: 0.240, trendVsLastMonth: 'improving' },
        { pitchType: 'Changeup', velocity: 86.5, spinRate: 1720, usage: 22, whiffRate: 28.4, putAwayRate: 18.5, battingAvgAgainst: 0.218, sluggingAgainst: 0.340, groundBallRate: 52.8, xwOBA: 0.280, trendVsLastMonth: 'improving' },
        { pitchType: 'Four-seam', velocity: 96.8, spinRate: 2420, usage: 18, whiffRate: 24.1, putAwayRate: 12.5, battingAvgAgainst: 0.248, sluggingAgainst: 0.420, groundBallRate: 28.5, xwOBA: 0.330, trendVsLastMonth: 'declining' },
      ],
      situationalData: [
        { situation: '0-0 Count', bestPitch: 'Sinker', worstPitch: 'Four-seam', bestWhiffRate: 18.5, worstBAA: 0.310 },
        { situation: 'Two Strikes', bestPitch: 'Slider', worstPitch: 'Sinker', bestWhiffRate: 42.1, worstBAA: 0.280 },
        { situation: 'vs LHH', bestPitch: 'Changeup', worstPitch: 'Four-seam', bestWhiffRate: 32.5, worstBAA: 0.295 },
        { situation: 'RISP', bestPitch: 'Slider', worstPitch: 'Changeup', bestWhiffRate: 38.8, worstBAA: 0.265 },
      ],
    },
    {
      pitcherName: 'Camilo Doval',
      role: 'CL',
      overallEfficiency: 88,
      keyInsight: 'Elite slider usage up — four-seam velocity ticking down, monitor workload',
      pitches: [
        { pitchType: 'Four-seam', velocity: 98.2, spinRate: 2350, usage: 45, whiffRate: 28.5, putAwayRate: 18.2, battingAvgAgainst: 0.195, sluggingAgainst: 0.340, groundBallRate: 32.1, xwOBA: 0.265, trendVsLastMonth: 'declining' },
        { pitchType: 'Slider', velocity: 89.5, spinRate: 2680, usage: 42, whiffRate: 42.8, putAwayRate: 28.5, battingAvgAgainst: 0.148, sluggingAgainst: 0.210, groundBallRate: 38.5, xwOBA: 0.195, trendVsLastMonth: 'improving' },
        { pitchType: 'Sinker', velocity: 96.8, spinRate: 2150, usage: 13, whiffRate: 12.5, putAwayRate: 8.2, battingAvgAgainst: 0.265, sluggingAgainst: 0.380, groundBallRate: 55.2, xwOBA: 0.310, trendVsLastMonth: 'stable' },
      ],
      situationalData: [
        { situation: '0-0 Count', bestPitch: 'Four-seam', worstPitch: 'Sinker', bestWhiffRate: 28.5, worstBAA: 0.290 },
        { situation: 'Two Strikes', bestPitch: 'Slider', worstPitch: 'Sinker', bestWhiffRate: 52.1, worstBAA: 0.310 },
        { situation: 'High Leverage', bestPitch: 'Slider', worstPitch: 'Sinker', bestWhiffRate: 45.2, worstBAA: 0.285 },
      ],
    },
  ];

  return { teamName: 'San Francisco Giants', pitchers };
}
