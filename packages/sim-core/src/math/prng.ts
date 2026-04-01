/**
 * @module prng
 * Seedable PRNG system wrapping pure-rand.
 * Math.random() is NEVER used. All randomness flows through this module.
 */

import prand from 'pure-rand';
import type { RandomGenerator } from 'pure-rand';

/** Serialized PRNG state for save/restore. */
export interface GameRNGState {
  readonly seed: number;
  readonly callCount: number;
}

/**
 * Deterministic PRNG wrapper around pure-rand's xoroshiro128plus.
 *
 * Every instance is fully reproducible from its seed. Two GameRNG
 * instances constructed with the same seed will produce the identical
 * sequence of values regardless of platform or runtime.
 */
export class GameRNG {
  private readonly seed: number;
  private rng: RandomGenerator;
  private callCount: number;

  constructor(seed: number) {
    this.seed = seed;
    this.rng = prand.xoroshiro128plus(seed);
    this.callCount = 0;
  }

  // ---------------------------------------------------------------------------
  // Core generators
  // ---------------------------------------------------------------------------

  /** Uniform integer in [min, max] (inclusive on both ends). */
  nextInt(min: number, max: number): number {
    const [value, next] = prand.uniformIntDistribution(min, max, this.rng);
    this.rng = next;
    this.callCount++;
    return value;
  }

  /** Uniform float in [0, 1). */
  nextFloat(): number {
    // Generate a 32-bit integer and map to [0, 1).
    const [value, next] = prand.uniformIntDistribution(0, 0x7fffffff, this.rng);
    this.rng = next;
    this.callCount++;
    return value / (0x7fffffff + 1);
  }

  /** Gaussian (normal) distributed value via Box-Muller transform. */
  nextGaussian(mean: number, stddev: number): number {
    // Box-Muller requires two uniform samples.
    const u1 = this.nextFloat();
    const u2 = this.nextFloat();

    // Clamp u1 away from 0 so log is safe.
    const safeU1 = Math.max(u1, 1e-10);

    const z0 = Math.sqrt(-2.0 * Math.log(safeU1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stddev;
  }

  // ---------------------------------------------------------------------------
  // Higher-order utilities
  // ---------------------------------------------------------------------------

  /**
   * Pick a random item from `items` according to `weights`.
   * Weights do not need to be normalized — they are treated as relative.
   */
  weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0 || weights.length === 0) {
      throw new Error('weightedPick: items and weights must be non-empty');
    }
    if (items.length !== weights.length) {
      throw new Error('weightedPick: items and weights must have the same length');
    }

    let totalWeight = 0;
    for (const w of weights) {
      totalWeight += w;
    }

    let roll = this.nextFloat() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) {
        return items[i]!;
      }
    }

    // Floating-point guard — return the last item.
    return items[items.length - 1]!;
  }

  /**
   * Fisher-Yates shuffle. Returns a NEW array — the input is not mutated.
   */
  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const tmp = result[i]!;
      result[i] = result[j]!;
      result[j] = tmp;
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Identity / branching / serialization
  // ---------------------------------------------------------------------------

  /** Returns the original seed used to create this RNG. */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Create a child RNG with a derived seed.
   * The derived seed is deterministic (based on the current state),
   * but the child sequence is independent of the parent.
   */
  fork(): GameRNG {
    const derivedSeed = this.nextInt(-0x7fffffff, 0x7fffffff);
    return new GameRNG(derivedSeed);
  }

  /** Serialize state for persistence. */
  getState(): GameRNGState {
    return {
      seed: this.seed,
      callCount: this.callCount,
    };
  }

  /**
   * Restore a GameRNG from serialized state by replaying the
   * exact number of calls from the original seed.
   */
  static fromState(state: GameRNGState): GameRNG {
    const rng = new GameRNG(state.seed);
    // Fast-forward by consuming `callCount` values.
    // We use unsafeSkipN for speed — it advances the generator
    // without producing output. However pure-rand's skip does not
    // track our mixed call types, so we replay manually.
    let gen = prand.xoroshiro128plus(state.seed);
    for (let i = 0; i < state.callCount; i++) {
      const [, next] = prand.uniformIntDistribution(0, 0x7fffffff, gen);
      gen = next;
    }
    rng.rng = gen;
    rng.callCount = state.callCount;
    return rng;
  }
}
