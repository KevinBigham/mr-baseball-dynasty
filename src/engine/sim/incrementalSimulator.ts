/**
 * incrementalSimulator.ts — Chunked season simulation for interactive pacing.
 *
 * Allows the season to be simulated in segments (monthly chunks) with pause
 * points between for roster management, mid-season events, and trade deadlines.
 * Reuses the same per-game simulation logic as seasonSimulator.ts.
 */

import { simulateGame } from './gameSimulator';
import type { SimulateGameInput } from './gameSimulator';
import type { ScheduleEntry } from '../../types/game';
import type { Player, PlayerSeasonStats } from '../../types/player';
import type { Team, TeamSeasonStats } from '../../types/team';
import {
  accumulateBatting, accumulatePitching, stddev,
} from './seasonSimulator';

// ─── Season segment definitions ────────────────────────────────────────────────

export type SeasonSegment = 0 | 1 | 2 | 3 | 4;

export const SEGMENT_COUNT = 5;

export type ChunkEvent = 'roster_pause' | 'allstar' | 'deadline' | 'callups' | 'complete';

export interface SegmentInfo {
  index: SeasonSegment;
  label: string;
  event: ChunkEvent;
}

/** Segment metadata: label and what event follows completion */
export const SEGMENTS: SegmentInfo[] = [
  { index: 0, label: 'April–May',  event: 'roster_pause' },
  { index: 1, label: 'June',       event: 'allstar' },
  { index: 2, label: 'July',       event: 'deadline' },
  { index: 3, label: 'August',     event: 'callups' },
  { index: 4, label: 'September',  event: 'complete' },
];

/** Compute schedule index boundaries for each segment. */
export function computeSegmentBoundaries(totalGames: number): number[] {
  // 5 segments: [0, 1/3, 1/2, 2/3, 5/6, 1.0] of schedule
  // First chunk is ~1/3 (Apr-May), then ~1/6 each for Jun/Jul/Aug/Sep
  const fractions = [0, 1 / 3, 1 / 2, 2 / 3, 5 / 6, 1.0];
  return fractions.map(f => Math.round(f * totalGames));
}

// ─── SeasonSimState — serializable accumulator state ───────────────────────────

export interface SeasonSimState {
  gamesCompleted: number;
  totalGames: number;
  currentSegment: number;       // 0-4; 5 = complete
  season: number;
  baseSeed: number;
  isComplete: boolean;
  segmentBoundaries: number[];  // 6 values: [0, b1, b2, b3, b4, totalGames]

  // Team accumulators (Record form for JSON serialization)
  teamWins: Record<number, number>;
  teamLosses: Record<number, number>;
  teamRS: Record<number, number>;
  teamRA: Record<number, number>;

  // Player stats (keyed by playerId as string for JSON compat)
  playerStats: Record<string, PlayerSeasonStats>;

  // Rotation/bullpen tracking
  rotationIndex: Record<number, number>;
  bullpenOffset: Record<number, number>;
}

/** Create a blank SeasonSimState for a new season. */
export function createSeasonSimState(
  teams: Team[],
  totalGames: number,
  season: number,
  baseSeed: number,
): SeasonSimState {
  const teamWins: Record<number, number> = {};
  const teamLosses: Record<number, number> = {};
  const teamRS: Record<number, number> = {};
  const teamRA: Record<number, number> = {};
  const rotationIndex: Record<number, number> = {};
  const bullpenOffset: Record<number, number> = {};

  for (const t of teams) {
    teamWins[t.teamId] = 0;
    teamLosses[t.teamId] = 0;
    teamRS[t.teamId] = 0;
    teamRA[t.teamId] = 0;
    rotationIndex[t.teamId] = 0;
    bullpenOffset[t.teamId] = 0;
  }

  return {
    gamesCompleted: 0,
    totalGames,
    currentSegment: 0,
    season,
    baseSeed,
    isComplete: false,
    segmentBoundaries: computeSegmentBoundaries(totalGames),
    teamWins,
    teamLosses,
    teamRS,
    teamRA,
    playerStats: {},
    rotationIndex,
    bullpenOffset,
  };
}

// ─── Partial result (for mid-season display) ────────────────────────────────────

export interface PartialSeasonResult {
  season: number;
  teamSeasons: TeamSeasonStats[];
  playerSeasons: PlayerSeasonStats[];
  leagueBA: number;
  leagueERA: number;
  leagueRPG: number;
  teamWinsSD: number;
  gamesCompleted: number;
  totalGames: number;
}

/** Convert running SeasonSimState to a displayable partial result. */
export function buildPartialResult(
  state: SeasonSimState,
  teams: Team[],
): PartialSeasonResult {
  const teamSeasons: TeamSeasonStats[] = teams.map(t => ({
    teamId: t.teamId,
    season: state.season,
    record: {
      wins: state.teamWins[t.teamId] ?? 0,
      losses: state.teamLosses[t.teamId] ?? 0,
      runsScored: state.teamRS[t.teamId] ?? 0,
      runsAllowed: state.teamRA[t.teamId] ?? 0,
    },
    payroll: 0,
  }));

  const playerSeasons = Object.values(state.playerStats);

  // League stats
  let totalHits = 0, totalAB = 0, totalER = 0, totalOuts = 0, totalRuns = 0;
  for (const s of playerSeasons) {
    totalHits += s.h;
    totalAB += s.ab;
    totalER += s.er;
    totalOuts += s.outs;
    totalRuns += s.ra;
  }

  const leagueBA = totalAB > 0 ? totalHits / totalAB : 0.255;
  const leagueERA = totalOuts > 0 ? (totalER / totalOuts) * 27 : 4.10;
  const leagueRPG = state.gamesCompleted > 0 ? totalRuns / (state.gamesCompleted * 2) : 4.5;
  const winTotals = teamSeasons.map(ts => ts.record.wins);
  const teamWinsSD = stddev(winTotals);

  return {
    season: state.season,
    teamSeasons,
    playerSeasons,
    leagueBA,
    leagueERA,
    leagueRPG,
    teamWinsSD,
    gamesCompleted: state.gamesCompleted,
    totalGames: state.totalGames,
  };
}

// ─── Simulate one chunk of the season ──────────────────────────────────────────

export interface ChunkResult {
  segment: number;
  segmentLabel: string;
  event: ChunkEvent;
  partialResult: PartialSeasonResult;
  userRecord: { wins: number; losses: number };
  isSeasonComplete: boolean;
}

/**
 * Simulate the next segment of the season.
 * Mutates `state` in-place for efficiency (caller owns the state in the worker).
 */
export function simulateChunk(
  state: SeasonSimState,
  teams: Team[],
  players: Player[],
  schedule: ScheduleEntry[],
  options?: {
    userTeamId?: number;
    userLineupOrder?: number[];
    userRotationOrder?: number[];
  },
  onProgress?: (pct: number) => void,
): ChunkResult {
  if (state.isComplete || state.currentSegment >= SEGMENT_COUNT) {
    return {
      segment: state.currentSegment,
      segmentLabel: 'Complete',
      event: 'complete',
      partialResult: buildPartialResult(state, teams),
      userRecord: { wins: 0, losses: 0 },
      isSeasonComplete: true,
    };
  }

  const segIdx = state.currentSegment;
  const startIdx = state.segmentBoundaries[segIdx]!;
  const endIdx = state.segmentBoundaries[segIdx + 1]!;

  // Build lookup maps (fresh each chunk since rosters may have changed)
  const playerTeamMap = new Map<number, number>();
  const playerPositionMap = new Map<number, string>();
  for (const p of players) {
    playerTeamMap.set(p.playerId, p.teamId);
    playerPositionMap.set(p.playerId, p.position);
  }

  const teamMap = new Map<number, Team>();
  for (const t of teams) teamMap.set(t.teamId, t);

  // Rebuild player stats into a Map for accumulation helpers
  const playerStatsMap = new Map<number, PlayerSeasonStats>();
  for (const [key, val] of Object.entries(state.playerStats)) {
    playerStatsMap.set(Number(key), val);
  }

  // Track user team record before this chunk
  const userTeamId = options?.userTeamId;
  const userWinsBefore = userTeamId ? (state.teamWins[userTeamId] ?? 0) : 0;
  const userLossesBefore = userTeamId ? (state.teamLosses[userTeamId] ?? 0) : 0;

  const chunkSize = endIdx - startIdx;
  let chunkCompleted = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const entry = schedule[i];
    if (!entry) continue;

    const homeTeam = teamMap.get(entry.homeTeamId);
    const awayTeam = teamMap.get(entry.awayTeamId);

    if (!homeTeam || !awayTeam) {
      state.gamesCompleted++;
      chunkCompleted++;
      continue;
    }

    const gameSeed = (state.baseSeed ^ (entry.gameId * 2654435761)) >>> 0;

    const homeWithRotation: Team = {
      ...homeTeam,
      rotationIndex: state.rotationIndex[entry.homeTeamId] ?? 0,
      bullpenReliefCounter: state.bullpenOffset[entry.homeTeamId] ?? 0,
    };
    const awayWithRotation: Team = {
      ...awayTeam,
      rotationIndex: state.rotationIndex[entry.awayTeamId] ?? 0,
      bullpenReliefCounter: state.bullpenOffset[entry.awayTeamId] ?? 0,
    };

    const isUserGame = userTeamId !== undefined &&
      (entry.homeTeamId === userTeamId || entry.awayTeamId === userTeamId);

    const input: SimulateGameInput = {
      gameId: entry.gameId,
      season: state.season,
      date: entry.date,
      homeTeam: homeWithRotation,
      awayTeam: awayWithRotation,
      players,
      seed: gameSeed,
      ...(isUserGame ? {
        userTeamId: options!.userTeamId,
        userLineupOrder: options!.userLineupOrder,
        userRotationOrder: options!.userRotationOrder,
      } : {}),
    };

    const result = simulateGame(input);

    // Advance rotation and bullpen
    state.rotationIndex[entry.homeTeamId] = (state.rotationIndex[entry.homeTeamId] ?? 0) + 1;
    state.rotationIndex[entry.awayTeamId] = (state.rotationIndex[entry.awayTeamId] ?? 0) + 1;
    state.bullpenOffset[entry.homeTeamId] = (state.bullpenOffset[entry.homeTeamId] ?? 0) + 3;
    state.bullpenOffset[entry.awayTeamId] = (state.bullpenOffset[entry.awayTeamId] ?? 0) + 3;

    // Update team records
    if (result.homeScore > result.awayScore) {
      state.teamWins[entry.homeTeamId] = (state.teamWins[entry.homeTeamId] ?? 0) + 1;
      state.teamLosses[entry.awayTeamId] = (state.teamLosses[entry.awayTeamId] ?? 0) + 1;
    } else {
      state.teamWins[entry.awayTeamId] = (state.teamWins[entry.awayTeamId] ?? 0) + 1;
      state.teamLosses[entry.homeTeamId] = (state.teamLosses[entry.homeTeamId] ?? 0) + 1;
    }
    state.teamRS[entry.homeTeamId] = (state.teamRS[entry.homeTeamId] ?? 0) + result.homeScore;
    state.teamRS[entry.awayTeamId] = (state.teamRS[entry.awayTeamId] ?? 0) + result.awayScore;
    state.teamRA[entry.homeTeamId] = (state.teamRA[entry.homeTeamId] ?? 0) + result.awayScore;
    state.teamRA[entry.awayTeamId] = (state.teamRA[entry.awayTeamId] ?? 0) + result.homeScore;

    // Accumulate player stats
    const box = result.boxScore;
    accumulateBatting(playerStatsMap, box.homeBatting, playerTeamMap, state.season);
    accumulateBatting(playerStatsMap, box.awayBatting, playerTeamMap, state.season);
    accumulatePitching(playerStatsMap, box.homePitching, playerTeamMap, playerPositionMap, state.season);
    accumulatePitching(playerStatsMap, box.awayPitching, playerTeamMap, playerPositionMap, state.season);

    state.gamesCompleted++;
    chunkCompleted++;

    if (chunkCompleted % 50 === 0 && onProgress) {
      onProgress(chunkCompleted / chunkSize);
    }
  }

  // Serialize player stats back into Record form
  state.playerStats = {};
  for (const [pid, stats] of playerStatsMap.entries()) {
    state.playerStats[String(pid)] = stats;
  }

  // Also sync team seasonRecord on Team objects (so getStandings/getRoster reads correctly)
  for (const t of teams) {
    t.seasonRecord = {
      wins: state.teamWins[t.teamId] ?? 0,
      losses: state.teamLosses[t.teamId] ?? 0,
      runsScored: state.teamRS[t.teamId] ?? 0,
      runsAllowed: state.teamRA[t.teamId] ?? 0,
    };
  }

  // Advance segment
  const segInfo = SEGMENTS[segIdx]!;
  state.currentSegment = segIdx + 1;
  if (state.currentSegment >= SEGMENT_COUNT) {
    state.isComplete = true;
  }

  // User record for this chunk
  const userWinsAfter = userTeamId ? (state.teamWins[userTeamId] ?? 0) : 0;
  const userLossesAfter = userTeamId ? (state.teamLosses[userTeamId] ?? 0) : 0;

  return {
    segment: segIdx,
    segmentLabel: segInfo.label,
    event: segInfo.event,
    partialResult: buildPartialResult(state, teams),
    userRecord: {
      wins: userWinsAfter - userWinsBefore,
      losses: userLossesAfter - userLossesBefore,
    },
    isSeasonComplete: state.isComplete,
  };
}

// ─── Granular simulation — sim by day / week / month ─────────────────────────

export interface SimRangeResult {
  gamesSimulated: number;
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  crossedEvent: ChunkEvent | null;
  crossedSegment: number | null;
  partialResult: PartialSeasonResult;
  userRecord: { wins: number; losses: number };
  isSeasonComplete: boolean;
}

/** Compute target index for "sim 1 day" — all games on the next unplayed date. */
export function computeSim1DayTarget(
  state: SeasonSimState,
  schedule: ScheduleEntry[],
): number {
  const idx = state.gamesCompleted;
  if (idx >= schedule.length) return schedule.length;
  const date = schedule[idx]!.date;
  let target = idx;
  while (target < schedule.length && schedule[target]!.date === date) {
    target++;
  }
  return target;
}

/** Compute target index for "sim 1 week" — all games within next 7 calendar days. */
export function computeSim1WeekTarget(
  state: SeasonSimState,
  schedule: ScheduleEntry[],
): number {
  const idx = state.gamesCompleted;
  if (idx >= schedule.length) return schedule.length;
  const startDate = new Date(schedule[idx]!.date + 'T00:00:00Z');
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 7);
  const endDateStr = endDate.toISOString().slice(0, 10);
  let target = idx;
  while (target < schedule.length && schedule[target]!.date < endDateStr) {
    target++;
  }
  return target;
}

/** Compute target index for "sim 1 month" — all games through end of current calendar month. */
export function computeSim1MonthTarget(
  state: SeasonSimState,
  schedule: ScheduleEntry[],
): number {
  const idx = state.gamesCompleted;
  if (idx >= schedule.length) return schedule.length;
  const currentDate = schedule[idx]!.date;
  const parts = currentDate.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  let target = idx;
  while (target < schedule.length && schedule[target]!.date < endDateStr) {
    target++;
  }
  return target;
}

/**
 * Simulate games from gamesCompleted up to targetEndIndex, stopping early
 * at segment boundaries to trigger events (allstar, deadline, etc.).
 * Mutates `state` in-place.
 */
export function simulateRange(
  state: SeasonSimState,
  teams: Team[],
  players: Player[],
  schedule: ScheduleEntry[],
  targetEndIndex: number,
  options?: {
    userTeamId?: number;
    userLineupOrder?: number[];
    userRotationOrder?: number[];
  },
  onProgress?: (pct: number) => void,
): SimRangeResult {
  const startIdx = state.gamesCompleted;

  // If already complete, return immediately
  if (state.isComplete || startIdx >= state.totalGames) {
    const date = startIdx > 0 ? (schedule[startIdx - 1]?.date ?? '') : '';
    return {
      gamesSimulated: 0,
      startIndex: startIdx,
      endIndex: startIdx,
      startDate: date,
      endDate: date,
      crossedEvent: 'complete',
      crossedSegment: null,
      partialResult: buildPartialResult(state, teams),
      userRecord: { wins: 0, losses: 0 },
      isSeasonComplete: true,
    };
  }

  // Clamp target to total games
  let effectiveEnd = Math.min(targetEndIndex, state.totalGames);

  // Find the next segment boundary and clamp to it
  const nextBoundaryIdx = state.currentSegment + 1;
  const nextBoundary = nextBoundaryIdx < state.segmentBoundaries.length
    ? state.segmentBoundaries[nextBoundaryIdx]!
    : state.totalGames;
  effectiveEnd = Math.min(effectiveEnd, nextBoundary);

  // Build lookup maps
  const playerTeamMap = new Map<number, number>();
  const playerPositionMap = new Map<number, string>();
  for (const p of players) {
    playerTeamMap.set(p.playerId, p.teamId);
    playerPositionMap.set(p.playerId, p.position);
  }

  const teamMap = new Map<number, Team>();
  for (const t of teams) teamMap.set(t.teamId, t);

  const playerStatsMap = new Map<number, PlayerSeasonStats>();
  for (const [key, val] of Object.entries(state.playerStats)) {
    playerStatsMap.set(Number(key), val);
  }

  // Track user record
  const userTeamId = options?.userTeamId;
  const userWinsBefore = userTeamId ? (state.teamWins[userTeamId] ?? 0) : 0;
  const userLossesBefore = userTeamId ? (state.teamLosses[userTeamId] ?? 0) : 0;

  const rangeSize = effectiveEnd - startIdx;
  let rangeCompleted = 0;

  // ─── Game simulation loop (same logic as simulateChunk) ───
  for (let i = startIdx; i < effectiveEnd; i++) {
    const entry = schedule[i];
    if (!entry) continue;

    const homeTeam = teamMap.get(entry.homeTeamId);
    const awayTeam = teamMap.get(entry.awayTeamId);

    if (!homeTeam || !awayTeam) {
      state.gamesCompleted++;
      rangeCompleted++;
      continue;
    }

    const gameSeed = (state.baseSeed ^ (entry.gameId * 2654435761)) >>> 0;

    const homeWithRotation: Team = {
      ...homeTeam,
      rotationIndex: state.rotationIndex[entry.homeTeamId] ?? 0,
      bullpenReliefCounter: state.bullpenOffset[entry.homeTeamId] ?? 0,
    };
    const awayWithRotation: Team = {
      ...awayTeam,
      rotationIndex: state.rotationIndex[entry.awayTeamId] ?? 0,
      bullpenReliefCounter: state.bullpenOffset[entry.awayTeamId] ?? 0,
    };

    const isUserGame = userTeamId !== undefined &&
      (entry.homeTeamId === userTeamId || entry.awayTeamId === userTeamId);

    const input: SimulateGameInput = {
      gameId: entry.gameId,
      season: state.season,
      date: entry.date,
      homeTeam: homeWithRotation,
      awayTeam: awayWithRotation,
      players,
      seed: gameSeed,
      ...(isUserGame ? {
        userTeamId: options!.userTeamId,
        userLineupOrder: options!.userLineupOrder,
        userRotationOrder: options!.userRotationOrder,
      } : {}),
    };

    const result = simulateGame(input);

    // Advance rotation and bullpen
    state.rotationIndex[entry.homeTeamId] = (state.rotationIndex[entry.homeTeamId] ?? 0) + 1;
    state.rotationIndex[entry.awayTeamId] = (state.rotationIndex[entry.awayTeamId] ?? 0) + 1;
    state.bullpenOffset[entry.homeTeamId] = (state.bullpenOffset[entry.homeTeamId] ?? 0) + 3;
    state.bullpenOffset[entry.awayTeamId] = (state.bullpenOffset[entry.awayTeamId] ?? 0) + 3;

    // Update team records
    if (result.homeScore > result.awayScore) {
      state.teamWins[entry.homeTeamId] = (state.teamWins[entry.homeTeamId] ?? 0) + 1;
      state.teamLosses[entry.awayTeamId] = (state.teamLosses[entry.awayTeamId] ?? 0) + 1;
    } else {
      state.teamWins[entry.awayTeamId] = (state.teamWins[entry.awayTeamId] ?? 0) + 1;
      state.teamLosses[entry.homeTeamId] = (state.teamLosses[entry.homeTeamId] ?? 0) + 1;
    }
    state.teamRS[entry.homeTeamId] = (state.teamRS[entry.homeTeamId] ?? 0) + result.homeScore;
    state.teamRS[entry.awayTeamId] = (state.teamRS[entry.awayTeamId] ?? 0) + result.awayScore;
    state.teamRA[entry.homeTeamId] = (state.teamRA[entry.homeTeamId] ?? 0) + result.awayScore;
    state.teamRA[entry.awayTeamId] = (state.teamRA[entry.awayTeamId] ?? 0) + result.homeScore;

    // Accumulate player stats
    const box = result.boxScore;
    accumulateBatting(playerStatsMap, box.homeBatting, playerTeamMap, state.season);
    accumulateBatting(playerStatsMap, box.awayBatting, playerTeamMap, state.season);
    accumulatePitching(playerStatsMap, box.homePitching, playerTeamMap, playerPositionMap, state.season);
    accumulatePitching(playerStatsMap, box.awayPitching, playerTeamMap, playerPositionMap, state.season);

    state.gamesCompleted++;
    rangeCompleted++;

    if (rangeSize > 0 && rangeCompleted % 50 === 0 && onProgress) {
      onProgress(rangeCompleted / rangeSize);
    }
  }

  // Serialize player stats back
  state.playerStats = {};
  for (const [pid, stats] of playerStatsMap.entries()) {
    state.playerStats[String(pid)] = stats;
  }

  // Sync team seasonRecord on Team objects
  for (const t of teams) {
    t.seasonRecord = {
      wins: state.teamWins[t.teamId] ?? 0,
      losses: state.teamLosses[t.teamId] ?? 0,
      runsScored: state.teamRS[t.teamId] ?? 0,
      runsAllowed: state.teamRA[t.teamId] ?? 0,
    };
  }

  // Check if we hit a segment boundary
  let crossedEvent: ChunkEvent | null = null;
  let crossedSegment: number | null = null;

  if (state.gamesCompleted >= nextBoundary && state.currentSegment < SEGMENT_COUNT) {
    const segInfo = SEGMENTS[state.currentSegment]!;
    crossedEvent = segInfo.event;
    crossedSegment = state.currentSegment;
    state.currentSegment++;
    if (state.currentSegment >= SEGMENT_COUNT) {
      state.isComplete = true;
    }
  }

  // User record for this range
  const userWinsAfter = userTeamId ? (state.teamWins[userTeamId] ?? 0) : 0;
  const userLossesAfter = userTeamId ? (state.teamLosses[userTeamId] ?? 0) : 0;

  const startDate = startIdx < schedule.length ? (schedule[startIdx]?.date ?? '') : '';
  const lastIdx = state.gamesCompleted > 0 ? state.gamesCompleted - 1 : 0;
  const endDate = lastIdx < schedule.length ? (schedule[lastIdx]?.date ?? '') : '';

  return {
    gamesSimulated: rangeCompleted,
    startIndex: startIdx,
    endIndex: state.gamesCompleted,
    startDate,
    endDate,
    crossedEvent,
    crossedSegment,
    partialResult: buildPartialResult(state, teams),
    userRecord: {
      wins: userWinsAfter - userWinsBefore,
      losses: userLossesAfter - userLossesBefore,
    },
    isSeasonComplete: state.isComplete,
  };
}
