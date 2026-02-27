import type { PlayerGameStats, PitcherGameStats } from './player';

export type BattedBallType = 'GB' | 'FB' | 'LD' | 'PU';
export type PAOutcome = 'BB' | 'HBP' | 'K' | 'HR' | '1B' | '2B' | '3B' | 'GB_OUT' | 'FB_OUT' | 'LD_OUT' | 'PU_OUT' | 'GDP' | 'SF' | 'SB' | 'CS' | 'E' | 'WP' | 'PB' | 'SAC_BUNT';

export interface PAResult {
  outcome: PAOutcome;
  battedBallType?: BattedBallType;
  runsScored: number;
  runnersAdvanced: number; // bitmask of which bases advanced
}

export interface PlayEvent {
  inning: number;
  isTop: boolean;
  batterId: number;
  pitcherId: number;
  outs: number;        // outs before this play
  runners: number;     // bitmask before this play (1=1st, 2=2nd, 4=3rd)
  result: PAResult;
}

export interface BoxScore {
  gameId: number;
  season: number;
  date: string;           // ISO date string
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  innings: number;
  lineScore?: { away: number[]; home: number[] }; // Runs per inning
  homeBatting: PlayerGameStats[];
  awayBatting: PlayerGameStats[];
  homePitching: PitcherGameStats[];
  awayPitching: PitcherGameStats[];
  playLog?: PlayEvent[];  // Only for hot storage
}

export interface GameResult {
  gameId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  innings: number;
  walkOff?: boolean;
  boxScore: BoxScore;
}

export interface ScheduleEntry {
  gameId: number;
  date: string;
  homeTeamId: number;
  awayTeamId: number;
  isInterleague: boolean;
  isDivisional: boolean;
}

/** Lightweight game summary for recent games display (no full stat arrays) */
export interface GameSummary {
  gameId: number;
  date: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  innings: number;
  walkOff?: boolean;
  lineScore?: { away: number[]; home: number[] };
  homeHits: number;
  awayHits: number;
}
