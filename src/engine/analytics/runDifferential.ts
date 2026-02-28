/**
 * Run Differential Trends
 *
 * Tracks run differential over time, expected vs actual wins,
 * pythagorean record, and identifies hot/cold streaks in
 * scoring and run prevention.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TrendDirection = 'surging' | 'rising' | 'steady' | 'falling' | 'slumping';

export const TREND_DISPLAY: Record<TrendDirection, { label: string; emoji: string; color: string }> = {
  surging:  { label: 'Surging',  emoji: '🚀', color: '#22c55e' },
  rising:   { label: 'Rising',   emoji: '📈', color: '#3b82f6' },
  steady:   { label: 'Steady',   emoji: '➡️', color: '#6b7280' },
  falling:  { label: 'Falling',  emoji: '📉', color: '#f97316' },
  slumping: { label: 'Slumping', emoji: '💀', color: '#ef4444' },
};

export interface TeamRunDiff {
  id: number;
  teamName: string;
  abbr: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  runDiffPerGame: number;
  pythWins: number;
  pythLosses: number;
  pythDiff: number;         // actual wins - pythag wins (luck factor)
  last10RunDiff: number;
  last30RunDiff: number;
  trend: TrendDirection;
  offenseRank: number;      // 1-30
  defenseRank: number;      // 1-30
  blowoutWins: number;      // won by 5+
  closeWins: number;        // won by 1
  closeLosses: number;      // lost by 1
  oneRunRecord: string;     // e.g. "22-15"
}

export interface RunDiffSummary {
  teamRunDiff: number;
  teamRDPerGame: number;
  pythWins: number;
  luckFactor: number;
  offenseRank: number;
  defenseRank: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function calcPythag(rs: number, ra: number, games: number): { wins: number; losses: number } {
  const exp = 1.83; // baseball exponent
  const winPct = Math.pow(rs, exp) / (Math.pow(rs, exp) + Math.pow(ra, exp));
  const wins = Math.round(winPct * games);
  return { wins, losses: games - wins };
}

export function getTrend(last10RD: number, last30RD: number): TrendDirection {
  if (last10RD >= 15) return 'surging';
  if (last10RD >= 5) return 'rising';
  if (last10RD >= -5) return 'steady';
  if (last10RD >= -15) return 'falling';
  return 'slumping';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoRunDiff(): TeamRunDiff[] {
  const teams = [
    { name: 'Los Angeles Dodgers',   abbr: 'LAD', w: 88, l: 52, rs: 680, ra: 530, l10: 22, l30: 48, bw: 18, cw: 15, cl: 8 },
    { name: 'Atlanta Braves',        abbr: 'ATL', w: 85, l: 55, rs: 660, ra: 545, l10: 15, l30: 35, bw: 16, cw: 18, cl: 12 },
    { name: 'Baltimore Orioles',     abbr: 'BAL', w: 82, l: 58, rs: 620, ra: 520, l10: 8,  l30: 22, bw: 14, cw: 20, cl: 10 },
    { name: 'Philadelphia Phillies', abbr: 'PHI', w: 80, l: 60, rs: 640, ra: 560, l10: 12, l30: 28, bw: 15, cw: 16, cl: 14 },
    { name: 'Houston Astros',        abbr: 'HOU', w: 78, l: 62, rs: 610, ra: 555, l10: -2, l30: 10, bw: 12, cw: 22, cl: 18 },
    { name: 'Minnesota Twins',       abbr: 'MIN', w: 76, l: 64, rs: 600, ra: 570, l10: 5,  l30: 8,  bw: 10, cw: 18, cl: 15 },
    { name: 'Texas Rangers',         abbr: 'TEX', w: 74, l: 66, rs: 590, ra: 575, l10: -8, l30: -5, bw: 11, cw: 14, cl: 16 },
    { name: 'Tampa Bay Rays',        abbr: 'TB',  w: 73, l: 67, rs: 560, ra: 540, l10: 3,  l30: 5,  bw: 8,  cw: 20, cl: 18 },
    { name: 'Seattle Mariners',      abbr: 'SEA', w: 72, l: 68, rs: 530, ra: 520, l10: -5, l30: -12,bw: 6,  cw: 25, cl: 22 },
    { name: 'Chicago Cubs',          abbr: 'CHC', w: 68, l: 72, rs: 550, ra: 580, l10: -12,l30: -20,bw: 9,  cw: 12, cl: 18 },
    { name: 'New York Mets',         abbr: 'NYM', w: 65, l: 75, rs: 540, ra: 600, l10: -18,l30: -35,bw: 7,  cw: 10, cl: 20 },
    { name: 'Colorado Rockies',      abbr: 'COL', w: 55, l: 85, rs: 510, ra: 660, l10: -20,l30: -48,bw: 5,  cw: 8,  cl: 22 },
  ];

  return teams.map((t, i) => {
    const games = t.w + t.l;
    const rd = t.rs - t.ra;
    const pyth = calcPythag(t.rs, t.ra, games);
    const rdPerGame = Math.round((rd / games) * 100) / 100;
    const oRank = teams.sort((a, b) => b.rs - a.rs).findIndex(x => x.abbr === t.abbr) + 1;
    const dRank = teams.sort((a, b) => a.ra - b.ra).findIndex(x => x.abbr === t.abbr) + 1;
    return {
      id: i,
      teamName: t.name,
      abbr: t.abbr,
      wins: t.w,
      losses: t.l,
      runsScored: t.rs,
      runsAllowed: t.ra,
      runDiff: rd,
      runDiffPerGame: rdPerGame,
      pythWins: pyth.wins,
      pythLosses: pyth.losses,
      pythDiff: t.w - pyth.wins,
      last10RunDiff: t.l10,
      last30RunDiff: t.l30,
      trend: getTrend(t.l10, t.l30),
      offenseRank: oRank,
      defenseRank: dRank,
      blowoutWins: t.bw,
      closeWins: t.cw,
      closeLosses: t.cl,
      oneRunRecord: `${t.cw}-${t.cl}`,
    };
  }).sort((a, b) => b.runDiff - a.runDiff);
}
