import type { RandomGenerator } from 'pure-rand';
import { nextFloat } from '../math/prng';
import { ADVANCEMENT_PROBS, getSpeedTier } from '../../data/re24Matrix';
import type { PAOutcome } from '../../types/game';

// ─── Markov chain state ────────────────────────────────────────────────────────
// 24 active states: 8 runner configs × 3 out counts + absorbing state (outs=3)
// runners bitmask: bit0=1st, bit1=2nd, bit2=3rd

export interface MarkovState {
  runners: number; // 0–7 bitmask
  outs: number;    // 0–3 (3 = inning over)
  runsScored: number;
}

export const INITIAL_INNING_STATE: MarkovState = { runners: 0, outs: 0, runsScored: 0 };

// ─── Force-play walker advancement (BB/HBP) ───────────────────────────────────
function forceWalk(runners: number): { newRunners: number; runs: number } {
  // Cascade force plays from the top
  let r = runners;
  let runs = 0;

  if ((r & 0b111) === 0b111) {
    // Bases loaded: runner on 3rd scores, everyone else forced
    runs = 1;
    // All forced one base: 2nd→3rd, 1st→2nd, batter→1st (stays loaded)
    return { newRunners: 0b111, runs };
  }
  if ((r & 0b011) === 0b011) {
    // 1st and 2nd: force 2nd→3rd, 1st→2nd, batter→1st
    r &= ~0b011;
    r |= 0b111;
    return { newRunners: r, runs };
  }
  if (r & 0b001) {
    // 1st only: force 1st→2nd, batter→1st
    r &= ~0b001;
    r |= 0b011;
    return { newRunners: r, runs };
  }
  // Empty: batter takes 1st
  return { newRunners: r | 0b001, runs };
}

// ─── Runner advancement for hits ──────────────────────────────────────────────
function advanceOnHit(
  gen: RandomGenerator,
  runners: number,
  outcome: '1B' | '2B' | '3B' | 'HR',
  leadRunnerSpeed: number,
): [number, number, RandomGenerator] {
  const tier = getSpeedTier(leadRunnerSpeed);
  let r = runners;
  let runs = 0;

  switch (outcome) {
    case 'HR': {
      runs = 1 + ((r & 1) ? 1 : 0) + ((r & 2) ? 1 : 0) + ((r & 4) ? 1 : 0);
      return [0, runs, gen];
    }

    case '3B': {
      runs = ((r & 1) ? 1 : 0) + ((r & 2) ? 1 : 0) + ((r & 4) ? 1 : 0);
      return [0b100, runs, gen];
    }

    case '2B': {
      // Score from 3rd and 2nd always
      if (r & 0b100) { runs++; r &= ~0b100; }
      if (r & 0b010) { runs++; r &= ~0b010; }
      // Runner on 1st may score
      if (r & 0b001) {
        let roll: number;
        [roll, gen] = nextFloat(gen);
        if (roll < ADVANCEMENT_PROBS.score_from_1st_on_double[tier]) {
          runs++; r &= ~0b001;
        } else {
          r &= ~0b001;
          r |= 0b100; // stops at 3rd
        }
      }
      r |= 0b010; // batter takes 2nd
      return [r & 0b111, runs, gen];
    }

    case '1B': {
      // Score from 3rd
      if (r & 0b100) { runs++; r &= ~0b100; }
      // Runner on 2nd: may score or advance to 3rd
      if (r & 0b010) {
        let roll: number;
        [roll, gen] = nextFloat(gen);
        if (roll < ADVANCEMENT_PROBS.score_from_2nd_on_single[tier]) {
          runs++; r &= ~0b010;
        } else {
          r &= ~0b010; r |= 0b100;
        }
      }
      // Runner on 1st: may go 1st→3rd or just 1st→2nd
      if (r & 0b001) {
        let roll: number;
        [roll, gen] = nextFloat(gen);
        if (roll < ADVANCEMENT_PROBS.first_to_third_on_single[tier]) {
          r &= ~0b001; r |= 0b100;
        } else {
          r &= ~0b001; r |= 0b010;
        }
      }
      r |= 0b001; // batter takes 1st
      return [r & 0b111, runs, gen];
    }
  }
}

// ─── Apply PA outcome to Markov state ─────────────────────────────────────────
export function applyOutcome(
  gen: RandomGenerator,
  state: MarkovState,
  outcome: PAOutcome,
  _batterSpeedVal: number,   // for future: batter stealing / infield hit
  leadRunnerSpeedVal: number,
): [MarkovState, RandomGenerator] {
  if (state.outs >= 3) return [state, gen];

  let newOuts = state.outs;
  let newRunners = state.runners;
  let additionalRuns = 0;

  switch (outcome) {
    case 'HR':
    case '3B':
    case '2B':
    case '1B': {
      let runs: number;
      [newRunners, runs, gen] = advanceOnHit(gen, state.runners, outcome, leadRunnerSpeedVal);
      additionalRuns = runs;
      break;
    }

    case 'E': {
      // Error: batter reaches like a single, runners advance
      let runs: number;
      [newRunners, runs, gen] = advanceOnHit(gen, state.runners, '1B', leadRunnerSpeedVal);
      additionalRuns = runs;
      break;
    }

    case 'BB':
    case 'HBP': {
      const { newRunners: nr, runs } = forceWalk(state.runners);
      newRunners = nr;
      additionalRuns = runs;
      break;
    }

    case 'K':
    case 'FB_OUT':
    case 'LD_OUT':
    case 'PU_OUT': {
      newOuts += 1;
      break;
    }

    case 'GB_OUT': {
      newOuts += 1;
      // Runner advancement on groundout:
      // - Runner on 3rd can score on GB with < 2 outs (~45% of the time)
      // - Runner on 2nd advances to 3rd on GB (~60% of the time)
      if (newOuts < 3) {
        if (state.runners & 0b100) {
          // Runner on 3rd: may score on productive groundout (< 2 outs only)
          if (state.outs < 2) {
            let roll: number;
            [roll, gen] = nextFloat(gen);
            if (roll < 0.35) {
              additionalRuns++;
              newRunners = newRunners & ~0b100;
            }
          }
        }
        if (state.runners & 0b010) {
          // Runner on 2nd: advances to 3rd if 3rd isn't occupied
          if (!(newRunners & 0b100)) {
            let roll: number;
            [roll, gen] = nextFloat(gen);
            if (roll < 0.50) {
              newRunners = (newRunners & ~0b010) | 0b100;
            }
          }
        }
      }
      break;
    }

    case 'GDP': {
      // Double play: lead runner on 1st out, batter out, others advance
      newOuts += 2;
      newRunners = newRunners & ~0b001; // runner on 1st out
      // Remaining runners advance one base
      let r = 0;
      if (newRunners & 0b010) r |= 0b100;
      if (newRunners & 0b100) { additionalRuns++; } // score from 3rd
      newRunners = r;
      break;
    }

    case 'SF': {
      newOuts += 1;
      if (state.runners & 0b100) {
        additionalRuns++;
        newRunners = state.runners & ~0b100;
      }
      break;
    }
  }

  return [{
    runners: newRunners & 0b111,
    outs: Math.min(newOuts, 3),
    runsScored: state.runsScored + additionalRuns,
  }, gen];
}
