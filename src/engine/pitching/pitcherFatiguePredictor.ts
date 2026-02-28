// Pitcher Fatigue Predictor — predict performance decline based on workload

export interface FatiguePitcher {
  name: string;
  role: 'SP' | 'RP' | 'CL';
  inningsPitched: number;
  pitchCount: number;           // season total
  avgPitchesPerOuting: number;
  fatigueLevel: number;         // 0-100 (100 = fully fatigued)
  velocityDrop: number;         // mph decline from season start
  eraLast30: number;
  eraSeason: number;
  projectedInningsLeft: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface FatiguePredictorData {
  teamName: string;
  pitchers: FatiguePitcher[];
  teamAvgFatigue: number;
  overworkedCount: number;
}

export function getFatigueColor(fatigue: number): string {
  if (fatigue >= 80) return '#ef4444';
  if (fatigue >= 60) return '#f59e0b';
  if (fatigue >= 40) return '#3b82f6';
  return '#22c55e';
}

export function getRiskColor(risk: string): string {
  if (risk === 'critical') return '#ef4444';
  if (risk === 'high') return '#f59e0b';
  if (risk === 'medium') return '#3b82f6';
  return '#22c55e';
}

export function generateDemoFatiguePredictor(): FatiguePredictorData {
  return {
    teamName: 'San Francisco Giants',
    teamAvgFatigue: 48,
    overworkedCount: 2,
    pitchers: [
      { name: 'Javier Castillo', role: 'SP', inningsPitched: 128.2, pitchCount: 2185, avgPitchesPerOuting: 98, fatigueLevel: 62, velocityDrop: 1.2, eraLast30: 3.85, eraSeason: 3.12, projectedInningsLeft: 52, riskLevel: 'medium', recommendation: 'Consider skipping a start in August' },
      { name: 'Greg Thornton', role: 'SP', inningsPitched: 112.0, pitchCount: 1845, avgPitchesPerOuting: 88, fatigueLevel: 75, velocityDrop: 2.1, eraLast30: 4.65, eraSeason: 3.88, projectedInningsLeft: 35, riskLevel: 'high', recommendation: 'Limit to 80 pitches per start — consider bullpen role' },
      { name: 'Tyler Kim', role: 'RP', inningsPitched: 52.1, pitchCount: 825, avgPitchesPerOuting: 18, fatigueLevel: 35, velocityDrop: 0.3, eraLast30: 2.55, eraSeason: 2.88, projectedInningsLeft: 22, riskLevel: 'low', recommendation: 'Workload normal — continue current usage' },
      { name: 'Colton Braithwaite', role: 'CL', inningsPitched: 45.0, pitchCount: 710, avgPitchesPerOuting: 16, fatigueLevel: 42, velocityDrop: 0.5, eraLast30: 1.95, eraSeason: 1.82, projectedInningsLeft: 20, riskLevel: 'low', recommendation: 'Avoid back-to-back-to-back appearances' },
      { name: 'Derek Solis', role: 'RP', inningsPitched: 58.2, pitchCount: 945, avgPitchesPerOuting: 20, fatigueLevel: 55, velocityDrop: 0.8, eraLast30: 3.42, eraSeason: 2.68, projectedInningsLeft: 18, riskLevel: 'medium', recommendation: 'Day off after every 2 appearances' },
      { name: 'Marcus Rivera', role: 'RP', inningsPitched: 62.0, pitchCount: 1020, avgPitchesPerOuting: 22, fatigueLevel: 82, velocityDrop: 2.5, eraLast30: 5.10, eraSeason: 3.15, projectedInningsLeft: 12, riskLevel: 'critical', recommendation: 'Shut down for 7-10 days — IL stint recommended' },
    ],
  };
}
