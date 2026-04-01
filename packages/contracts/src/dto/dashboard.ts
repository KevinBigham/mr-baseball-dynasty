import { z } from "zod";
import { NewsItemSchema } from "../schemas/narrative.js";

export const ActionItemTypeEnum = z.enum([
  "ROSTER_MOVE",
  "TRADE_OFFER",
  "INJURY",
  "CONTRACT",
  "DEADLINE",
]);
export type ActionItemType = z.infer<typeof ActionItemTypeEnum>;

export const ActionItemSchema = z.object({
  id: z.string(),
  type: ActionItemTypeEnum,
  description: z.string(),
  priority: z.number().int().min(1).max(5),
  actionRoute: z.string(),
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

export const DashboardDTOSchema = z.object({
  teamRecord: z.object({
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  }),
  standingPosition: z.number().int().min(1),
  playoffOdds: z.number().min(0).max(100),
  ownerMood: z.number().int().min(0).max(100),
  actionItems: z.array(ActionItemSchema),
  recentNews: z.array(NewsItemSchema),
  nextEvent: z.object({
    type: z.string(),
    date: z.string(),
    description: z.string(),
  }),
});
export type DashboardDTO = z.infer<typeof DashboardDTOSchema>;
