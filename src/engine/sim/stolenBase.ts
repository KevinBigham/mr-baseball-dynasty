import type { RandomGenerator } from 'pure-rand';
import { nextFloat } from '../math/prng';
import type { Player } from '../../types/player';
import type { MarkovState } from './markov';

// ─── Stolen base decision + resolution engine ───────────────────────────────
// Called between PAs. Each runner on 1st or 2nd may attempt a steal.
// Factors: runner speed, baserunning IQ, pitcher holdRunners, catcher arm,
//          game situation (outs, score differential, inning).

export interface StealAttemptResult {
  runnerId: number;
  fromBase: 1 | 2;   // stealing from 1st (→2nd) or 2nd (→3rd)
  success: boolean;
}

// Probability that a runner with given speed attempts a steal in this situation
function stealAttemptProbability(
  speed: number,
  baserunningIQ: number,
  outs: number,
  fromBase: 1 | 2,
  isBaseBehindOccupied: boolean,
): number {
  // Fast runners (speed > 400) attempt more often
  // MLB average SB attempt rate: ~0.06 per time on base
  const speedFactor = Math.max(0, (speed - 250) / 300); // 0 at 250, 1.0 at 550
  const iqFactor = Math.max(0.3, baserunningIQ / 400);  // smarter runners pick better spots

  // Base rates by situation
  let baseRate = 0.04; // base attempt rate per PA while on base

  // More attempts from 1st than 2nd (2nd→3rd is riskier)
  if (fromBase === 2) baseRate *= 0.35;

  // Fewer attempts with 2 outs (not worth the risk usually)
  if (outs === 2) baseRate *= 0.5;

  // Don't steal if the base ahead is occupied (can't steal into an occupied base)
  if (isBaseBehindOccupied) return 0;

  return Math.min(0.20, baseRate * speedFactor * iqFactor);
}

// Catcher pop time: composite of arm strength, fielding mechanics, and reaction time.
// In real baseball, pop time (catcher release → ball at bag) averages ~2.0s.
// Elite catchers are ~1.85s, poor catchers ~2.15s. This translates to SB success reduction.
function catcherPopTimeRating(catcher: Player | null): number {
  if (!catcher) return 350; // Average if no catcher data
  const h = catcher.hitterAttributes;
  if (!h) return 350;
  // Pop time = 55% arm strength (throw velocity) + 30% fielding (transfer/footwork) + 15% defensiveIQ (anticipation)
  return h.armStrength * 0.55 + h.fielding * 0.30 + (h.defensiveIQ ?? 400) * 0.15;
}

// Success probability given an attempt
function stealSuccessProbability(
  runnerSpeed: number,
  runnerBRIQ: number,
  pitcherHoldRunners: number,
  catcherPopTime: number,
  fromBase: 1 | 2,
): number {
  // MLB average SB success rate: ~75%
  // Speed is primary factor, pitcher hold and catcher pop time are defensive
  const speedPct = runnerSpeed / 550;          // 0-1
  const holdPct = pitcherHoldRunners / 550;    // 0-1 (higher = better at holding)
  const popPct = catcherPopTime / 550;         // 0-1 (higher = better pop time)
  const iqBonus = (runnerBRIQ - 300) / 500 * 0.05; // small IQ bonus

  // Base success rate scales with speed
  let successRate = 0.50 + speedPct * 0.35 + iqBonus; // range: ~0.50 to 0.90

  // Pitcher holding reduces success
  successRate -= holdPct * 0.12;

  // Catcher pop time reduces success (composite is stronger than arm alone)
  successRate -= popPct * 0.12;

  // Stealing 3rd is slightly harder
  if (fromBase === 2) successRate -= 0.05;

  return Math.max(0.30, Math.min(0.95, successRate));
}

// Main entry point: check for steal attempts between PAs
export function attemptSteals(
  gen: RandomGenerator,
  state: MarkovState,
  runners: Player[],         // runners currently on base [1st, 2nd, 3rd] or null
  pitcher: Player,
  catcher: Player | null,
  outs: number,
): [MarkovState, StealAttemptResult[], RandomGenerator] {
  if (state.outs >= 3) return [state, [], gen];

  const results: StealAttemptResult[] = [];
  let newRunners = state.runners;
  let newOuts = state.outs;

  const catcherPop = catcherPopTimeRating(catcher);
  const pitcherHold = pitcher.pitcherAttributes?.holdRunners ?? 300;

  // Check runner on 2nd first (stealing 3rd)
  if (newRunners & 0b010) {
    const runner = runners[1];
    if (runner) {
      const speed = runner.hitterAttributes?.speed ?? 300;
      const briq = runner.hitterAttributes?.baserunningIQ ?? 300;
      const thirdOccupied = (newRunners & 0b100) !== 0;

      let roll: number;
      [roll, gen] = nextFloat(gen);
      const attemptProb = stealAttemptProbability(speed, briq, outs, 2, thirdOccupied);

      if (roll < attemptProb) {
        let successRoll: number;
        [successRoll, gen] = nextFloat(gen);
        const successProb = stealSuccessProbability(speed, briq, pitcherHold, catcherPop, 2);

        if (successRoll < successProb) {
          // Success: 2nd → 3rd
          newRunners = (newRunners & ~0b010) | 0b100;
          results.push({ runnerId: runner.playerId, fromBase: 2, success: true });
        } else {
          // Caught stealing: runner out
          newRunners = newRunners & ~0b010;
          newOuts++;
          results.push({ runnerId: runner.playerId, fromBase: 2, success: false });
        }
      }
    }
  }

  // Check runner on 1st (stealing 2nd)
  if (newOuts < 3 && (newRunners & 0b001)) {
    const runner = runners[0];
    if (runner) {
      const speed = runner.hitterAttributes?.speed ?? 300;
      const briq = runner.hitterAttributes?.baserunningIQ ?? 300;
      const secondOccupied = (newRunners & 0b010) !== 0;

      let roll: number;
      [roll, gen] = nextFloat(gen);
      const attemptProb = stealAttemptProbability(speed, briq, outs, 1, secondOccupied);

      if (roll < attemptProb) {
        let successRoll: number;
        [successRoll, gen] = nextFloat(gen);
        const successProb = stealSuccessProbability(speed, briq, pitcherHold, catcherPop, 1);

        if (successRoll < successProb) {
          // Success: 1st → 2nd
          newRunners = (newRunners & ~0b001) | 0b010;
          results.push({ runnerId: runner.playerId, fromBase: 1, success: true });
        } else {
          // Caught stealing
          newRunners = newRunners & ~0b001;
          newOuts++;
          results.push({ runnerId: runner.playerId, fromBase: 1, success: false });
        }
      }
    }
  }

  if (results.length === 0) return [state, [], gen];

  return [{
    runners: newRunners & 0b111,
    outs: Math.min(newOuts, 3),
    runsScored: state.runsScored,
  }, results, gen];
}
