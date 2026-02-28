// ── Bullpen Arm Health Monitor ───────────────────────────────────
// Tracks pitcher workload, arm stress, and injury risk indicators

export interface ArmHealthPitcher {
  name: string;
  role: string;
  throws: 'L' | 'R';
  pitchesLast3Days: number;
  pitchesLast7Days: number;
  pitchesLast30Days: number;
  highStressOutings: number;      // 25+ pitches or 2+ innings
  consecutiveDays: number;
  daysRest: number;
  velocityTrend: number;          // mph change from baseline
  armHealthScore: number;         // 0-100 (100=fresh)
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  maxAvailablePitches: number;
  recommendation: string;
}

export interface BullpenHealthData {
  teamName: string;
  overallBullpenHealth: number;   // 0-100
  freshArms: number;
  taxedArms: number;
  unavailable: number;
  pitchers: ArmHealthPitcher[];
  weeklyTrend: { day: string; totalPitches: number; arms: number }[];
}

export function getRiskLevelColor(risk: string): string {
  if (risk === 'low') return '#22c55e';
  if (risk === 'moderate') return '#f59e0b';
  if (risk === 'elevated') return '#ef4444';
  return '#dc2626';
}

export function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#dc2626';
}

export function generateDemoBullpenHealth(): BullpenHealthData {
  return {
    teamName: 'San Francisco Giants',
    overallBullpenHealth: 72,
    freshArms: 4,
    taxedArms: 2,
    unavailable: 1,
    pitchers: [
      { name: 'Camilo Doval', role: 'CL', throws: 'R', pitchesLast3Days: 0, pitchesLast7Days: 42, pitchesLast30Days: 165, highStressOutings: 3, consecutiveDays: 0, daysRest: 2, velocityTrend: -0.3, armHealthScore: 85, riskLevel: 'low', maxAvailablePitches: 25, recommendation: 'Available — fully rested. Use up to 25 pitches.' },
      { name: 'Tyler Rogers', role: 'SU', throws: 'R', pitchesLast3Days: 35, pitchesLast7Days: 58, pitchesLast30Days: 180, highStressOutings: 5, consecutiveDays: 2, daysRest: 0, velocityTrend: -0.8, armHealthScore: 42, riskLevel: 'elevated', maxAvailablePitches: 15, recommendation: 'USE WITH CAUTION — 2 straight days, velo dropping. Limit to 1 batter or 15 pitches.' },
      { name: 'Sean Manaea', role: 'MR', throws: 'L', pitchesLast3Days: 0, pitchesLast7Days: 22, pitchesLast30Days: 110, highStressOutings: 1, consecutiveDays: 0, daysRest: 3, velocityTrend: 0.2, armHealthScore: 92, riskLevel: 'low', maxAvailablePitches: 35, recommendation: 'Fully available — rested 3 days, fresh arm. Can go multi-inning.' },
      { name: 'Ryan Walker', role: 'MR', throws: 'R', pitchesLast3Days: 28, pitchesLast7Days: 65, pitchesLast30Days: 195, highStressOutings: 6, consecutiveDays: 1, daysRest: 0, velocityTrend: -1.2, armHealthScore: 28, riskLevel: 'high', maxAvailablePitches: 0, recommendation: 'UNAVAILABLE — Max workload reached. Velocity down 1.2 mph. Need day off.' },
      { name: 'Luke Jackson', role: 'MR', throws: 'R', pitchesLast3Days: 15, pitchesLast7Days: 30, pitchesLast30Days: 120, highStressOutings: 2, consecutiveDays: 0, daysRest: 1, velocityTrend: 0, armHealthScore: 75, riskLevel: 'moderate', maxAvailablePitches: 20, recommendation: 'Available but monitor workload. 1 day rest, moderate usage.' },
      { name: 'Scott Alexander', role: 'LOOGY', throws: 'L', pitchesLast3Days: 0, pitchesLast7Days: 18, pitchesLast30Days: 85, highStressOutings: 0, consecutiveDays: 0, daysRest: 2, velocityTrend: 0.1, armHealthScore: 90, riskLevel: 'low', maxAvailablePitches: 20, recommendation: 'Available — specialist role, light workload. Ready for L-on-L matchups.' },
      { name: 'Alex Cobb', role: 'LR', throws: 'R', pitchesLast3Days: 0, pitchesLast7Days: 45, pitchesLast30Days: 140, highStressOutings: 2, consecutiveDays: 0, daysRest: 2, velocityTrend: -0.1, armHealthScore: 80, riskLevel: 'low', maxAvailablePitches: 40, recommendation: 'Available for long relief — 2 days rest, can go 2-3 innings.' },
    ],
    weeklyTrend: [
      { day: 'Mon', totalPitches: 45, arms: 3 },
      { day: 'Tue', totalPitches: 62, arms: 4 },
      { day: 'Wed', totalPitches: 38, arms: 2 },
      { day: 'Thu', totalPitches: 55, arms: 3 },
      { day: 'Fri', totalPitches: 78, arms: 5 },
      { day: 'Sat', totalPitches: 42, arms: 3 },
      { day: 'Sun', totalPitches: 0, arms: 0 },
    ],
  };
}
