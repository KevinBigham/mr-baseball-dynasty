import { describe, it, expect } from 'vitest';
import { advanceRunners, freshRunnerState } from '../src/sim/markov.js';

describe('advanceRunners', () => {
  it('starts with empty bases and 0 outs', () => {
    const state = freshRunnerState();
    expect(state.bases).toBe(0);
    expect(state.outs).toBe(0);
  });

  it('walk puts runner on first', () => {
    const state = freshRunnerState();
    const result = advanceRunners(state, 'BB');
    expect(result.newState.bases & 1).toBe(1); // runner on 1st
    expect(result.runsScored).toBe(0);
    expect(result.inningOver).toBe(false);
  });

  it('bases loaded walk scores a run', () => {
    // Bases loaded = 0b111 = 7
    const state = { bases: 7, outs: 0 };
    const result = advanceRunners(state, 'BB');
    expect(result.runsScored).toBe(1);
  });

  it('home run with bases empty scores 1', () => {
    const state = freshRunnerState();
    const result = advanceRunners(state, 'HR');
    expect(result.runsScored).toBe(1);
    expect(result.newState.bases).toBe(0);
  });

  it('grand slam scores 4', () => {
    const state = { bases: 7, outs: 0 };
    const result = advanceRunners(state, 'HR');
    expect(result.runsScored).toBe(4);
  });

  it('triple scores all runners', () => {
    const state = { bases: 0b011, outs: 0 }; // runners on 1st and 2nd
    const result = advanceRunners(state, 'TRIPLE');
    expect(result.runsScored).toBe(2);
    expect(result.newState.bases).toBe(0b100); // runner on 3rd (batter)
  });

  it('strikeout adds an out', () => {
    const state = freshRunnerState();
    const result = advanceRunners(state, 'K');
    expect(result.newState.outs).toBe(1);
    expect(result.runsScored).toBe(0);
  });

  it('three outs end the inning', () => {
    let state = freshRunnerState();
    state = advanceRunners(state, 'K').newState;
    state = advanceRunners(state, 'K').newState;
    const result = advanceRunners(state, 'K');
    expect(result.inningOver).toBe(true);
    expect(result.newState.outs).toBe(0);
    expect(result.newState.bases).toBe(0);
  });

  it('double play adds 2 outs', () => {
    const state = { bases: 0b001, outs: 0 }; // runner on 1st
    const result = advanceRunners(state, 'DOUBLE_PLAY');
    expect(result.newState.outs).toBe(2);
  });

  it('single with runner on 2nd scores a run', () => {
    const state = { bases: 0b010, outs: 0 }; // runner on 2nd
    const result = advanceRunners(state, 'SINGLE');
    expect(result.runsScored).toBe(1);
    expect(result.newState.bases & 1).toBe(1); // batter on 1st
  });

  it('double scores runners from 1st, 2nd, and 3rd', () => {
    const state = { bases: 0b111, outs: 0 }; // bases loaded
    const result = advanceRunners(state, 'DOUBLE');
    expect(result.runsScored).toBe(3);
    expect(result.newState.bases).toBe(0b010); // batter on 2nd
  });
});
