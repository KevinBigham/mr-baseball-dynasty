/**
 * Owner evaluation & initialization.
 * Stub — Sprint 04 branch surgery.
 */

import type { TeamSeason, TeamStrategy } from '../../types/team';
import type { Player } from '../../types/player';
import type { OwnerProfile, OwnerEvaluation } from '../../types/owner';
import type { PlayoffBracket } from '../sim/playoffSimulator';

export interface EvaluationInput {
  season: number;
  ownerProfiles: Map<number, OwnerProfile>;
  teamSeasons: Map<number, TeamSeason>;
  players: Player[];
  bracket: PlayoffBracket | null;
  teamStrategies: Map<number, TeamStrategy>;
}

export function evaluateOwnersForSeason(input: EvaluationInput): OwnerEvaluation[] {
  const evaluations: OwnerEvaluation[] = [];
  for (const [teamId] of input.ownerProfiles) {
    evaluations.push({
      teamId,
      season: input.season,
      score: 65,
      summary: 'Baseline evaluation',
    });
  }
  return evaluations;
}

export function initializeOwnerProfiles(
  teamIds: number[],
  _season: number,
): Map<number, OwnerProfile> {
  const profiles = new Map<number, OwnerProfile>();
  for (const teamId of teamIds) {
    profiles.set(teamId, {
      teamId,
      ownerName: `Owner ${teamId}`,
      activeMandate: {
        type: 'BALANCED',
        bidAggression: 1.0,
        payrollModifier: 1.0,
      },
      currentGoals: [],
      lastEvaluation: null,
      jobSecurity: 'safe',
    });
  }
  return profiles;
}
