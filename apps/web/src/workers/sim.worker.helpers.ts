/**
 * Shared types, state, and helper functions for the sim worker.
 * Extracted to keep the main worker file under 500 lines.
 */
import {
  GameRNG,
  TEAMS,
  toDisplayRating,
  toLetterGrade,
  advanceInjury,
  describeInjury,
  processInjuries,
  checkMilestones,
  generateNews,
  deduplicateNews,
  createOffseasonState,
  advanceOffseasonDay,
  skipCurrentPhase,
  autoResolveTenderNonTender,
  buildRosterState,
  calculateTeamPayroll,
  createFreeAgencyMarket,
  evaluateTeamNeeds,
  getArbEligiblePlayers,
  getTeamBudget,
  recordFASigning,
  recordTenderDecisions,
  simulateFADay,
  type FASigningResult,
} from '@mbd/sim-core';
import { applyMoraleEvent } from '../../../../packages/sim-core/src/league/narrativeState';
import type {
  GeneratedPlayer,
  ScheduledGame,
  SeasonState,
  PlayoffBracket,
  PlayerGameStats,
  Injury,
  Scout,
  DraftClass,
  RosterState,
  OffseasonState,
  FreeAgencyMarket,
  NewsItem,
  GMPersonality,
} from '@mbd/sim-core';
import type {
  AwardHistoryEntry,
  BriefingItem,
  OwnerState,
  PlayerMorale,
  Rivalry,
  SeasonHistoryEntry,
  TeamChemistry,
} from '@mbd/contracts';

// ---------------------------------------------------------------------------
// Full game state
// ---------------------------------------------------------------------------

export interface FullGameState {
  rng: GameRNG;
  season: number;
  day: number;
  phase: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  players: GeneratedPlayer[];
  schedule: ScheduledGame[];
  seasonState: SeasonState;
  userTeamId: string;
  playoffBracket: PlayoffBracket | null;
  // Phase 2 state
  injuries: Map<string, Injury>;
  serviceTime: Map<string, number>;
  scoutingStaffs: Map<string, Scout[]>;
  gmPersonalities: Map<string, GMPersonality>;
  offseasonState: OffseasonState | null;
  draftClass: DraftClass | null;
  freeAgencyMarket: FreeAgencyMarket | null;
  news: NewsItem[];
  rosterStates: Map<string, RosterState>;
  playerMorale: Map<string, PlayerMorale>;
  teamChemistry: Map<string, TeamChemistry>;
  ownerState: Map<string, OwnerState>;
  briefingQueue: BriefingItem[];
  storyFlags: Map<string, string[]>;
  rivalries: Map<string, Rivalry>;
  awardHistory: AwardHistoryEntry[];
  seasonHistory: SeasonHistoryEntry[];
}

export let state: FullGameState | null = null;

export function setState(s: FullGameState | null): void {
  state = s;
}

// ---------------------------------------------------------------------------
// DTO types for the UI
// ---------------------------------------------------------------------------

export interface TeamStandingsDTO {
  teamId: string;
  teamName: string;
  city: string;
  abbreviation: string;
  division: string;
  wins: number;
  losses: number;
  pct: string;
  gamesBack: number;
  streak: string;
  runDifferential: number;
}

export interface PlayerDTO {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  overallRating: number;
  displayRating: number;
  letterGrade: string;
  rosterStatus: string;
  teamId: string;
  stats: {
    pa: number;
    ab: number;
    hits: number;
    hr: number;
    rbi: number;
    bb: number;
    k: number;
    avg: string;
    ip: number;
    earnedRuns: number;
    strikeouts: number;
    walks: number;
    era: string;
  } | null;
}

export interface SimResultDTO {
  day: number;
  season: number;
  phase: string;
  gamesPlayed: number;
  seasonComplete: boolean;
}

export interface OffseasonProgressResult {
  aiSignings: Array<{
    playerId: string;
    teamId: string;
    years: number;
    annualSalary: number;
    marketValue: number;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function requireState(): FullGameState {
  if (!state) throw new Error('No game initialized');
  return state;
}

export function timestamp(): string {
  const s = requireState();
  return `S${s.season}D${s.day}`;
}

export function getTeamPlayers(teamId: string): GeneratedPlayer[] {
  return requireState().players.filter(p => p.teamId === teamId);
}

export function toPlayerDTO(player: GeneratedPlayer, stats?: PlayerGameStats): PlayerDTO {
  const seasonStats = stats ?? (state ? state.seasonState.playerSeasonStats.get(player.id) : undefined);
  let statBlock: PlayerDTO['stats'] = null;
  if (seasonStats && (seasonStats.pa > 0 || seasonStats.strikeouts > 0)) {
    const avg = seasonStats.ab > 0
      ? (seasonStats.hits / seasonStats.ab).toFixed(3).replace(/^0/, '')
      : '.000';
    const era = seasonStats.ip > 0
      ? ((seasonStats.earnedRuns / (seasonStats.ip / 3)) * 9).toFixed(2)
      : '0.00';
    statBlock = {
      pa: seasonStats.pa, ab: seasonStats.ab, hits: seasonStats.hits,
      hr: seasonStats.hr, rbi: seasonStats.rbi, bb: seasonStats.bb,
      k: seasonStats.k, avg,
      ip: seasonStats.ip, earnedRuns: seasonStats.earnedRuns,
      strikeouts: seasonStats.strikeouts, walks: seasonStats.walks, era,
    };
  }
  return {
    id: player.id, firstName: player.firstName, lastName: player.lastName,
    age: player.age, position: player.position,
    overallRating: player.overallRating,
    displayRating: toDisplayRating(player.overallRating),
    letterGrade: toLetterGrade(player.overallRating),
    rosterStatus: player.rosterStatus, teamId: player.teamId,
    stats: statBlock,
  };
}

/** Post-day injury processing and news generation. */
export function processDayInjuriesAndNews(s: FullGameState): void {
  // Advance existing injuries by 1 day
  for (const [pid, injury] of s.injuries) {
    const advanced = advanceInjury(injury);
    if (advanced) {
      s.injuries.set(pid, advanced);
    } else {
      s.injuries.delete(pid);
    }
  }

  // Check new injuries on MLB players
  const mlbPlayers = s.players.filter(p => p.rosterStatus === 'MLB');
  const newInjuries = processInjuries(s.rng.fork(), mlbPlayers, s.injuries);
  for (const [pid, injury] of newInjuries) {
    if (!s.injuries.has(pid)) {
      s.injuries.set(pid, injury);
      const player = s.players.find(p => p.id === pid);
      if (player) {
        const currentMorale = s.playerMorale.get(pid);
        if (currentMorale) {
          s.playerMorale.set(pid, applyMoraleEvent(player, currentMorale, {
            type: 'injury',
            impact: -14,
            summary: describeInjury(injury),
            timestamp: timestamp(),
          }));
        }
        const newsItems = generateNews(s.rng.fork(), {
          type: 'injury', season: s.season, day: s.day, data: {
            playerId: pid, playerName: `${player.firstName} ${player.lastName}`,
            teamId: player.teamId, description: describeInjury(injury),
          },
        }, s.players, s.season, s.day);
        s.news.push(...newsItems);
      }
    }
  }

  // Check milestones
  const milestones = checkMilestones(s.seasonState.playerSeasonStats, s.players, s.season, s.day);
  for (const m of milestones) {
    const mNews = generateNews(s.rng.fork(), {
      type: 'milestone', season: s.season, day: s.day,
      data: m as unknown as Record<string, unknown>,
    }, s.players, s.season, s.day);
    s.news.push(...mNews);
  }

  s.news = deduplicateNews(s.news);
}

function ensureOffseasonState(s: FullGameState) {
  if (!s.offseasonState) {
    s.offseasonState = createOffseasonState(s.season);
  }
}

function updateOffseasonClock(s: FullGameState) {
  if (s.offseasonState) {
    s.day = s.offseasonState.totalDay;
  }
}

function applyTenderDecisionsOnce(s: FullGameState) {
  if (!s.offseasonState) return;

  const existingTendered = new Set(s.offseasonState.phaseResults.tenderedPlayers);
  const existingNonTendered = new Set(s.offseasonState.phaseResults.nonTenderedPlayers);
  const affectedTeams = new Set<string>();

  for (const teamId of TEAMS.map((team) => team.id)) {
    if (teamId === s.userTeamId) continue;

    const arbEligiblePlayers = getArbEligiblePlayers(s.players, teamId, s.serviceTime)
      .filter((player) => player.rosterStatus === 'MLB');
    if (arbEligiblePlayers.length === 0) continue;

    const eligibleIds = new Set(arbEligiblePlayers.map((player) => player.id));
    const decisions = autoResolveTenderNonTender(s.rng.fork(), teamId, s.players, s.serviceTime);
    const tendered = decisions.tendered
      .filter((playerId) => eligibleIds.has(playerId) && !existingTendered.has(playerId) && !existingNonTendered.has(playerId));
    const nonTendered = decisions.nonTendered
      .filter((playerId) => eligibleIds.has(playerId) && !existingTendered.has(playerId) && !existingNonTendered.has(playerId));

    if (tendered.length === 0 && nonTendered.length === 0) continue;

    s.offseasonState = recordTenderDecisions(s.offseasonState, tendered, nonTendered);
    for (const playerId of tendered) existingTendered.add(playerId);
    for (const playerId of nonTendered) existingNonTendered.add(playerId);

    for (const playerId of nonTendered) {
      const player = s.players.find((candidate) => candidate.id === playerId);
      if (!player) continue;
      const previousTeamId = player.teamId;
      player.teamId = '';
      player.rosterStatus = 'INTERNATIONAL';
      player.contract = {
        ...player.contract,
        years: 0,
      };
      affectedTeams.add(previousTeamId);
    }
  }

  for (const teamId of affectedTeams) {
    s.rosterStates.set(teamId, buildRosterState(teamId, s.players));
  }
}

function ensureFreeAgencyMarket(s: FullGameState) {
  if (!s.freeAgencyMarket) {
    s.freeAgencyMarket = createFreeAgencyMarket(s.season, s.players);
  }
}

function buildFreeAgencyPayrolls(s: FullGameState) {
  const freeAgentIds = new Set(s.freeAgencyMarket?.freeAgents.map((freeAgent) => freeAgent.player.id) ?? []);
  return new Map(
    TEAMS
      .filter((team) => team.id !== s.userTeamId)
      .map((team) => {
        const teamPlayers = s.players.filter(
          (player) => player.teamId === team.id && !freeAgentIds.has(player.id),
        );
        return [team.id, calculateTeamPayroll(team.id, teamPlayers).totalPayroll] as const;
      }),
  );
}

function buildFreeAgencyNeeds(s: FullGameState) {
  const freeAgentIds = new Set(s.freeAgencyMarket?.freeAgents.map((freeAgent) => freeAgent.player.id) ?? []);
  return new Map(
    TEAMS
      .filter((team) => team.id !== s.userTeamId)
      .map((team) => {
        const teamRoster = s.players.filter(
          (player) => player.teamId === team.id && player.rosterStatus === 'MLB' && !freeAgentIds.has(player.id),
        );
        return [team.id, evaluateTeamNeeds(teamRoster)] as const;
      }),
  );
}

function applyNewFreeAgencySignings(
  s: FullGameState,
  previousSignedIds: Set<string>,
): OffseasonProgressResult['aiSignings'] {
  if (!s.freeAgencyMarket || !s.offseasonState) return [];

  const progress: OffseasonProgressResult['aiSignings'] = [];
  const currentSigningIds = new Set(s.offseasonState.phaseResults.freeAgentSignings.map((entry) => entry.playerId));

  for (const signedPlayer of s.freeAgencyMarket.signedPlayers) {
    const contract = signedPlayer.contract;
    const teamId = signedPlayer.signedWith;
    if (!contract || !teamId || previousSignedIds.has(signedPlayer.player.id) || currentSigningIds.has(signedPlayer.player.id)) {
      continue;
    }

    const player = s.players.find((candidate) => candidate.id === signedPlayer.player.id);
    if (!player) continue;

    const previousTeamId = player.teamId;
    player.teamId = teamId;
    player.rosterStatus = 'MLB';
    player.contract = {
      years: contract.years,
      annualSalary: contract.annualSalary,
      noTradeClause: contract.noTradeClause,
      playerOption: contract.playerOption,
      teamOption: contract.teamOption,
    };

    if (previousTeamId) {
      s.rosterStates.set(previousTeamId, buildRosterState(previousTeamId, s.players));
    }
    s.rosterStates.set(teamId, buildRosterState(teamId, s.players));

    const signingResult: FASigningResult = {
      playerId: player.id,
      teamId,
      years: contract.years,
      annualSalary: contract.annualSalary,
      totalValue: contract.totalValue,
    };
    s.offseasonState = recordFASigning(s.offseasonState, signingResult);
    currentSigningIds.add(player.id);
    progress.push({
      playerId: player.id,
      teamId,
      years: contract.years,
      annualSalary: contract.annualSalary,
      marketValue: signedPlayer.marketValue,
    });
  }

  return progress;
}

function simulateFreeAgencyDays(
  s: FullGameState,
  daysToSimulate: number,
): OffseasonProgressResult['aiSignings'] {
  ensureFreeAgencyMarket(s);
  const aiSignings: OffseasonProgressResult['aiSignings'] = [];

  for (let day = 0; day < daysToSimulate; day++) {
    if (!s.freeAgencyMarket) break;
    const previousSignedIds = new Set(s.freeAgencyMarket.signedPlayers.map((entry) => entry.player.id));
    const teamBudgets = new Map(
      TEAMS
        .filter((team) => team.id !== s.userTeamId)
        .map((team) => [team.id, getTeamBudget(team.id)] as const),
    );
    const teamPayrolls = buildFreeAgencyPayrolls(s);
    const teamNeeds = buildFreeAgencyNeeds(s);
    s.freeAgencyMarket = simulateFADay(
      s.rng.fork(),
      s.freeAgencyMarket,
      teamBudgets,
      teamPayrolls,
      teamNeeds,
    );
    aiSignings.push(...applyNewFreeAgencySignings(s, previousSignedIds));
  }

  return aiSignings;
}

function processCurrentOffseasonPhase(
  s: FullGameState,
  previousPhase: OffseasonState['currentPhase'] | null,
  previousPhaseDay: number | null,
): OffseasonProgressResult {
  if (!s.offseasonState) return { aiSignings: [] };

  const currentPhase = s.offseasonState.currentPhase;
  const enteredPhase = previousPhase !== currentPhase;

  if (currentPhase === 'tender_nontender' && enteredPhase) {
    applyTenderDecisionsOnce(s);
    return { aiSignings: [] };
  }

  if (currentPhase === 'free_agency') {
    const advancedWithinPhase = previousPhase === currentPhase && previousPhaseDay !== s.offseasonState.phaseDay;
    if (enteredPhase || advancedWithinPhase) {
      return {
        aiSignings: simulateFreeAgencyDays(s, 1),
      };
    }
  }

  return { aiSignings: [] };
}

function finalizeFreeAgencyIfNeeded(
  s: FullGameState,
  previousPhase: OffseasonState['currentPhase'],
  nextPhase: OffseasonState['currentPhase'] | null,
): OffseasonProgressResult['aiSignings'] {
  if (previousPhase !== 'free_agency' || nextPhase === 'free_agency') {
    return [];
  }

  ensureFreeAgencyMarket(s);
  const remainingDays = s.freeAgencyMarket ? Math.max(0, 60 - s.freeAgencyMarket.day) : 0;
  return simulateFreeAgencyDays(s, remainingDays);
}

function applyOffseasonTransition(
  s: FullGameState,
  previousState: OffseasonState,
  nextState: OffseasonState,
): OffseasonProgressResult {
  const aiSignings = finalizeFreeAgencyIfNeeded(s, previousState.currentPhase, nextState.currentPhase);
  s.offseasonState = {
    ...nextState,
    phaseResults: s.offseasonState?.phaseResults ?? previousState.phaseResults,
  };
  updateOffseasonClock(s);
  const currentProgress = processCurrentOffseasonPhase(s, previousState.currentPhase, previousState.phaseDay);
  return {
    aiSignings: [...aiSignings, ...currentProgress.aiSignings],
  };
}

/** Handle one offseason day with AI auto-resolution. */
export function advanceOffseasonOnce(s: FullGameState): OffseasonProgressResult {
  ensureOffseasonState(s);
  if (!s.offseasonState || s.offseasonState.completed) return { aiSignings: [] };

  const previousState = s.offseasonState;
  const nextState = advanceOffseasonDay(previousState);
  return applyOffseasonTransition(s, previousState, nextState);
}

export function skipOffseasonPhaseWithAI(s: FullGameState): OffseasonProgressResult {
  ensureOffseasonState(s);
  if (!s.offseasonState || s.offseasonState.completed) return { aiSignings: [] };

  const previousState = s.offseasonState;
  const nextState = skipCurrentPhase(previousState);
  return applyOffseasonTransition(s, previousState, nextState);
}
