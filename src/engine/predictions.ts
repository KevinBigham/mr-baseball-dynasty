/**
 * predictions.ts — MFSN Pre-Season Predictions Engine
 *
 * Simulates a sports network pre-season show:
 *   - Projects win totals for all 30 teams
 *   - Generates analyst quotes and playoff odds
 *   - Resolves predictions against actual season results
 */

import type { StandingsRow } from '../types/league';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeamPrediction {
  teamId:        number;
  teamAbbr:      string;
  teamName:      string;
  division:      string;
  league:        string;
  predictedWins: number;
  playoffOdds:   number;    // 0–100
  wsOdds:        number;    // 0–100
  analystName:   string;
  analystQuote:  string;
  actualWins:    number | null;
  hit:           boolean | null;  // within 5 wins of prediction
}

export interface MFSNReport {
  season:      number;
  predictions: TeamPrediction[];
  resolved:    boolean;
}

// ─── Analyst pool ─────────────────────────────────────────────────────────────

const ANALYSTS = [
  'Karl Dobbs', 'Tara McAllister', 'Ray Fontaine', 'Jackie Marsh',
  'Denny Rivera', 'Lou Petrakis', 'Cassandra Bright', 'Hank Moynihan',
];

// ─── Quote generators ─────────────────────────────────────────────────────────

function getAnalystQuote(wins: number, teamAbbr: string): string {
  if (wins >= 95) {
    const pool = [
      `${teamAbbr} is built to dominate from day one. Clear World Series contender.`,
      `I'd be shocked if ${teamAbbr} doesn't win 95 games. The rotation alone wins divisions.`,
      `${teamAbbr} is the team everyone else is gunning for. For good reason.`,
    ];
    return pool[wins % pool.length];
  }
  if (wins >= 88) {
    const pool = [
      `${teamAbbr} is a legitimate playoff team. Whether they make a deep run depends on health.`,
      `Don't sleep on ${teamAbbr}. They have the depth to handle a 162-game grind.`,
      `${teamAbbr} is a quietly dangerous club. Solid in all three phases.`,
    ];
    return pool[wins % pool.length];
  }
  if (wins >= 81) {
    const pool = [
      `${teamAbbr} is right on the playoff bubble. Their rotation needs to step up.`,
      `I see ${teamAbbr} grinding to 82 wins, but the offense is a question mark.`,
      `${teamAbbr} is a .500 club that could surprise — or disappoint — depending on the kids.`,
    ];
    return pool[wins % pool.length];
  }
  if (wins >= 72) {
    const pool = [
      `${teamAbbr} is a year or two away. Good bones, but not ready to compete yet.`,
      `This is a development year for ${teamAbbr}. Don't judge them on wins alone.`,
      `${teamAbbr}'s front office made the right call to prioritize prospects over wins.`,
    ];
    return pool[wins % pool.length];
  }
  const pool = [
    `${teamAbbr} is in full tank mode. Draft board is their only scoreboard that matters.`,
    `Rough year ahead for ${teamAbbr}, but the pipeline looks promising.`,
    `${teamAbbr} fans should be excited about the future, even if this season stings.`,
  ];
  return pool[wins % pool.length];
}

// ─── Static team data ─────────────────────────────────────────────────────────

interface TeamMeta {
  teamId:   number;
  abbr:     string;
  name:     string;
  division: string;
  league:   string;
}

function getAllTeams(): TeamMeta[] {
  return [
    { teamId: 1,  abbr: 'ADM', name: 'New Harbor Admirals',         division: 'East',    league: 'AL' },
    { teamId: 2,  abbr: 'COL', name: 'Capitol City Colonials',      division: 'East',    league: 'AL' },
    { teamId: 3,  abbr: 'LOB', name: 'Boston Bay Lobsters',         division: 'East',    league: 'AL' },
    { teamId: 4,  abbr: 'STM', name: 'Steel City Steamers',         division: 'East',    league: 'AL' },
    { teamId: 5,  abbr: 'HAM', name: 'Lake City Hammers',           division: 'East',    league: 'AL' },
    { teamId: 6,  abbr: 'WLV', name: 'River City Wolves',           division: 'Central', league: 'AL' },
    { teamId: 7,  abbr: 'CRU', name: 'South City Crushers',         division: 'Central', league: 'AL' },
    { teamId: 8,  abbr: 'FOX', name: 'Prairie City Foxes',          division: 'Central', league: 'AL' },
    { teamId: 9,  abbr: 'MIN', name: 'Twin Peaks Miners',           division: 'Central', league: 'AL' },
    { teamId: 10, abbr: 'MON', name: 'Crown City Monarchs',         division: 'Central', league: 'AL' },
    { teamId: 11, abbr: 'GUL', name: 'Bay City Gulls',              division: 'West',    league: 'AL' },
    { teamId: 12, abbr: 'RAT', name: 'Desert City Rattlers',        division: 'West',    league: 'AL' },
    { teamId: 13, abbr: 'COU', name: 'Sun Valley Cougars',          division: 'West',    league: 'AL' },
    { teamId: 14, abbr: 'LUM', name: 'Northwest City Lumberjacks',  division: 'West',    league: 'AL' },
    { teamId: 15, abbr: 'ANG', name: 'Anaheim Hills Angels',        division: 'West',    league: 'AL' },
    { teamId: 16, abbr: 'MET', name: 'New Harbor Metros',           division: 'East',    league: 'NL' },
    { teamId: 17, abbr: 'BRA', name: 'Peach City Brawlers',         division: 'East',    league: 'NL' },
    { teamId: 18, abbr: 'TID', name: 'Palmetto City Tides',         division: 'East',    league: 'NL' },
    { teamId: 19, abbr: 'PAT', name: 'Brick City Patriots',         division: 'East',    league: 'NL' },
    { teamId: 20, abbr: 'HUR', name: 'Swamp City Hurricanes',       division: 'East',    league: 'NL' },
    { teamId: 21, abbr: 'CUB', name: 'Lake City Cubs',              division: 'Central', league: 'NL' },
    { teamId: 22, abbr: 'RED', name: 'Gateway City Redbirds',       division: 'Central', league: 'NL' },
    { teamId: 23, abbr: 'CIN', name: 'Blue Grass City Reds',        division: 'Central', league: 'NL' },
    { teamId: 24, abbr: 'AST', name: 'Bayou City Astros',           division: 'Central', league: 'NL' },
    { teamId: 25, abbr: 'BRW', name: 'Lake Front Brewers',          division: 'Central', league: 'NL' },
    { teamId: 26, abbr: 'DOD', name: 'Harbor Bay Dodgers',          division: 'West',    league: 'NL' },
    { teamId: 27, abbr: 'GNT', name: 'Bay City Giants',             division: 'West',    league: 'NL' },
    { teamId: 28, abbr: 'PAD', name: 'Harbor Lights Padres',        division: 'West',    league: 'NL' },
    { teamId: 29, abbr: 'ROC', name: 'Mile High City Rockies',      division: 'West',    league: 'NL' },
    { teamId: 30, abbr: 'DIA', name: 'Sandstone Park Diamondbacks', division: 'West',    league: 'NL' },
  ];
}

// ─── Core generation ──────────────────────────────────────────────────────────

/**
 * Generate pre-season predictions from last season's standings.
 * If no standings (first season), seeds from league-average baselines.
 */
export function generatePreseasonPredictions(
  lastSeasonStandings: StandingsRow[] | null,
_userTeamId:         number,
  season:              number,
): MFSNReport {
  // Deterministic seed based on season — no Math.random()
  const seed = (season * 2053 + 7919) % 1000;

  const predictions: TeamPrediction[] = [];
  const allTeams = getAllTeams();

  for (const team of allTeams) {
    // Base: last season wins or league average (81)
    const lastRow = lastSeasonStandings?.find(s => s.teamId === team.teamId);
    const baseWins = lastRow ? lastRow.wins : 81;

    // Regression to mean: 65% of actual, 35% toward 81
    const regressed = Math.round(baseWins * 0.65 + 81 * 0.35);

    // Deterministic noise ±8 based on team ID + season seed
    const noiseRaw = ((team.teamId * 37 + seed * (team.teamId % 7 + 1)) % 17) - 8;
    const predictedWins = Math.max(55, Math.min(105, regressed + noiseRaw));

    // Playoff odds: roughly correlated with predicted wins
    const basePlayoffOdds = Math.max(0, Math.min(95, (predictedWins - 72) * 6));
    const playoffOdds = Math.round(Math.max(2, Math.min(97, basePlayoffOdds + noiseRaw * 1.5)));

    // WS odds: quadratic falloff from playoff odds
    const wsOdds = Math.round(Math.max(1, Math.min(33,
      (playoffOdds / 100) * (playoffOdds / 100) * 35,
    )));

    const analystIdx  = (team.teamId + seed) % ANALYSTS.length;
    const analystName = ANALYSTS[analystIdx];
    const analystQuote = getAnalystQuote(predictedWins, team.abbr);

    predictions.push({
      teamId:        team.teamId,
      teamAbbr:      team.abbr,
      teamName:      team.name,
      division:      team.division,
      league:        team.league,
      predictedWins,
      playoffOdds,
      wsOdds,
      analystName,
      analystQuote,
      actualWins:    null,
      hit:           null,
    });
  }

  // Sort by predicted wins descending
  predictions.sort((a, b) => b.predictedWins - a.predictedWins);

  return { season, predictions, resolved: false };
}

/**
 * Resolve predictions against actual season results.
 * A prediction HITS if actual wins are within 5 of predicted.
 */
export function resolvePredictions(
  report:          MFSNReport,
  actualStandings: StandingsRow[],
): MFSNReport {
  const resolved = report.predictions.map(pred => {
    const actual = actualStandings.find(s => s.teamId === pred.teamId);
    if (!actual) return pred;
    const actualWins = actual.wins;
    const hit = Math.abs(actualWins - pred.predictedWins) <= 5;
    return { ...pred, actualWins, hit };
  });

  return { ...report, predictions: resolved, resolved: true };
}

/**
 * How accurate was the MFSN overall? Returns a string grade.
 */
export function gradeReportAccuracy(report: MFSNReport): { pct: number; label: string; color: string } {
  if (!report.resolved) return { pct: 0, label: '—', color: '#6b7280' };
  const total = report.predictions.filter(p => p.hit !== null).length;
  if (total === 0) return { pct: 0, label: '—', color: '#6b7280' };
  const hits = report.predictions.filter(p => p.hit === true).length;
  const pct  = Math.round((hits / total) * 100);
  if (pct >= 70) return { pct, label: 'SHARP',     color: '#4ade80' };
  if (pct >= 55) return { pct, label: 'SOLID',     color: '#86efac' };
  if (pct >= 40) return { pct, label: 'MIXED',     color: '#fbbf24' };
  if (pct >= 25) return { pct, label: 'STRUGGLED', color: '#f97316' };
  return              { pct, label: 'EMBARRASSING', color: '#ef4444' };
}
