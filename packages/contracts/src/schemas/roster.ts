import { z } from "zod";

export const TransactionTypeEnum = z.enum([
  "PROMOTE",
  "DEMOTE",
  "DFA",
  "WAIVER_CLAIM",
  "TRADE",
  "SIGN",
  "RELEASE",
  "DRAFT",
  "RULE5",
]);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const RosterTransactionSchema = z.object({
  id: z.string(),
  type: TransactionTypeEnum,
  playerId: z.string(),
  fromTeamId: z.string().optional(),
  toTeamId: z.string(),
  date: z.string(),
  details: z.string(),
});
export type RosterTransaction = z.infer<typeof RosterTransactionSchema>;
