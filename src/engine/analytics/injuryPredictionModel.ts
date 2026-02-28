// Injury Prediction Model — predict injury risk based on workload and history

export interface InjuryRiskPlayer {
  name: string;
  position: string;
  age: number;
  riskScore: number;        // 0-100
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  injuryHistory: { injury: string; year: number; missedGames: number }[];
  workloadFlag: boolean;
  keyRiskFactors: string[];
  recommendation: string;
}

export interface InjuryPredictionData {
  teamName: string;
  highRiskCount: number;
  totalPlayersTracked: number;
  players: InjuryRiskPlayer[];
}

export function getInjuryRiskColor(risk: string): string {
  if (risk === 'low') return '#22c55e';
  if (risk === 'moderate') return '#3b82f6';
  if (risk === 'elevated') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoInjuryPrediction(): InjuryPredictionData {
  return {
    teamName: 'San Francisco Giants',
    highRiskCount: 3,
    totalPlayersTracked: 6,
    players: [
      {
        name: 'Greg Thornton', position: 'SP', age: 30, riskScore: 78, riskLevel: 'high',
        workloadFlag: true, recommendation: 'Limit to 80 pitches — consider skipping starts in Sept',
        injuryHistory: [
          { injury: 'UCL sprain', year: 2024, missedGames: 45 },
          { injury: 'Shoulder inflammation', year: 2023, missedGames: 22 },
        ],
        keyRiskFactors: ['Prior UCL issues', 'Velocity decline trend', 'Innings spike vs career avg', 'Age 30+ workload concern'],
      },
      {
        name: 'Marcus Rivera', position: 'RP', age: 29, riskScore: 72, riskLevel: 'elevated',
        workloadFlag: true, recommendation: 'Mandatory rest day after every 2 appearances',
        injuryHistory: [
          { injury: 'Forearm tightness', year: 2025, missedGames: 15 },
        ],
        keyRiskFactors: ['Heavy workload — most appearances on staff', 'Recent forearm issues', 'Velocity dip in last 10 outings'],
      },
      {
        name: 'Tomas Herrera', position: '3B', age: 28, riskScore: 55, riskLevel: 'moderate',
        workloadFlag: false, recommendation: 'Monitor wrist — schedule periodic rest days',
        injuryHistory: [
          { injury: 'Wrist contusion', year: 2025, missedGames: 8 },
          { injury: 'Hamstring strain', year: 2023, missedGames: 18 },
        ],
        keyRiskFactors: ['Nagging wrist soreness', 'Previous hamstring issues', 'Bat speed decline suggests discomfort'],
      },
      {
        name: 'Victor Robles III', position: 'RF', age: 27, riskScore: 35, riskLevel: 'low',
        workloadFlag: false, recommendation: 'Workload normal — no restrictions needed',
        injuryHistory: [],
        keyRiskFactors: ['Clean injury history', 'Healthy workload levels'],
      },
      {
        name: 'Carlos Delgado Jr.', position: 'DH', age: 26, riskScore: 42, riskLevel: 'moderate',
        workloadFlag: false, recommendation: 'DH-only role managing knee load effectively',
        injuryHistory: [
          { injury: 'Knee soreness', year: 2025, missedGames: 5 },
        ],
        keyRiskFactors: ['Chronic knee management', 'DH role mitigates risk', 'Power numbers unaffected'],
      },
      {
        name: 'Jaylen Torres', position: 'SS', age: 25, riskScore: 22, riskLevel: 'low',
        workloadFlag: false, recommendation: 'No concerns — elite conditioning',
        injuryHistory: [],
        keyRiskFactors: ['Zero injury history', 'Young and durable', 'Elite physical conditioning scores'],
      },
    ],
  };
}
