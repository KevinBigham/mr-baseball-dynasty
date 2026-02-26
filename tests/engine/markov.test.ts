import { describe, it, expect } from 'vitest';
import { createPRNG } from '../../src/engine/math/prng';
import { applyOutcome, INITIAL_INNING_STATE, type MarkovState } from '../../src/engine/sim/markov';
import type { PAOutcome } from '../../src/types/game';

const AVG_SPEED = 350; // average speed tier

function simulateInning(outcomes: PAOutcome[], seed = 42): { runs: number; outs: number } {
  let gen = createPRNG(seed);
  let state = { ...INITIAL_INNING_STATE };

  for (const outcome of outcomes) {
    if (state.outs >= 3) break;
    [state, gen] = applyOutcome(gen, state, outcome, AVG_SPEED, AVG_SPEED);
  }

  return { runs: state.runsScored, outs: state.outs };
}

describe('Markov chain — basic state transitions', () => {
  it('starts at zero runners, zero outs', () => {
    expect(INITIAL_INNING_STATE.runners).toBe(0);
    expect(INITIAL_INNING_STATE.outs).toBe(0);
    expect(INITIAL_INNING_STATE.runsScored).toBe(0);
  });

  it('HR with bases empty scores exactly 1 run', () => {
    const { runs } = simulateInning(['HR']);
    expect(runs).toBe(1);
  });

  it('HR with bases loaded scores 4 runs', () => {
    // Load bases with 3 singles, then HR
    const { runs } = simulateInning(['1B', '1B', '1B', 'HR']);
    expect(runs).toBe(4);
  });

  it('3 Ks produce 0 runs and inning ends', () => {
    const { runs, outs } = simulateInning(['K', 'K', 'K']);
    expect(runs).toBe(0);
    expect(outs).toBe(3);
  });

  it('bases loaded walk forces in a run', () => {
    // 1B 1B 1B loads bases, then BB forces one run
    const { runs } = simulateInning(['1B', '1B', '1B', 'BB']);
    expect(runs).toBe(1);
  });

  it('GDP removes runner on 1st and costs 2 outs', () => {
    let gen = createPRNG(1);
    let state = { ...INITIAL_INNING_STATE };

    // Put runner on 1st
    [state, gen] = applyOutcome(gen, state, '1B', AVG_SPEED, AVG_SPEED);
    const runnersBefore = state.runners;
    expect(runnersBefore & 0b001).toBe(1); // runner on 1st

    // GDP
    [state, gen] = applyOutcome(gen, state, 'GDP', AVG_SPEED, AVG_SPEED);
    expect(state.outs).toBe(2);
    expect(state.runners & 0b001).toBe(0); // runner on 1st gone
  });

  it('SF scores runner from 3rd and costs 1 out', () => {
    let gen = createPRNG(1);
    let state = { ...INITIAL_INNING_STATE };

    // Put runner on 3rd (via 3B)
    [state, gen] = applyOutcome(gen, state, '3B', AVG_SPEED, AVG_SPEED);
    expect(state.runners & 0b100).toBe(4); // runner on 3rd

    const runsBefore = state.runsScored;
    [state, gen] = applyOutcome(gen, state, 'SF', AVG_SPEED, AVG_SPEED);
    expect(state.runsScored).toBe(runsBefore + 1);
    expect(state.outs).toBe(1);
    expect(state.runners & 0b100).toBe(0); // 3rd cleared
  });

  it('does nothing if inning already over (outs=3)', () => {
    let gen = createPRNG(1);
    let state = { runners: 0, outs: 3, runsScored: 5 };
    const [newState] = applyOutcome(gen, state, 'HR', AVG_SPEED, AVG_SPEED);
    expect(newState.runsScored).toBe(5); // unchanged
    expect(newState.outs).toBe(3);
  });

  it('3B clears all runners', () => {
    // Directly set up bases loaded — tests the 3B logic, not the path to get there.
    // (Relying on specific singles rolls is too fragile across PRNG versions.)
    let gen = createPRNG(42);
    let state: MarkovState = { runners: 0b111, outs: 0, runsScored: 0 };

    [state, gen] = applyOutcome(gen, state, '3B', AVG_SPEED, AVG_SPEED);
    expect(state.runsScored).toBe(3); // 3 runners scored
    expect(state.runners).toBe(0b100); // batter on 3rd
  });
});

describe('Markov chain — runner advancement speed tiers', () => {
  it('fast runner on 1st can score on a double', () => {
    const FAST_SPEED = 500;
    // Run many trials and expect scoring to happen sometimes
    let scored = 0;
    for (let seed = 0; seed < 100; seed++) {
      let gen = createPRNG(seed);
      let state = { ...INITIAL_INNING_STATE };
      [state, gen] = applyOutcome(gen, state, '1B', AVG_SPEED, FAST_SPEED);
      const startRuns = state.runsScored;
      [state, gen] = applyOutcome(gen, state, '2B', AVG_SPEED, FAST_SPEED);
      if (state.runsScored > startRuns) scored++;
    }
    // With fast runner, score_from_1st_on_double should be ~40% or more
    expect(scored).toBeGreaterThan(20);
  });

  it('slow runner on 1st rarely scores on a double', () => {
    const SLOW_SPEED = 100;
    let scored = 0;
    for (let seed = 0; seed < 100; seed++) {
      let gen = createPRNG(seed);
      let state = { ...INITIAL_INNING_STATE };
      [state, gen] = applyOutcome(gen, state, '1B', AVG_SPEED, SLOW_SPEED);
      const startRuns = state.runsScored;
      [state, gen] = applyOutcome(gen, state, '2B', AVG_SPEED, SLOW_SPEED);
      if (state.runsScored > startRuns) scored++;
    }
    // Slow runner should score <20% of the time
    expect(scored).toBeLessThan(30);
  });
});
