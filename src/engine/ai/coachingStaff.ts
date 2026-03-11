/**
 * Coaching staff generation.
 * Generates varied coaching quality per team using PRNG.
 * Quality tiers: 0.3 (below average), 0.5 (average), 0.7 (above average).
 */

import type { CoachingStaff } from '../../types/team';
import type { RandomGenerator } from '../math/prng';
import { nextFloat } from '../math/prng';

const QUALITY_TIERS = [0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.7, 0.7] as const;

function pickQuality(gen: RandomGenerator): [number, RandomGenerator] {
  let roll: number;
  [roll, gen] = nextFloat(gen);
  const idx = Math.floor(roll * QUALITY_TIERS.length) % QUALITY_TIERS.length;
  return [QUALITY_TIERS[idx], gen];
}

export function generateAllCoachingStaffs(
  teamIds: number[],
  gen: RandomGenerator,
): [Map<number, CoachingStaff>, RandomGenerator] {
  const staffs = new Map<number, CoachingStaff>();
  for (const id of teamIds) {
    let hq: number, pq: number;
    [hq, gen] = pickQuality(gen);
    [pq, gen] = pickQuality(gen);
    staffs.set(id, { hittingCoachQuality: hq, pitchingCoachQuality: pq });
  }
  return [staffs, gen];
}
