/**
 * Team chemistry advancement.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player } from '../../types/player';
import type { TeamSeason } from '../../types/team';
import type { OwnerProfile } from '../../types/owner';
import type { TeamChemistryState, ClubhouseEvent } from '../../types/chemistry';
import type { RandomGenerator } from '../math/prng';

export interface ChemistryAdvanceInput {
  season: number;
  players: Player[];
  teamSeasons: Map<number, TeamSeason>;
  ownerProfiles: Map<number, OwnerProfile>;
  previousChemistry: Map<number, TeamChemistryState>;
  gen: RandomGenerator;
  nextEventId: number;
}

export interface ChemistryAdvanceResult {
  chemistry: Map<number, TeamChemistryState>;
  events: ClubhouseEvent[];
  gen: RandomGenerator;
}

export function advanceTeamChemistry(input: ChemistryAdvanceInput): ChemistryAdvanceResult {
  return {
    chemistry: input.previousChemistry,
    events: [],
    gen: input.gen,
  };
}

export function initializeTeamChemistry(
  teamIds: number[],
  _season: number,
): Map<number, TeamChemistryState> {
  const map = new Map<number, TeamChemistryState>();
  for (const teamId of teamIds) {
    map.set(teamId, {
      teamId,
      cohesion: 50,
      morale: 50,
      lastUpdatedSeason: _season,
    });
  }
  return map;
}
