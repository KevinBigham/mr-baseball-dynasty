import { z } from "zod";
import { DraftPickSchema } from "./draft.js";

export const TradeStatusEnum = z.enum([
  "PROPOSED",
  "COUNTERED",
  "ACCEPTED",
  "REJECTED",
  "EXECUTED",
]);
export type TradeStatus = z.infer<typeof TradeStatusEnum>;

export const TradePackageSchema = z.object({
  players: z.array(z.string()),
  draftPicks: z.array(DraftPickSchema),
});
export type TradePackage = z.infer<typeof TradePackageSchema>;

export const TradeProposalSchema = z.object({
  id: z.string(),
  proposingTeamId: z.string(),
  receivingTeamId: z.string(),
  proposingPackage: TradePackageSchema,
  receivingPackage: TradePackageSchema,
  status: TradeStatusEnum,
  counterOfferCount: z.number().int().min(0),
});
export type TradeProposal = z.infer<typeof TradeProposalSchema>;
