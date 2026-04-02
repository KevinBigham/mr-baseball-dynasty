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

export const PersistentTradeOfferSchema = z.object({
  id: z.string(),
  fromTeamId: z.string(),
  toTeamId: z.string(),
  offeringPlayerIds: z.array(z.string()),
  requestingPlayerIds: z.array(z.string()),
  fairnessScore: z.number(),
  message: z.string(),
  createdAt: z.string(),
});
export type PersistentTradeOffer = z.infer<typeof PersistentTradeOfferSchema>;

export const TradeHistoryEntrySchema = z.object({
  id: z.string(),
  fromTeamId: z.string(),
  toTeamId: z.string(),
  offeringPlayerIds: z.array(z.string()),
  requestingPlayerIds: z.array(z.string()),
  fairnessScore: z.number(),
  summary: z.string(),
  timestamp: z.string(),
});
export type TradeHistoryEntry = z.infer<typeof TradeHistoryEntrySchema>;

export const TradeStateSchema = z.object({
  pendingOffers: z.array(PersistentTradeOfferSchema),
  tradeHistory: z.array(TradeHistoryEntrySchema),
});
export type TradeState = z.infer<typeof TradeStateSchema>;
