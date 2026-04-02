/**
 * Web Worker entry point.
 * Full simulation engine: player generation, schedule, game sim, standings,
 * plus Phase 2 systems (injuries, scouting, draft, trade, roster, offseason,
 * free agency, finance, narrative).
 */
import * as Comlink from 'comlink';
import {
  GameRNG,
  generateLeaguePlayers,
  TEAMS,
  generateSchedule,
  createSeasonState,
  simulateDay,
  simulateWeek,
  simulateMonth,
  determinePlayoffSeeds,
  simulatePlayoffs,
  getTeamById,
  developAllPlayers,
  describeInjury,
  calculateTeamPayroll,
  calculateLuxuryTax,
  getTeamBudget,
  generateScoutingStaff,
  scoutPlayer,
  generateDraftClass,
  rankProspects,
  determineDraftOrder,
  simulateFullDraft,
  evaluatePlayerTradeValue,
  evaluateTradeProposal,
  executeTrade,
  assignGMPersonality,
  generateAITradeOffers,
  generateTradeId,
  buildRosterState,
  promotePlayer,
  demotePlayer,
  dfaPlayer,
  determineRetirements,
  createFreeAgencyMarket,
  getTopFreeAgents,
  makeUserOffer,
  getUnreadNews,
  markAsRead,
  recordRetirements,
} from '@mbd/sim-core';
import type {
  GeneratedPlayer,
  StandingsEntry,
  PlayoffBracket,
  PlayerGameStats,
  DraftResult,
  TradeProposal,
  RosterState,
  OffseasonState,
  PlayerTradeValue,
  ContractOffer,
  FreeAgent,
} from '@mbd/sim-core';
import {
  state, setState,
  requireState, timestamp, getTeamPlayers,
  buildOffseasonStateView,
  createEmptyTradeState,
  toPlayerDTO, processDayInjuriesAndNews, advanceOffseasonOnce, skipOffseasonPhaseWithAI,
} from './sim.worker.helpers.js';
import type {
  OffseasonStateView,
  SimResultDTO,
  TeamStandingsDTO,
  PlayerDTO,
} from './sim.worker.helpers.js';
import { exportGameSnapshot, importGameSnapshot } from './snapshot.js';
import { calculateAwardRaces } from '../../../../packages/sim-core/src/league/awards';
import {
  ensureNarrativeState,
  ensureAwardHistoryForSeason,
  finalizeSeasonHistoryRetirements,
  getAwardHistory,
  getPersonalityProfileForPlayer,
  getRivalriesForTeam,
  resolveHistoryDisplayNames,
  getSeasonHistory,
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
import { buildPressRoomFeed } from './sim.worker.pressRoom.js';

// ---------------------------------------------------------------------------
// Worker API
// ---------------------------------------------------------------------------

export const api = {
  ping() {
    return { pong: true as const, timestamp: Date.now() };
  },

  newGame(seed: number, userTeamId: string = 'nyy') {
    const rng = new GameRNG(seed);
    const teamIds = TEAMS.map(t => t.id);
    const players = generateLeaguePlayers(rng.fork(), teamIds);
    const schedule = generateSchedule(rng.fork());
    const seasonState = createSeasonState(1, teamIds);

    const serviceTime = new Map<string, number>();
    for (const p of players) {
      if (p.rosterStatus === 'MLB') serviceTime.set(p.id, rng.nextInt(0, 8));
    }

    const scoutingStaffs = new Map();
    const gmPersonalities = new Map();
    const rosterStates = new Map();
    for (const tid of teamIds) {
      scoutingStaffs.set(tid, generateScoutingStaff(rng.fork(), tid));
      gmPersonalities.set(tid, assignGMPersonality(rng.fork(), tid));
      rosterStates.set(tid, buildRosterState(tid, players));
    }

    setState({
      rng, season: 1, day: 1, phase: 'preseason',
      players, schedule, seasonState, userTeamId,
      playoffBracket: null, injuries: new Map(),
      serviceTime, scoutingStaffs, gmPersonalities,
      offseasonState: null, draftClass: null,
      freeAgencyMarket: null, news: [], rosterStates,
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
      success: true as const, season: 1, day: 1, phase: 'preseason' as const,
      playerCount: players.length, teamCount: teamIds.length,
      gamesScheduled: schedule.length,
    };
  },

  simDay(): SimResultDTO {
    const s = requireState();
    if (s.phase === 'preseason') { s.phase = 'regular'; s.day = 1; }

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
      return { day: s.day, season: s.season, phase: s.phase,
        gamesPlayed: result.games.length, seasonComplete: result.seasonComplete };
    }

    if (s.phase === 'playoffs') {
      if (!s.playoffBracket) {
        const seeds = determinePlayoffSeeds(s.seasonState.standings.getFullStandings());
        s.playoffBracket = simulatePlayoffs(s.rng, seeds, s.players);
      }
      ensureAwardHistoryForSeason(s);
      const seasonMoments = applyPostseasonConsequences(s);
      recordSeasonHistory(s, seasonMoments);
      s.phase = 'offseason'; s.day = 1;
      return { day: 1, season: s.season, phase: 'offseason', gamesPlayed: 0, seasonComplete: true };
    }

    if (s.phase === 'offseason') {
      const offseasonProgress = advanceOffseasonOnce(s);
      for (const signing of offseasonProgress.aiSignings) {
        applyAISigningConsequences(
          s,
          signing.playerId,
          signing.teamId,
          signing.annualSalary,
          signing.years,
          signing.marketValue,
        );
      }
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
        s.players = s.players.filter(p => !retired.includes(p.id));
        s.season++; s.day = 1; s.phase = 'preseason';
        s.playoffBracket = null; s.offseasonState = null;
        s.draftClass = null; s.freeAgencyMarket = null;
        const teamIds = TEAMS.map(t => t.id);
        s.schedule = generateSchedule(s.rng.fork());
        s.seasonState = createSeasonState(s.season, teamIds);
        for (const tid of teamIds) s.rosterStates.set(tid, buildRosterState(tid, s.players));
        ensureNarrativeState(s);
        return { day: 1, season: s.season, phase: 'preseason', gamesPlayed: 0, seasonComplete: false };
      }
      return { day: s.day, season: s.season, phase: 'offseason', gamesPlayed: 0, seasonComplete: true };
    }

    return { day: s.day, season: s.season, phase: s.phase, gamesPlayed: 0, seasonComplete: false };
  },

  simWeek(): SimResultDTO {
    const s = requireState();
    if (s.phase !== 'regular') return this.simDay();
    const { newState, result } = simulateWeek(s.rng, s.seasonState, s.schedule, s.players);
    s.seasonState = newState; s.day = newState.currentDay;
    processDayInjuriesAndNews(s);
    refreshNarrativeState(s, result.games);
    if (result.seasonComplete) {
      ensureAwardHistoryForSeason(s);
      s.phase = 'playoffs';
      s.day = 1;
    }
    return { day: s.day, season: s.season, phase: s.phase,
      gamesPlayed: result.games.length, seasonComplete: result.seasonComplete };
  },

  simMonth(): SimResultDTO {
    const s = requireState();
    if (s.phase !== 'regular') return this.simDay();
    const { newState, result } = simulateMonth(s.rng, s.seasonState, s.schedule, s.players);
    s.seasonState = newState; s.day = newState.currentDay;
    processDayInjuriesAndNews(s);
    refreshNarrativeState(s, result.games);
    if (result.seasonComplete) {
      ensureAwardHistoryForSeason(s);
      s.phase = 'playoffs';
      s.day = 1;
    }
    return { day: s.day, season: s.season, phase: s.phase,
      gamesPlayed: result.games.length, seasonComplete: result.seasonComplete };
  },

  getState() {
    if (!state) return null;
    return { season: state.season, day: state.day, phase: state.phase,
      userTeamId: state.userTeamId, playerCount: state.players.length };
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

  // -----------------------------------------------------------------------
  // Standings & Rosters (Phase 1)
  // -----------------------------------------------------------------------

  getStandings(): { divisions: Record<string, TeamStandingsDTO[]> } | null {
    if (!state) return null;
    const fullStandings = state.seasonState.standings.getFullStandings();
    const divisions: Record<string, TeamStandingsDTO[]> = {};
    for (const [div, entries] of Object.entries(fullStandings)) {
      divisions[div] = entries.map((e: StandingsEntry) => {
        const team = getTeamById(e.teamId);
        return {
          teamId: e.teamId, teamName: team?.name ?? e.teamId,
          city: team?.city ?? '', abbreviation: team?.abbreviation ?? '',
          division: div, wins: e.wins, losses: e.losses,
          pct: e.pct.toFixed(3).replace(/^0/, ''),
          gamesBack: e.gamesBack, streak: e.streak, runDifferential: e.runDifferential,
        };
      });
    }
    return { divisions };
  },

  getTeamRoster(teamId: string): PlayerDTO[] {
    if (!state) return [];
    return state.players.filter(p => p.teamId === teamId && p.rosterStatus === 'MLB')
      .sort((a, b) => b.overallRating - a.overallRating).map(p => toPlayerDTO(p));
  },

  getFullRoster(teamId: string): { mlb: PlayerDTO[]; minors: Record<string, PlayerDTO[]> } {
    if (!state) return { mlb: [], minors: {} };
    const tp = state.players.filter(p => p.teamId === teamId);
    const mlb = tp.filter(p => p.rosterStatus === 'MLB')
      .sort((a, b) => b.overallRating - a.overallRating).map(p => toPlayerDTO(p));
    const minors: Record<string, PlayerDTO[]> = {};
    for (const level of ['AAA', 'AA', 'A_PLUS', 'A', 'ROOKIE', 'INTERNATIONAL']) {
      minors[level] = tp.filter(p => p.rosterStatus === level)
        .sort((a, b) => b.overallRating - a.overallRating).map(p => toPlayerDTO(p));
    }
    return { mlb, minors };
  },

  getPlayer(playerId: string): PlayerDTO | null {
    if (!state) return null;
    const player = state.players.find(p => p.id === playerId);
    return player ? toPlayerDTO(player) : null;
  },

  getLeagueLeaders(stat: string, limit: number = 20): PlayerDTO[] {
    if (!state) return [];
    const withStats = state.players.filter(p => p.rosterStatus === 'MLB')
      .map(p => ({ player: p, stats: state!.seasonState.playerSeasonStats.get(p.id) }))
      .filter((item): item is { player: GeneratedPlayer; stats: PlayerGameStats } =>
        item.stats != null && item.stats.pa > 0);
    const sorted = [...withStats].sort((a, b) => {
      switch (stat) {
        case 'hr': return b.stats.hr - a.stats.hr;
        case 'rbi': return b.stats.rbi - a.stats.rbi;
        case 'hits': return b.stats.hits - a.stats.hits;
        case 'avg': return (b.stats.ab > 0 ? b.stats.hits / b.stats.ab : 0) -
          (a.stats.ab > 0 ? a.stats.hits / a.stats.ab : 0);
        case 'k': return b.stats.strikeouts - a.stats.strikeouts;
        case 'era': return (a.stats.ip > 0 ? (a.stats.earnedRuns / (a.stats.ip / 3)) * 9 : 99) -
          (b.stats.ip > 0 ? (b.stats.earnedRuns / (b.stats.ip / 3)) * 9 : 99);
        default: return b.stats.hr - a.stats.hr;
      }
    });
    return sorted.slice(0, limit).map(item => toPlayerDTO(item.player, item.stats));
  },

  getPlayoffBracket(): PlayoffBracket | null { return state?.playoffBracket ?? null; },
  getUserTeamId(): string { return state?.userTeamId ?? 'nyy'; },

  searchPlayers(query: string, limit: number = 20): PlayerDTO[] {
    if (!state || !query) return [];
    const q = query.toLowerCase();
    return state.players
      .filter(p => p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))
      .slice(0, limit).map(p => toPlayerDTO(p));
  },

  // -----------------------------------------------------------------------
  // Injuries (Phase 2)
  // -----------------------------------------------------------------------

  getInjuries(teamId: string) {
    const s = requireState();
    const results: { playerId: string; playerName: string; injury: string; daysRemaining: number }[] = [];
    for (const [pid, injury] of s.injuries) {
      const player = s.players.find(p => p.id === pid);
      if (player && player.teamId === teamId) {
        results.push({ playerId: pid, playerName: `${player.firstName} ${player.lastName}`,
          injury: describeInjury(injury), daysRemaining: injury.daysRemaining });
      }
    }
    return results;
  },

  // -----------------------------------------------------------------------
  // Scouting (Phase 2)
  // -----------------------------------------------------------------------

  scoutPlayerReport(playerId: string) {
    const s = requireState();
    const player = s.players.find(p => p.id === playerId);
    if (!player) return null;
    const staff = s.scoutingStaffs.get(s.userTeamId);
    if (!staff || staff.length === 0) return null;
    const report = scoutPlayer(s.rng.fork(), staff[0]!, player, timestamp());
    const team = getTeamById(player.teamId);
    return {
      playerId: report.playerId,
      playerName: `${player.firstName} ${player.lastName}`,
      position: player.position,
      age: player.age,
      teamName: team?.abbreviation ?? player.teamId.toUpperCase(),
      isPitcher: player.pitcherAttributes != null,
      grades: report.observedRatings,
      confidence: report.confidence,
      overall: report.overallGrade,
      ceiling: report.ceiling,
      floor: report.floor,
      notes: report.notes,
      scoutName: staff[0]!.name,
      date: report.reportDate,
      reliability: Math.max(1, Math.min(5, Math.round(report.reliability * 5))),
    };
  },

  getScoutingStaff() { return requireState().scoutingStaffs.get(requireState().userTeamId) ?? []; },

  // -----------------------------------------------------------------------
  // Draft (Phase 2)
  // -----------------------------------------------------------------------

  getDraftClass() {
    const s = requireState();
    if (!s.draftClass) return null;
    return {
      prospects: rankProspects(s.draftClass.prospects).map(p => ({
        id: p.player.id, name: `${p.player.firstName} ${p.player.lastName}`,
        position: p.player.position, grade: p.scoutingGrade,
        college: p.collegeOrHS === 'college' ? 'College' : 'HS',
      })),
    };
  },

  startDraft() {
    const s = requireState();
    s.draftClass = generateDraftClass(s.rng.fork(), s.season);
  },

  makeDraftPick(prospectId: string) {
    const s = requireState();
    if (!s.draftClass) return { success: false, pick: null };
    const prospect = s.draftClass.prospects.find(p => p.player.id === prospectId);
    if (!prospect) return { success: false, pick: null };
    s.draftClass = { ...s.draftClass, prospects: s.draftClass.prospects.filter(p => p.player.id !== prospectId) };
    return { success: true, pick: { prospectId: prospect.player.id,
      name: `${prospect.player.firstName} ${prospect.player.lastName}`,
      position: prospect.player.position, grade: prospect.scoutingGrade, teamId: s.userTeamId } };
  },

  simulateRemainingDraft(): DraftResult | null {
    const s = requireState();
    if (!s.draftClass) return null;
    const records: { teamId: string; wins: number; losses: number }[] = [];
    for (const entries of Object.values(s.seasonState.standings.getFullStandings())) {
      for (const e of entries as StandingsEntry[]) records.push({ teamId: e.teamId, wins: e.wins, losses: e.losses });
    }
    const draftOrder = determineDraftOrder(records);
    const teamRosters = new Map<string, GeneratedPlayer[]>();
    for (const tid of TEAMS.map(t => t.id)) teamRosters.set(tid, getTeamPlayers(tid));
    return simulateFullDraft(s.rng.fork(), s.draftClass, draftOrder, teamRosters, s.userTeamId);
  },

  // -----------------------------------------------------------------------
  // Trade (Phase 2)
  // -----------------------------------------------------------------------

  getPlayerTradeValue(playerId: string): PlayerTradeValue | null {
    const player = requireState().players.find(p => p.id === playerId);
    return player ? evaluatePlayerTradeValue(player) : null;
  },

  proposeTrade(offered: string[], requested: string[], toTeamId: string) {
    const s = requireState();
    const gm = s.gmPersonalities.get(toTeamId);
    if (!gm) return { decision: 'rejected', reason: 'Unknown team' };
    const preTradeUserPlayers = getTeamPlayers(s.userTeamId);
    const preTradePartnerPlayers = getTeamPlayers(toTeamId);
    const proposal: TradeProposal = { id: generateTradeId(s.rng.fork()),
      fromTeamId: s.userTeamId, toTeamId, playersOffered: offered,
      playersRequested: requested, status: 'proposed', reason: '' };
    const result = evaluateTradeProposal(
      s.rng.fork(), proposal, preTradeUserPlayers, preTradePartnerPlayers, gm, false);
    if (result.decision === 'accepted') {
      executeTrade(proposal, s.players);
      s.rosterStates.set(s.userTeamId, buildRosterState(s.userTeamId, s.players));
      s.rosterStates.set(toTeamId, buildRosterState(toTeamId, s.players));
      applyTradeConsequences(s, offered, requested, toTeamId, preTradeUserPlayers, preTradePartnerPlayers);
    }
    return { decision: result.decision, reason: result.reason, counter: result.counter ?? undefined };
  },

  getTradeOffers(): TradeProposal[] {
    const s = requireState();
    const gm = s.gmPersonalities.get(s.userTeamId);
    if (!gm) return [];
    return generateAITradeOffers(s.rng.fork(), s.userTeamId, getTeamPlayers(s.userTeamId), s.players, gm, false);
  },

  // -----------------------------------------------------------------------
  // Roster Management (Phase 2)
  // -----------------------------------------------------------------------

  getRosterState(teamId: string): RosterState | null { return requireState().rosterStates.get(teamId) ?? null; },

  promotePlayerAction(playerId: string) {
    const s = requireState();
    const player = s.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found' };
    const rs = s.rosterStates.get(player.teamId);
    if (!rs) return { success: false, error: 'No roster state' };
    const result = promotePlayer(playerId, s.players, rs, timestamp());
    s.players = result.players; s.rosterStates.set(player.teamId, result.rosterState);
    return { success: result.success, error: result.error };
  },

  demotePlayerAction(playerId: string) {
    const s = requireState();
    const player = s.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found' };
    const rs = s.rosterStates.get(player.teamId);
    if (!rs) return { success: false, error: 'No roster state' };
    const result = demotePlayer(playerId, s.players, rs, timestamp());
    s.players = result.players; s.rosterStates.set(player.teamId, result.rosterState);
    return { success: result.success, error: result.error };
  },

  dfaPlayerAction(playerId: string) {
    const s = requireState();
    const player = s.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found' };
    const rs = s.rosterStates.get(player.teamId);
    if (!rs) return { success: false, error: 'No roster state' };
    const result = dfaPlayer(playerId, s.players, rs, timestamp());
    s.players = result.players; s.rosterStates.set(player.teamId, result.rosterState);
    return { success: result.success, error: result.error };
  },

  // -----------------------------------------------------------------------
  // Free Agency (Phase 2)
  // -----------------------------------------------------------------------

  getFreeAgents(limit: number = 25): FreeAgent[] {
    const s = requireState();
    if (!s.freeAgencyMarket) s.freeAgencyMarket = createFreeAgencyMarket(s.season, s.players);
    return getTopFreeAgents(s.freeAgencyMarket, undefined, limit);
  },

  makeContractOffer(playerId: string, years: number, salary: number) {
    const s = requireState();
    if (!s.freeAgencyMarket) s.freeAgencyMarket = createFreeAgencyMarket(s.season, s.players);
    const freeAgent = s.freeAgencyMarket.freeAgents.find((candidate) => candidate.player.id === playerId);
    const offer: ContractOffer = { teamId: s.userTeamId, playerId, years, annualSalary: salary,
      totalValue: years * salary, noTradeClause: false, playerOption: false,
      teamOption: false, signingBonus: 0 };
    const result = makeUserOffer(s.freeAgencyMarket, offer);
    if (!result.accepted || !freeAgent) return result;

    const player = s.players.find((candidate) => candidate.id === playerId);
    if (!player) return result;

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

  // -----------------------------------------------------------------------
  // Offseason (Phase 2)
  // -----------------------------------------------------------------------

  getOffseasonState() { return buildOffseasonStateView(requireState()); },

  advanceOffseason(): OffseasonStateView | null {
    const s = requireState();
    const progress = advanceOffseasonOnce(s);
    for (const signing of progress.aiSignings) {
      applyAISigningConsequences(
        s,
        signing.playerId,
        signing.teamId,
        signing.annualSalary,
        signing.years,
        signing.marketValue,
      );
    }
    return buildOffseasonStateView(s);
  },

  skipOffseasonPhase(): OffseasonStateView | null {
    const s = requireState();
    const progress = skipOffseasonPhaseWithAI(s);
    for (const signing of progress.aiSignings) {
      applyAISigningConsequences(
        s,
        signing.playerId,
        signing.teamId,
        signing.annualSalary,
        signing.years,
        signing.marketValue,
      );
    }
    return buildOffseasonStateView(s);
  },

  // -----------------------------------------------------------------------
  // News (Phase 2)
  // -----------------------------------------------------------------------

  getNews(limit: number = 50) { return getUnreadNews(requireState().news).slice(0, limit); },
  markNewsRead(newsId: string) { const s = requireState(); s.news = markAsRead(s.news, newsId); },
  getBriefing(limit: number = 5) { return requireState().briefingQueue.slice(0, limit); },
  getPressRoomFeed(limit: number = 100) { return buildPressRoomFeed(requireState(), limit); },
  getTeamChemistry(teamId?: string) {
    const s = requireState();
    return s.teamChemistry.get(teamId ?? s.userTeamId) ?? null;
  },
  getOwnerState(teamId?: string) {
    const s = requireState();
    return s.ownerState.get(teamId ?? s.userTeamId) ?? null;
  },
  getPersonalityProfile(playerId: string) {
    return getPersonalityProfileForPlayer(requireState(), playerId);
  },
  getAwardRaces() {
    const s = requireState();
    return calculateAwardRaces(s.players, s.seasonState.playerSeasonStats);
  },
  getRivalries(teamId?: string) {
    const s = requireState();
    return Array.from(getRivalriesForTeam(s, teamId ?? s.userTeamId).values())
      .sort((a, b) => b.intensity - a.intensity);
  },
  getAwardHistory() { return getAwardHistory(requireState()); },
  getSeasonHistory() { return getSeasonHistory(requireState()); },
  resolveHistoryDisplayNames(playerIds: string[], teamIds: string[]) {
    return resolveHistoryDisplayNames(requireState(), playerIds, teamIds);
  },

  // -----------------------------------------------------------------------
  // Finance (Phase 2)
  // -----------------------------------------------------------------------

  getTeamFinances(teamId: string) {
    const s = requireState();
    const payrollInfo = calculateTeamPayroll(teamId, getTeamPlayers(teamId));
    const budget = getTeamBudget(teamId);
    const luxuryTax = calculateLuxuryTax(payrollInfo.totalPayroll);
    return { payroll: payrollInfo.totalPayroll, budget, luxuryTax,
      capSpace: budget - payrollInfo.totalPayroll };
  },
};

export type WorkerApi = typeof api;
Comlink.expose(api);
