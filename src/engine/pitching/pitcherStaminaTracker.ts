// Pitcher Stamina Tracker — track performance degradation through game outings

export interface InningPerformance {
  inning: number;
  pitchCount: number;
  velocity: number;      // avg fastball velo
  veloChange: number;    // vs 1st inning
  strikeouts: number;
  walks: number;
  hits: number;
  era: number;
  whip: number;
}

export interface StaminaProfile {
  pitcherId: string;
  name: string;
  type: 'Starter' | 'Reliever';
  avgPitchCount: number;
  optimalPitchCount: number;  // where performance starts to decline
  dropoffInning: number;       // inning where sharp decline begins
  thirdTimePenalty: number;    // OPS increase 3rd time through order
  inningData: InningPerformance[];
  staminaGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  durabilityScore: number;     // 0-100
}

export interface StaminaTrackerData {
  pitchers: StaminaProfile[];
}

export function getStaminaGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#22c55e';
    case 'B': return '#3b82f6';
    case 'C': return '#f59e0b';
    case 'D': return '#ef4444';
    case 'F': return '#dc2626';
    default: return '#6b7280';
  }
}

export function getVeloChangeColor(change: number): string {
  if (change >= 0) return '#22c55e';
  if (change >= -1) return '#f59e0b';
  if (change >= -2) return '#ef4444';
  return '#dc2626';
}

export function generateDemoStaminaTracker(): StaminaTrackerData {
  const pitchers: StaminaProfile[] = [
    {
      pitcherId: 'SP1', name: 'Corbin Burnes', type: 'Starter',
      avgPitchCount: 98, optimalPitchCount: 85, dropoffInning: 7,
      thirdTimePenalty: 0.042, staminaGrade: 'A', durabilityScore: 92,
      inningData: [
        { inning: 1, pitchCount: 15, velocity: 96.2, veloChange: 0, strikeouts: 45, walks: 12, hits: 28, era: 2.88, whip: 0.98 },
        { inning: 2, pitchCount: 30, velocity: 96.0, veloChange: -0.2, strikeouts: 42, walks: 10, hits: 30, era: 3.05, whip: 1.02 },
        { inning: 3, pitchCount: 44, velocity: 95.8, veloChange: -0.4, strikeouts: 40, walks: 11, hits: 32, era: 3.15, whip: 1.05 },
        { inning: 4, pitchCount: 58, velocity: 95.5, veloChange: -0.7, strikeouts: 38, walks: 13, hits: 31, era: 3.22, whip: 1.08 },
        { inning: 5, pitchCount: 72, velocity: 95.3, veloChange: -0.9, strikeouts: 36, walks: 14, hits: 33, era: 3.35, whip: 1.12 },
        { inning: 6, pitchCount: 85, velocity: 95.0, veloChange: -1.2, strikeouts: 34, walks: 15, hits: 35, era: 3.52, whip: 1.16 },
        { inning: 7, pitchCount: 97, velocity: 94.5, veloChange: -1.7, strikeouts: 28, walks: 16, hits: 38, era: 3.95, whip: 1.28 },
        { inning: 8, pitchCount: 108, velocity: 93.8, veloChange: -2.4, strikeouts: 12, walks: 8, hits: 18, era: 4.50, whip: 1.44 },
      ],
    },
    {
      pitcherId: 'SP2', name: 'Grayson Rodriguez', type: 'Starter',
      avgPitchCount: 92, optimalPitchCount: 75, dropoffInning: 6,
      thirdTimePenalty: 0.068, staminaGrade: 'B', durabilityScore: 78,
      inningData: [
        { inning: 1, pitchCount: 16, velocity: 97.1, veloChange: 0, strikeouts: 48, walks: 15, hits: 25, era: 2.65, whip: 0.95 },
        { inning: 2, pitchCount: 32, velocity: 96.8, veloChange: -0.3, strikeouts: 44, walks: 14, hits: 28, era: 2.85, whip: 1.00 },
        { inning: 3, pitchCount: 48, velocity: 96.4, veloChange: -0.7, strikeouts: 40, walks: 16, hits: 32, era: 3.20, whip: 1.10 },
        { inning: 4, pitchCount: 63, velocity: 95.8, veloChange: -1.3, strikeouts: 36, walks: 18, hits: 35, era: 3.55, whip: 1.18 },
        { inning: 5, pitchCount: 78, velocity: 95.2, veloChange: -1.9, strikeouts: 32, walks: 19, hits: 38, era: 3.92, whip: 1.28 },
        { inning: 6, pitchCount: 92, velocity: 94.3, veloChange: -2.8, strikeouts: 22, walks: 15, hits: 30, era: 4.65, whip: 1.50 },
        { inning: 7, pitchCount: 104, velocity: 93.5, veloChange: -3.6, strikeouts: 8, walks: 7, hits: 15, era: 5.40, whip: 1.71 },
      ],
    },
    {
      pitcherId: 'SP3', name: 'Dean Kremer', type: 'Starter',
      avgPitchCount: 88, optimalPitchCount: 70, dropoffInning: 5,
      thirdTimePenalty: 0.085, staminaGrade: 'C', durabilityScore: 62,
      inningData: [
        { inning: 1, pitchCount: 17, velocity: 92.5, veloChange: 0, strikeouts: 35, walks: 18, hits: 30, era: 3.20, whip: 1.12 },
        { inning: 2, pitchCount: 34, velocity: 92.2, veloChange: -0.3, strikeouts: 32, walks: 16, hits: 32, era: 3.45, whip: 1.15 },
        { inning: 3, pitchCount: 50, velocity: 91.8, veloChange: -0.7, strikeouts: 28, walks: 18, hits: 36, era: 3.80, whip: 1.25 },
        { inning: 4, pitchCount: 66, velocity: 91.0, veloChange: -1.5, strikeouts: 24, walks: 20, hits: 40, era: 4.35, whip: 1.38 },
        { inning: 5, pitchCount: 82, velocity: 90.2, veloChange: -2.3, strikeouts: 18, walks: 18, hits: 38, era: 5.10, whip: 1.55 },
        { inning: 6, pitchCount: 95, velocity: 89.5, veloChange: -3.0, strikeouts: 10, walks: 12, hits: 22, era: 5.85, whip: 1.72 },
      ],
    },
    {
      pitcherId: 'SP4', name: 'Cole Irvin', type: 'Starter',
      avgPitchCount: 94, optimalPitchCount: 80, dropoffInning: 6,
      thirdTimePenalty: 0.072, staminaGrade: 'B', durabilityScore: 75,
      inningData: [
        { inning: 1, pitchCount: 15, velocity: 89.8, veloChange: 0, strikeouts: 28, walks: 12, hits: 35, era: 3.55, whip: 1.18 },
        { inning: 2, pitchCount: 30, velocity: 89.6, veloChange: -0.2, strikeouts: 26, walks: 11, hits: 33, era: 3.60, whip: 1.16 },
        { inning: 3, pitchCount: 44, velocity: 89.3, veloChange: -0.5, strikeouts: 24, walks: 13, hits: 36, era: 3.78, whip: 1.22 },
        { inning: 4, pitchCount: 59, velocity: 88.9, veloChange: -0.9, strikeouts: 22, walks: 14, hits: 38, era: 4.05, whip: 1.28 },
        { inning: 5, pitchCount: 74, velocity: 88.4, veloChange: -1.4, strikeouts: 20, walks: 16, hits: 40, era: 4.42, whip: 1.35 },
        { inning: 6, pitchCount: 88, velocity: 87.8, veloChange: -2.0, strikeouts: 16, walks: 14, hits: 36, era: 4.92, whip: 1.48 },
        { inning: 7, pitchCount: 100, velocity: 87.0, veloChange: -2.8, strikeouts: 8, walks: 8, hits: 20, era: 5.55, whip: 1.65 },
      ],
    },
  ];

  return { pitchers };
}
