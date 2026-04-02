import * as Comlink from 'comlink';
import { actionApi } from './sim.worker.actions.js';
import { queryApi } from './sim.worker.queries.js';

/**
 * Web Worker entry point.
 * The worker owns simulation state and exposes a stable Comlink API.
 */
export const api = {
  ping() {
    return { pong: true as const, timestamp: Date.now() };
  },
  ...actionApi,
  ...queryApi,
};

export type WorkerApi = typeof api;
Comlink.expose(api);
