import type { Player, PlayerSeasonStats } from './player';
import type { Team, TeamSeasonStats } from './team';
import type { ScheduleEntry, BoxScore } from './game';

export interface LeagueEnvironment {
  // Calibration factors (1.0 = neutral)
  pitcherBuffFactor: number;
  hitterBuffFactor: number;
  babipAdjustment: number;
}

export interface LeagueState {
  season: number;
  teams: Team[];
  players: Player[];
  schedule: ScheduleEntry[];
  environment: LeagueEnvironment;
  prngState: number[];  // Serialized PRNG state
  userTeamId: number;
}

export interface SeasonResult {
  season: number;
  teamSeasons: TeamSeasonStats[];
  playerSeasons: PlayerSeasonStats[];
  boxScores: BoxScore[];
  leagueBA: number;
  leagueERA: number;
  leagueRPG: number;
  teamWinsSD: number;
}

// ─── Worker API response shapes ───────────────────────────────────────────────
export interface StandingsRow {
  teamId: number;
  name: string;
  abbreviation: string;
  league: string;
  division: string;
  wins: number;
  losses: number;
  pct: number;
  gb: number;
  runsScored: number;
  runsAllowed: number;
  pythagWins: number;
}

export interface StandingsData {
  season: number;
  standings: StandingsRow[];
}

export interface RosterPlayer {
  playerId: number;
  name: string;
  position: string;
  age: number;
  bats: string;
  throws: string;
  isPitcher: boolean;
  overall: number;
  potential: number;
  rosterStatus: string;
  isOn40Man: boolean;
  optionYearsRemaining: number;
  serviceTimeDays: number;
  salary: number;
  contractYearsRemaining: number;
  // Season stats (current season)
  stats: {
    // Hitting
    pa?: number; avg?: number; obp?: number; slg?: number;
    hr?: number; rbi?: number; sb?: number; k?: number; bb?: number;
    // Pitching
    w?: number; l?: number; sv?: number; era?: number;
    ip?: number; k9?: number; bb9?: number; whip?: number;
  };
}

export interface RosterData {
  teamId: number;
  season: number;
  active: RosterPlayer[];    // 26-man
  il: RosterPlayer[];        // IL entries
  minors: RosterPlayer[];    // AAA/Rookie on 40-man
  dfa: RosterPlayer[];
}

export interface LeaderboardEntry {
  rank: number;
  playerId: number;
  name: string;
  teamAbbr: string;
  position: string;
  age: number;
  value: number;
  displayValue: string;
}

export interface PlayerProfileData {
  player: {
    playerId: number;
    name: string;
    age: number;
    position: string;
    bats: string;
    throws: string;
    overall: number;
    potential: number;
    // Scouting grades (20–80 scale)
    grades: Record<string, number>;
    rosterStatus: string;
    serviceTimeDays: number;
    salary: number;
    contractYearsRemaining: number;
  };
  seasonStats: {
    season: number;
    // batting or pitching stats depending on player type
    [key: string]: number;
  } | null;
  careerStats: {
    seasons: number;
    [key: string]: number;
  };
}
