/**
 * @module worker
 * Web Worker entry point. Exposes the sim API via Comlink.
 *
 * This file is loaded as a Web Worker by the React app.
 * The app wraps it with Comlink.wrap<WorkerApi>().
 */

import * as Comlink from 'comlink';
import { createInitialState, type SimState } from './bridge.js';
import { systemCommands } from './commands/systemCommands.js';
import { seasonCommands } from './commands/seasonCommands.js';

let state: SimState | null = null;

const workerApi = {
  ping() {
    return systemCommands.ping();
  },

  newGame(seed: number) {
    state = createInitialState(seed);
    return { success: true as const, season: state.season, day: state.day };
  },

  simDay() {
    if (!state) throw new Error('No game initialized');
    const result = seasonCommands.simDay(state);
    state = result.state;
    return result.result;
  },

  simWeek() {
    if (!state) throw new Error('No game initialized');
    const result = seasonCommands.simWeek(state);
    state = result.state;
    return result.result;
  },

  getState() {
    if (!state) return null;
    return { season: state.season, day: state.day, phase: state.phase };
  },
};

export type WorkerApi = typeof workerApi;

Comlink.expose(workerApi);
