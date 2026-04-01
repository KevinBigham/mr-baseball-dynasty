import { z } from "zod";

export const NewsPriorityEnum = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type NewsPriority = z.infer<typeof NewsPriorityEnum>;

export const NewsCategoryEnum = z.enum([
  "injury",
  "trade",
  "signing",
  "draft",
  "milestone",
  "performance",
  "standings",
  "roster_move",
  "award",
  "record",
  "playoff",
]);
export type NewsCategory = z.infer<typeof NewsCategoryEnum>;

export const NewsItemSchema = z.object({
  id: z.string(),
  headline: z.string().min(1),
  body: z.string(),
  priority: NewsPriorityEnum,
  category: NewsCategoryEnum,
  timestamp: z.string(),
  relatedPlayerIds: z.array(z.string()),
  relatedTeamIds: z.array(z.string()),
  read: z.boolean(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const MomentTypeEnum = z.enum([
  "walk_off",
  "no_hitter",
  "perfect_game",
  "cycle",
  "milestone_hr",
  "milestone_hit",
  "milestone_k",
  "milestone_win",
  "streak",
  "record_broken",
  "debut",
  "retirement",
  "championship",
  "playoff_upset",
  "comeback",
]);
export type MomentType = z.infer<typeof MomentTypeEnum>;

export const MomentSchema = z.object({
  type: MomentTypeEnum,
  headline: z.string().min(1),
  description: z.string(),
  season: z.number().int().min(1),
  day: z.number().int().min(1),
  playerIds: z.array(z.string()),
  teamIds: z.array(z.string()),
  historical: z.boolean(),
});
export type Moment = z.infer<typeof MomentSchema>;

export const NarrativeTrendEnum = z.enum([
  "rising",
  "falling",
  "steady",
]);
export type NarrativeTrend = z.infer<typeof NarrativeTrendEnum>;

export const ChemistryTierEnum = z.enum([
  "fractured",
  "tense",
  "steady",
  "connected",
  "electric",
]);
export type ChemistryTier = z.infer<typeof ChemistryTierEnum>;

export const PlayerMoraleSchema = z.object({
  playerId: z.string(),
  score: z.number().min(0).max(100),
  trend: NarrativeTrendEnum,
  summary: z.string(),
  lastUpdated: z.string(),
});
export type PlayerMorale = z.infer<typeof PlayerMoraleSchema>;

export const TeamChemistrySchema = z.object({
  teamId: z.string(),
  score: z.number().min(0).max(100),
  tier: ChemistryTierEnum,
  trend: NarrativeTrendEnum,
  summary: z.string(),
  reasons: z.array(z.string()),
});
export type TeamChemistry = z.infer<typeof TeamChemistrySchema>;

export const OwnerExpectationsSchema = z.object({
  winsTarget: z.number().int().min(0),
  playoffTarget: z.boolean(),
  payrollTarget: z.number().min(0),
});
export type OwnerExpectations = z.infer<typeof OwnerExpectationsSchema>;

export const OwnerStateSchema = z.object({
  teamId: z.string(),
  archetype: z.enum(["win_now", "patient_builder", "penny_pincher"]),
  patience: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  hotSeat: z.boolean(),
  summary: z.string(),
  expectations: OwnerExpectationsSchema,
});
export type OwnerState = z.infer<typeof OwnerStateSchema>;

export const BriefingCategoryEnum = z.enum([
  "owner",
  "chemistry",
  "morale",
  "award",
  "rivalry",
  "breakout",
  "news",
]);
export type BriefingCategory = z.infer<typeof BriefingCategoryEnum>;

export const BriefingItemSchema = z.object({
  id: z.string(),
  priority: NewsPriorityEnum,
  category: BriefingCategoryEnum,
  headline: z.string().min(1),
  body: z.string(),
  relatedTeamIds: z.array(z.string()),
  relatedPlayerIds: z.array(z.string()),
  timestamp: z.string(),
  acknowledged: z.boolean(),
});
export type BriefingItem = z.infer<typeof BriefingItemSchema>;

export const RivalrySchema = z.object({
  id: z.string(),
  teamA: z.string(),
  teamB: z.string(),
  intensity: z.number().min(0).max(100),
  summary: z.string(),
  reasons: z.array(z.string()),
});
export type Rivalry = z.infer<typeof RivalrySchema>;

export const AwardHistoryEntrySchema = z.object({
  season: z.number().int().min(1),
  award: z.string(),
  playerId: z.string(),
  teamId: z.string(),
  summary: z.string(),
});
export type AwardHistoryEntry = z.infer<typeof AwardHistoryEntrySchema>;

export const SeasonHistoryEntrySchema = z.object({
  season: z.number().int().min(1),
  championTeamId: z.string().nullable(),
  summary: z.string(),
  awards: z.array(AwardHistoryEntrySchema),
  keyMoments: z.array(z.string()),
});
export type SeasonHistoryEntry = z.infer<typeof SeasonHistoryEntrySchema>;
