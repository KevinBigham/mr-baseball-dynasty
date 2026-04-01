import { z } from "zod";

export const NewsPriorityEnum = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type NewsPriority = z.infer<typeof NewsPriorityEnum>;

export const NewsItemSchema = z.object({
  id: z.string(),
  headline: z.string().min(1),
  body: z.string(),
  priority: NewsPriorityEnum,
  date: z.string(),
  relatedPlayerIds: z.array(z.string()),
  relatedTeamIds: z.array(z.string()),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const MomentTypeEnum = z.enum([
  "WALK_OFF",
  "MILESTONE",
  "STREAK",
  "RECORD",
  "NO_HITTER",
  "PERFECT_GAME",
]);
export type MomentType = z.infer<typeof MomentTypeEnum>;

export const MomentSchema = z.object({
  id: z.string(),
  type: MomentTypeEnum,
  description: z.string(),
  date: z.string(),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
  details: z.record(z.string(), z.unknown()),
});
export type Moment = z.infer<typeof MomentSchema>;
