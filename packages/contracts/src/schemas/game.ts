import { z } from "zod";

export const PAOutcomeEnum = z.enum([
  "BB",
  "K",
  "SINGLE",
  "DOUBLE",
  "TRIPLE",
  "HR",
  "GB_OUT",
  "FB_OUT",
  "LD_OUT",
  "HBP",
  "SAC_FLY",
  "SAC_BUNT",
  "DOUBLE_PLAY",
  "FIELDERS_CHOICE",
  "ERROR",
]);
export type PAOutcome = z.infer<typeof PAOutcomeEnum>;

export const PAResultSchema = z.object({
  outcome: PAOutcomeEnum,
  runnersAdvanced: z.number().int().min(0),
  runsScored: z.number().int().min(0),
  batterId: z.string(),
  pitcherId: z.string(),
});
export type PAResult = z.infer<typeof PAResultSchema>;

export const InningHalfEnum = z.enum(["TOP", "BOTTOM"]);
export type InningHalf = z.infer<typeof InningHalfEnum>;

export const GameResultSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  innings: z.number().int().min(1),
  paResults: z.array(PAResultSchema),
  date: z.string(),
  isPlayoff: z.boolean(),
});
export type GameResult = z.infer<typeof GameResultSchema>;
