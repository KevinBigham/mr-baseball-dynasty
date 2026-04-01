import { z } from "zod";

export const StandingsEntrySchema = z.object({
  teamId: z.string(),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  gamesBack: z.number().min(0),
  last10Wins: z.number().int().min(0).max(10),
  last10Losses: z.number().int().min(0).max(10),
  streak: z.string(),
  runDifferential: z.number().int(),
  playoffOdds: z.number().min(0).max(100),
});
export type StandingsEntry = z.infer<typeof StandingsEntrySchema>;

export const AwardTypeEnum = z.enum([
  "MVP",
  "CY_YOUNG",
  "ROY",
  "SILVER_SLUGGER",
  "GOLD_GLOVE",
]);
export type AwardType = z.infer<typeof AwardTypeEnum>;

export const AwardSchema = z.object({
  type: AwardTypeEnum,
  year: z.number().int(),
  playerId: z.string(),
  votes: z.number().int().min(0),
});
export type Award = z.infer<typeof AwardSchema>;
