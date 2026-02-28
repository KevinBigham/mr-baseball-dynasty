// ─── Playoff Bracket Tree ─────────────────────────────────────────────────
// Baseball postseason bracket visualization with 4 rounds.

export type PlayoffRound = 'wildcard' | 'division' | 'championship' | 'worldseries';

export interface BracketTeam {
  id: number;
  abbr: string;
  seed: number;
  wins: number;
  losses: number;
  icon: string;
}

export interface BracketMatchup {
  round: PlayoffRound;
  homeTeam: BracketTeam;
  awayTeam: BracketTeam;
  homeWins: number;
  awayWins: number;
  seriesLength: number;
  played: boolean;
  winnerId: number | null;
  conference: 'AL' | 'NL';
}

export interface BracketTree {
  wildcard: BracketMatchup[];
  division: BracketMatchup[];
  championship: BracketMatchup[];
  worldseries: BracketMatchup[];
}

export const ROUND_DISPLAY: Record<PlayoffRound, { label: string; color: string; seriesLength: number }> = {
  wildcard:     { label: 'Wild Card', color: '#94a3b8', seriesLength: 3 },
  division:     { label: 'Division Series', color: '#3b82f6', seriesLength: 5 },
  championship: { label: 'Championship Series', color: '#f59e0b', seriesLength: 7 },
  worldseries:  { label: 'World Series', color: '#ef4444', seriesLength: 7 },
};

export function getSeriesStatus(m: BracketMatchup): string {
  if (!m.played) return 'Upcoming';
  const needed = Math.ceil(m.seriesLength / 2);
  if (m.homeWins >= needed) return `${m.homeTeam.abbr} wins ${m.homeWins}-${m.awayWins}`;
  if (m.awayWins >= needed) return `${m.awayTeam.abbr} wins ${m.awayWins}-${m.homeWins}`;
  return `Tied ${m.homeWins}-${m.awayWins}`;
}

export function isSeriesOver(m: BracketMatchup): boolean {
  const needed = Math.ceil(m.seriesLength / 2);
  return m.homeWins >= needed || m.awayWins >= needed;
}

// ─── Demo bracket ─────────────────────────────────────────────────────────

function makeTeam(id: number, abbr: string, seed: number, w: number, l: number): BracketTeam {
  return { id, abbr, seed, wins: w, losses: l, icon: '⚾' };
}

export function generateDemoBracket(): BracketTree {
  // AL teams
  const hou = makeTeam(1, 'HOU', 1, 98, 64);
  const nyy = makeTeam(2, 'NYY', 2, 95, 67);
  const cle = makeTeam(3, 'CLE', 3, 92, 70);
  const bal = makeTeam(4, 'BAL', 4, 89, 73);
  const tex = makeTeam(5, 'TEX', 5, 87, 75);
  const min = makeTeam(6, 'MIN', 6, 85, 77);

  // NL teams
  const lad = makeTeam(7, 'LAD', 1, 100, 62);
  const atl = makeTeam(8, 'ATL', 2, 96, 66);
  const phi = makeTeam(9, 'PHI', 3, 90, 72);
  const mil = makeTeam(10, 'MIL', 4, 88, 74);
  const ari = makeTeam(11, 'ARI', 5, 86, 76);
  const mia = makeTeam(12, 'MIA', 6, 84, 78);

  return {
    wildcard: [
      { round: 'wildcard', homeTeam: bal, awayTeam: min, homeWins: 2, awayWins: 1, seriesLength: 3, played: true, winnerId: 4, conference: 'AL' },
      { round: 'wildcard', homeTeam: tex, awayTeam: cle, homeWins: 2, awayWins: 0, seriesLength: 3, played: true, winnerId: 5, conference: 'AL' },
      { round: 'wildcard', homeTeam: mil, awayTeam: mia, homeWins: 2, awayWins: 0, seriesLength: 3, played: true, winnerId: 10, conference: 'NL' },
      { round: 'wildcard', homeTeam: ari, awayTeam: phi, homeWins: 1, awayWins: 2, seriesLength: 3, played: true, winnerId: 9, conference: 'NL' },
    ],
    division: [
      { round: 'division', homeTeam: hou, awayTeam: bal, homeWins: 3, awayWins: 1, seriesLength: 5, played: true, winnerId: 1, conference: 'AL' },
      { round: 'division', homeTeam: nyy, awayTeam: tex, homeWins: 2, awayWins: 3, seriesLength: 5, played: true, winnerId: 5, conference: 'AL' },
      { round: 'division', homeTeam: lad, awayTeam: mil, homeWins: 3, awayWins: 0, seriesLength: 5, played: true, winnerId: 7, conference: 'NL' },
      { round: 'division', homeTeam: atl, awayTeam: phi, homeWins: 2, awayWins: 3, seriesLength: 5, played: true, winnerId: 9, conference: 'NL' },
    ],
    championship: [
      { round: 'championship', homeTeam: hou, awayTeam: tex, homeWins: 4, awayWins: 3, seriesLength: 7, played: true, winnerId: 1, conference: 'AL' },
      { round: 'championship', homeTeam: lad, awayTeam: phi, homeWins: 3, awayWins: 2, seriesLength: 7, played: false, winnerId: null, conference: 'NL' },
    ],
    worldseries: [
      { round: 'worldseries', homeTeam: hou, awayTeam: lad, homeWins: 0, awayWins: 0, seriesLength: 7, played: false, winnerId: null, conference: 'AL' },
    ],
  };
}
