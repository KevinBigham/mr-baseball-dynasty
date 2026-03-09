/**
 * Draft board system.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player } from '../types/player';
import type { TeamSeason } from '../types/team';
import type { DraftPick } from '../types/offseason';
import type { RandomGenerator } from './math/prng';

export interface DraftBoardEntry {
  playerId: number;
  playerName: string;
  position: string;
  age: number;
  scoutRank: number;
  draftedByTeamId: number | null;
}

export interface DraftBoardState {
  season: number;
  userTeamId: number;
  totalRounds: number;
  currentRound: number;
  currentPickInRound: number;
  overallPick: number;
  completed: boolean;
  board: DraftBoardEntry[];
  picks: DraftPick[];
  draftOrder: number[];
}

export interface UserPickResult {
  ok: boolean;
  reason?: string;
  pick?: DraftPick;
}

export function createDraftBoardState(
  _teamSeasons: TeamSeason[],
  _players: Player[],
  season: number,
  userTeamId: number,
  gen: RandomGenerator,
): [DraftBoardState, Player[], RandomGenerator] {
  const state: DraftBoardState = {
    season,
    userTeamId,
    totalRounds: 10,
    currentRound: 1,
    currentPickInRound: 1,
    overallPick: 1,
    completed: true,
    board: [],
    picks: [],
    draftOrder: [],
  };
  return [state, [], gen];
}

export function makeUserDraftPick(
  state: DraftBoardState,
  _playersById: Map<number, Player>,
  _playerId: number,
): [DraftBoardState, UserPickResult] {
  return [state, { ok: false, reason: 'Draft stub' }];
}

export function runAIPicksUntilUserTurn(
  state: DraftBoardState,
  _playersById: Map<number, Player>,
): DraftBoardState {
  return state;
}

export function teamOnClockId(state: DraftBoardState): number | null {
  if (state.completed) return null;
  const idx = (state.overallPick - 1) % state.draftOrder.length;
  return state.draftOrder[idx] ?? null;
}
