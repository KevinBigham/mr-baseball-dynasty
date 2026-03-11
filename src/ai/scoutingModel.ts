/**
 * Scouting profile generation.
 * Stub — Sprint 04 branch surgery.
 */

import type { RandomGenerator } from '../engine/math/prng';

export function generateScoutingProfiles(
  teamIds: number[],
  gen: RandomGenerator,
): [Map<number, unknown>, RandomGenerator] {
  const profiles = new Map<number, unknown>();
  for (const id of teamIds) {
    profiles.set(id, { teamId: id });
  }
  return [profiles, gen];
}
