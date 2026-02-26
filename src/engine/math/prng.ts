import { xoroshiro128plus, type RandomGenerator } from 'pure-rand';

// ─── Core PRNG (pure-rand xoroshiro128+) ─────────────────────────────────────
// CRITICAL: Generator is IMMUTABLE. Every call returns a NEW generator.
// Thread the generator through all simulation functions.
// Never use a module-level mutable generator.

export function createPRNG(seed: number): RandomGenerator {
  // Apply splitmix32 mixing before seeding to avoid bias with small integer seeds.
  // xoroshiro128+ has poor initial randomness when seeded with small values like 0, 1, 2…
  // splitmix32 spreads the bits uniformly.
  let s = (seed >>> 0);               // treat as unsigned 32-bit
  s = Math.imul(s + 0x9e3779b9, s + 0x9e3779b9) >>> 0;
  s = Math.imul(s ^ (s >>> 15), 0x85ebca6b) >>> 0;
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0;
  s = (s ^ (s >>> 16)) >>> 0;
  return xoroshiro128plus(s | 0);  // pure-rand expects signed 32-bit
}

// Float in [0, 1)
export function nextFloat(gen: RandomGenerator): [number, RandomGenerator] {
  const [value, next] = gen.next();
  return [(value >>> 0) / 0x100000000, next];
}

// Integer in [min, max] inclusive
export function nextInt(
  gen: RandomGenerator,
  min: number,
  max: number,
): [number, RandomGenerator] {
  let roll: number;
  [roll, gen] = nextFloat(gen);
  return [Math.floor(roll * (max - min + 1)) + min, gen];
}

// Float in [min, max)
export function nextRange(
  gen: RandomGenerator,
  min: number,
  max: number,
): [number, RandomGenerator] {
  let roll: number;
  [roll, gen] = nextFloat(gen);
  return [roll * (max - min) + min, gen];
}

// Box-Muller Gaussian (mean=0, sd=1) — returns two values
export function gaussian(
  gen: RandomGenerator,
  mean: number,
  sd: number,
): [number, RandomGenerator] {
  let u1: number, u2: number;
  [u1, gen] = nextFloat(gen);
  [u2, gen] = nextFloat(gen);
  // Avoid log(0)
  u1 = Math.max(u1, 1e-10);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return [mean + z * sd, gen];
}

// Clamp a gaussian draw to [min, max] — for attribute generation
export function clampedGaussian(
  gen: RandomGenerator,
  mean: number,
  sd: number,
  min: number,
  max: number,
): [number, RandomGenerator] {
  let val: number;
  [val, gen] = gaussian(gen, mean, sd);
  return [Math.max(min, Math.min(max, Math.round(val))), gen];
}

// Serialize PRNG state for save files
export function serializeState(gen: RandomGenerator): number[] {
  return Array.from((gen as RandomGenerator & { getState(): readonly number[] }).getState());
}

// Restore PRNG from save
export function deserializeState(state: number[]): RandomGenerator {
  return xoroshiro128plus.fromState(state);
}

// Weighted random selection from array of {weight, value}
export function weightedPick<T>(
  gen: RandomGenerator,
  items: Array<{ weight: number; value: T }>,
): [T, RandomGenerator] {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll: number;
  [roll, gen] = nextFloat(gen);
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.weight / total;
    if (roll < cumulative) return [item.value, gen];
  }
  return [items[items.length - 1].value, gen];
}
