// Walk Rate Leaderboard — league-wide BB% leaders with trends and eye discipline

export interface WalkRatePlayer {
  playerId: string;
  name: string;
  team: string;
  position: string;
  pa: number;
  bb: number;
  bbPct: number;
  kPct: number;
  bbkRatio: number;
  obp: number;
  ops: number;
  chasePct: number;          // swing at pitches outside zone
  zoneSwingPct: number;      // swing at pitches inside zone
  firstPitchStrikePct: number;
  monthlyBBPct: Array<{ month: string; bbPct: number }>;
  trend: 'up' | 'down' | 'stable';
  rank: number;
}

export interface WalkRateData {
  leagueAvgBBPct: number;
  leagueAvgKPct: number;
  leaders: WalkRatePlayer[];
}

export function getBBColor(bbPct: number): string {
  if (bbPct >= 14) return '#22c55e';
  if (bbPct >= 10) return '#3b82f6';
  if (bbPct >= 7) return '#f59e0b';
  return '#9ca3af';
}

export function getChaseColor(chasePct: number): string {
  if (chasePct <= 22) return '#22c55e';
  if (chasePct <= 28) return '#3b82f6';
  if (chasePct <= 34) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoWalkRate(): WalkRateData {
  const leaders: WalkRatePlayer[] = [
    { playerId: 'W1', name: 'Juan Soto', team: 'NYM', position: 'RF', pa: 420, bb: 78, bbPct: 18.6, kPct: 16.4, bbkRatio: 1.13, obp: .425, ops: .985, chasePct: 18.2, zoneSwingPct: 68.5, firstPitchStrikePct: 52.1, monthlyBBPct: [{ month: 'Apr', bbPct: 17.8 }, { month: 'May', bbPct: 19.2 }, { month: 'Jun', bbPct: 18.9 }], trend: 'up', rank: 1 },
    { playerId: 'W2', name: 'Aaron Judge', team: 'NYY', position: 'RF', pa: 415, bb: 68, bbPct: 16.4, kPct: 22.8, bbkRatio: 0.72, obp: .410, ops: 1.025, chasePct: 21.5, zoneSwingPct: 72.0, firstPitchStrikePct: 58.2, monthlyBBPct: [{ month: 'Apr', bbPct: 15.5 }, { month: 'May', bbPct: 17.0 }, { month: 'Jun', bbPct: 16.8 }], trend: 'stable', rank: 2 },
    { playerId: 'W3', name: 'Shohei Ohtani', team: 'LAD', position: 'DH', pa: 410, bb: 62, bbPct: 15.1, kPct: 21.2, bbkRatio: 0.71, obp: .395, ops: 1.015, chasePct: 23.8, zoneSwingPct: 70.2, firstPitchStrikePct: 55.8, monthlyBBPct: [{ month: 'Apr', bbPct: 14.2 }, { month: 'May', bbPct: 15.8 }, { month: 'Jun', bbPct: 15.4 }], trend: 'up', rank: 3 },
    { playerId: 'W4', name: 'Bryce Harper', team: 'PHI', position: '1B', pa: 395, bb: 58, bbPct: 14.7, kPct: 19.5, bbkRatio: 0.75, obp: .388, ops: .928, chasePct: 22.4, zoneSwingPct: 68.8, firstPitchStrikePct: 54.0, monthlyBBPct: [{ month: 'Apr', bbPct: 13.8 }, { month: 'May', bbPct: 15.2 }, { month: 'Jun', bbPct: 15.0 }], trend: 'up', rank: 4 },
    { playerId: 'W5', name: 'Freddie Freeman', team: 'LAD', position: '1B', pa: 408, bb: 56, bbPct: 13.7, kPct: 14.8, bbkRatio: 0.93, obp: .382, ops: .888, chasePct: 20.5, zoneSwingPct: 74.2, firstPitchStrikePct: 51.5, monthlyBBPct: [{ month: 'Apr', bbPct: 14.5 }, { month: 'May', bbPct: 13.2 }, { month: 'Jun', bbPct: 13.5 }], trend: 'down', rank: 5 },
    { playerId: 'W6', name: 'Gunnar Henderson', team: 'BAL', position: '3B', pa: 400, bb: 52, bbPct: 13.0, kPct: 20.2, bbkRatio: 0.64, obp: .368, ops: .912, chasePct: 25.8, zoneSwingPct: 69.5, firstPitchStrikePct: 56.5, monthlyBBPct: [{ month: 'Apr', bbPct: 12.2 }, { month: 'May', bbPct: 13.5 }, { month: 'Jun', bbPct: 13.4 }], trend: 'up', rank: 6 },
    { playerId: 'W7', name: 'Kyle Tucker', team: 'HOU', position: 'RF', pa: 390, bb: 50, bbPct: 12.8, kPct: 17.4, bbkRatio: 0.74, obp: .375, ops: .895, chasePct: 24.0, zoneSwingPct: 71.2, firstPitchStrikePct: 53.8, monthlyBBPct: [{ month: 'Apr', bbPct: 12.0 }, { month: 'May', bbPct: 13.4 }, { month: 'Jun', bbPct: 13.0 }], trend: 'stable', rank: 7 },
    { playerId: 'W8', name: 'Mookie Betts', team: 'LAD', position: '2B', pa: 385, bb: 48, bbPct: 12.5, kPct: 15.8, bbkRatio: 0.79, obp: .372, ops: .892, chasePct: 22.8, zoneSwingPct: 72.5, firstPitchStrikePct: 52.5, monthlyBBPct: [{ month: 'Apr', bbPct: 13.0 }, { month: 'May', bbPct: 12.2 }, { month: 'Jun', bbPct: 12.4 }], trend: 'down', rank: 8 },
    { playerId: 'W9', name: 'Adley Rutschman', team: 'BAL', position: 'C', pa: 378, bb: 45, bbPct: 11.9, kPct: 16.2, bbkRatio: 0.73, obp: .362, ops: .835, chasePct: 23.5, zoneSwingPct: 70.8, firstPitchStrikePct: 50.8, monthlyBBPct: [{ month: 'Apr', bbPct: 11.5 }, { month: 'May', bbPct: 12.2 }, { month: 'Jun', bbPct: 12.0 }], trend: 'stable', rank: 9 },
    { playerId: 'W10', name: 'Francisco Lindor', team: 'NYM', position: 'SS', pa: 405, bb: 46, bbPct: 11.4, kPct: 18.0, bbkRatio: 0.63, obp: .355, ops: .845, chasePct: 26.2, zoneSwingPct: 73.0, firstPitchStrikePct: 57.0, monthlyBBPct: [{ month: 'Apr', bbPct: 10.8 }, { month: 'May', bbPct: 11.8 }, { month: 'Jun', bbPct: 11.5 }], trend: 'up', rank: 10 },
  ];

  return { leagueAvgBBPct: 8.5, leagueAvgKPct: 22.4, leaders };
}
