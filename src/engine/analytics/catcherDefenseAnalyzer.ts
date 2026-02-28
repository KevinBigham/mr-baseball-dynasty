// ── Catcher Defense Analyzer ─────────────────────────────────────
// Comprehensive catcher defense: framing, blocking, throwing, game-calling

export interface FramingData {
  totalCalled: number;
  extraStrikesEarned: number;
  framingRunsAboveAvg: number;
  bestZone: string;
  worstZone: string;
  leagueRank: number;
}

export interface BlockingData {
  wildPitches: number;
  passedBalls: number;
  totalBlockOpportunities: number;
  blockRate: number;
  runsSaved: number;
}

export interface ThrowingData {
  stolenBaseAttempts: number;
  caughtStealing: number;
  csRate: number;
  avgPopTime: number;
  bestPopTime: number;
}

export interface GameCallingData {
  staffERAWithCatcher: number;
  staffERAWithout: number;
  callingRunValue: number;
  pitcherTrust: number;      // 0-100
  sequenceGrade: 'A' | 'B' | 'C' | 'D';
}

export interface CatcherProfile {
  playerName: string;
  gamesStarted: number;
  framing: FramingData;
  blocking: BlockingData;
  throwing: ThrowingData;
  gameCalling: GameCallingData;
  totalDefensiveValue: number;   // runs above avg
  overallGrade: string;
}

export interface CatcherDefenseData {
  teamName: string;
  catchers: CatcherProfile[];
}

export function getDefGradeColor(grade: string): string {
  if (grade === 'A' || grade === 'A+') return '#22c55e';
  if (grade === 'B' || grade === 'B+') return '#3b82f6';
  if (grade === 'C' || grade === 'C+') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoCatcherDefense(): CatcherDefenseData {
  const catchers: CatcherProfile[] = [
    {
      playerName: 'Miguel Santos',
      gamesStarted: 98,
      framing: {
        totalCalled: 4250,
        extraStrikesEarned: 42,
        framingRunsAboveAvg: 8.5,
        bestZone: 'Low & Away',
        worstZone: 'Up & In',
        leagueRank: 5,
      },
      blocking: {
        wildPitches: 3,
        passedBalls: 2,
        totalBlockOpportunities: 185,
        blockRate: 97.3,
        runsSaved: 4.2,
      },
      throwing: {
        stolenBaseAttempts: 72,
        caughtStealing: 25,
        csRate: 34.7,
        avgPopTime: 1.88,
        bestPopTime: 1.82,
      },
      gameCalling: {
        staffERAWithCatcher: 3.42,
        staffERAWithout: 4.15,
        callingRunValue: 6.8,
        pitcherTrust: 88,
        sequenceGrade: 'A',
      },
      totalDefensiveValue: 19.5,
      overallGrade: 'A',
    },
    {
      playerName: 'Sam Trevino',
      gamesStarted: 62,
      framing: {
        totalCalled: 2680,
        extraStrikesEarned: 18,
        framingRunsAboveAvg: 2.1,
        bestZone: 'Up & In',
        worstZone: 'Low & Away',
        leagueRank: 14,
      },
      blocking: {
        wildPitches: 5,
        passedBalls: 4,
        totalBlockOpportunities: 115,
        blockRate: 92.2,
        runsSaved: 1.5,
      },
      throwing: {
        stolenBaseAttempts: 48,
        caughtStealing: 12,
        csRate: 25.0,
        avgPopTime: 1.98,
        bestPopTime: 1.90,
      },
      gameCalling: {
        staffERAWithCatcher: 4.05,
        staffERAWithout: 3.42,
        callingRunValue: -2.1,
        pitcherTrust: 65,
        sequenceGrade: 'C',
      },
      totalDefensiveValue: 1.5,
      overallGrade: 'C+',
    },
  ];

  return { teamName: 'San Francisco Giants', catchers };
}
