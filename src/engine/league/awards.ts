/**
 * Season awards computation.
 * Stub — Sprint 04 branch surgery.
 */

import type { Team } from '../../types/team';
import type { Player, PlayerSeason } from '../../types/player';
import type { RandomGenerator } from '../math/prng';

export interface AwardWinner {
  awardName: string;
  playerId: number;
  playerName: string;
  teamId: number;
  statLine: string;
}

export interface SeasonAwards {
  season: number;
  alMVP: AwardWinner;
  nlMVP: AwardWinner;
  alCyYoung: AwardWinner;
  nlCyYoung: AwardWinner;
  alROY: AwardWinner | null;
  nlROY: AwardWinner | null;
}

const emptyWinner: AwardWinner = {
  awardName: '', playerId: 0, playerName: '', teamId: 0, statLine: '',
};

export function computeSeasonAwards(
  season: number,
  _players: Player[],
  _playerSeasons: Map<number, PlayerSeason>,
  _teams: Team[],
  gen: RandomGenerator,
): [SeasonAwards, RandomGenerator] {
  return [{
    season,
    alMVP: { ...emptyWinner, awardName: 'AL MVP' },
    nlMVP: { ...emptyWinner, awardName: 'NL MVP' },
    alCyYoung: { ...emptyWinner, awardName: 'AL Cy Young' },
    nlCyYoung: { ...emptyWinner, awardName: 'NL Cy Young' },
    alROY: null,
    nlROY: null,
  }, gen];
}
