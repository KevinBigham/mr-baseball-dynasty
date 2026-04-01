import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  handlePing,
  handleSimDay,
  REGULAR_SEASON_DAYS,
} from '../src/bridge.js';
import { seasonCommands } from '../src/commands/seasonCommands.js';

describe('bridge', () => {
  describe('createInitialState', () => {
    it('returns a valid state with the correct seed', () => {
      const state = createInitialState(42);
      expect(state.initialized).toBe(true);
      expect(state.season).toBe(1);
      expect(state.day).toBe(1);
      expect(state.phase).toBe('preseason');
      expect(state.rng).toBeDefined();
      expect(state.rng.getSeed()).toBe(42);
    });

    it('produces deterministic RNG from the same seed', () => {
      const a = createInitialState(123);
      const b = createInitialState(123);
      expect(a.rng.nextFloat()).toBe(b.rng.nextFloat());
    });
  });

  describe('handlePing', () => {
    it('returns pong with a timestamp', () => {
      const result = handlePing();
      expect(result.pong).toBe(true);
      expect(typeof result.timestamp).toBe('number');
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });

  describe('handleSimDay', () => {
    it('advances the day counter by 1', () => {
      const state = createInitialState(1);
      const result = handleSimDay(state);
      expect(result.day).toBe(2);
      expect(result.season).toBe(1);
    });

    it('transitions from preseason to regular on first advance', () => {
      const state = createInitialState(1);
      expect(state.phase).toBe('preseason');
      const result = handleSimDay(state);
      expect(result.state.phase).toBe('regular');
    });

    it('stays in regular season within bounds', () => {
      let state = createInitialState(1);
      // Advance past preseason
      state = handleSimDay(state).state;
      expect(state.phase).toBe('regular');

      // Advance a few more days
      for (let i = 0; i < 5; i++) {
        state = handleSimDay(state).state;
      }
      expect(state.phase).toBe('regular');
      expect(state.day).toBe(7); // 1 (preseason advance) + 1 (to regular) + 5 = day 7
    });

    it('wraps to playoffs after regular season ends', () => {
      let state = createInitialState(1);
      // 1 call: preseason -> regular (day 2)
      // 160 calls: regular day 3..162
      // 1 call: day >= 162 -> playoffs day 1
      // Total: 162 calls
      for (let i = 0; i < REGULAR_SEASON_DAYS; i++) {
        state = handleSimDay(state).state;
      }
      expect(state.phase).toBe('playoffs');
      expect(state.day).toBe(1);
    });

    it('wraps to offseason after playoffs end', () => {
      let state = createInitialState(1);
      // Through preseason + regular season (162 calls)
      for (let i = 0; i < REGULAR_SEASON_DAYS; i++) {
        state = handleSimDay(state).state;
      }
      expect(state.phase).toBe('playoffs');

      // Through 30 days of playoffs: days 2..30 (29 calls), then wrap (1 call) = 30
      for (let i = 0; i < 30; i++) {
        state = handleSimDay(state).state;
      }
      expect(state.phase).toBe('offseason');
      expect(state.day).toBe(1);
    });

    it('wraps to next season after offseason ends', () => {
      let state = createInitialState(1);
      // regular: 162, playoffs: 30, offseason: 60
      const totalDays = REGULAR_SEASON_DAYS + 30 + 60;
      for (let i = 0; i < totalDays; i++) {
        state = handleSimDay(state).state;
      }
      expect(state.phase).toBe('preseason');
      expect(state.season).toBe(2);
      expect(state.day).toBe(1);
    });
  });

  describe('seasonCommands.simDay', () => {
    it('returns state and result with day and season', () => {
      const state = createInitialState(99);
      const { state: newState, result } = seasonCommands.simDay(state);
      expect(newState.day).toBe(2);
      expect(result.day).toBe(2);
      expect(result.season).toBe(1);
    });
  });

  describe('seasonCommands.simWeek', () => {
    it('advances 7 days', () => {
      const state = createInitialState(55);
      const { result } = seasonCommands.simWeek(state);
      // Start at day 1, advance 7 = day 8
      expect(result.day).toBe(8);
      expect(result.season).toBe(1);
    });

    it('handles phase transitions within a week', () => {
      let state = createInitialState(1);
      // Move to day 160 of regular season
      // First advance past preseason
      state = handleSimDay(state).state;
      // Then advance to day 160
      for (let i = 0; i < 158; i++) {
        state = handleSimDay(state).state;
      }
      expect(state.day).toBe(160);
      expect(state.phase).toBe('regular');

      // simWeek from day 160: days 161, 162 (end regular), then playoffs 1..5
      const { state: newState, result } = seasonCommands.simWeek(state);
      expect(newState.phase).toBe('playoffs');
      expect(result.day).toBe(5);
    });
  });
});
