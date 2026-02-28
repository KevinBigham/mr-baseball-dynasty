// ── Season Projection Model ─────────────────────────────────────
// Projects final season standings based on current performance + schedule

export interface ProjectedTeam {
  teamName: string;
  abbreviation: string;
  currentWins: number;
  currentLosses: number;
  projectedWins: number;
  projectedLosses: number;
  winRange: [number, number];    // 90% confidence
  divisionProb: number;
  wildcardProb: number;
  playoffProb: number;
  worldSeriesProb: number;
  strengthRemaining: number;
  magicNumber: number | null;
  eliminationNumber: number | null;
}

export interface DivisionProjection {
  division: string;
  teams: ProjectedTeam[];
}

export interface SeasonProjectionData {
  userTeam: string;
  asOfDate: string;
  gamesRemaining: number;
  divisions: DivisionProjection[];
  wildcardRace: ProjectedTeam[];
}

export function getProbColor(prob: number): string {
  if (prob >= 75) return '#22c55e';
  if (prob >= 40) return '#3b82f6';
  if (prob >= 15) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoSeasonProjection(): SeasonProjectionData {
  return {
    userTeam: 'San Francisco Giants',
    asOfDate: 'July 15',
    gamesRemaining: 72,
    divisions: [
      {
        division: 'NL West',
        teams: [
          { teamName: 'Los Angeles Dodgers', abbreviation: 'LAD', currentWins: 58, currentLosses: 32, projectedWins: 102, projectedLosses: 60, winRange: [96, 108], divisionProb: 88.5, wildcardProb: 10.2, playoffProb: 98.7, worldSeriesProb: 22.4, strengthRemaining: 0.498, magicNumber: 45, eliminationNumber: null },
          { teamName: 'San Francisco Giants', abbreviation: 'SFG', currentWins: 50, currentLosses: 40, projectedWins: 90, projectedLosses: 72, winRange: [84, 96], divisionProb: 8.5, wildcardProb: 52.8, playoffProb: 61.3, worldSeriesProb: 8.2, strengthRemaining: 0.505, magicNumber: null, eliminationNumber: 55 },
          { teamName: 'San Diego Padres', abbreviation: 'SDP', currentWins: 48, currentLosses: 42, projectedWins: 87, projectedLosses: 75, winRange: [81, 93], divisionProb: 2.5, wildcardProb: 35.2, playoffProb: 37.7, worldSeriesProb: 4.5, strengthRemaining: 0.510, magicNumber: null, eliminationNumber: 50 },
          { teamName: 'Arizona Diamondbacks', abbreviation: 'ARI', currentWins: 45, currentLosses: 45, projectedWins: 82, projectedLosses: 80, winRange: [76, 88], divisionProb: 0.5, wildcardProb: 12.5, playoffProb: 13.0, worldSeriesProb: 1.2, strengthRemaining: 0.502, magicNumber: null, eliminationNumber: 42 },
          { teamName: 'Colorado Rockies', abbreviation: 'COL', currentWins: 30, currentLosses: 60, projectedWins: 58, projectedLosses: 104, winRange: [52, 64], divisionProb: 0.0, wildcardProb: 0.0, playoffProb: 0.0, worldSeriesProb: 0.0, strengthRemaining: 0.520, magicNumber: null, eliminationNumber: 3 },
        ],
      },
    ],
    wildcardRace: [
      { teamName: 'San Francisco Giants', abbreviation: 'SFG', currentWins: 50, currentLosses: 40, projectedWins: 90, projectedLosses: 72, winRange: [84, 96], divisionProb: 8.5, wildcardProb: 52.8, playoffProb: 61.3, worldSeriesProb: 8.2, strengthRemaining: 0.505, magicNumber: null, eliminationNumber: 55 },
      { teamName: 'Chicago Cubs', abbreviation: 'CHC', currentWins: 48, currentLosses: 42, projectedWins: 86, projectedLosses: 76, winRange: [80, 92], divisionProb: 5.0, wildcardProb: 30.5, playoffProb: 35.5, worldSeriesProb: 2.8, strengthRemaining: 0.488, magicNumber: null, eliminationNumber: 48 },
      { teamName: 'New York Mets', abbreviation: 'NYM', currentWins: 47, currentLosses: 43, projectedWins: 85, projectedLosses: 77, winRange: [79, 91], divisionProb: 3.2, wildcardProb: 28.0, playoffProb: 31.2, worldSeriesProb: 3.5, strengthRemaining: 0.502, magicNumber: null, eliminationNumber: 46 },
    ],
  };
}
