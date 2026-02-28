// Historical Season Comparison — compare current season to franchise history

export interface SeasonSnapshot {
  year: number;
  wins: number;
  losses: number;
  winPct: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  teamERA: number;
  teamBA: number;
  teamOPS: number;
  mvp: string;
  cyYoung: string;
  result: string;         // e.g. 'World Series Champion', 'Lost ALCS', 'Missed Playoffs'
  gamesPlayed: number;    // how far into season (for current)
}

export interface HistoricalCompData {
  currentSeason: SeasonSnapshot;
  historicalSeasons: SeasonSnapshot[];
  closestComp: { year: number; similarity: number };
  bestSeason: { year: number; wins: number };
  worstSeason: { year: number; wins: number };
  avgWins: number;
}

export function getCompColor(similarity: number): string {
  if (similarity >= 90) return '#22c55e';
  if (similarity >= 75) return '#3b82f6';
  if (similarity >= 60) return '#f59e0b';
  return '#9ca3af';
}

export function getResultColor(result: string): string {
  if (result.includes('World Series Champion')) return '#f59e0b';
  if (result.includes('World Series') || result.includes('Pennant')) return '#3b82f6';
  if (result.includes('ALCS') || result.includes('NLCS')) return '#22c55e';
  if (result.includes('ALDS') || result.includes('NLDS') || result.includes('Wild Card')) return '#9ca3af';
  return '#ef4444';
}

export function generateDemoHistoricalComp(): HistoricalCompData {
  const historicalSeasons: SeasonSnapshot[] = [
    { year: 2023, wins: 101, losses: 61, winPct: .623, runsScored: 807, runsAllowed: 622, runDiff: 185, teamERA: 3.35, teamBA: .261, teamOPS: .778, mvp: 'Gunnar Henderson', cyYoung: 'Corbin Burnes', result: 'Lost ALDS', gamesPlayed: 162 },
    { year: 2022, wins: 83, losses: 79, winPct: .512, runsScored: 674, runsAllowed: 689, runDiff: -15, teamERA: 3.97, teamBA: .237, teamOPS: .695, mvp: 'Adley Rutschman', cyYoung: 'N/A', result: 'Missed Playoffs', gamesPlayed: 162 },
    { year: 2021, wins: 52, losses: 110, winPct: .321, runsScored: 559, runsAllowed: 799, runDiff: -240, teamERA: 5.82, teamBA: .228, teamOPS: .674, mvp: 'Cedric Mullins', cyYoung: 'N/A', result: 'Last Place', gamesPlayed: 162 },
    { year: 2020, wins: 25, losses: 35, winPct: .417, runsScored: 225, runsAllowed: 287, runDiff: -62, teamERA: 4.56, teamBA: .240, teamOPS: .716, mvp: 'Anthony Santander', cyYoung: 'N/A', result: 'Missed Playoffs (Short Season)', gamesPlayed: 60 },
    { year: 2019, wins: 54, losses: 108, winPct: .333, runsScored: 757, runsAllowed: 915, runDiff: -158, teamERA: 5.59, teamBA: .252, teamOPS: .762, mvp: 'Trey Mancini', cyYoung: 'John Means', result: 'Last Place', gamesPlayed: 162 },
    { year: 2014, wins: 96, losses: 66, winPct: .593, runsScored: 705, runsAllowed: 567, runDiff: 138, teamERA: 3.43, teamBA: .256, teamOPS: .722, mvp: 'Nelson Cruz', cyYoung: 'Chris Tillman', result: 'Lost ALCS', gamesPlayed: 162 },
    { year: 2012, wins: 93, losses: 69, winPct: .574, runsScored: 712, runsAllowed: 614, runDiff: 98, teamERA: 3.90, teamBA: .247, teamOPS: .730, mvp: 'Adam Jones', cyYoung: 'Jason Hammel', result: 'Lost ALDS', gamesPlayed: 162 },
    { year: 1983, wins: 98, losses: 64, winPct: .605, runsScored: 799, runsAllowed: 652, runDiff: 147, teamERA: 3.63, teamBA: .269, teamOPS: .745, mvp: 'Cal Ripken Jr.', cyYoung: 'Scott McGregor', result: 'World Series Champion', gamesPlayed: 162 },
    { year: 1979, wins: 102, losses: 57, winPct: .642, runsScored: 757, runsAllowed: 582, runDiff: 175, teamERA: 3.26, teamBA: .261, teamOPS: .735, mvp: 'Ken Singleton', cyYoung: 'Mike Flanagan', result: 'Lost World Series', gamesPlayed: 159 },
    { year: 1970, wins: 108, losses: 54, winPct: .667, runsScored: 792, runsAllowed: 574, runDiff: 218, teamERA: 3.15, teamBA: .257, teamOPS: .740, mvp: 'Boog Powell', cyYoung: 'Jim Palmer', result: 'World Series Champion', gamesPlayed: 162 },
  ];

  const currentSeason: SeasonSnapshot = {
    year: 2025, wins: 48, losses: 30, winPct: .615, runsScored: 412, runsAllowed: 305, runDiff: 107,
    teamERA: 3.28, teamBA: .264, teamOPS: .782, mvp: 'Gunnar Henderson', cyYoung: 'Corbin Burnes',
    result: 'In Progress — 1st Place', gamesPlayed: 78,
  };

  return {
    currentSeason,
    historicalSeasons,
    closestComp: { year: 2023, similarity: 88 },
    bestSeason: { year: 1970, wins: 108 },
    worstSeason: { year: 2021, wins: 52 },
    avgWins: 80,
  };
}
