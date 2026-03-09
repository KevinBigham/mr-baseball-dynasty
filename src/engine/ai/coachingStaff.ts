/**
 * Coaching staff generation.
 * Stub — Sprint 04 branch surgery.
 */

import type { CoachingStaff } from '../../types/team';
import type { RandomGenerator } from '../math/prng';

export function generateAllCoachingStaffs(
  teamIds: number[],
  gen: RandomGenerator,
): [Map<number, CoachingStaff>, RandomGenerator] {
  const staffs = new Map<number, CoachingStaff>();
  for (const id of teamIds) {
    staffs.set(id, { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 });
  }
  return [staffs, gen];
}
