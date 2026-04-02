import {
  type AwardHistoryEntry,
  type BriefingItem,
  type CareerStatsLedger,
  type FranchiseTimelineEntry,
  type GameSnapshot,
  type HallOfFameBallotEntry,
  type HallOfFameEntry,
  type OwnerState,
  type PlayerMorale,
  type Rivalry,
  type SeasonHistoryEntry,
  type TeamChemistry,
} from '@mbd/contracts';
import {
  CURRENT_GAME_SNAPSHOT_VERSION,
  parseGameSnapshot,
} from '../../../../packages/contracts/src/schemas/save';
import {
  GameRNG,
  StandingsTracker,
  type FreeAgencyMarket,
  type GMPersonality,
  type GeneratedPlayer,
  type Injury,
  type OffseasonState,
  type PlayerGameStats,
  type PlayoffBracket,
  type RosterState,
  type ScheduledGame,
  type Scout,
  type SeasonState,
  type TeamRecord,
  type GameBoxScore,
  type NewsItem,
} from '@mbd/sim-core';
import {
  createEmptyTradeState,
  normalizeDraftSessionState,
  normalizeOffseasonState,
  type DraftSessionState,
  type FullGameState,
} from './sim.worker.helpers';

function serializeSeasonState(seasonState: SeasonState): GameSnapshot['seasonState'] {
  return {
    season: seasonState.season,
    currentDay: seasonState.currentDay,
    standings: seasonState.standings.serialize(),
    playerSeasonStats: Array.from(seasonState.playerSeasonStats.entries()),
    gameLog: seasonState.gameLog,
    completed: seasonState.completed,
  };
}

function deserializeSeasonState(
  serialized: GameSnapshot['seasonState'],
): SeasonState {
  return {
    season: serialized.season,
    currentDay: serialized.currentDay,
    standings: StandingsTracker.deserialize(serialized.standings as TeamRecord[]),
    playerSeasonStats: new Map(serialized.playerSeasonStats as [string, PlayerGameStats][]),
    gameLog: serialized.gameLog as GameBoxScore[],
    completed: serialized.completed,
  };
}

function toEntries<T>(map: Map<string, T>): [string, T][] {
  return Array.from(map.entries());
}

function fromEntries<T>(entries: [string, T][]): Map<string, T> {
  return new Map(entries);
}

function validateSnapshot(snapshot: unknown): GameSnapshot {
  if (
    typeof snapshot === 'object' &&
    snapshot !== null &&
    'schemaVersion' in snapshot &&
    snapshot.schemaVersion !== 2 &&
    snapshot.schemaVersion !== 3 &&
    snapshot.schemaVersion !== 4 &&
    snapshot.schemaVersion !== CURRENT_GAME_SNAPSHOT_VERSION
  ) {
    throw new Error(`Unsupported snapshot schema version: ${String(snapshot.schemaVersion)}`);
  }
  try {
    return parseGameSnapshot(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid snapshot payload';
    throw new Error(`Invalid snapshot: ${message}`);
  }
}

export function exportGameSnapshot(state: FullGameState): GameSnapshot {
  return validateSnapshot({
    schemaVersion: CURRENT_GAME_SNAPSHOT_VERSION,
    rng: state.rng.getState(),
    season: state.season,
    day: state.day,
    phase: state.phase,
    userTeamId: state.userTeamId,
    players: state.players,
    schedule: state.schedule,
    seasonState: serializeSeasonState(state.seasonState),
    playoffBracket: state.playoffBracket,
    injuries: toEntries(state.injuries),
    serviceTime: toEntries(state.serviceTime),
    scoutingStaffs: toEntries(state.scoutingStaffs),
    gmPersonalities: toEntries(state.gmPersonalities),
    offseasonState: state.offseasonState,
    draftClass: state.draftClass,
    freeAgencyMarket: state.freeAgencyMarket,
    news: state.news,
    rosterStates: toEntries(state.rosterStates),
    narrative: {
      playerMorale: toEntries(state.playerMorale),
      teamChemistry: toEntries(state.teamChemistry),
      ownerState: toEntries(state.ownerState),
      briefingQueue: state.briefingQueue,
      storyFlags: toEntries(state.storyFlags),
      rivalries: toEntries(state.rivalries),
      awardHistory: state.awardHistory,
      hallOfFame: state.hallOfFame,
      hallOfFameBallot: state.hallOfFameBallot,
      franchiseTimeline: state.franchiseTimeline,
      careerStats: state.careerStats,
      seasonHistory: state.seasonHistory,
    },
    tradeState: state.tradeState,
  });
}

export function importGameSnapshot(snapshotLike: unknown): FullGameState {
  const snapshot = validateSnapshot(snapshotLike);
  const players = snapshot.players as GeneratedPlayer[];
  const serviceTime = fromEntries(snapshot.serviceTime);
  const seasonState = deserializeSeasonState(snapshot.seasonState);

  return {
    rng: GameRNG.fromState(snapshot.rng),
    season: snapshot.season,
    day: snapshot.day,
    phase: snapshot.phase,
    players,
    schedule: snapshot.schedule as ScheduledGame[],
    seasonState,
    userTeamId: snapshot.userTeamId,
    playoffBracket: snapshot.playoffBracket as PlayoffBracket | null,
    injuries: fromEntries(snapshot.injuries as [string, Injury][]),
    serviceTime,
    scoutingStaffs: fromEntries(snapshot.scoutingStaffs as [string, Scout[]][]),
    gmPersonalities: fromEntries(snapshot.gmPersonalities as [string, GMPersonality][]),
    offseasonState: normalizeOffseasonState(
      snapshot.offseasonState as OffseasonState | null,
      players,
      serviceTime,
    ),
    draftClass: normalizeDraftSessionState(
      snapshot.draftClass as DraftSessionState | null,
      seasonState,
      snapshot.userTeamId,
    ),
    freeAgencyMarket: snapshot.freeAgencyMarket as FreeAgencyMarket | null,
    news: snapshot.news as NewsItem[],
    rosterStates: fromEntries(snapshot.rosterStates as [string, RosterState][]),
    playerMorale: fromEntries(snapshot.narrative.playerMorale as [string, PlayerMorale][]),
    teamChemistry: fromEntries(snapshot.narrative.teamChemistry as [string, TeamChemistry][]),
    ownerState: fromEntries(snapshot.narrative.ownerState as [string, OwnerState][]),
    briefingQueue: snapshot.narrative.briefingQueue as BriefingItem[],
    storyFlags: fromEntries(snapshot.narrative.storyFlags),
    rivalries: fromEntries(snapshot.narrative.rivalries as [string, Rivalry][]),
    awardHistory: snapshot.narrative.awardHistory as AwardHistoryEntry[],
    hallOfFame: snapshot.narrative.hallOfFame as HallOfFameEntry[],
    hallOfFameBallot: snapshot.narrative.hallOfFameBallot as HallOfFameBallotEntry[],
    franchiseTimeline: snapshot.narrative.franchiseTimeline as FranchiseTimelineEntry[],
    careerStats: snapshot.narrative.careerStats as CareerStatsLedger[],
    seasonHistory: snapshot.narrative.seasonHistory as SeasonHistoryEntry[],
    tradeState: snapshot.tradeState ?? createEmptyTradeState(),
  };
}
