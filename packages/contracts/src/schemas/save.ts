import { z } from "zod";
import {
  ContractSchema,
  HitterAttributesSchema,
  PersonalitySchema,
  PitcherAttributesSchema,
  PositionEnum,
  RosterStatusEnum,
  DevelopmentPhaseEnum,
} from "./player.js";
import {
  AwardHistoryEntrySchema,
  BriefingItemSchema,
  NewsItemSchema,
  OwnerStateSchema,
  PlayerMoraleSchema,
  RivalrySchema,
  TeamChemistrySchema,
  SeasonHistoryEntrySchema,
} from "./narrative.js";
import { TradeStateSchema } from "./trade.js";

export const SaveMetaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  season: z.number().int(),
  teamName: z.string(),
  version: z.number().int().min(1),
});
export type SaveMeta = z.infer<typeof SaveMetaSchema>;

export const SaveSlotSchema = z.object({
  slotNumber: z.number().int().min(1).max(10),
  meta: SaveMetaSchema.optional(),
  isEmpty: z.boolean(),
});
export type SaveSlot = z.infer<typeof SaveSlotSchema>;

export const GameRNGStateSchema = z.object({
  seed: z.number().int(),
  callCount: z.number().int().min(0),
});
export type GameRNGState = z.infer<typeof GameRNGStateSchema>;

export const SimPhaseEnum = z.enum([
  "preseason",
  "regular",
  "playoffs",
  "offseason",
]);
export type SimPhase = z.infer<typeof SimPhaseEnum>;

export const SnapshotPlayerSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.number().int().min(16).max(50),
  position: PositionEnum,
  hitterAttributes: HitterAttributesSchema,
  pitcherAttributes: PitcherAttributesSchema.nullable(),
  personality: PersonalitySchema,
  contract: ContractSchema,
  rosterStatus: RosterStatusEnum,
  developmentPhase: DevelopmentPhaseEnum,
  teamId: z.string(),
  nationality: z.enum(["american", "latin", "asian"]),
  overallRating: z.number().int().min(0).max(550),
});
export type SnapshotPlayer = z.infer<typeof SnapshotPlayerSchema>;

export const ScheduledGameSchema = z.object({
  day: z.number().int().min(1),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
});
export type ScheduledGame = z.infer<typeof ScheduledGameSchema>;

export const StandingsRecordSchema = z.object({
  teamId: z.string(),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  runsScored: z.number().int(),
  runsAllowed: z.number().int(),
  streak: z.number().int(),
  last10: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
  divisionWins: z.number().int().min(0),
  divisionLosses: z.number().int().min(0),
});
export type StandingsRecord = z.infer<typeof StandingsRecordSchema>;

export const PlayerStatEntrySchema = z.tuple([
  z.string(),
  z.object({
    pa: z.number().int().min(0),
    ab: z.number().int().min(0),
    hits: z.number().int().min(0),
    doubles: z.number().int().min(0),
    triples: z.number().int().min(0),
    hr: z.number().int().min(0),
    rbi: z.number().int().min(0),
    bb: z.number().int().min(0),
    k: z.number().int().min(0),
    runs: z.number().int().min(0),
    ip: z.number().int().min(0),
    earnedRuns: z.number().int().min(0),
    strikeouts: z.number().int().min(0),
    walks: z.number().int().min(0),
    hitsAllowed: z.number().int().min(0),
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  }),
]);
export type PlayerStatEntry = z.infer<typeof PlayerStatEntrySchema>;

const LegacyPlayerStatEntrySchema = z.tuple([
  z.string(),
  z.object({
    pa: z.number().int().min(0),
    ab: z.number().int().min(0),
    hits: z.number().int().min(0),
    doubles: z.number().int().min(0),
    triples: z.number().int().min(0),
    hr: z.number().int().min(0),
    rbi: z.number().int().min(0),
    bb: z.number().int().min(0),
    k: z.number().int().min(0),
    runs: z.number().int().min(0),
    ip: z.number().int().min(0),
    earnedRuns: z.number().int().min(0),
    strikeouts: z.number().int().min(0),
    walks: z.number().int().min(0),
    hitsAllowed: z.number().int().min(0),
  }),
]);

export const SerializedSeasonStateSchema = z.object({
  season: z.number().int().min(1),
  currentDay: z.number().int().min(1),
  standings: z.array(StandingsRecordSchema),
  playerSeasonStats: z.array(PlayerStatEntrySchema),
  gameLog: z.array(z.unknown()),
  completed: z.boolean(),
});
export type SerializedSeasonState = z.infer<typeof SerializedSeasonStateSchema>;

const LegacySerializedSeasonStateSchema = z.object({
  season: z.number().int().min(1),
  currentDay: z.number().int().min(1),
  standings: z.array(StandingsRecordSchema),
  playerSeasonStats: z.array(LegacyPlayerStatEntrySchema),
  gameLog: z.array(z.unknown()),
  completed: z.boolean(),
});

const InjuryEntrySchema = z.tuple([z.string(), z.unknown()]);
const ServiceTimeEntrySchema = z.tuple([z.string(), z.number().int().min(0)]);
const ScoutStaffEntrySchema = z.tuple([z.string(), z.array(z.unknown())]);
const GMPersonalityEntrySchema = z.tuple([z.string(), z.string()]);
const RosterStateEntrySchema = z.tuple([z.string(), z.unknown()]);
const StoryFlagEntrySchema = z.tuple([z.string(), z.array(z.string())]);
const PlayerMoraleEntrySchema = z.tuple([z.string(), PlayerMoraleSchema]);
const TeamChemistryEntrySchema = z.tuple([z.string(), TeamChemistrySchema]);
const OwnerStateEntrySchema = z.tuple([z.string(), OwnerStateSchema]);
const RivalryEntrySchema = z.tuple([z.string(), RivalrySchema]);

export const NarrativeSnapshotSchema = z.object({
  playerMorale: z.array(PlayerMoraleEntrySchema),
  teamChemistry: z.array(TeamChemistryEntrySchema),
  ownerState: z.array(OwnerStateEntrySchema),
  briefingQueue: z.array(BriefingItemSchema),
  storyFlags: z.array(StoryFlagEntrySchema),
  rivalries: z.array(RivalryEntrySchema),
  awardHistory: z.array(AwardHistoryEntrySchema),
  seasonHistory: z.array(SeasonHistoryEntrySchema),
});
export type NarrativeSnapshot = z.infer<typeof NarrativeSnapshotSchema>;

const LegacyAwardHistoryEntrySchema = z.object({
  season: z.number().int().min(1),
  award: z.string(),
  playerId: z.string(),
  teamId: z.string(),
  summary: z.string(),
});

const LegacySeasonHistoryEntrySchema = z.object({
  season: z.number().int().min(1),
  championTeamId: z.string().nullable(),
  summary: z.string(),
  awards: z.array(LegacyAwardHistoryEntrySchema),
  keyMoments: z.array(z.string()),
});

const LegacyNarrativeSnapshotSchema = z.object({
  playerMorale: z.array(PlayerMoraleEntrySchema),
  teamChemistry: z.array(TeamChemistryEntrySchema),
  ownerState: z.array(OwnerStateEntrySchema),
  briefingQueue: z.array(BriefingItemSchema),
  storyFlags: z.array(StoryFlagEntrySchema),
  rivalries: z.array(RivalryEntrySchema),
  awardHistory: z.array(LegacyAwardHistoryEntrySchema),
  seasonHistory: z.array(LegacySeasonHistoryEntrySchema),
});

export const CURRENT_GAME_SNAPSHOT_VERSION = 4;

export const GameSnapshotSchema = z.object({
  schemaVersion: z.literal(CURRENT_GAME_SNAPSHOT_VERSION),
  rng: GameRNGStateSchema,
  season: z.number().int().min(1),
  day: z.number().int().min(1),
  phase: SimPhaseEnum,
  userTeamId: z.string(),
  players: z.array(SnapshotPlayerSchema),
  schedule: z.array(ScheduledGameSchema),
  seasonState: SerializedSeasonStateSchema,
  playoffBracket: z.unknown().nullable(),
  injuries: z.array(InjuryEntrySchema),
  serviceTime: z.array(ServiceTimeEntrySchema),
  scoutingStaffs: z.array(ScoutStaffEntrySchema),
  gmPersonalities: z.array(GMPersonalityEntrySchema),
  offseasonState: z.unknown().nullable(),
  draftClass: z.unknown().nullable(),
  freeAgencyMarket: z.unknown().nullable(),
  news: z.array(NewsItemSchema),
  rosterStates: z.array(RosterStateEntrySchema),
  narrative: NarrativeSnapshotSchema,
  tradeState: TradeStateSchema,
});
export type GameSnapshot = z.infer<typeof GameSnapshotSchema>;

export const GameSnapshotV3Schema = z.object({
  schemaVersion: z.literal(3),
  rng: GameRNGStateSchema,
  season: z.number().int().min(1),
  day: z.number().int().min(1),
  phase: SimPhaseEnum,
  userTeamId: z.string(),
  players: z.array(SnapshotPlayerSchema),
  schedule: z.array(ScheduledGameSchema),
  seasonState: SerializedSeasonStateSchema,
  playoffBracket: z.unknown().nullable(),
  injuries: z.array(InjuryEntrySchema),
  serviceTime: z.array(ServiceTimeEntrySchema),
  scoutingStaffs: z.array(ScoutStaffEntrySchema),
  gmPersonalities: z.array(GMPersonalityEntrySchema),
  offseasonState: z.unknown().nullable(),
  draftClass: z.unknown().nullable(),
  freeAgencyMarket: z.unknown().nullable(),
  news: z.array(NewsItemSchema),
  rosterStates: z.array(RosterStateEntrySchema),
  narrative: NarrativeSnapshotSchema,
});
export type GameSnapshotV3 = z.infer<typeof GameSnapshotV3Schema>;

export const GameSnapshotV2Schema = z.object({
  schemaVersion: z.literal(2),
  rng: GameRNGStateSchema,
  season: z.number().int().min(1),
  day: z.number().int().min(1),
  phase: SimPhaseEnum,
  userTeamId: z.string(),
  players: z.array(SnapshotPlayerSchema),
  schedule: z.array(ScheduledGameSchema),
  seasonState: LegacySerializedSeasonStateSchema,
  playoffBracket: z.unknown().nullable(),
  injuries: z.array(InjuryEntrySchema),
  serviceTime: z.array(ServiceTimeEntrySchema),
  scoutingStaffs: z.array(ScoutStaffEntrySchema),
  gmPersonalities: z.array(GMPersonalityEntrySchema),
  offseasonState: z.unknown().nullable(),
  draftClass: z.unknown().nullable(),
  freeAgencyMarket: z.unknown().nullable(),
  news: z.array(NewsItemSchema),
  rosterStates: z.array(RosterStateEntrySchema),
  narrative: LegacyNarrativeSnapshotSchema,
});
export type GameSnapshotV2 = z.infer<typeof GameSnapshotV2Schema>;

function migratePlayerStatEntry([playerId, stats]: z.infer<typeof LegacyPlayerStatEntrySchema>): PlayerStatEntry {
  return [
    playerId,
    {
      ...stats,
      wins: 0,
      losses: 0,
    },
  ];
}

function createEmptyStatLeaders() {
  return {
    hr: [],
    rbi: [],
    avg: [],
    era: [],
    k: [],
    w: [],
  };
}

function createEmptyTradeState() {
  return {
    pendingOffers: [],
    tradeHistory: [],
  };
}

export function migrateGameSnapshot(snapshot: GameSnapshotV2): GameSnapshot {
  return GameSnapshotSchema.parse({
    ...snapshot,
    schemaVersion: CURRENT_GAME_SNAPSHOT_VERSION,
    seasonState: {
      ...snapshot.seasonState,
      playerSeasonStats: snapshot.seasonState.playerSeasonStats.map(migratePlayerStatEntry),
    },
    narrative: {
      ...snapshot.narrative,
      awardHistory: snapshot.narrative.awardHistory.map((entry) => ({
        ...entry,
        league: "MLB" as const,
      })),
      seasonHistory: snapshot.narrative.seasonHistory.map((entry) => ({
        ...entry,
        awards: entry.awards.map((award) => ({
          ...award,
          league: "MLB" as const,
        })),
        runnerUpTeamId: null,
        worldSeriesRecord: null,
        statLeaders: createEmptyStatLeaders(),
        notableRetirements: [],
        blockbusterTrades: [],
        userSeason: null,
        })),
    },
    tradeState: createEmptyTradeState(),
  });
}

function migrateGameSnapshotV3(snapshot: GameSnapshotV3): GameSnapshot {
  return GameSnapshotSchema.parse({
    ...snapshot,
    schemaVersion: CURRENT_GAME_SNAPSHOT_VERSION,
    tradeState: createEmptyTradeState(),
  });
}

export function parseGameSnapshot(snapshotLike: unknown): GameSnapshot {
  if (
    typeof snapshotLike === "object" &&
    snapshotLike !== null &&
    "schemaVersion" in snapshotLike &&
    snapshotLike.schemaVersion === 2
  ) {
    return migrateGameSnapshot(GameSnapshotV2Schema.parse(snapshotLike));
  }

  if (
    typeof snapshotLike === "object" &&
    snapshotLike !== null &&
    "schemaVersion" in snapshotLike &&
    snapshotLike.schemaVersion === 3
  ) {
    return migrateGameSnapshotV3(GameSnapshotV3Schema.parse(snapshotLike));
  }

  return GameSnapshotSchema.parse(snapshotLike);
}
