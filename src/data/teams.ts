import type { Team } from '../types/team';

// ─── 30 teams: 15 AL, 15 NL, 3 divisions each, 5 teams per division ─────────
// Teams use fictional names and cities to avoid IP issues.

export const INITIAL_TEAMS: Omit<Team, 'seasonRecord' | 'rotationIndex' | 'bullpenReliefCounter' | 'strategy'>[] = [
  // ─── AMERICAN LEAGUE EAST ──────────────────────────────────────────
  { teamId: 1,  name: 'Admirals',   abbreviation: 'ADM', city: 'New Harbor',    league: 'AL', division: 'East', parkFactorId: 3,  budget: 200_000_000, scoutingQuality: 0.85, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 } },
  { teamId: 2,  name: 'Colonials',  abbreviation: 'COL', city: 'Capitol City',  league: 'AL', division: 'East', parkFactorId: 5,  budget: 185_000_000, scoutingQuality: 0.80, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.5 } },
  { teamId: 3,  name: 'Lobsters',   abbreviation: 'LOB', city: 'Boston Bay',    league: 'AL', division: 'East', parkFactorId: 7,  budget: 195_000_000, scoutingQuality: 0.90, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 } },
  { teamId: 4,  name: 'Steamers',   abbreviation: 'STM', city: 'Steel City',    league: 'AL', division: 'East', parkFactorId: 14, budget: 130_000_000, scoutingQuality: 0.65, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.3 } },
  { teamId: 5,  name: 'Hammers',    abbreviation: 'HAM', city: 'Lake City',     league: 'AL', division: 'East', parkFactorId: 6,  budget: 150_000_000, scoutingQuality: 0.70, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 } },
  // ─── AMERICAN LEAGUE CENTRAL ────────────────────────────────────────
  { teamId: 6,  name: 'Wolves',     abbreviation: 'WLV', city: 'River City',    league: 'AL', division: 'Central', parkFactorId: 4,  budget: 145_000_000, scoutingQuality: 0.75, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.7 } },
  { teamId: 7,  name: 'Crushers',   abbreviation: 'CRU', city: 'South City',    league: 'AL', division: 'Central', parkFactorId: 10, budget: 165_000_000, scoutingQuality: 0.75, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.5 } },
  { teamId: 8,  name: 'Foxes',      abbreviation: 'FOX', city: 'Prairie City',  league: 'AL', division: 'Central', parkFactorId: 13, budget: 115_000_000, scoutingQuality: 0.60, coaching: { hittingCoachQuality: 0.3, pitchingCoachQuality: 0.5 } },
  { teamId: 9,  name: 'Miners',     abbreviation: 'MIN', city: 'Twin Peaks',    league: 'AL', division: 'Central', parkFactorId: 9,  budget: 125_000_000, scoutingQuality: 0.65, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.3 } },
  { teamId: 10, name: 'Monarchs',   abbreviation: 'MON', city: 'Crown City',    league: 'AL', division: 'Central', parkFactorId: 21, budget: 155_000_000, scoutingQuality: 0.75, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.7 } },
  // ─── AMERICAN LEAGUE WEST ───────────────────────────────────────────
  { teamId: 11, name: 'Gulls',      abbreviation: 'GUL', city: 'Bay City',      league: 'AL', division: 'West', parkFactorId: 1,  budget: 175_000_000, scoutingQuality: 0.85, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 } },
  { teamId: 12, name: 'Rattlers',   abbreviation: 'RAT', city: 'Desert City',   league: 'AL', division: 'West', parkFactorId: 17, budget: 115_000_000, scoutingQuality: 0.60, coaching: { hittingCoachQuality: 0.3, pitchingCoachQuality: 0.5 } },
  { teamId: 13, name: 'Cougars',    abbreviation: 'COU', city: 'Sun Valley',    league: 'AL', division: 'West', parkFactorId: 8,  budget: 135_000_000, scoutingQuality: 0.70, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 } },
  { teamId: 14, name: 'Lumberjacks',abbreviation: 'LUM', city: 'Northwest City',league: 'AL', division: 'West', parkFactorId: 16, budget: 160_000_000, scoutingQuality: 0.80, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.5 } },
  { teamId: 15, name: 'Angels',     abbreviation: 'ANG', city: 'Anaheim Hills', league: 'AL', division: 'West', parkFactorId: 11, budget: 175_000_000, scoutingQuality: 0.75, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.7 } },
  // ─── NATIONAL LEAGUE EAST ───────────────────────────────────────────
  { teamId: 16, name: 'Metros',     abbreviation: 'MET', city: 'New Harbor',    league: 'NL', division: 'East', parkFactorId: 3,  budget: 180_000_000, scoutingQuality: 0.85, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 } },
  { teamId: 17, name: 'Brawlers',   abbreviation: 'BRA', city: 'Peach City',    league: 'NL', division: 'East', parkFactorId: 20, budget: 140_000_000, scoutingQuality: 0.70, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 } },
  { teamId: 18, name: 'Tides',      abbreviation: 'TID', city: 'Palmetto City', league: 'NL', division: 'East', parkFactorId: 25, budget: 110_000_000, scoutingQuality: 0.60, coaching: { hittingCoachQuality: 0.3, pitchingCoachQuality: 0.5 } },
  { teamId: 19, name: 'Patriots',   abbreviation: 'PAT', city: 'Brick City',    league: 'NL', division: 'East', parkFactorId: 27, budget: 165_000_000, scoutingQuality: 0.80, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.5 } },
  { teamId: 20, name: 'Hurricanes', abbreviation: 'HUR', city: 'Swamp City',    league: 'NL', division: 'East', parkFactorId: 28, budget: 130_000_000, scoutingQuality: 0.65, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.3 } },
  // ─── NATIONAL LEAGUE CENTRAL ────────────────────────────────────────
  { teamId: 21, name: 'Cubs',       abbreviation: 'CUB', city: 'Lake City',     league: 'NL', division: 'Central', parkFactorId: 6,  budget: 155_000_000, scoutingQuality: 0.75, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.7 } },
  { teamId: 22, name: 'Redbirds',   abbreviation: 'RED', city: 'Gateway City',  league: 'NL', division: 'Central', parkFactorId: 15, budget: 165_000_000, scoutingQuality: 0.80, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 } },
  { teamId: 23, name: 'Reds',       abbreviation: 'CIN', city: 'Blue Grass City',league:'NL', division: 'Central', parkFactorId: 22, budget: 100_000_000, scoutingQuality: 0.55, coaching: { hittingCoachQuality: 0.3, pitchingCoachQuality: 0.3 } },
  { teamId: 24, name: 'Astros',     abbreviation: 'AST', city: 'Bayou City',    league: 'NL', division: 'Central', parkFactorId: 23, budget: 185_000_000, scoutingQuality: 0.90, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 } },
  { teamId: 25, name: 'Brewers',    abbreviation: 'BRW', city: 'Lake Front',    league: 'NL', division: 'Central', parkFactorId: 6,  budget: 115_000_000, scoutingQuality: 0.65, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 } },
  // ─── NATIONAL LEAGUE WEST ───────────────────────────────────────────
  { teamId: 26, name: 'Dodgers',    abbreviation: 'DOD', city: 'Harbor Bay',    league: 'NL', division: 'West', parkFactorId: 19, budget: 250_000_000, scoutingQuality: 0.95, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 } },
  { teamId: 27, name: 'Giants',     abbreviation: 'GNT', city: 'Bay City',      league: 'NL', division: 'West', parkFactorId: 1,  budget: 175_000_000, scoutingQuality: 0.85, coaching: { hittingCoachQuality: 0.7, pitchingCoachQuality: 0.5 } },
  { teamId: 28, name: 'Padres',     abbreviation: 'PAD', city: 'Harbor Lights', league: 'NL', division: 'West', parkFactorId: 19, budget: 165_000_000, scoutingQuality: 0.80, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.7 } },
  { teamId: 29, name: 'Rockies',    abbreviation: 'ROC', city: 'Mile High City', league: 'NL', division: 'West', parkFactorId: 0,  budget: 110_000_000, scoutingQuality: 0.55, coaching: { hittingCoachQuality: 0.3, pitchingCoachQuality: 0.3 } },
  { teamId: 30, name: 'Diamondbacks',abbreviation:'DIA', city: 'Sandstone Park', league: 'NL', division: 'West', parkFactorId: 17, budget: 145_000_000, scoutingQuality: 0.70, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 } },
];

export function buildInitialTeams(): Team[] {
  return INITIAL_TEAMS.map(t => ({
    ...t,
    seasonRecord: { wins: 0, losses: 0, runsScored: 0, runsAllowed: 0 },
    rotationIndex: 0,
    bullpenReliefCounter: 0,
    strategy: 'fringe' as const,
  }));
}
