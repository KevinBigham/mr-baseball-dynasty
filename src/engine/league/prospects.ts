/**
 * Prospect rankings.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player } from '../../types/player';
import type { RandomGenerator } from '../math/prng';

export interface ProspectRanking {
  rank: number;
  playerId: number;
  name: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  teamId: number;
}

export function generateTop100(
  _playerMap: Map<number, Player>,
  gen: RandomGenerator,
): [ProspectRanking[], RandomGenerator] {
  return [[], gen];
}
