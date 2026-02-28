// ── Game Script Analyzer ─────────────────────────────────────────
// Analyzes how the team performs across different game scripts

export interface GameScriptRecord {
  script: string;              // "Leading after 5", "Trailing after 5", "Tied after 5"
  games: number;
  wins: number;
  losses: number;
  winPct: number;
  avgRunsScored: number;
  avgRunsAllowed: number;
  comebackRate: number;
  blownLeadRate: number;
}

export interface InningPerformance {
  inning: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  bigInnings: number;         // 3+ runs scored
}

export interface GameScriptData {
  teamName: string;
  overallRecord: string;
  bestScript: string;
  worstScript: string;
  scripts: GameScriptRecord[];
  inningPerformance: InningPerformance[];
  closeGameRecord: string;
  blowoutRecord: string;
  extraInningRecord: string;
  onRunRecord: string;
}

export function getScriptColor(winPct: number): string {
  if (winPct >= 0.700) return '#22c55e';
  if (winPct >= 0.500) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoGameScript(): GameScriptData {
  return {
    teamName: 'San Francisco Giants',
    overallRecord: '50-40',
    bestScript: 'Leading after 5 (38-8)',
    worstScript: 'Trailing after 7 (2-22)',
    closeGameRecord: '22-18',
    blowoutRecord: '15-8',
    extraInningRecord: '4-3',
    onRunRecord: '18-12',
    scripts: [
      { script: 'Leading after 5', games: 46, wins: 38, losses: 8, winPct: 0.826, avgRunsScored: 6.2, avgRunsAllowed: 2.8, comebackRate: 0, blownLeadRate: 17.4 },
      { script: 'Trailing after 5', games: 28, wins: 6, losses: 22, winPct: 0.214, avgRunsScored: 2.5, avgRunsAllowed: 5.8, comebackRate: 21.4, blownLeadRate: 0 },
      { script: 'Tied after 5', games: 16, wins: 6, losses: 10, winPct: 0.375, avgRunsScored: 3.8, avgRunsAllowed: 4.2, comebackRate: 0, blownLeadRate: 0 },
      { script: 'Leading after 7', games: 42, wins: 40, losses: 2, winPct: 0.952, avgRunsScored: 5.8, avgRunsAllowed: 2.4, comebackRate: 0, blownLeadRate: 4.8 },
      { script: 'Trailing after 7', games: 24, wins: 2, losses: 22, winPct: 0.083, avgRunsScored: 2.2, avgRunsAllowed: 5.5, comebackRate: 8.3, blownLeadRate: 0 },
    ],
    inningPerformance: [
      { inning: 1, runsScored: 52, runsAllowed: 45, runDiff: 7, bigInnings: 8 },
      { inning: 2, runsScored: 38, runsAllowed: 35, runDiff: 3, bigInnings: 5 },
      { inning: 3, runsScored: 42, runsAllowed: 40, runDiff: 2, bigInnings: 6 },
      { inning: 4, runsScored: 48, runsAllowed: 42, runDiff: 6, bigInnings: 7 },
      { inning: 5, runsScored: 45, runsAllowed: 38, runDiff: 7, bigInnings: 6 },
      { inning: 6, runsScored: 40, runsAllowed: 48, runDiff: -8, bigInnings: 4 },
      { inning: 7, runsScored: 55, runsAllowed: 35, runDiff: 20, bigInnings: 10 },
      { inning: 8, runsScored: 38, runsAllowed: 42, runDiff: -4, bigInnings: 5 },
      { inning: 9, runsScored: 30, runsAllowed: 35, runDiff: -5, bigInnings: 3 },
    ],
  };
}
