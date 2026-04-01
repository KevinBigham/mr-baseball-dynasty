/**
 * @module markov
 * 24-state Markov baserunner FSM.
 *
 * State = (base occupancy) x (outs).
 * Base occupancy is a 3-bit mask: [1st, 2nd, 3rd].
 * Outs: 0, 1, or 2. (3 outs = inning over.)
 *
 * Pure function: input state + PA outcome -> output state + runs scored.
 */

import type { PAOutcome } from './plateAppearance.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 3-bit base occupancy: bit 0 = 1st, bit 1 = 2nd, bit 2 = 3rd */
export type BaseState = number; // 0b000 to 0b111

export interface RunnerState {
  readonly bases: BaseState;
  readonly outs: number;
}

export interface MarkovResult {
  readonly newState: RunnerState;
  readonly runsScored: number;
  readonly inningOver: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasRunner(bases: BaseState, base: 1 | 2 | 3): boolean {
  return (bases & (1 << (base - 1))) !== 0;
}

function setRunner(bases: BaseState, base: 1 | 2 | 3): BaseState {
  return bases | (1 << (base - 1));
}

function clearRunner(bases: BaseState, base: 1 | 2 | 3): BaseState {
  return bases & ~(1 << (base - 1));
}

function countRunners(bases: BaseState): number {
  return (bases & 1) + ((bases >> 1) & 1) + ((bases >> 2) & 1);
}

// ---------------------------------------------------------------------------
// Transition logic
// ---------------------------------------------------------------------------

/**
 * Advance the base/out state given a PA outcome.
 * Returns the new state and runs scored.
 */
export function advanceRunners(state: RunnerState, outcome: PAOutcome): MarkovResult {
  let { bases, outs } = state;
  let runs = 0;

  switch (outcome) {
    case 'BB':
    case 'HBP': {
      // Walk: forced advancement only
      if (hasRunner(bases, 1)) {
        if (hasRunner(bases, 2)) {
          if (hasRunner(bases, 3)) {
            runs++; // Runner on 3rd scores
          }
          bases = setRunner(bases, 3);
        }
        bases = setRunner(bases, 2);
      }
      bases = setRunner(bases, 1);
      break;
    }

    case 'SINGLE': {
      // Runners advance 1 base; runner on 3rd scores, runner on 2nd scores
      if (hasRunner(bases, 3)) { runs++; bases = clearRunner(bases, 3); }
      if (hasRunner(bases, 2)) { runs++; bases = clearRunner(bases, 2); }
      if (hasRunner(bases, 1)) {
        bases = clearRunner(bases, 1);
        bases = setRunner(bases, 2);
      }
      bases = setRunner(bases, 1);
      break;
    }

    case 'DOUBLE': {
      // All runners score except batter goes to 2nd
      if (hasRunner(bases, 3)) { runs++; bases = clearRunner(bases, 3); }
      if (hasRunner(bases, 2)) { runs++; bases = clearRunner(bases, 2); }
      if (hasRunner(bases, 1)) { runs++; bases = clearRunner(bases, 1); }
      bases = setRunner(bases, 2);
      break;
    }

    case 'TRIPLE': {
      // All runners score, batter to 3rd
      runs += countRunners(bases);
      bases = 0;
      bases = setRunner(bases, 3);
      break;
    }

    case 'HR': {
      // Everyone scores including batter
      runs += countRunners(bases) + 1;
      bases = 0;
      break;
    }

    case 'K': {
      outs++;
      break;
    }

    case 'GB_OUT': {
      outs++;
      // Runner on 1st advances to 2nd on ground out (if less than 2 outs)
      if (outs < 3 && hasRunner(bases, 1)) {
        bases = clearRunner(bases, 1);
        bases = setRunner(bases, 2);
      }
      // Runner on 3rd scores on ground out (if less than 2 outs when play started)
      if (state.outs < 2 && hasRunner(bases, 3)) {
        runs++;
        bases = clearRunner(bases, 3);
      }
      break;
    }

    case 'FB_OUT':
    case 'LD_OUT': {
      outs++;
      // Sac fly: runner on 3rd scores with less than 2 outs
      if (state.outs < 2 && hasRunner(bases, 3)) {
        runs++;
        bases = clearRunner(bases, 3);
      }
      break;
    }

    case 'SAC_FLY': {
      outs++;
      if (hasRunner(bases, 3)) {
        runs++;
        bases = clearRunner(bases, 3);
      }
      break;
    }

    case 'DOUBLE_PLAY': {
      outs += 2;
      // Lead runner is out, batter is out
      if (hasRunner(bases, 1)) {
        bases = clearRunner(bases, 1);
      } else if (hasRunner(bases, 2)) {
        bases = clearRunner(bases, 2);
      }
      break;
    }

    default:
      outs++;
      break;
  }

  const inningOver = outs >= 3;

  return {
    newState: { bases: inningOver ? 0 : bases, outs: inningOver ? 0 : outs },
    runsScored: runs,
    inningOver,
  };
}

/** Create a fresh runner state (start of half-inning). */
export function freshRunnerState(): RunnerState {
  return { bases: 0, outs: 0 };
}
