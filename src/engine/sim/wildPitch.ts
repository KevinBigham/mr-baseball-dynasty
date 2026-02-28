import type { RandomGenerator } from 'pure-rand';
import { nextFloat } from '../math/prng';
import type { Player } from '../../types/player';
import type { MarkovState } from './markov';

// ─── Wild Pitch / Passed Ball engine ─────────────────────────────────────────
// Called between PAs when runners are on base.
// Wild pitches depend on pitcher command and pitch mix.
// Passed balls depend on catcher fielding.
// MLB averages: ~0.35 WP/game, ~0.08 PB/game → ~0.43 events/game
// With ~280 PAs/game and ~65% of PAs having runners on base → ~180 opportunities
// Rate per opportunity: 0.43/180 ≈ 0.0024

export interface WildPitchResult {
  type: 'WP' | 'PB';
  runsScored: number;
}

// Wild pitch probability per PA with runners on base
function wildPitchProbability(
  pitcher: Player,
  pitchCount: number,
): number {
  const command = pitcher.pitcherAttributes?.command ?? 400;
  const breakingPct = pitcher.pitcherAttributes?.pitchTypeMix.breaking ?? 0.30;

  // Base rate: ~0.002 per PA opportunity
  let rate = 0.002;

  // Lower command → more wild pitches (avg command 400 = neutral)
  const commandFactor = Math.max(0.5, (800 - command) / 400); // 1.0 at 400, ~1.5 at 200, ~0.5 at 600
  rate *= commandFactor;

  // More breaking balls → more wild pitches (breaking balls bounce in dirt)
  rate *= (0.70 + breakingPct * 1.0); // 1.0 at 30% breaking, 1.2 at 50%

  // Fatigue increases WP rate
  if (pitchCount > 80) rate *= 1.3;
  else if (pitchCount > 60) rate *= 1.1;

  return Math.max(0.0005, Math.min(0.008, rate));
}

// Passed ball probability per PA with runners on base
function passedBallProbability(
  catcher: Player | null,
  pitcher: Player,
): number {
  if (!catcher) return 0.001; // No catcher data → minimal rate

  const catcherFielding = catcher.hitterAttributes?.fielding ?? 350;
  const catcherDefIQ = catcher.hitterAttributes?.defensiveIQ ?? 350;
  const pitcherStuff = pitcher.pitcherAttributes?.stuff ?? 400;

  // Base rate: ~0.0005 per PA opportunity
  let rate = 0.0005;

  // Poor catchers let more balls through
  const catcherFactor = Math.max(0.4, (800 - catcherFielding) / 400);
  rate *= catcherFactor;

  // Low defensive IQ compounds it
  const iqFactor = Math.max(0.5, (700 - catcherDefIQ) / 300);
  rate *= iqFactor;

  // Harder throwing pitchers create more PBs (nastier stuff to handle)
  if (pitcherStuff > 450) rate *= 1.2;

  return Math.max(0.0001, Math.min(0.003, rate));
}

// Advance all runners one base on WP/PB. Runner on 3rd scores.
function advanceRunners(state: MarkovState): { newRunners: number; runsScored: number } {
  let r = state.runners;
  let runs = 0;

  // Runner on 3rd scores
  if (r & 0b100) {
    runs++;
    r &= ~0b100;
  }

  // Runner on 2nd → 3rd
  if (r & 0b010) {
    r &= ~0b010;
    r |= 0b100;
  }

  // Runner on 1st → 2nd
  if (r & 0b001) {
    r &= ~0b001;
    r |= 0b010;
  }

  return { newRunners: r & 0b111, runsScored: runs };
}

// Main entry point: check for WP/PB between PAs
export function checkWildPitch(
  gen: RandomGenerator,
  state: MarkovState,
  pitcher: Player,
  catcher: Player | null,
  pitchCount: number,
): [MarkovState, WildPitchResult | null, RandomGenerator] {
  if (state.outs >= 3 || state.runners === 0) return [state, null, gen];

  // Check for wild pitch
  let roll: number;
  [roll, gen] = nextFloat(gen);
  const wpProb = wildPitchProbability(pitcher, pitchCount);

  if (roll < wpProb) {
    const { newRunners, runsScored } = advanceRunners(state);
    return [{
      runners: newRunners,
      outs: state.outs,
      runsScored: state.runsScored + runsScored,
    }, { type: 'WP', runsScored }, gen];
  }

  // Check for passed ball
  [roll, gen] = nextFloat(gen);
  const pbProb = passedBallProbability(catcher, pitcher);

  if (roll < pbProb) {
    const { newRunners, runsScored } = advanceRunners(state);
    return [{
      runners: newRunners,
      outs: state.outs,
      runsScored: state.runsScored + runsScored,
    }, { type: 'PB', runsScored }, gen];
  }

  return [state, null, gen];
}
