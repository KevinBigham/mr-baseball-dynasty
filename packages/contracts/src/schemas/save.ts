import { z } from "zod";

export const SaveMetaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  season: z.number().int(),
  teamName: z.string(),
  version: z.number().int().min(1),
});
export type SaveMeta = z.infer<typeof SaveMetaSchema>;

export const SaveSlotSchema = z.object({
  slotNumber: z.number().int().min(1).max(10),
  meta: SaveMetaSchema.optional(),
  isEmpty: z.boolean(),
});
export type SaveSlot = z.infer<typeof SaveSlotSchema>;
