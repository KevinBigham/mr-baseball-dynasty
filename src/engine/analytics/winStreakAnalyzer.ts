// ── Win Streak Analyzer ──────────────────────────────────────────
// Analyzes team winning/losing streaks with contributing factors

export interface StreakGame {
  opponent: string;
  result: string;        // "W 5-3" etc.
  winProbAdded: number;
  mvp: string;
  keyPlay: string;
}

export interface StreakFactor {
  factor: string;
  impact: 'major' | 'moderate' | 'minor';
  description: string;
  statChange: string;
}

export interface StreakAnalysis {
  teamName: string;
  currentStreakType: 'winning' | 'losing';
  currentStreakLength: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  streakGames: StreakGame[];
  contributingFactors: StreakFactor[];
  projectedEnd: number;     // games until projected end
  historicalComps: { season: string; streak: number; outcome: string }[];
  streakImpact: { stat: string; duringStreak: number; seasonAvg: number }[];
}

export function getStreakColor(type: 'winning' | 'losing'): string {
  return type === 'winning' ? '#22c55e' : '#ef4444';
}

export function getImpactColor(impact: 'major' | 'moderate' | 'minor'): string {
  if (impact === 'major') return '#22c55e';
  if (impact === 'moderate') return '#f59e0b';
  return '#6b7280';
}

export function generateDemoWinStreakAnalysis(): StreakAnalysis {
  return {
    teamName: 'San Francisco Giants',
    currentStreakType: 'winning',
    currentStreakLength: 7,
    longestWinStreak: 11,
    longestLoseStreak: 5,
    streakGames: [
      { opponent: 'LAD', result: 'W 5-3', winProbAdded: 0.22, mvp: 'Carlos Delgado Jr.', keyPlay: '3-run HR in 6th' },
      { opponent: 'LAD', result: 'W 3-1', winProbAdded: 0.18, mvp: 'Alejandro Vega', keyPlay: '7 IP, 1 ER, 10 K' },
      { opponent: 'LAD', result: 'W 8-2', winProbAdded: 0.35, mvp: 'Terrence Baylor', keyPlay: '2 HR, 5 RBI' },
      { opponent: 'ARI', result: 'W 4-3', winProbAdded: 0.42, mvp: 'Marcus Webb', keyPlay: 'Walk-off single in 9th' },
      { opponent: 'ARI', result: 'W 6-5', winProbAdded: 0.38, mvp: 'Tony Reyes', keyPlay: 'Grand slam in 7th' },
      { opponent: 'COL', result: 'W 7-4', winProbAdded: 0.15, mvp: 'Derek Palmer', keyPlay: '4-for-4 with 3 2B' },
      { opponent: 'COL', result: 'W 2-1', winProbAdded: 0.28, mvp: 'Ryan Whitaker', keyPlay: '8 IP, 1 ER, 8 K' },
    ],
    contributingFactors: [
      { factor: 'Starting Pitching', impact: 'major', description: 'Rotation posting 2.45 ERA during streak', statChange: 'ERA: 3.82 → 2.45' },
      { factor: 'Clutch Hitting', impact: 'major', description: 'Team batting .312 with RISP during streak', statChange: 'RISP AVG: .248 → .312' },
      { factor: 'Bullpen', impact: 'moderate', description: 'Relievers holding leads; 2 BS vs 5 saves', statChange: 'SV%: 72% → 85%' },
      { factor: 'Defense', impact: 'minor', description: 'Clean fielding — 0.4 errors/game', statChange: 'E/G: 0.8 → 0.4' },
      { factor: 'Base Running', impact: 'moderate', description: 'Aggressive base running creating extra runs', statChange: 'SB: 4, XBT: 62%' },
    ],
    projectedEnd: 3,
    historicalComps: [
      { season: '2021', streak: 8, outcome: 'Lost to PHI; starter had bad outing' },
      { season: '2019', streak: 7, outcome: 'Extended to 11; rotation stayed dominant' },
      { season: '2023', streak: 6, outcome: 'Ended at 6 after bullpen collapse' },
    ],
    streakImpact: [
      { stat: 'Team BA', duringStreak: 0.285, seasonAvg: 0.258 },
      { stat: 'Team ERA', duringStreak: 2.45, seasonAvg: 3.82 },
      { stat: 'Runs/Game', duringStreak: 5.0, seasonAvg: 4.2 },
      { stat: 'WHIP', duringStreak: 1.08, seasonAvg: 1.28 },
      { stat: 'HR/Game', duringStreak: 1.6, seasonAvg: 1.2 },
    ],
  };
}
