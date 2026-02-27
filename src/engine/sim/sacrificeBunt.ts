import type { RandomGenerator } from 'pure-rand';
import type { Player } from '../../types/player';
import type { PAOutcome } from '../../types/game';
import { nextFloat } from '../math/prng';

// ─── Sacrifice bunt decision and resolution ──────────────────────────────────
// Pitchers and weak hitters may sacrifice bunt to advance runners.
// Only attempted with runner(s) on 1st/2nd, < 2 outs.

/**
 * Decide whether the batter should attempt a sacrifice bunt.
 * Returns a probability (0–1) that the batter bunts; caller rolls against this.
 */
export function buntProbability(
  batter: Player,
  runners: number,
  outs: number,
): number {
  // Never bunt with 2 outs, no runners, or runner only on 3rd
  if (outs >= 2) return 0;
  const runnerOn1st = (runners & 0b001) !== 0;
  const runnerOn2nd = (runners & 0b010) !== 0;
  if (!runnerOn1st && !runnerOn2nd) return 0;

  // Pitcher batting: very likely to bunt
  if (batter.isPitcher) return 0.80;

  // Weak hitters: bunt if offensive quality is low
  const h = batter.hitterAttributes;
  if (!h) return 0;

  // Composite offensive quality (scale 0–550 each)
  const offQ = h.contact * 0.4 + h.power * 0.4 + h.eye * 0.2;
  // Below ~300 composite = very weak (replacement level), scale up to 340 = marginal
  if (offQ < 300) return 0.35;
  if (offQ < 340) return 0.15;

  // Speed demons with low power might bunt for a hit, but that's a different mechanic
  return 0;
}

/**
 * Resolve a bunt attempt. Possible outcomes:
 * - 'SAC_BUNT': successful sacrifice (batter out, runners advance) — most common
 * - '1B': bunt for hit (batter safe, runners advance) — rare, speed-dependent
 * - 'GDP': bunt into DP (fielder gets lead runner) — very rare
 * - null: bunt fails (fouled off or popped up) — revert to normal PA
 */
export function resolveBunt(
  gen: RandomGenerator,
  batter: Player,
  defenseRating: number,
): [PAOutcome | null, RandomGenerator] {
  let roll: number;
  [roll, gen] = nextFloat(gen);

  // Base probabilities (MLB historical sacrifice bunt outcomes)
  // ~72% successful sacrifice, ~12% bunt hit, ~6% bunt DP, ~10% failed
  const speed = batter.hitterAttributes?.speed ?? 300;
  const contact = batter.hitterAttributes?.contact ?? 200;

  // Speed boosts bunt-for-hit chance; defense reduces it
  const speedBonus = (speed - 350) / 550 * 0.08; // ±8% for fast/slow
  const defPenalty = (defenseRating - 400) / 550 * 0.04; // good defense cuts bunt hits
  const contactBonus = (contact - 300) / 550 * 0.04; // better contact = better bunt placement

  const buntHitProb = Math.max(0.03, Math.min(0.25, 0.12 + speedBonus - defPenalty + contactBonus));
  const buntDPProb = Math.max(0.02, Math.min(0.12, 0.06 + defPenalty * 0.5));
  const failedProb = 0.10;
  // sacProb = remainder

  if (roll < buntHitProb) return ['1B', gen];
  if (roll < buntHitProb + buntDPProb) return ['GDP', gen];
  if (roll < buntHitProb + buntDPProb + failedProb) return [null, gen]; // failed, normal PA
  return ['SAC_BUNT', gen]; // successful sacrifice
}
