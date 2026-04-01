import { z } from "zod";

export const ContractDetailSchema = z.object({
  playerId: z.string(),
  years: z.number().int().min(0),
  annualSalaries: z.array(z.number().min(0)),
  noTradeClause: z.boolean(),
  playerOption: z.number().int().min(1).optional(),
  teamOption: z.number().int().min(1).optional(),
  vestingOption: z
    .object({
      year: z.number().int().min(1),
      threshold: z.string(),
      value: z.number().min(0),
    })
    .optional(),
  signingBonus: z.number().min(0),
  totalValue: z.number().min(0),
});
export type ContractDetail = z.infer<typeof ContractDetailSchema>;
