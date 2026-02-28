/**
 * postseasonHistory.ts – Postseason History Engine
 *
 * Complete franchise postseason record and memorable moments.
 * Tracks every postseason appearance, series result, round reached,
 * MVPs, and identifies the franchise's best postseason run.
 * All demo data — no sim engine changes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PostseasonRound = 'WC' | 'DS' | 'CS' | 'WS';

export interface PostseasonSeries {
  season: number;
  round: PostseasonRound;
  opponent: string;
  result: 'W' | 'L';
  gamesWon: number;
  gamesLost: number;
  mvp: string;
}

export interface PostseasonHistoryData {
  teamName: string;
  appearances: number;
  titles: number;
  series: PostseasonSeries[];
  bestRun: { season: number; result: string };
  lastAppearance: number;
}

// ── Display Maps ───────────────────────────────────────────────────────────

export const ROUND_DISPLAY: Record<PostseasonRound, { label: string; color: string; full: string }> = {
  WC: { label: 'WC',  color: '#94a3b8', full: 'Wild Card' },
  DS: { label: 'DS',  color: '#3b82f6', full: 'Division Series' },
  CS: { label: 'CS',  color: '#f59e0b', full: 'Championship Series' },
  WS: { label: 'WS',  color: '#22c55e', full: 'World Series' },
};

export function getResultColor(result: 'W' | 'L'): string {
  return result === 'W' ? '#22c55e' : '#ef4444';
}

export function getRoundWeight(round: PostseasonRound): number {
  switch (round) {
    case 'WC': return 1;
    case 'DS': return 2;
    case 'CS': return 3;
    case 'WS': return 4;
  }
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface PostseasonSummary {
  totalSeries: number;
  seriesWins: number;
  seriesLosses: number;
  winPct: number;
  worldSeriesRecord: string;
  mostCommonOpponent: string;
}

export function getPostseasonSummary(data: PostseasonHistoryData): PostseasonSummary {
  const wins = data.series.filter(s => s.result === 'W').length;
  const losses = data.series.filter(s => s.result === 'L').length;
  const wsWins = data.series.filter(s => s.round === 'WS' && s.result === 'W').length;
  const wsLosses = data.series.filter(s => s.round === 'WS' && s.result === 'L').length;

  const oppCounts: Record<string, number> = {};
  for (const s of data.series) {
    oppCounts[s.opponent] = (oppCounts[s.opponent] ?? 0) + 1;
  }
  const mostCommon = Object.entries(oppCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  return {
    totalSeries: data.series.length,
    seriesWins: wins,
    seriesLosses: losses,
    winPct: data.series.length > 0 ? Math.round((wins / data.series.length) * 1000) / 10 : 0,
    worldSeriesRecord: `${wsWins}-${wsLosses}`,
    mostCommonOpponent: mostCommon,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoPostseasonHistory(): PostseasonHistoryData {
  const series: PostseasonSeries[] = [
    // Season 1 — Wild Card exit
    { season: 1, round: 'WC', opponent: 'Atlanta Braves',       result: 'L', gamesWon: 0, gamesLost: 2, mvp: '' },
    // Season 2 — Deep run to CS
    { season: 2, round: 'WC', opponent: 'Milwaukee Brewers',    result: 'W', gamesWon: 2, gamesLost: 0, mvp: 'Marcus Bell' },
    { season: 2, round: 'DS', opponent: 'Los Angeles Dodgers',  result: 'W', gamesWon: 3, gamesLost: 2, mvp: "James O'Brien" },
    { season: 2, round: 'CS', opponent: 'Philadelphia Phillies', result: 'L', gamesWon: 2, gamesLost: 4, mvp: '' },
    // Season 3 — Championship!
    { season: 3, round: 'DS', opponent: 'San Diego Padres',     result: 'W', gamesWon: 3, gamesLost: 1, mvp: 'Carlos Reyes' },
    { season: 3, round: 'CS', opponent: 'Atlanta Braves',       result: 'W', gamesWon: 4, gamesLost: 2, mvp: 'Marcus Bell' },
    { season: 3, round: 'WS', opponent: 'Houston Astros',       result: 'W', gamesWon: 4, gamesLost: 3, mvp: 'Marcus Bell' },
    // Season 5 — Defend title attempt
    { season: 5, round: 'WC', opponent: 'Chicago Cubs',         result: 'W', gamesWon: 2, gamesLost: 1, mvp: 'David Chen' },
    { season: 5, round: 'DS', opponent: 'New York Mets',        result: 'W', gamesWon: 3, gamesLost: 2, mvp: 'Ryan Parker' },
    { season: 5, round: 'CS', opponent: 'Los Angeles Dodgers',  result: 'L', gamesWon: 3, gamesLost: 4, mvp: '' },
    // Season 7 — World Series loss
    { season: 7, round: 'DS', opponent: 'Arizona Diamondbacks',  result: 'W', gamesWon: 3, gamesLost: 0, mvp: 'Kenji Tanaka' },
    { season: 7, round: 'CS', opponent: 'Philadelphia Phillies', result: 'W', gamesWon: 4, gamesLost: 1, mvp: 'Marcus Bell' },
    { season: 7, round: 'WS', opponent: 'New York Yankees',     result: 'L', gamesWon: 2, gamesLost: 4, mvp: '' },
    // Season 8 — Current season, DS exit
    { season: 8, round: 'WC', opponent: 'St. Louis Cardinals',  result: 'W', gamesWon: 2, gamesLost: 0, mvp: 'Carlos Reyes' },
    { season: 8, round: 'DS', opponent: 'Atlanta Braves',       result: 'L', gamesWon: 1, gamesLost: 3, mvp: '' },
  ];

  const seasons = [...new Set(series.map(s => s.season))];
  const wsWins = series.filter(s => s.round === 'WS' && s.result === 'W').length;

  return {
    teamName: 'San Francisco Giants',
    appearances: seasons.length,
    titles: wsWins,
    series,
    bestRun: { season: 3, result: 'World Series Champions' },
    lastAppearance: 8,
  };
}
