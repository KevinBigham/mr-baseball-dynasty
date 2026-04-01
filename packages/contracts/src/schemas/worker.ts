import { z } from "zod";

export const WorkerCommandEnum = z.enum([
  "PING",
  "SIM_DAY",
  "SIM_WEEK",
  "SIM_MONTH",
  "SIM_SEASON",
  "GET_ROSTER",
  "GET_PLAYER",
  "GET_STANDINGS",
  "GET_DASHBOARD",
  "SAVE_GAME",
  "LOAD_GAME",
  "NEW_GAME",
]);
export type WorkerCommand = z.infer<typeof WorkerCommandEnum>;

export const WorkerResponseStatusEnum = z.enum(["SUCCESS", "ERROR"]);
export type WorkerResponseStatus = z.infer<typeof WorkerResponseStatusEnum>;

export const WorkerRequestSchema = z.object({
  command: WorkerCommandEnum,
  payload: z.unknown(),
});
export type WorkerRequest = z.infer<typeof WorkerRequestSchema>;

export const WorkerResponseSchema = z.object({
  status: WorkerResponseStatusEnum,
  data: z.unknown(),
  error: z.string().optional(),
});
export type WorkerResponse = z.infer<typeof WorkerResponseSchema>;
