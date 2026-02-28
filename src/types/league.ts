import type { Player, PlayerSeasonStats } from './player';
import type { Team, TeamSeasonStats } from './team';
import type { ScheduleEntry, BoxScore } from './game';
import type { SeasonAwards, DivisionChampion } from '../engine/player/awards';
import type { DevelopmentEvent } from '../engine/player/development';
import type { PlayoffBracket } from '../engine/sim/playoffs';

export interface LeagueEnvironment {
  // Calibration factors (1.0 = neutral)
  pitcherBuffFactor: number;
  hitterBuffFactor: number;
  babipAdjustment: number;
}

// Auxiliary worker state that was previously lost on save/load
export interface WorkerAuxState {
  seasonResults: unknown[];
  tradeHistory: unknown[];
  lineups: Array<[number, unknown]>;
  financialHistory: Array<[number, unknown[]]>;
  teamCash: Array<[number, number]>;
  luxuryTaxYears: Array<[number, number]>;
  seasonInjuries: unknown[];
  arbHistory: unknown[];
  rule5History: unknown[];
  deadlineDeals: unknown[];
  intlProspects: unknown[];
  coachingStaff: Array<[number, unknown[]]>;
  coachingPool: unknown[];
  extensionHistory: unknown[];
  waiverHistory: unknown[];
  ownerGoals: unknown | null;
  playerSeasonStats: Array<[number, unknown]>;
  careerRecords: Array<[number, unknown]>;
  awardsHistory: {
    awardHistory: unknown[];
    championHistory: unknown[];
    transactionLog: unknown[];
    milestones: unknown[];
  };
  gamesPlayed: number;
  simRotationIndex: Array<[number, number]>;
  simBullpenOffset: Array<[number, number]>;
  simTeamWins: Array<[number, number]>;
  simTeamLosses: Array<[number, number]>;
  simTeamRS: Array<[number, number]>;
  simTeamRA: Array<[number, number]>;
}

export interface LeagueState {
  season: number;
  teams: Team[];
  players: Player[];
  schedule: ScheduleEntry[];
  environment: LeagueEnvironment;
  prngState: number[];  // Serialized PRNG state
  userTeamId: number;
  aux?: WorkerAuxState; // Persisted auxiliary state (coaching, finance, history, etc.)
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
  playoffBracket?: PlayoffBracket;
  freeAgencySignings?: number;
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

export interface SplitLine {
  pa: number; ab: number; avg: number; obp: number; slg: number; ops: number;
  hr: number; bb: number; k: number;
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
  splits?: { vsLHP: SplitLine; vsRHP: SplitLine } | null;
  pitchMix?: { fastball: number; breaking: number; offspeed: number } | null;
  tradeValue?: number;        // 0-100 trade value
  marketSalary?: number;      // Estimated market salary
  seasonLog?: Array<{
    season: number;
    teamName: string;
    age: number;
    // Hitting
    g: number; pa: number; ab: number; h: number; hr: number;
    rbi: number; bb: number; k: number; sb: number;
    avg: number;
    // Pitching
    w: number; l: number; sv: number; era: number; ip: number; ka: number;
    gs: number; qs: number; cg: number; sho: number;
    awards: string[];
  }>;
}
