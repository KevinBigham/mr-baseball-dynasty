/**
 * @module seasonCommands
 * Commands that advance the simulation calendar.
 */

import type { SimState } from '../bridge.js';
import { handleSimDay } from '../bridge.js';

export const seasonCommands = {
  /**
   * Advance the simulation by one day.
   */
  simDay(state: SimState): {
    state: SimState;
    result: { day: number; season: number; phase: string };
  } {
    const { state: newState, day, season } = handleSimDay(state);
    return { state: newState, result: { day, season, phase: newState.phase } };
  },

  /**
   * Advance the simulation by 7 days.
   * Returns the final state and day/season after all 7 advances.
   */
  simWeek(state: SimState): {
    state: SimState;
    result: { day: number; season: number; phase: string };
  } {
    let current = state;
    let day = state.day;
    let season = state.season;

    for (let i = 0; i < 7; i++) {
      const result = handleSimDay(current);
      current = result.state;
      day = result.day;
      season = result.season;
    }

    return { state: current, result: { day, season, phase: current.phase } };
  },
};
