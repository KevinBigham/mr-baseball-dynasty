/**
 * Draft board system.
 *
 * Supports:
 * - setup-time snake drafts from the existing MLB-active player pool
 * - offseason annual drafts from a generated amateur class
 */

import type { Player, Position, RosterStatus } from '../types/player';
import type { TeamSeason } from '../types/team';
import type { RandomGenerator } from './math/prng';
import { nextInt } from './math/prng';
import { TEAMS } from '../data/teams';
import {
  ANNUAL_DRAFT_ROUNDS,
  createDraftPool,
  generateAnnualDraftClass,
  getDraftRounds,
  scoutDraftPool,
  type DraftProspect,
} from './draft/draftPool';
import {
  aiSelectPlayer,
  getOverallPick,
  getPickingTeam,
  type DraftPick,
} from './draft/draftAI';

export type DraftMode = 'snake10' | 'snake25' | 'snake26' | 'annual';

export interface DraftBoardEntry extends DraftProspect {
  draftedByTeamId: number | null;
}

export interface DraftBoardState {
  season: number;
  mode: DraftMode;
  snake: boolean;
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

export interface CreateDraftBoardOptions {
  mode?: DraftMode;
  userDraftSlot?: number | null;
}

const TEAM_ABBR_BY_ID = new Map(TEAMS.map((team) => [team.teamId, team.abbreviation]));
const TEAM_SCOUTING_BY_ID = new Map(TEAMS.map((team) => [team.teamId, team.scoutingQuality]));

const INITIAL_ACTIVE_ROSTER_SIZE = 26;
const INITIAL_ACTIVE_HITTERS = 13;
const INITIAL_ACTIVE_PITCHERS = 13;
const INITIAL_POSITION_TARGETS: Array<[Position, number]> = [
  ['C', 2],
  ['1B', 1],
  ['2B', 1],
  ['SS', 1],
  ['3B', 1],
  ['LF', 1],
  ['CF', 1],
  ['RF', 1],
  ['DH', 1],
  ['SP', 5],
  ['RP', 4],
  ['CL', 1],
];

function toDraftEntry(prospect: DraftProspect): DraftBoardEntry {
  return {
    ...prospect,
    draftedByTeamId: null,
  };
}

function uniqueTeamIds(teamSeasons: TeamSeason[]): number[] {
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const teamSeason of teamSeasons) {
    if (seen.has(teamSeason.teamId)) continue;
    seen.add(teamSeason.teamId);
    ids.push(teamSeason.teamId);
  }
  return ids;
}

function shuffleTeamIds(teamIds: number[], gen: RandomGenerator): [number[], RandomGenerator] {
  const order = [...teamIds];
  for (let i = order.length - 1; i > 0; i--) {
    let swapIdx: number;
    [swapIdx, gen] = nextInt(gen, 0, i);
    [order[i], order[swapIdx]] = [order[swapIdx], order[i]];
  }
  return [order, gen];
}

function normalizeRequestedDraftSlot(
  requestedSlot: number | null | undefined,
  teamCount: number,
): number | null {
  if (!Number.isInteger(requestedSlot)) return null;
  if (requestedSlot == null) return null;
  if (requestedSlot < 1 || requestedSlot > teamCount) return null;
  return requestedSlot;
}

function buildStartupDraftOrder(
  teamIds: number[],
  userTeamId: number,
  requestedSlot: number | null | undefined,
  gen: RandomGenerator,
): [number[], RandomGenerator] {
  if (!teamIds.includes(userTeamId)) {
    return shuffleTeamIds(teamIds, gen);
  }

  const normalizedSlot = normalizeRequestedDraftSlot(requestedSlot, teamIds.length);
  if (normalizedSlot == null) {
    return shuffleTeamIds(teamIds, gen);
  }

  const otherTeamIds = teamIds.filter((teamId) => teamId !== userTeamId);
  let shuffledOthers: number[];
  [shuffledOthers, gen] = shuffleTeamIds(otherTeamIds, gen);

  const slotIndex = normalizedSlot - 1;
  return [[
    ...shuffledOthers.slice(0, slotIndex),
    userTeamId,
    ...shuffledOthers.slice(slotIndex),
  ], gen];
}

function buildAnnualDraftOrder(teamSeasons: TeamSeason[]): number[] {
  return [...teamSeasons]
    .sort((a, b) =>
      a.wins - b.wins ||
      (a.runsScored - a.runsAllowed) - (b.runsScored - b.runsAllowed) ||
      a.teamId - b.teamId,
    )
    .map((teamSeason) => teamSeason.teamId);
}

function draftScoutingAccuracy(userTeamId: number): number {
  const quality = TEAM_SCOUTING_BY_ID.get(userTeamId) ?? 0.7;
  return Math.max(0.5, Math.min(1.5, 0.5 + quality));
}

function isPitchingPosition(position: Position): boolean {
  return position === 'SP' || position === 'RP' || position === 'CL';
}

function availableBoardEntries(state: DraftBoardState): DraftBoardEntry[] {
  return state.board
    .filter((entry) => entry.draftedByTeamId == null)
    .sort((a, b) => a.rank - b.rank || b.scoutedPot - a.scoutedPot || a.playerId - b.playerId);
}

function draftTeamOnClock(state: DraftBoardState): number | null {
  if (state.completed || state.draftOrder.length === 0) return null;
  if (state.snake) {
    return getPickingTeam(state.draftOrder, state.currentRound, state.currentPickInRound);
  }
  return state.draftOrder[state.currentPickInRound] ?? null;
}

function advanceDraftCursor(state: DraftBoardState): DraftBoardState {
  if (state.completed) return state;

  const totalPicks = state.totalRounds * state.draftOrder.length;
  if (state.overallPick >= totalPicks) {
    return {
      ...state,
      completed: true,
    };
  }

  const nextPickInRound = state.currentPickInRound + 1;
  if (nextPickInRound >= state.draftOrder.length) {
    return {
      ...state,
      currentRound: state.currentRound + 1,
      currentPickInRound: 0,
      overallPick: state.overallPick + 1,
    };
  }

  return {
    ...state,
    currentPickInRound: nextPickInRound,
    overallPick: state.overallPick + 1,
  };
}

function rosterStatusForAmateurPick(player: Player): RosterStatus {
  switch (player.leagueLevel) {
    case 'AAA':
      return 'MINORS_AAA';
    case 'AA':
      return 'MINORS_AA';
    case 'A+':
      return 'MINORS_APLUS';
    case 'A-':
      return 'MINORS_AMINUS';
    case 'Intl':
      return 'MINORS_INTL';
    case 'Rookie':
    default:
      return 'MINORS_ROOKIE';
  }
}

function assignDraftedPlayer(player: Player, teamId: number, mode: DraftMode): void {
  player.teamId = teamId;
  player.rosterData.rule5Selected = false;
  player.rosterData.rule5OriginalTeamId = undefined;

  if (mode === 'annual') {
    player.rosterData.rosterStatus = rosterStatusForAmateurPick(player);
    player.rosterData.isOn40Man = false;
    player.rosterData.contractYearsRemaining = 0;
    player.rosterData.salary = 0;
    player.rosterData.arbitrationEligible = false;
    player.rosterData.freeAgentEligible = false;
    return;
  }

  player.rosterData.rosterStatus = 'MLB_ACTIVE';
  player.rosterData.isOn40Man = true;
}

function releaseUndraftedPlayer(player: Player): void {
  player.teamId = -1;
  player.rosterData.rosterStatus = 'FREE_AGENT';
  player.rosterData.isOn40Man = false;
  player.rosterData.contractYearsRemaining = 0;
  player.rosterData.salary = 0;
  player.rosterData.arbitrationEligible = false;
  player.rosterData.freeAgentEligible = false;
}

function countActiveRoster(players: Player[], teamId: number): {
  total: number;
  hitters: number;
  pitchers: number;
  byPosition: Record<string, number>;
} {
  const byPosition: Record<string, number> = {};
  let total = 0;
  let hitters = 0;
  let pitchers = 0;

  for (const player of players) {
    if (player.teamId !== teamId || player.rosterData.rosterStatus !== 'MLB_ACTIVE') continue;
    total++;
    byPosition[player.position] = (byPosition[player.position] ?? 0) + 1;
    if (player.isPitcher) pitchers++;
    else hitters++;
  }

  return { total, hitters, pitchers, byPosition };
}

function takeBestUndrafted(
  undrafted: Player[],
  predicate: (player: Player) => boolean,
): Player | null {
  const idx = undrafted.findIndex(predicate);
  if (idx === -1) return null;
  const [player] = undrafted.splice(idx, 1);
  return player ?? null;
}

function fillInitialRosters(playersById: Map<number, Player>, teamIds: number[]): void {
  const allPlayers = Array.from(playersById.values());
  const undrafted = allPlayers
    .filter((player) => player.rosterData.rosterStatus === 'DRAFT_ELIGIBLE')
    .sort((a, b) => b.overall - a.overall || b.potential - a.potential || a.playerId - b.playerId);

  for (const teamId of teamIds) {
    let counts = countActiveRoster(allPlayers, teamId);

    for (const [position, target] of INITIAL_POSITION_TARGETS) {
      while ((counts.byPosition[position] ?? 0) < target) {
        const candidate = takeBestUndrafted(undrafted, (player) => player.position === position)
          ?? takeBestUndrafted(undrafted, (player) =>
            isPitchingPosition(position) ? player.isPitcher : !player.isPitcher,
          );
        if (!candidate) break;
        assignDraftedPlayer(candidate, teamId, 'snake26');
        counts = countActiveRoster(allPlayers, teamId);
      }
    }

    while (counts.total < INITIAL_ACTIVE_ROSTER_SIZE) {
      const needsPitchers = counts.pitchers < INITIAL_ACTIVE_PITCHERS;
      const needsHitters = counts.hitters < INITIAL_ACTIVE_HITTERS;

      const candidate = needsPitchers && !needsHitters
        ? takeBestUndrafted(undrafted, (player) => player.isPitcher)
        : needsHitters && !needsPitchers
          ? takeBestUndrafted(undrafted, (player) => !player.isPitcher)
          : takeBestUndrafted(undrafted, () => true);

      if (!candidate) break;
      assignDraftedPlayer(candidate, teamId, 'snake26');
      counts = countActiveRoster(allPlayers, teamId);
    }
  }

  for (const player of undrafted) {
    releaseUndraftedPlayer(player);
  }
}

function finalizeAnnualDraftPool(playersById: Map<number, Player>): void {
  for (const player of playersById.values()) {
    if (player.rosterData.rosterStatus !== 'DRAFT_ELIGIBLE') continue;
    releaseUndraftedPlayer(player);
  }
}

function executePickForTeam(
  state: DraftBoardState,
  playersById: Map<number, Player>,
  teamId: number,
  playerId: number,
): [DraftBoardState, UserPickResult] {
  if (state.completed) {
    return [state, { ok: false, reason: 'Draft already complete.' }];
  }

  const onClockTeamId = draftTeamOnClock(state);
  if (onClockTeamId == null) {
    return [state, { ok: false, reason: 'Draft board unavailable.' }];
  }

  if (onClockTeamId !== teamId) {
    return [state, { ok: false, reason: 'Team is not on the clock.' }];
  }

  const boardIdx = state.board.findIndex(
    (entry) => entry.playerId === playerId && entry.draftedByTeamId == null,
  );
  if (boardIdx === -1) {
    return [state, { ok: false, reason: 'Player is no longer available.' }];
  }

  const player = playersById.get(playerId);
  if (!player) {
    return [state, { ok: false, reason: 'Player record unavailable.' }];
  }

  const boardEntry = state.board[boardIdx];
  assignDraftedPlayer(player, teamId, state.mode);

  const updatedBoard = [...state.board];
  updatedBoard[boardIdx] = {
    ...boardEntry,
    draftedByTeamId: teamId,
  };

  const pick: DraftPick = {
    round: state.currentRound,
    pick: state.overallPick,
    pickNumber: state.overallPick,
    teamId,
    teamAbbr: TEAM_ABBR_BY_ID.get(teamId) ?? `T${teamId}`,
    playerId,
    playerName: boardEntry.name,
    position: boardEntry.position,
    scoutedOvr: boardEntry.scoutedOvr,
    scoutedPot: boardEntry.scoutedPot,
    type: state.mode === 'annual' ? 'amateur' : 'startup',
  };

  const nextState = advanceDraftCursor({
    ...state,
    board: updatedBoard,
    picks: [...state.picks, pick],
  });

  return [nextState, { ok: true, pick }];
}

export function createDraftBoardState(
  teamSeasons: TeamSeason[],
  players: Player[],
  season: number,
  userTeamId: number,
  gen: RandomGenerator,
  options: CreateDraftBoardOptions = {},
): [DraftBoardState, Player[], RandomGenerator] {
  const mode = options.mode ?? 'annual';
  const snake = mode !== 'annual';
  const teamIds = uniqueTeamIds(teamSeasons);
  const totalRounds = mode === 'annual' ? ANNUAL_DRAFT_ROUNDS : getDraftRounds(mode);

  let draftOrder = snake ? teamIds : buildAnnualDraftOrder(teamSeasons);
  if (snake) {
    [draftOrder, gen] = buildStartupDraftOrder(draftOrder, userTeamId, options.userDraftSlot, gen);
  }

  let draftPlayers: Player[];
  if (mode === 'annual') {
    [draftPlayers, gen] = generateAnnualDraftClass(gen, season + 1);
  } else {
    draftPlayers = createDraftPool(players);
  }

  let prospects: DraftProspect[];
  [prospects, gen] = scoutDraftPool(draftPlayers, draftScoutingAccuracy(userTeamId), gen);

  const board = prospects.map(toDraftEntry);
  const completed = draftOrder.length === 0 || totalRounds <= 0 || board.length === 0;

  const state: DraftBoardState = {
    season,
    mode,
    snake,
    userTeamId,
    totalRounds,
    currentRound: 1,
    currentPickInRound: 0,
    overallPick: 1,
    completed,
    board,
    picks: [],
    draftOrder,
  };

  return [state, mode === 'annual' ? draftPlayers : [], gen];
}

export function makeUserDraftPick(
  state: DraftBoardState,
  playersById: Map<number, Player>,
  playerId: number,
): [DraftBoardState, UserPickResult] {
  return executePickForTeam(state, playersById, state.userTeamId, playerId);
}

export function autoPickForUser(
  state: DraftBoardState,
  playersById: Map<number, Player>,
): [DraftBoardState, UserPickResult] {
  const available = availableBoardEntries(state);
  if (available.length === 0) {
    return [state, { ok: false, reason: 'No available players remain.' }];
  }

  const userPicks = state.picks.filter((pick) => pick.teamId === state.userTeamId);
  const playerId = aiSelectPlayer(available, userPicks, state.currentRound);
  if (playerId === -1) {
    return [state, { ok: false, reason: 'No suitable auto-pick available.' }];
  }

  return executePickForTeam(state, playersById, state.userTeamId, playerId);
}

export function runAIPicksUntilUserTurn(
  state: DraftBoardState,
  playersById: Map<number, Player>,
): DraftBoardState {
  let draftState = state;

  while (!draftState.completed) {
    const onClockTeamId = draftTeamOnClock(draftState);
    if (onClockTeamId == null || onClockTeamId === draftState.userTeamId) {
      break;
    }

    const available = availableBoardEntries(draftState);
    if (available.length === 0) {
      draftState = {
        ...draftState,
        completed: true,
      };
      break;
    }

    const teamPicks = draftState.picks.filter((pick) => pick.teamId === onClockTeamId);
    const playerId = aiSelectPlayer(available, teamPicks, draftState.currentRound);
    if (playerId === -1) {
      draftState = {
        ...draftState,
        completed: true,
      };
      break;
    }

    const [nextState] = executePickForTeam(draftState, playersById, onClockTeamId, playerId);
    draftState = nextState;
  }

  return draftState;
}

export function completeDraftBoard(
  state: DraftBoardState,
  playersById: Map<number, Player>,
): { draftedCount: number } {
  if (state.mode === 'annual') {
    finalizeAnnualDraftPool(playersById);
  } else {
    fillInitialRosters(playersById, state.draftOrder);
  }

  return {
    draftedCount: state.picks.length,
  };
}

export function teamOnClockId(state: DraftBoardState): number | null {
  return draftTeamOnClock(state);
}

export function pickNumberForState(state: DraftBoardState): number {
  return getOverallPick(state.currentRound, state.currentPickInRound, state.draftOrder.length);
}
