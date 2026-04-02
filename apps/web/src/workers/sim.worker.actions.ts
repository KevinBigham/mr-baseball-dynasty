import {
  GameRNG,
  TEAMS,
  assignGMPersonality,
  buildRosterState,
  createSeasonState,
  demotePlayer,
  determinePlayoffSeeds,
  determineRetirements,
  developAllPlayers,
  dfaPlayer,
  evaluateTradeProposal,
  executeTrade,
  generateDraftClass,
  generateLeaguePlayers,
  generateSchedule,
  generateScoutingStaff,
  markAsRead,
  makeUserOffer,
  promotePlayer,
  recordRetirements,
  simulateDay,
  simulateMonth,
  simulatePlayoffs,
  simulateWeek,
  generateTradeId,
  createFreeAgencyMarket,
} from '@mbd/sim-core';
import type {
  ContractOffer,
  TradeProposal,
} from '@mbd/sim-core';
import {
  buildOffseasonStateView,
  createEmptyTradeState,
  getTeamPlayers,
  makeUserDraftSelection,
  processDayInjuriesAndNews,
  requireState,
  startDraftSession,
  setState,
  skipOffseasonPhaseWithAI,
  simulateRemainingDraftSession,
  timestamp,
  advanceOffseasonOnce,
} from './sim.worker.helpers.js';
import type {
  FullGameState,
  OffseasonStateView,
  SimResultDTO,
} from './sim.worker.helpers.js';
import { exportGameSnapshot, importGameSnapshot } from './snapshot.js';
import {
  ensureNarrativeState,
  ensureAwardHistoryForSeason,
  finalizeSeasonHistoryRetirements,
  recordBreakoutNarratives,
  recordSeasonHistory,
  refreshNarrativeState,
} from './sim.worker.narrative.js';
import {
  applyAISigningConsequences,
  applyPostseasonConsequences,
  applyRetirementConsequences,
  applySigningConsequences,
  applyTradeConsequences,
} from './sim.worker.consequences.js';

function applyAISigningProgress(
  s: FullGameState,
  aiSignings: Array<{
    playerId: string;
    teamId: string;
    years: number;
    annualSalary: number;
    marketValue: number;
  }>,
) {
  for (const signing of aiSignings) {
    applyAISigningConsequences(
      s,
      signing.playerId,
      signing.teamId,
      signing.annualSalary,
      signing.years,
      signing.marketValue,
    );
  }
}

function simDayInternal(): SimResultDTO {
  const s = requireState();
  if (s.phase === 'preseason') {
    s.phase = 'regular';
    s.day = 1;
  }

  if (s.phase === 'regular') {
    const { newState, result } = simulateDay(s.rng, s.seasonState, s.schedule, s.players);
    s.seasonState = newState;
    s.day = newState.currentDay;
    processDayInjuriesAndNews(s);
    refreshNarrativeState(s, result.games);
    if (result.seasonComplete) {
      ensureAwardHistoryForSeason(s);
      s.phase = 'playoffs';
      s.day = 1;
    }
    return {
      day: s.day,
      season: s.season,
      phase: s.phase,
      gamesPlayed: result.games.length,
      seasonComplete: result.seasonComplete,
    };
  }

  if (s.phase === 'playoffs') {
    if (!s.playoffBracket) {
      const seeds = determinePlayoffSeeds(s.seasonState.standings.getFullStandings());
      s.playoffBracket = simulatePlayoffs(s.rng, seeds, s.players);
    }
    ensureAwardHistoryForSeason(s);
    const seasonMoments = applyPostseasonConsequences(s);
    recordSeasonHistory(s, seasonMoments);
    s.phase = 'offseason';
    s.day = 1;
    return {
      day: 1,
      season: s.season,
      phase: 'offseason',
      gamesPlayed: 0,
      seasonComplete: true,
    };
  }

  if (s.phase === 'offseason') {
    const offseasonProgress = advanceOffseasonOnce(s);
    applyAISigningProgress(s, offseasonProgress.aiSignings);

    if (s.offseasonState?.completed) {
      const beforePlayers = s.players;
      const developedPlayers = developAllPlayers(s.rng.fork(), s.players);
      recordBreakoutNarratives(s, beforePlayers, developedPlayers);
      s.players = developedPlayers;

      const retired = determineRetirements(s.rng.fork(), s.players);
      if (s.offseasonState) {
        s.offseasonState = recordRetirements(
          s.offseasonState,
          retired.map((playerId) => {
            const player = s.players.find((candidate) => candidate.id === playerId);
            const seasonsPlayed = s.serviceTime.get(playerId) ?? 0;
            const playerName = player ? `${player.firstName} ${player.lastName}` : playerId;
            return {
              playerId,
              teamId: player?.teamId ?? '',
              playerName,
              seasonsPlayed,
              summary: `${playerName} retired after ${seasonsPlayed} seasons.`,
            };
          }),
        );
      }

      applyRetirementConsequences(s, retired);
      finalizeSeasonHistoryRetirements(s, retired);
      s.players = s.players.filter((player) => !retired.includes(player.id));
      s.season++;
      s.day = 1;
      s.phase = 'preseason';
      s.playoffBracket = null;
      s.offseasonState = null;
      s.draftClass = null;
      s.freeAgencyMarket = null;
      const teamIds = TEAMS.map((team) => team.id);
      s.schedule = generateSchedule(s.rng.fork());
      s.seasonState = createSeasonState(s.season, teamIds);
      for (const teamId of teamIds) {
        s.rosterStates.set(teamId, buildRosterState(teamId, s.players));
      }
      ensureNarrativeState(s);
      return {
        day: 1,
        season: s.season,
        phase: 'preseason',
        gamesPlayed: 0,
        seasonComplete: false,
      };
    }

    return {
      day: s.day,
      season: s.season,
      phase: 'offseason',
      gamesPlayed: 0,
      seasonComplete: true,
    };
  }

  return {
    day: s.day,
    season: s.season,
    phase: s.phase,
    gamesPlayed: 0,
    seasonComplete: false,
  };
}

export const actionApi = {
  newGame(seed: number, userTeamId: string = 'nyy') {
    const rng = new GameRNG(seed);
    const teamIds = TEAMS.map((team) => team.id);
    const players = generateLeaguePlayers(rng.fork(), teamIds);
    const schedule = generateSchedule(rng.fork());
    const seasonState = createSeasonState(1, teamIds);

    const serviceTime = new Map<string, number>();
    for (const player of players) {
      if (player.rosterStatus === 'MLB') {
        serviceTime.set(player.id, rng.nextInt(0, 8));
      }
    }

    const scoutingStaffs = new Map();
    const gmPersonalities = new Map();
    const rosterStates = new Map();
    for (const teamId of teamIds) {
      scoutingStaffs.set(teamId, generateScoutingStaff(rng.fork(), teamId));
      gmPersonalities.set(teamId, assignGMPersonality(rng.fork(), teamId));
      rosterStates.set(teamId, buildRosterState(teamId, players));
    }

    setState({
      rng,
      season: 1,
      day: 1,
      phase: 'preseason',
      players,
      schedule,
      seasonState,
      userTeamId,
      playoffBracket: null,
      injuries: new Map(),
      serviceTime,
      scoutingStaffs,
      gmPersonalities,
      offseasonState: null,
      draftClass: null,
      freeAgencyMarket: null,
      news: [],
      rosterStates,
      playerMorale: new Map(),
      teamChemistry: new Map(),
      ownerState: new Map(),
      briefingQueue: [],
      storyFlags: new Map(),
      rivalries: new Map(),
      awardHistory: [],
      seasonHistory: [],
      tradeState: createEmptyTradeState(),
    });
    ensureNarrativeState(requireState());

    return {
      success: true as const,
      season: 1,
      day: 1,
      phase: 'preseason' as const,
      playerCount: players.length,
      teamCount: teamIds.length,
      gamesScheduled: schedule.length,
    };
  },

  simDay(): SimResultDTO {
    return simDayInternal();
  },

  simWeek(): SimResultDTO {
    const s = requireState();
    if (s.phase !== 'regular') {
      return simDayInternal();
    }

    const { newState, result } = simulateWeek(s.rng, s.seasonState, s.schedule, s.players);
    s.seasonState = newState;
    s.day = newState.currentDay;
    processDayInjuriesAndNews(s);
    refreshNarrativeState(s, result.games);
    if (result.seasonComplete) {
      ensureAwardHistoryForSeason(s);
      s.phase = 'playoffs';
      s.day = 1;
    }
    return {
      day: s.day,
      season: s.season,
      phase: s.phase,
      gamesPlayed: result.games.length,
      seasonComplete: result.seasonComplete,
    };
  },

  simMonth(): SimResultDTO {
    const s = requireState();
    if (s.phase !== 'regular') {
      return simDayInternal();
    }

    const { newState, result } = simulateMonth(s.rng, s.seasonState, s.schedule, s.players);
    s.seasonState = newState;
    s.day = newState.currentDay;
    processDayInjuriesAndNews(s);
    refreshNarrativeState(s, result.games);
    if (result.seasonComplete) {
      ensureAwardHistoryForSeason(s);
      s.phase = 'playoffs';
      s.day = 1;
    }
    return {
      day: s.day,
      season: s.season,
      phase: s.phase,
      gamesPlayed: result.games.length,
      seasonComplete: result.seasonComplete,
    };
  },

  exportSnapshot() {
    return exportGameSnapshot(requireState());
  },

  importSnapshot(snapshot: unknown) {
    setState(importGameSnapshot(snapshot));
    const s = requireState();
    ensureNarrativeState(s);
    return {
      success: true as const,
      season: s.season,
      day: s.day,
      phase: s.phase,
      playerCount: s.players.length,
      userTeamId: s.userTeamId,
    };
  },

  startDraft() {
    const s = requireState();
    return startDraftSession(s, generateDraftClass(s.rng.fork(), s.season));
  },

  makeDraftPick(prospectId: string) {
    return makeUserDraftSelection(requireState(), prospectId);
  },

  simulateRemainingDraft() {
    return simulateRemainingDraftSession(requireState());
  },

  proposeTrade(offered: string[], requested: string[], toTeamId: string) {
    const s = requireState();
    const gm = s.gmPersonalities.get(toTeamId);
    if (!gm) {
      return { decision: 'rejected', reason: 'Unknown team' };
    }

    const preTradeUserPlayers = getTeamPlayers(s.userTeamId);
    const preTradePartnerPlayers = getTeamPlayers(toTeamId);
    const proposal: TradeProposal = {
      id: generateTradeId(s.rng.fork()),
      fromTeamId: s.userTeamId,
      toTeamId,
      playersOffered: offered,
      playersRequested: requested,
      status: 'proposed',
      reason: '',
    };
    const result = evaluateTradeProposal(
      s.rng.fork(),
      proposal,
      preTradeUserPlayers,
      preTradePartnerPlayers,
      gm,
      false,
    );
    if (result.decision === 'accepted') {
      executeTrade(proposal, s.players);
      s.rosterStates.set(s.userTeamId, buildRosterState(s.userTeamId, s.players));
      s.rosterStates.set(toTeamId, buildRosterState(toTeamId, s.players));
      applyTradeConsequences(s, offered, requested, toTeamId, preTradeUserPlayers, preTradePartnerPlayers);
    }
    return { decision: result.decision, reason: result.reason, counter: result.counter ?? undefined };
  },

  promotePlayerAction(playerId: string) {
    const s = requireState();
    const player = s.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const rosterState = s.rosterStates.get(player.teamId);
    if (!rosterState) {
      return { success: false, error: 'No roster state' };
    }

    const result = promotePlayer(playerId, s.players, rosterState, timestamp());
    s.players = result.players;
    s.rosterStates.set(player.teamId, result.rosterState);
    return { success: result.success, error: result.error };
  },

  demotePlayerAction(playerId: string) {
    const s = requireState();
    const player = s.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const rosterState = s.rosterStates.get(player.teamId);
    if (!rosterState) {
      return { success: false, error: 'No roster state' };
    }

    const result = demotePlayer(playerId, s.players, rosterState, timestamp());
    s.players = result.players;
    s.rosterStates.set(player.teamId, result.rosterState);
    return { success: result.success, error: result.error };
  },

  dfaPlayerAction(playerId: string) {
    const s = requireState();
    const player = s.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const rosterState = s.rosterStates.get(player.teamId);
    if (!rosterState) {
      return { success: false, error: 'No roster state' };
    }

    const result = dfaPlayer(playerId, s.players, rosterState, timestamp());
    s.players = result.players;
    s.rosterStates.set(player.teamId, result.rosterState);
    return { success: result.success, error: result.error };
  },

  makeContractOffer(playerId: string, years: number, salary: number) {
    const s = requireState();
    if (!s.freeAgencyMarket) {
      s.freeAgencyMarket = createFreeAgencyMarket(s.season, s.players);
    }

    const freeAgent = s.freeAgencyMarket.freeAgents.find((candidate) => candidate.player.id === playerId);
    const offer: ContractOffer = {
      teamId: s.userTeamId,
      playerId,
      years,
      annualSalary: salary,
      totalValue: years * salary,
      noTradeClause: false,
      playerOption: false,
      teamOption: false,
      signingBonus: 0,
    };
    const result = makeUserOffer(s.freeAgencyMarket, offer);
    if (!result.accepted || !freeAgent) {
      return result;
    }

    const player = s.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return result;
    }

    const previousTeamId = player.teamId;
    player.teamId = s.userTeamId;
    player.contract = {
      years,
      annualSalary: salary,
      noTradeClause: false,
      playerOption: false,
      teamOption: false,
    };

    s.freeAgencyMarket.freeAgents = s.freeAgencyMarket.freeAgents.filter(
      (candidate) => candidate.player.id !== playerId,
    );
    s.freeAgencyMarket.signedPlayers.push({
      ...freeAgent,
      player,
      signedWith: s.userTeamId,
      contract: offer,
    });

    s.rosterStates.set(previousTeamId, buildRosterState(previousTeamId, s.players));
    s.rosterStates.set(s.userTeamId, buildRosterState(s.userTeamId, s.players));
    applySigningConsequences(s, playerId, salary, years, freeAgent.marketValue);
    return result;
  },

  advanceOffseason(): OffseasonStateView | null {
    const s = requireState();
    const progress = advanceOffseasonOnce(s);
    applyAISigningProgress(s, progress.aiSignings);
    return buildOffseasonStateView(s);
  },

  skipOffseasonPhase(): OffseasonStateView | null {
    const s = requireState();
    const progress = skipOffseasonPhaseWithAI(s);
    applyAISigningProgress(s, progress.aiSignings);
    return buildOffseasonStateView(s);
  },

  markNewsRead(newsId: string) {
    const s = requireState();
    s.news = markAsRead(s.news, newsId);
  },
};
