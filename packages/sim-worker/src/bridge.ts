/**
 * @module bridge
 * Command-to-sim-core mapper for the Web Worker.
 * Phase 0: basic state management and day advancement.
 */

import { GameRNG } from '@mbd/sim-core';

export interface SimState {
  rng: GameRNG;
  season: number;
  day: number;
  phase: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  initialized: boolean;
}

/** Number of regular-season games per team. */
export const REGULAR_SEASON_DAYS = 162;

/**
 * Create a fresh SimState from a seed.
 * Starts at season 1, day 1, preseason phase.
 */
export function createInitialState(seed: number): SimState {
  return {
    rng: new GameRNG(seed),
    season: 1,
    day: 1,
    phase: 'preseason',
    initialized: true,
  };
}

/** Simple ping/pong for worker health checks. */
export function handlePing(): { pong: true; timestamp: number } {
  return { pong: true, timestamp: Date.now() };
}

/**
 * Reset state for a new game with the given seed.
 * Discards any existing state.
 */
export function handleNewGame(_state: SimState, seed: number): SimState {
  return createInitialState(seed);
}

/**
 * Advance the simulation by one day.
 * Wraps the day counter at the regular-season boundary
 * and transitions through phases accordingly.
 */
export function handleSimDay(state: SimState): {
  state: SimState;
  day: number;
  season: number;
} {
  let { day, season, phase } = state;

  if (phase === 'preseason') {
    // Preseason is instantaneous — transition to regular season day 2.
    day++;
    phase = 'regular';
  } else if (phase === 'regular' && day >= REGULAR_SEASON_DAYS) {
    // Regular season complete — advance to playoffs day 1.
    phase = 'playoffs';
    day = 1;
  } else if (phase === 'playoffs' && day >= 30) {
    // Playoffs complete — advance to offseason day 1.
    phase = 'offseason';
    day = 1;
  } else if (phase === 'offseason' && day >= 60) {
    // Offseason complete — new season, preseason day 1.
    phase = 'preseason';
    day = 1;
    season++;
  } else {
    day++;
  }

  const newState: SimState = {
    ...state,
    day,
    season,
    phase,
  };

  return { state: newState, day: newState.day, season: newState.season };
}
