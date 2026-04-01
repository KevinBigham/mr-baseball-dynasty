import { z } from "zod";

export const ScoutReportSchema = z.object({
  playerId: z.string(),
  scoutId: z.string(),
  overallGrade: z.number().int().min(20).max(80),
  confidence: z.number().int().min(0).max(100),
  attributes: z.record(z.string(), z.number().int().min(20).max(80)),
  notes: z.string(),
  date: z.string(),
});
export type ScoutReport = z.infer<typeof ScoutReportSchema>;

export const DraftPickSchema = z.object({
  round: z.number().int().min(1),
  pickNumber: z.number().int().min(1),
  teamId: z.string(),
  playerId: z.string().optional(),
});
export type DraftPick = z.infer<typeof DraftPickSchema>;

export const DraftClassSchema = z.object({
  year: z.number().int(),
  picks: z.array(DraftPickSchema),
});
export type DraftClass = z.infer<typeof DraftClassSchema>;
