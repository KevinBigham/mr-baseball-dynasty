/**
 * teamWinShares.ts – Team Win Shares Breakdown (Bill James model)
 *
 * Breaks down team wins into individual player contributions across three
 * categories: batting win shares, pitching win shares, and fielding win shares.
 * Identifies top contributors, underperformers relative to salary, and tracks
 * league-wide win share leaders.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface PlayerWinShares {
  id: string;
  name: string;
  team: string;
  position: string;
  battingWS: number;
  pitchingWS: number;
  fieldingWS: number;
  totalWS: number;
  salary: number;             // $M
  costPerWS: number;          // $M per win share
  gamesPlayed: number;
  isOverperformer: boolean;   // producing above salary expectation
  isUnderperformer: boolean;  // producing below salary expectation
  valueRating: 'elite' | 'good' | 'fair' | 'poor' | 'negative';
}

export interface LeagueLeader {
  rank: number;
  name: string;
  team: string;
  position: string;
  totalWS: number;
  category: 'overall' | 'batting' | 'pitching' | 'fielding';
  categoryWS: number;
}

export interface TeamWinSharesData {
  teamName: string;
  teamAbbr: string;
  teamWins: number;
  teamLosses: number;
  totalBattingWS: number;
  totalPitchingWS: number;
  totalFieldingWS: number;
  totalWS: number;
  expectedWins: number;       // WS / 3 approximation
  players: PlayerWinShares[];
  leagueLeaders: LeagueLeader[];
  topContributor: string;
  bestValue: string;          // best cost/WS ratio
  worstValue: string;         // worst cost/WS ratio
}

// ── Display Helpers ────────────────────────────────────────────────────────

export const VALUE_DISPLAY: Record<PlayerWinShares['valueRating'], { label: string; color: string }> = {
  elite:    { label: 'Elite Value',    color: '#22c55e' },
  good:     { label: 'Good Value',     color: '#4ade80' },
  fair:     { label: 'Fair Value',     color: '#f59e0b' },
  poor:     { label: 'Poor Value',     color: '#f97316' },
  negative: { label: 'Negative Value', color: '#ef4444' },
};

export function wsColor(ws: number): string {
  if (ws >= 20) return '#22c55e';
  if (ws >= 15) return '#4ade80';
  if (ws >= 10) return '#f59e0b';
  if (ws >= 5) return '#f97316';
  return '#ef4444';
}

export function costColor(costPerWS: number): string {
  if (costPerWS <= 0.5) return '#22c55e';
  if (costPerWS <= 1.0) return '#4ade80';
  if (costPerWS <= 2.0) return '#f59e0b';
  if (costPerWS <= 4.0) return '#f97316';
  return '#ef4444';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface WinSharesSummary {
  teamWins: number;
  totalWS: number;
  battingPct: number;
  pitchingPct: number;
  fieldingPct: number;
  topContributor: string;
  topContributorWS: number;
  bestValuePlayer: string;
  worstValuePlayer: string;
  avgCostPerWS: number;
}

export function getWinSharesSummary(data: TeamWinSharesData): WinSharesSummary {
  const sorted = [...data.players].sort((a, b) => b.totalWS - a.totalWS);
  const byCost = [...data.players].filter(p => p.salary > 0).sort((a, b) => a.costPerWS - b.costPerWS);
  const worstCost = [...data.players].filter(p => p.salary > 1).sort((a, b) => b.costPerWS - a.costPerWS);
  const totalSalary = data.players.reduce((s, p) => s + p.salary, 0);

  return {
    teamWins: data.teamWins,
    totalWS: data.totalWS,
    battingPct: Math.round((data.totalBattingWS / data.totalWS) * 100),
    pitchingPct: Math.round((data.totalPitchingWS / data.totalWS) * 100),
    fieldingPct: Math.round((data.totalFieldingWS / data.totalWS) * 100),
    topContributor: sorted[0]?.name ?? '-',
    topContributorWS: sorted[0]?.totalWS ?? 0,
    bestValuePlayer: byCost[0]?.name ?? '-',
    worstValuePlayer: worstCost[0]?.name ?? '-',
    avgCostPerWS: Math.round((totalSalary / data.totalWS) * 100) / 100,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function calcValueRating(costPerWS: number, totalWS: number): PlayerWinShares['valueRating'] {
  if (totalWS <= 0) return 'negative';
  if (costPerWS <= 0.4) return 'elite';
  if (costPerWS <= 1.0) return 'good';
  if (costPerWS <= 2.5) return 'fair';
  if (costPerWS <= 5.0) return 'poor';
  return 'negative';
}

export function generateDemoTeamWinShares(): TeamWinSharesData {
  const PLAYERS_RAW = [
    { name: 'Gunnar Henderson', pos: 'SS', bat: 9.2, pitch: 0, field: 2.8, salary: 0.72, gp: 158 },
    { name: 'Adley Rutschman', pos: 'C', bat: 6.8, pitch: 0, field: 3.1, salary: 0.68, gp: 142 },
    { name: 'Anthony Santander', pos: 'RF', bat: 8.4, pitch: 0, field: 1.2, salary: 3.85, gp: 155 },
    { name: 'Jordan Westburg', pos: '3B', bat: 5.9, pitch: 0, field: 2.0, salary: 0.73, gp: 148 },
    { name: 'Colton Cowser', pos: 'CF', bat: 4.6, pitch: 0, field: 2.4, salary: 0.72, gp: 139 },
    { name: 'Ryan Mountcastle', pos: '1B', bat: 4.8, pitch: 0, field: 0.6, salary: 4.60, gp: 151 },
    { name: 'Cedric Mullins', pos: 'LF', bat: 3.2, pitch: 0, field: 1.8, salary: 6.75, gp: 130 },
    { name: 'Ramon Urias', pos: 'UTIL', bat: 2.1, pitch: 0, field: 1.4, salary: 2.15, gp: 108 },
    { name: 'Jackson Holliday', pos: '2B', bat: 2.5, pitch: 0, field: 0.9, salary: 0.72, gp: 68 },
    { name: 'Corbin Burnes', pos: 'SP', bat: 0, pitch: 11.8, field: 0.4, salary: 15.64, gp: 33 },
    { name: 'Grayson Rodriguez', pos: 'SP', bat: 0, pitch: 9.2, field: 0.3, salary: 0.72, gp: 31 },
    { name: 'Dean Kremer', pos: 'SP', bat: 0, pitch: 5.8, field: 0.2, salary: 3.40, gp: 30 },
    { name: 'Cole Irvin', pos: 'SP', bat: 0, pitch: 4.1, field: 0.2, salary: 3.20, gp: 28 },
    { name: 'Kyle Bradish', pos: 'SP', bat: 0, pitch: 3.8, field: 0.1, salary: 0.72, gp: 15 },
    { name: 'Craig Kimbrel', pos: 'RP', bat: 0, pitch: 2.4, field: 0, salary: 13.00, gp: 64 },
    { name: 'Yennier Cano', pos: 'RP', bat: 0, pitch: 3.6, field: 0, salary: 0.72, gp: 68 },
    { name: 'Keegan Akin', pos: 'RP', bat: 0, pitch: 2.2, field: 0, salary: 1.80, gp: 55 },
    { name: 'Danny Coulombe', pos: 'RP', bat: 0, pitch: 1.8, field: 0, salary: 3.00, gp: 58 },
  ];

  const players: PlayerWinShares[] = PLAYERS_RAW.map((p, i) => {
    const totalWS = Math.round((p.bat + p.pitch + p.field) * 10) / 10;
    const costPerWS = totalWS > 0 ? Math.round((p.salary / totalWS) * 100) / 100 : 99.99;
    const expectedWS = p.salary * 1.2; // rough market rate: 1.2 WS per $M
    return {
      id: `ws-${i}`,
      name: p.name,
      team: 'BAL',
      position: p.pos,
      battingWS: p.bat,
      pitchingWS: p.pitch,
      fieldingWS: p.field,
      totalWS,
      salary: p.salary,
      costPerWS,
      gamesPlayed: p.gp,
      isOverperformer: totalWS > expectedWS * 1.3,
      isUnderperformer: totalWS < expectedWS * 0.5 && p.salary > 3,
      valueRating: calcValueRating(costPerWS, totalWS),
    };
  });

  const totalBat = Math.round(players.reduce((s, p) => s + p.battingWS, 0) * 10) / 10;
  const totalPitch = Math.round(players.reduce((s, p) => s + p.pitchingWS, 0) * 10) / 10;
  const totalField = Math.round(players.reduce((s, p) => s + p.fieldingWS, 0) * 10) / 10;
  const totalWS = Math.round((totalBat + totalPitch + totalField) * 10) / 10;

  const sortedByWS = [...players].sort((a, b) => b.totalWS - a.totalWS);
  const bestValue = [...players].filter(p => p.totalWS > 2).sort((a, b) => a.costPerWS - b.costPerWS);
  const worstValue = [...players].filter(p => p.salary > 2).sort((a, b) => b.costPerWS - a.costPerWS);

  const leagueLeaders: LeagueLeader[] = [
    { rank: 1, name: 'Shohei Ohtani', team: 'LAD', position: 'DH/SP', totalWS: 28.4, category: 'overall', categoryWS: 28.4 },
    { rank: 2, name: 'Aaron Judge', team: 'NYY', position: 'RF', totalWS: 26.1, category: 'overall', categoryWS: 26.1 },
    { rank: 3, name: 'Mookie Betts', team: 'LAD', position: 'SS', totalWS: 24.8, category: 'overall', categoryWS: 24.8 },
    { rank: 4, name: 'Corey Seager', team: 'TEX', position: 'SS', totalWS: 23.2, category: 'overall', categoryWS: 23.2 },
    { rank: 5, name: 'Gunnar Henderson', team: 'BAL', position: 'SS', totalWS: 12.0, category: 'overall', categoryWS: 12.0 },
    { rank: 1, name: 'Aaron Judge', team: 'NYY', position: 'RF', totalWS: 18.2, category: 'batting', categoryWS: 18.2 },
    { rank: 2, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', totalWS: 16.8, category: 'batting', categoryWS: 16.8 },
    { rank: 3, name: 'Juan Soto', team: 'NYY', position: 'LF', totalWS: 15.4, category: 'batting', categoryWS: 15.4 },
    { rank: 4, name: 'Freddie Freeman', team: 'LAD', position: '1B', totalWS: 14.6, category: 'batting', categoryWS: 14.6 },
    { rank: 5, name: 'Gunnar Henderson', team: 'BAL', position: 'SS', totalWS: 9.2, category: 'batting', categoryWS: 9.2 },
    { rank: 1, name: 'Corbin Burnes', team: 'BAL', position: 'SP', totalWS: 12.2, category: 'pitching', categoryWS: 12.2 },
    { rank: 2, name: 'Zack Wheeler', team: 'PHI', position: 'SP', totalWS: 11.8, category: 'pitching', categoryWS: 11.8 },
    { rank: 3, name: 'Gerrit Cole', team: 'NYY', position: 'SP', totalWS: 11.4, category: 'pitching', categoryWS: 11.4 },
    { rank: 4, name: 'Spencer Strider', team: 'ATL', position: 'SP', totalWS: 10.6, category: 'pitching', categoryWS: 10.6 },
    { rank: 5, name: 'Grayson Rodriguez', team: 'BAL', position: 'SP', totalWS: 9.5, category: 'pitching', categoryWS: 9.5 },
    { rank: 1, name: 'Andres Gimenez', team: 'CLE', position: '2B', totalWS: 5.2, category: 'fielding', categoryWS: 5.2 },
    { rank: 2, name: 'Nico Hoerner', team: 'CHC', position: '2B', totalWS: 4.8, category: 'fielding', categoryWS: 4.8 },
    { rank: 3, name: 'Matt Chapman', team: 'SF', position: '3B', totalWS: 4.6, category: 'fielding', categoryWS: 4.6 },
    { rank: 4, name: 'Adley Rutschman', team: 'BAL', position: 'C', totalWS: 3.1, category: 'fielding', categoryWS: 3.1 },
    { rank: 5, name: 'Gunnar Henderson', team: 'BAL', position: 'SS', totalWS: 2.8, category: 'fielding', categoryWS: 2.8 },
  ];

  return {
    teamName: 'Baltimore Orioles',
    teamAbbr: 'BAL',
    teamWins: 97,
    teamLosses: 65,
    totalBattingWS: totalBat,
    totalPitchingWS: totalPitch,
    totalFieldingWS: totalField,
    totalWS,
    expectedWins: Math.round(totalWS / 3),
    players,
    leagueLeaders,
    topContributor: sortedByWS[0]?.name ?? '-',
    bestValue: bestValue[0]?.name ?? '-',
    worstValue: worstValue[0]?.name ?? '-',
  };
}
