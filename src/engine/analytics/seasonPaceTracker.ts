/**
 * seasonPaceTracker.ts – Season Pace Tracker
 *
 * Projects a team's final record based on current win pace.
 * Includes Pythagorean expected wins, run differential,
 * strength of schedule, and playoff/division-lead pace analysis.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface PaceProjection {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  currentPace: number;
  projectedWins: number;
  projectedLosses: number;
  gamesRemaining: number;
  playoffPace: boolean;
  divisionLeadPace: number;
  runDiff: number;
  pythagWins: number;
  strengthOfSchedule: number;
}

// ── Logic ──────────────────────────────────────────────────────────────────

export function calculatePace(wins: number, losses: number): number {
  const gamesPlayed = wins + losses;
  if (gamesPlayed === 0) return 0;
  return Math.round((wins / gamesPlayed) * 162);
}

export function calculatePythagWins(runsScored: number, runsAllowed: number, gamesPlayed: number): number {
  const expo = 1.83;
  const pythPct = Math.pow(runsScored, expo) / (Math.pow(runsScored, expo) + Math.pow(runsAllowed, expo));
  return Math.round(pythPct * (162 / gamesPlayed) * gamesPlayed);
}

export function getPaceSummary(projections: PaceProjection[]) {
  const n = projections.length;
  const playoffTeams = projections.filter(p => p.playoffPace).length;
  const avgPace = Math.round(projections.reduce((s, p) => s + p.currentPace, 0) / n);
  const bestPace = projections.reduce((best, p) => p.currentPace > best.currentPace ? p : best);
  const worstPace = projections.reduce((worst, p) => p.currentPace < worst.currentPace ? p : worst);
  const avgRunDiff = Math.round(projections.reduce((s, p) => s + p.runDiff, 0) / n);

  return {
    playoffTeams,
    avgPace,
    bestTeam: bestPace.teamName,
    bestPace: bestPace.currentPace,
    worstTeam: worstPace.teamName,
    worstPace: worstPace.currentPace,
    avgRunDiff,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface TeamSeed {
  id: string;
  team: string;
  w: number;
  l: number;
  rd: number;
  sos: number;
}

const TEAM_SEEDS: TeamSeed[] = [
  { id: 'LAD', team: 'Los Angeles Dodgers',    w: 72, l: 40, rd: 148,  sos: 0.508 },
  { id: 'PHI', team: 'Philadelphia Phillies',   w: 68, l: 44, rd: 105,  sos: 0.495 },
  { id: 'BAL', team: 'Baltimore Orioles',       w: 67, l: 45, rd: 112,  sos: 0.488 },
  { id: 'NYY', team: 'New York Yankees',        w: 66, l: 46, rd: 88,   sos: 0.502 },
  { id: 'CLE', team: 'Cleveland Guardians',     w: 64, l: 48, rd: 72,   sos: 0.485 },
  { id: 'MIL', team: 'Milwaukee Brewers',       w: 63, l: 49, rd: 55,   sos: 0.492 },
  { id: 'ATL', team: 'Atlanta Braves',          w: 62, l: 50, rd: 68,   sos: 0.498 },
  { id: 'HOU', team: 'Houston Astros',          w: 60, l: 52, rd: 42,   sos: 0.510 },
  { id: 'MIN', team: 'Minnesota Twins',         w: 59, l: 53, rd: 35,   sos: 0.496 },
  { id: 'SD',  team: 'San Diego Padres',        w: 58, l: 54, rd: 28,   sos: 0.505 },
  { id: 'SEA', team: 'Seattle Mariners',        w: 57, l: 55, rd: 10,   sos: 0.498 },
  { id: 'BOS', team: 'Boston Red Sox',          w: 56, l: 56, rd: -5,   sos: 0.504 },
  { id: 'TB',  team: 'Tampa Bay Rays',          w: 55, l: 57, rd: -12,  sos: 0.501 },
  { id: 'KC',  team: 'Kansas City Royals',      w: 54, l: 58, rd: -18,  sos: 0.494 },
  { id: 'ARI', team: 'Arizona Diamondbacks',    w: 53, l: 59, rd: -25,  sos: 0.506 },
  { id: 'SF',  team: 'San Francisco Giants',    w: 52, l: 60, rd: -32,  sos: 0.502 },
  { id: 'TEX', team: 'Texas Rangers',           w: 51, l: 61, rd: -38,  sos: 0.508 },
  { id: 'CHC', team: 'Chicago Cubs',            w: 50, l: 62, rd: -45,  sos: 0.495 },
  { id: 'CIN', team: 'Cincinnati Reds',         w: 49, l: 63, rd: -55,  sos: 0.492 },
  { id: 'DET', team: 'Detroit Tigers',          w: 48, l: 64, rd: -60,  sos: 0.488 },
  { id: 'STL', team: 'St. Louis Cardinals',     w: 47, l: 65, rd: -68,  sos: 0.498 },
  { id: 'PIT', team: 'Pittsburgh Pirates',      w: 46, l: 66, rd: -72,  sos: 0.496 },
  { id: 'NYM', team: 'New York Mets',           w: 45, l: 67, rd: -80,  sos: 0.510 },
  { id: 'TOR', team: 'Toronto Blue Jays',       w: 44, l: 68, rd: -85,  sos: 0.505 },
  { id: 'LAA', team: 'Los Angeles Angels',      w: 43, l: 69, rd: -92,  sos: 0.502 },
  { id: 'MIA', team: 'Miami Marlins',           w: 40, l: 72, rd: -110, sos: 0.498 },
  { id: 'OAK', team: 'Oakland Athletics',       w: 38, l: 74, rd: -125, sos: 0.504 },
  { id: 'CHW', team: 'Chicago White Sox',       w: 34, l: 78, rd: -155, sos: 0.496 },
  { id: 'COL', team: 'Colorado Rockies',        w: 36, l: 76, rd: -140, sos: 0.510 },
  { id: 'WSH', team: 'Washington Nationals',    w: 42, l: 70, rd: -98,  sos: 0.492 },
];

export function generateDemoSeasonPace(): PaceProjection[] {
  return TEAM_SEEDS
    .sort((a, b) => {
      const pctA = a.w / (a.w + a.l);
      const pctB = b.w / (b.w + b.l);
      return pctB - pctA;
    })
    .map(s => {
      const gp = s.w + s.l;
      const remaining = 162 - gp;
      const winPct = s.w / gp;
      const pace = Math.round(winPct * 162);
      const projW = Math.round(s.w + winPct * remaining);
      const projL = 162 - projW;

      // Pythagorean wins
      const rsPerG = (s.rd > 0 ? 4.5 + s.rd / gp : 4.5 + s.rd / gp);
      const raPerG = rsPerG - s.rd / gp;
      const rs = rsPerG * gp;
      const ra = raPerG * gp;
      const expo = 1.83;
      const pythPct = Math.pow(rs, expo) / (Math.pow(rs, expo) + Math.pow(ra, expo));
      const pythW = Math.round(pythPct * 162);

      // Division lead pace: +/- games from 95 win pace (approximate division winner threshold)
      const divLeadPace = Math.round((pace - 95) * 10) / 10;

      return {
        teamId: s.id,
        teamName: s.team,
        wins: s.w,
        losses: s.l,
        currentPace: pace,
        projectedWins: projW,
        projectedLosses: projL,
        gamesRemaining: remaining,
        playoffPace: pace >= 88,
        divisionLeadPace: divLeadPace,
        runDiff: s.rd,
        pythagWins: pythW,
        strengthOfSchedule: s.sos,
      };
    });
}
