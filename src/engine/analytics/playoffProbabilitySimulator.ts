// ── Playoff Probability Simulator ────────────────────────────────
// Monte Carlo playoff simulation with bracket outcomes

export interface PlayoffTeam {
  teamName: string;
  abbreviation: string;
  seed: number;
  record: string;
  overallRating: number;
  playoffExperience: number;  // 0-100
  momentum: string;           // "Hot", "Cold", "Steady"
}

export interface SeriesMatchup {
  round: string;
  team1: string;
  team2: string;
  team1WinProb: number;
  team2WinProb: number;
  keySeries: string;
  homefieldAdv: string;
}

export interface PlayoffSimResult {
  teamName: string;
  divisionSeries: number;    // % chance to win DS
  champSeries: number;       // % chance to win CS
  worldSeries: number;       // % chance to win WS
  expectedWins: number;
}

export interface PlayoffSimData {
  teamName: string;
  simulations: number;
  playoffTeams: PlayoffTeam[];
  matchups: SeriesMatchup[];
  results: PlayoffSimResult[];
  userTeamPath: string[];
}

export function getMomentumColor(m: string): string {
  if (m === 'Hot') return '#22c55e';
  if (m === 'Cold') return '#ef4444';
  return '#9ca3af';
}

export function generateDemoPlayoffSim(): PlayoffSimData {
  return {
    teamName: 'San Francisco Giants',
    simulations: 10000,
    playoffTeams: [
      { teamName: 'Los Angeles Dodgers', abbreviation: 'LAD', seed: 1, record: '102-60', overallRating: 94, playoffExperience: 95, momentum: 'Steady' },
      { teamName: 'Atlanta Braves', abbreviation: 'ATL', seed: 2, record: '98-64', overallRating: 91, playoffExperience: 88, momentum: 'Hot' },
      { teamName: 'San Francisco Giants', abbreviation: 'SFG', seed: 5, record: '90-72', overallRating: 82, playoffExperience: 65, momentum: 'Hot' },
      { teamName: 'Philadelphia Phillies', abbreviation: 'PHI', seed: 3, record: '95-67', overallRating: 88, playoffExperience: 82, momentum: 'Steady' },
      { teamName: 'Milwaukee Brewers', abbreviation: 'MIL', seed: 4, record: '92-70', overallRating: 85, playoffExperience: 55, momentum: 'Cold' },
      { teamName: 'Chicago Cubs', abbreviation: 'CHC', seed: 6, record: '88-74', overallRating: 78, playoffExperience: 45, momentum: 'Hot' },
    ],
    matchups: [
      { round: 'Wild Card', team1: 'SFG (5)', team2: 'MIL (4)', team1WinProb: 48.5, team2WinProb: 51.5, keySeries: 'Vega vs Brewers offense key matchup', homefieldAdv: 'MIL' },
      { round: 'Wild Card', team1: 'CHC (6)', team2: 'PHI (3)', team1WinProb: 35.2, team2WinProb: 64.8, keySeries: 'Cubs pitching vs Phillies power', homefieldAdv: 'PHI' },
      { round: 'NLDS', team1: 'WC1 Winner', team2: 'LAD (1)', team1WinProb: 32.0, team2WinProb: 68.0, keySeries: 'Dodgers rotation depth overwhelming', homefieldAdv: 'LAD' },
      { round: 'NLDS', team1: 'WC2 Winner', team2: 'ATL (2)', team1WinProb: 38.0, team2WinProb: 62.0, keySeries: 'Braves offense + experience edge', homefieldAdv: 'ATL' },
    ],
    results: [
      { teamName: 'Los Angeles Dodgers', divisionSeries: 72.5, champSeries: 48.2, worldSeries: 28.5, expectedWins: 8.2 },
      { teamName: 'Atlanta Braves', divisionSeries: 68.0, champSeries: 42.1, worldSeries: 22.8, expectedWins: 7.8 },
      { teamName: 'Philadelphia Phillies', divisionSeries: 58.5, champSeries: 32.5, worldSeries: 15.2, expectedWins: 6.5 },
      { teamName: 'San Francisco Giants', divisionSeries: 38.2, champSeries: 18.5, worldSeries: 8.2, expectedWins: 5.0 },
      { teamName: 'Milwaukee Brewers', divisionSeries: 35.8, champSeries: 15.2, worldSeries: 6.5, expectedWins: 4.5 },
      { teamName: 'Chicago Cubs', divisionSeries: 28.5, champSeries: 10.8, worldSeries: 4.2, expectedWins: 3.8 },
    ],
    userTeamPath: [
      'WC Round vs Milwaukee (Home: MIL) — 48.5% win',
      'NLDS vs Los Angeles (Home: LAD) — 32% if reach',
      'NLCS — depends on bracket',
      'World Series — 8.2% overall',
    ],
  };
}
