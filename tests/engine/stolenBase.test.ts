import { describe, it, expect } from 'vitest';
import { createPRNG } from '../../src/engine/math/prng';
import { attemptSteals, type StealAttemptResult } from '../../src/engine/sim/stolenBase';
import type { MarkovState } from '../../src/engine/sim/markov';
import type { Player } from '../../src/types/player';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeRunner(overrides: { speed?: number; baserunningIQ?: number } = {}): Player {
  return {
    playerId: 100,
    teamId: 1,
    name: 'Test Runner',
    age: 25,
    position: 'CF',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: false,
    overall: 400,
    potential: 450,
    hitterAttributes: {
      contact: 400, power: 380, eye: 380,
      speed: overrides.speed ?? 400,
      baserunningIQ: overrides.baserunningIQ ?? 400,
      fielding: 350, armStrength: 350, durability: 400,
      platoonSensitivity: 0, offensiveIQ: 400, defensiveIQ: 350,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    development: { theta: 0, sigma: 0, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE', isOn40Man: true, optionYearsRemaining: 0,
      optionUsedThisSeason: false, minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0, serviceTimeDays: 172, serviceTimeCurrentTeamDays: 172,
      rule5Selected: false, signedSeason: 2024, signedAge: 23,
      contractYearsRemaining: 3, salary: 1_000_000, arbitrationEligible: false,
      freeAgentEligible: false, hasTenAndFive: false,
    },
  };
}

function makePitcher(holdRunners = 300): Player {
  return {
    playerId: 200,
    teamId: 2,
    name: 'Test Pitcher',
    age: 28,
    position: 'SP',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: true,
    overall: 400,
    potential: 400,
    hitterAttributes: null,
    pitcherAttributes: {
      stuff: 400, movement: 400, command: 400, stamina: 400,
      pitchArsenalCount: 4, gbFbTendency: 50,
      holdRunners,
      durability: 400, recoveryRate: 400, platoonTendency: 0,
      pitchTypeMix: { fastball: 0.55, breaking: 0.30, offspeed: 0.15 },
      pitchingIQ: 400, workEthic: 50, mentalToughness: 50,
    },
    development: { theta: 0, sigma: 0, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE', isOn40Man: true, optionYearsRemaining: 0,
      optionUsedThisSeason: false, minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0, serviceTimeDays: 172, serviceTimeCurrentTeamDays: 172,
      rule5Selected: false, signedSeason: 2024, signedAge: 26,
      contractYearsRemaining: 3, salary: 1_000_000, arbitrationEligible: false,
      freeAgentEligible: false, hasTenAndFive: false,
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Stolen Base Engine', () => {
  it('never attempts steal with empty bases', () => {
    let gen = createPRNG(42);
    const state: MarkovState = { runners: 0, outs: 0, runsScored: 0 };
    const runners = [null, null, null] as unknown as Player[];
    const [newState, results] = attemptSteals(gen, state, runners, makePitcher(), null, 0);
    expect(results).toHaveLength(0);
    expect(newState.runners).toBe(0);
  });

  it('fast runners steal more often than slow runners over many opportunities', () => {
    const N = 5000;
    let fastSB = 0;
    let slowSB = 0;

    const fastRunner = makeRunner({ speed: 520, baserunningIQ: 450 });
    const slowRunner = makeRunner({ speed: 200, baserunningIQ: 250 });
    const pitcher = makePitcher();

    for (let i = 0; i < N; i++) {
      // Fast runner on 1st
      let gen = createPRNG(i * 31 + 1);
      const state: MarkovState = { runners: 0b001, outs: 0, runsScored: 0 };
      const [, results] = attemptSteals(gen, state, [fastRunner, fastRunner, fastRunner], pitcher, null, 0);
      for (const r of results) if (r.success) fastSB++;

      // Slow runner on 1st
      gen = createPRNG(i * 31 + 1);
      const [, results2] = attemptSteals(gen, state, [slowRunner, slowRunner, slowRunner], pitcher, null, 0);
      for (const r of results2) if (r.success) slowSB++;
    }

    // Fast runners should steal significantly more
    expect(fastSB).toBeGreaterThan(slowSB * 2);
  });

  it('does not attempt steal when base ahead is occupied (bases loaded)', () => {
    // Bases loaded — no one can steal because the next base is always occupied
    const state: MarkovState = { runners: 0b111, outs: 0, runsScored: 0 };
    const fastRunner = makeRunner({ speed: 550, baserunningIQ: 500 });
    let totalAttempts = 0;

    for (let i = 0; i < 1000; i++) {
      const gen = createPRNG(i + 100);
      const [, results] = attemptSteals(gen, state, [fastRunner, fastRunner, fastRunner], makePitcher(), null, 0);
      totalAttempts += results.length;
    }
    expect(totalAttempts).toBe(0);
  });

  it('caught stealing results in an out', () => {
    // Run many trials and verify CS adds outs
    let csCount = 0;
    const N = 5000;
    const runner = makeRunner({ speed: 350, baserunningIQ: 300 });
    const pitcher = makePitcher(500); // Very good at holding runners

    for (let i = 0; i < N; i++) {
      const gen = createPRNG(i * 17 + 7);
      const state: MarkovState = { runners: 0b001, outs: 0, runsScored: 0 };
      const [newState, results] = attemptSteals(gen, state, [runner, runner, runner], pitcher, null, 0);
      for (const r of results) {
        if (!r.success) {
          csCount++;
          expect(newState.outs).toBeGreaterThan(0);
        }
      }
    }
    // Should have at least some caught stealings
    expect(csCount).toBeGreaterThan(0);
  });

  it('successful SB moves runner to next base', () => {
    const N = 5000;
    const runner = makeRunner({ speed: 550, baserunningIQ: 500 });
    let sbFromFirst = 0;

    for (let i = 0; i < N; i++) {
      const gen = createPRNG(i * 29 + 3);
      const state: MarkovState = { runners: 0b001, outs: 0, runsScored: 0 };
      const [newState, results] = attemptSteals(gen, state, [runner, runner, runner], makePitcher(), null, 0);
      for (const r of results) {
        if (r.success && r.fromBase === 1) {
          sbFromFirst++;
          // Runner should now be on 2nd, not 1st
          expect(newState.runners & 0b010).toBeTruthy();
          expect(newState.runners & 0b001).toBeFalsy();
        }
      }
    }
    expect(sbFromFirst).toBeGreaterThan(0);
  });
});
