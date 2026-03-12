/**
 * Playoff simulation.
 * Stub — Sprint 04 branch surgery.
 */

import type { Team, TeamSeason } from '../../types/team';
import type { Player } from '../../types/player';
import type { RandomGenerator } from '../math/prng';

export interface PlayoffSeries {
  round: string;
  higherSeedTeamId: number;
  lowerSeedTeamId: number;
  winnerTeamId: number;
  loserTeamId: number;
  higherSeedWins: number;
  lowerSeedWins: number;
}

export interface PlayoffBracket {
  season: number;
  wildCardSeries: PlayoffSeries[];
  divisionSeries: PlayoffSeries[];
  championshipSeries: PlayoffSeries[];
  worldSeries: PlayoffSeries | null;
  champion: number | null;
}

export function simulatePlayoffs(
  _teams: Team[],
  _teamSeasons: TeamSeason[],
  _players: Player[],
  season: number,
  gen: RandomGenerator,
): [PlayoffBracket, RandomGenerator] {
  const bracket: PlayoffBracket = {
    season,
    wildCardSeries: [],
    divisionSeries: [],
    championshipSeries: [],
    worldSeries: null,
    champion: null,
  };
  return [bracket, gen];
}
