import type { Player, PlayerSeasonStats } from './player';
import type { Team, TeamSeasonStats } from './team';
import type { ScheduleEntry, BoxScore } from './game';
import type { SeasonAwards, DivisionChampion } from '../engine/player/awards';
import type { DevelopmentEvent } from '../engine/player/development';
import type { InjuryEvent } from '../engine/injuries';

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
  careerHistory?: Record<string, PlayerSeasonStats[]>;
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
  // Post-season results (populated by worker after simulation + offseason)
  // Optional so seasonSimulator.ts can return the base result; worker enriches it.
  awards?: SeasonAwards;
  divisionChampions?: DivisionChampion[];
  developmentEvents?: DevelopmentEvent[];
  injuryEvents?: InjuryEvent[];
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
  // Injury info (if currently on IL)
  injuryInfo?: {
    type: string;
    severity: string;
    daysRemaining: number;
    description: string;
  };
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

export interface LeaderboardFullEntry {
  rank: number;
  playerId: number;
  name: string;
  teamAbbr: string;
  teamId: number;
  position: string;
  age: number;
  isPitcher: boolean;
  stats: Record<string, number>;
}

export interface LeaderboardFullOptions {
  category: 'hitting' | 'pitching';
  sortBy: string;
  minPA?: number;
  minIP?: number;
  position?: string;
  limit?: number;
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
    isPitcher: boolean;
    teamId: number;
    teamAbbr: string;
    optionYearsRemaining: number;
    tradeValue: number;         // 0–100 from evaluatePlayer()
  };
  seasonStats: {
    season: number;
    // batting or pitching stats depending on player type
    [key: string]: number;
  } | null;
  careerStats: PlayerSeasonStats[];
}

export interface AwardCandidate {
  playerId:  number;
  name:      string;
  teamAbbr:  string;
  teamId:    number;
  position:  string;
  age:       number;
  isPitcher: boolean;
  score:     number;
  stats:     Record<string, number>;
}
