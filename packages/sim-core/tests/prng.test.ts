import { describe, it, expect } from 'vitest';
import { GameRNG } from '../src/math/prng.js';

describe('GameRNG', () => {
  // -------------------------------------------------------------------------
  // Determinism
  // -------------------------------------------------------------------------

  describe('determinism', () => {
    it('same seed produces the same sequence', () => {
      const a = new GameRNG(42);
      const b = new GameRNG(42);

      for (let i = 0; i < 100; i++) {
        expect(a.nextInt(0, 1000)).toBe(b.nextInt(0, 1000));
      }
    });

    it('different seeds produce different sequences', () => {
      const a = new GameRNG(42);
      const b = new GameRNG(99);

      let matches = 0;
      for (let i = 0; i < 100; i++) {
        if (a.nextInt(0, 1_000_000) === b.nextInt(0, 1_000_000)) {
          matches++;
        }
      }
      // Statistically impossible for all 100 to match with different seeds.
      expect(matches).toBeLessThan(100);
    });
  });

  // -------------------------------------------------------------------------
  // nextInt
  // -------------------------------------------------------------------------

  describe('nextInt', () => {
    it('stays within bounds [min, max]', () => {
      const rng = new GameRNG(123);
      for (let i = 0; i < 10_000; i++) {
        const v = rng.nextInt(5, 15);
        expect(v).toBeGreaterThanOrEqual(5);
        expect(v).toBeLessThanOrEqual(15);
      }
    });

    it('returns min when min === max', () => {
      const rng = new GameRNG(1);
      expect(rng.nextInt(7, 7)).toBe(7);
    });
  });

  // -------------------------------------------------------------------------
  // nextFloat
  // -------------------------------------------------------------------------

  describe('nextFloat', () => {
    it('produces values in [0, 1)', () => {
      const rng = new GameRNG(456);
      for (let i = 0; i < 10_000; i++) {
        const v = rng.nextFloat();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  // nextGaussian
  // -------------------------------------------------------------------------

  describe('nextGaussian', () => {
    it('produces values with the expected mean (within tolerance)', () => {
      const rng = new GameRNG(789);
      const mean = 50;
      const stddev = 10;
      const n = 50_000;

      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += rng.nextGaussian(mean, stddev);
      }
      const sampleMean = sum / n;

      // Expect the sample mean to be within 0.5 of the true mean.
      expect(Math.abs(sampleMean - mean)).toBeLessThan(0.5);
    });

    it('produces values with the expected stddev (within tolerance)', () => {
      const rng = new GameRNG(101);
      const mean = 0;
      const stddev = 5;
      const n = 50_000;

      const values: number[] = [];
      for (let i = 0; i < n; i++) {
        values.push(rng.nextGaussian(mean, stddev));
      }

      const sampleMean = values.reduce((a, b) => a + b, 0) / n;
      const variance =
        values.reduce((acc, v) => acc + (v - sampleMean) ** 2, 0) / n;
      const sampleStddev = Math.sqrt(variance);

      // Within 10% of target stddev.
      expect(Math.abs(sampleStddev - stddev)).toBeLessThan(stddev * 0.1);
    });
  });

  // -------------------------------------------------------------------------
  // weightedPick
  // -------------------------------------------------------------------------

  describe('weightedPick', () => {
    it('respects weights over many picks', () => {
      const rng = new GameRNG(555);
      const items = ['A', 'B', 'C'] as const;
      const weights = [1, 2, 7]; // Expect roughly 10%, 20%, 70%.
      const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
      const n = 10_000;

      for (let i = 0; i < n; i++) {
        const pick = rng.weightedPick(items, weights);
        counts[pick]++;
      }

      // C should dominate.
      expect(counts['C']! / n).toBeGreaterThan(0.6);
      expect(counts['C']! / n).toBeLessThan(0.8);

      // A should be rare.
      expect(counts['A']! / n).toBeGreaterThan(0.05);
      expect(counts['A']! / n).toBeLessThan(0.2);
    });

    it('throws on empty arrays', () => {
      const rng = new GameRNG(1);
      expect(() => rng.weightedPick([], [])).toThrow();
    });

    it('throws on mismatched lengths', () => {
      const rng = new GameRNG(1);
      expect(() => rng.weightedPick([1, 2], [1])).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // shuffle
  // -------------------------------------------------------------------------

  describe('shuffle', () => {
    it('returns a new array with the same elements', () => {
      const rng = new GameRNG(999);
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = rng.shuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
    });

    it('does not mutate the input array', () => {
      const rng = new GameRNG(999);
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      rng.shuffle(original);
      expect(original).toEqual(copy);
    });

    it('produces a different order (with high probability)', () => {
      const rng = new GameRNG(888);
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = rng.shuffle(original);
      // With 10 elements, the probability that shuffle is identity is 1/10! ~ 0.
      let samePosition = 0;
      for (let i = 0; i < original.length; i++) {
        if (original[i] === shuffled[i]) samePosition++;
      }
      expect(samePosition).toBeLessThan(original.length);
    });
  });

  // -------------------------------------------------------------------------
  // fork
  // -------------------------------------------------------------------------

  describe('fork', () => {
    it('creates an independent but deterministic child', () => {
      const parent1 = new GameRNG(42);
      const parent2 = new GameRNG(42);

      // Advance both parents the same amount.
      for (let i = 0; i < 10; i++) {
        parent1.nextInt(0, 100);
        parent2.nextInt(0, 100);
      }

      const child1 = parent1.fork();
      const child2 = parent2.fork();

      // Children should produce the same sequence.
      for (let i = 0; i < 50; i++) {
        expect(child1.nextInt(0, 10000)).toBe(child2.nextInt(0, 10000));
      }
    });

    it('child sequence differs from parent sequence', () => {
      const parent = new GameRNG(42);
      const child = parent.fork();

      // Parent and child should differ (different seeds).
      let matches = 0;
      for (let i = 0; i < 100; i++) {
        if (parent.nextInt(0, 1_000_000) === child.nextInt(0, 1_000_000)) {
          matches++;
        }
      }
      expect(matches).toBeLessThan(100);
    });
  });

  // -------------------------------------------------------------------------
  // getState / fromState round-trip
  // -------------------------------------------------------------------------

  describe('getState / fromState', () => {
    it('round-trips produce the same future sequence', () => {
      const rng = new GameRNG(42);

      // Advance the RNG some amount.
      for (let i = 0; i < 50; i++) {
        rng.nextInt(0, 100);
      }

      const state = rng.getState();
      const restored = GameRNG.fromState(state);

      // Both should produce the same sequence from here on.
      for (let i = 0; i < 100; i++) {
        expect(rng.nextInt(0, 10000)).toBe(restored.nextInt(0, 10000));
      }
    });

    it('preserves the original seed', () => {
      const rng = new GameRNG(12345);
      rng.nextInt(0, 100);
      const state = rng.getState();
      const restored = GameRNG.fromState(state);
      expect(restored.getSeed()).toBe(12345);
    });
  });

  // -------------------------------------------------------------------------
  // getSeed
  // -------------------------------------------------------------------------

  describe('getSeed', () => {
    it('returns the original seed', () => {
      const rng = new GameRNG(77777);
      rng.nextInt(0, 100);
      rng.nextFloat();
      expect(rng.getSeed()).toBe(77777);
    });
  });
});
