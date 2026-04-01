/**
 * Web Worker entry point.
 * Imports the sim-worker package which calls Comlink.expose() on load.
 */
import * as Comlink from 'comlink';
import { GameRNG } from '@mbd/sim-core';

interface SimState {
  rng: GameRNG;
  season: number;
  day: number;
  phase: 'preseason' | 'regular' | 'playoffs' | 'offseason';
}

let state: SimState | null = null;

const api = {
  ping() {
    return { pong: true as const, timestamp: Date.now() };
  },

  newGame(seed: number) {
    state = {
      rng: new GameRNG(seed),
      season: 1,
      day: 1,
      phase: 'preseason' as const,
    };
    return { success: true as const, season: state.season, day: state.day };
  },

  simDay() {
    if (!state) throw new Error('No game initialized');
    state = { ...state, day: state.day + 1 };
    if (state.day > 162) {
      state = { ...state, day: 162, phase: 'playoffs' as const };
    }
    return { day: state.day, season: state.season, phase: state.phase };
  },

  simWeek() {
    if (!state) throw new Error('No game initialized');
    const newDay = Math.min(state.day + 7, 162);
    const phase = newDay >= 162 ? ('playoffs' as const) : state.phase;
    state = { ...state, day: newDay, phase };
    return { day: state.day, season: state.season, phase: state.phase };
  },

  simMonth() {
    if (!state) throw new Error('No game initialized');
    const newDay = Math.min(state.day + 30, 162);
    const phase = newDay >= 162 ? ('playoffs' as const) : state.phase;
    state = { ...state, day: newDay, phase };
    return { day: state.day, season: state.season, phase: state.phase };
  },

  getState() {
    if (!state) return null;
    return { season: state.season, day: state.day, phase: state.phase };
  },
};

export type WorkerApi = typeof api;
Comlink.expose(api);
