// ── Base Running Efficiency ──────────────────────────────────────
// Comprehensive base running evaluation beyond stolen bases

export interface BaseRunningPlayer {
  playerName: string;
  position: string;
  speed: number;            // 20-80
  stolenBases: number;
  caughtStealing: number;
  sbSuccess: number;        // pct
  extraBasesTaken: number;
  extraBasesOpps: number;
  extraBasePct: number;
  firstToThirdPct: number;
  scoreFromSecondPct: number;
  outsMadeOnBases: number;
  baseRunningRuns: number;  // BRR
  overallGrade: string;
}

export interface BaseRunningData {
  teamName: string;
  teamBRR: number;
  leagueRank: number;
  players: BaseRunningPlayer[];
  situationalData: { situation: string; teamRate: number; leagueAvg: number; differential: number }[];
}

export function getBRGradeColor(grade: string): string {
  if (grade === 'A' || grade === 'A+') return '#22c55e';
  if (grade === 'B' || grade === 'B+') return '#3b82f6';
  if (grade === 'C' || grade === 'C+') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoBaseRunning(): BaseRunningData {
  return {
    teamName: 'San Francisco Giants',
    teamBRR: 8.5,
    leagueRank: 7,
    players: [
      { playerName: 'Marcus Webb', position: 'CF', speed: 65, stolenBases: 28, caughtStealing: 5, sbSuccess: 84.8, extraBasesTaken: 22, extraBasesOpps: 30, extraBasePct: 73.3, firstToThirdPct: 58.2, scoreFromSecondPct: 65.0, outsMadeOnBases: 2, baseRunningRuns: 5.2, overallGrade: 'A' },
      { playerName: 'Julio Herrera', position: 'SS', speed: 60, stolenBases: 18, caughtStealing: 4, sbSuccess: 81.8, extraBasesTaken: 15, extraBasesOpps: 22, extraBasePct: 68.2, firstToThirdPct: 52.0, scoreFromSecondPct: 60.0, outsMadeOnBases: 3, baseRunningRuns: 3.1, overallGrade: 'B+' },
      { playerName: 'Carlos Delgado Jr.', position: 'DH', speed: 35, stolenBases: 2, caughtStealing: 1, sbSuccess: 66.7, extraBasesTaken: 8, extraBasesOpps: 18, extraBasePct: 44.4, firstToThirdPct: 28.5, scoreFromSecondPct: 42.0, outsMadeOnBases: 1, baseRunningRuns: -1.2, overallGrade: 'C-' },
      { playerName: 'Tony Reyes', position: 'RF', speed: 50, stolenBases: 8, caughtStealing: 3, sbSuccess: 72.7, extraBasesTaken: 12, extraBasesOpps: 20, extraBasePct: 60.0, firstToThirdPct: 45.0, scoreFromSecondPct: 55.0, outsMadeOnBases: 2, baseRunningRuns: 1.5, overallGrade: 'B' },
      { playerName: 'Terrence Baylor', position: '1B', speed: 30, stolenBases: 0, caughtStealing: 0, sbSuccess: 0, extraBasesTaken: 5, extraBasesOpps: 15, extraBasePct: 33.3, firstToThirdPct: 22.0, scoreFromSecondPct: 38.0, outsMadeOnBases: 0, baseRunningRuns: -2.5, overallGrade: 'D' },
      { playerName: 'Derek Palmer', position: 'LF', speed: 45, stolenBases: 5, caughtStealing: 2, sbSuccess: 71.4, extraBasesTaken: 10, extraBasesOpps: 16, extraBasePct: 62.5, firstToThirdPct: 42.0, scoreFromSecondPct: 50.0, outsMadeOnBases: 2, baseRunningRuns: 0.8, overallGrade: 'B-' },
    ],
    situationalData: [
      { situation: 'SB Success Rate', teamRate: 78.5, leagueAvg: 74.2, differential: 4.3 },
      { situation: '1st to 3rd on Single', teamRate: 44.8, leagueAvg: 42.0, differential: 2.8 },
      { situation: 'Score from 2nd on Single', teamRate: 52.5, leagueAvg: 48.0, differential: 4.5 },
      { situation: 'Extra Bases Taken %', teamRate: 58.2, leagueAvg: 55.0, differential: 3.2 },
      { situation: 'Outs on Bases per Game', teamRate: 0.35, leagueAvg: 0.42, differential: -0.07 },
    ],
  };
}
