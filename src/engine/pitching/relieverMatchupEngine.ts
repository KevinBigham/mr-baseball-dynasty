// ── Reliever Matchup Engine ──────────────────────────────────────
// Optimal reliever selection based on batter matchups and leverage

export interface RelieverProfile {
  name: string;
  throws: 'L' | 'R';
  era: number;
  whip: number;
  kPer9: number;
  available: boolean;
  pitchCount: number;
  restDays: number;
  vsLHH: { avg: number; ops: number; kRate: number };
  vsRHH: { avg: number; ops: number; kRate: number };
  highLeverageERA: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export interface BatterMatchup {
  batterName: string;
  bats: 'L' | 'R' | 'S';
  situationOPS: number;
  bestReliever: string;
  bestRelieverAdvantage: string;
  worstReliever: string;
  worstRelieverRisk: string;
  matchupScores: { relieverName: string; score: number }[];
}

export interface RelieverMatchupData {
  teamName: string;
  inning: number;
  leverage: 'high' | 'medium' | 'low';
  score: string;
  relievers: RelieverProfile[];
  upcomingBatters: BatterMatchup[];
  recommendation: { relieverName: string; reason: string; confidence: number };
}

export function getGradeColor(grade: string): string {
  if (grade === 'A') return '#22c55e';
  if (grade === 'B') return '#3b82f6';
  if (grade === 'C') return '#f59e0b';
  return '#ef4444';
}

export function getLeverageColor(lev: string): string {
  if (lev === 'high') return '#ef4444';
  if (lev === 'medium') return '#f59e0b';
  return '#22c55e';
}

export function generateDemoRelieverMatchup(): RelieverMatchupData {
  const relievers: RelieverProfile[] = [
    {
      name: 'Camilo Doval',
      throws: 'R',
      era: 2.85,
      whip: 1.12,
      kPer9: 10.8,
      available: true,
      pitchCount: 0,
      restDays: 2,
      vsLHH: { avg: 0.210, ops: 0.620, kRate: 32.1 },
      vsRHH: { avg: 0.195, ops: 0.580, kRate: 35.4 },
      highLeverageERA: 2.10,
      grade: 'A',
    },
    {
      name: 'Tyler Rogers',
      throws: 'R',
      era: 3.42,
      whip: 1.18,
      kPer9: 7.2,
      available: true,
      pitchCount: 0,
      restDays: 1,
      vsLHH: { avg: 0.260, ops: 0.720, kRate: 18.5 },
      vsRHH: { avg: 0.195, ops: 0.540, kRate: 22.1 },
      highLeverageERA: 3.80,
      grade: 'B',
    },
    {
      name: 'Sean Manaea',
      throws: 'L',
      era: 3.15,
      whip: 1.20,
      kPer9: 9.2,
      available: true,
      pitchCount: 0,
      restDays: 1,
      vsLHH: { avg: 0.185, ops: 0.510, kRate: 30.2 },
      vsRHH: { avg: 0.248, ops: 0.710, kRate: 22.8 },
      highLeverageERA: 2.90,
      grade: 'B',
    },
    {
      name: 'Ryan Walker',
      throws: 'R',
      era: 3.68,
      whip: 1.25,
      kPer9: 8.8,
      available: false,
      pitchCount: 28,
      restDays: 0,
      vsLHH: { avg: 0.240, ops: 0.680, kRate: 24.5 },
      vsRHH: { avg: 0.218, ops: 0.620, kRate: 26.2 },
      highLeverageERA: 4.20,
      grade: 'C',
    },
  ];

  const upcomingBatters: BatterMatchup[] = [
    {
      batterName: 'Mookie Betts',
      bats: 'R',
      situationOPS: 0.850,
      bestReliever: 'Camilo Doval',
      bestRelieverAdvantage: 'Slider generates 42% whiff vs RHH',
      worstReliever: 'Tyler Rogers',
      worstRelieverRisk: 'Sits on submarine delivery, .340 career avg',
      matchupScores: [
        { relieverName: 'Camilo Doval', score: 88 },
        { relieverName: 'Sean Manaea', score: 62 },
        { relieverName: 'Tyler Rogers', score: 35 },
      ],
    },
    {
      batterName: 'Freddie Freeman',
      bats: 'L',
      situationOPS: 0.920,
      bestReliever: 'Sean Manaea',
      bestRelieverAdvantage: 'Same-side advantage; .185 avg vs LHP',
      worstReliever: 'Tyler Rogers',
      worstRelieverRisk: 'Struggles with patient LHH, .310 avg',
      matchupScores: [
        { relieverName: 'Sean Manaea', score: 82 },
        { relieverName: 'Camilo Doval', score: 72 },
        { relieverName: 'Tyler Rogers', score: 40 },
      ],
    },
    {
      batterName: 'Teoscar Hernandez',
      bats: 'R',
      situationOPS: 0.780,
      bestReliever: 'Camilo Doval',
      bestRelieverAdvantage: 'Fastball/slider combo induces chases',
      worstReliever: 'Sean Manaea',
      worstRelieverRisk: 'Crushes LHP — .290/.840 career',
      matchupScores: [
        { relieverName: 'Camilo Doval', score: 85 },
        { relieverName: 'Tyler Rogers', score: 68 },
        { relieverName: 'Sean Manaea', score: 45 },
      ],
    },
  ];

  return {
    teamName: 'San Francisco Giants',
    inning: 8,
    leverage: 'high',
    score: '4-3',
    relievers,
    upcomingBatters,
    recommendation: {
      relieverName: 'Camilo Doval',
      reason: 'Best matchup scores vs next 3 batters; fully rested; elite high-leverage ERA (2.10)',
      confidence: 92,
    },
  };
}
