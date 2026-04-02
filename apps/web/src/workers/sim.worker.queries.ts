import {
  calculateLuxuryTax,
  calculateTeamPayroll,
  createFreeAgencyMarket,
  describeInjury,
  evaluatePlayerTradeValue,
  generateAITradeOffers,
  getTeamBudget,
  getTeamById,
  getTopFreeAgents,
  getUnreadNews,
  scoutPlayer,
} from '@mbd/sim-core';
import type {
  FreeAgent,
  GeneratedPlayer,
  PlayerGameStats,
  PlayerTradeValue,
  PlayoffBracket,
  RosterState,
  StandingsEntry,
} from '@mbd/sim-core';
import { calculateAwardRaces } from '../../../../packages/sim-core/src/league/awards';
import {
  buildSeasonFlowStateView,
  buildDraftRoomView,
  buildOffseasonStateView,
  getTeamPlayers,
  requireState,
  state,
  timestamp,
  toPlayerDTO,
} from './sim.worker.helpers.js';
import type { PlayerDTO, TeamStandingsDTO } from './sim.worker.helpers.js';
import { buildPressRoomFeed } from './sim.worker.pressRoom.js';
import {
  getAwardHistory,
  getPersonalityProfileForPlayer,
  getRivalriesForTeam,
  getSeasonHistory,
  resolveHistoryDisplayNames as resolveNarrativeHistoryDisplayNames,
} from './sim.worker.narrative.js';
import {
  buildTradeHistoryView,
  buildTradeOffersView,
} from './sim.worker.trade.js';

export const queryApi = {
  getState() {
    if (!state) {
      return null;
    }
    return {
      season: state.season,
      day: state.day,
      phase: state.phase,
      userTeamId: state.userTeamId,
      playerCount: state.players.length,
    };
  },

  getStandings(): { divisions: Record<string, TeamStandingsDTO[]> } | null {
    if (!state) {
      return null;
    }

    const fullStandings = state.seasonState.standings.getFullStandings();
    const divisions: Record<string, TeamStandingsDTO[]> = {};
    for (const [division, entries] of Object.entries(fullStandings)) {
      divisions[division] = entries.map((entry: StandingsEntry) => {
        const team = getTeamById(entry.teamId);
        return {
          teamId: entry.teamId,
          teamName: team?.name ?? entry.teamId,
          city: team?.city ?? '',
          abbreviation: team?.abbreviation ?? '',
          division,
          wins: entry.wins,
          losses: entry.losses,
          pct: entry.pct.toFixed(3).replace(/^0/, ''),
          gamesBack: entry.gamesBack,
          streak: entry.streak,
          runDifferential: entry.runDifferential,
        };
      });
    }
    return { divisions };
  },

  getTeamRoster(teamId: string): PlayerDTO[] {
    if (!state) {
      return [];
    }

    return state.players
      .filter((player) => player.teamId === teamId && player.rosterStatus === 'MLB')
      .sort((left, right) => right.overallRating - left.overallRating)
      .map((player) => toPlayerDTO(player));
  },

  getFullRoster(teamId: string): { mlb: PlayerDTO[]; minors: Record<string, PlayerDTO[]> } {
    if (!state) {
      return { mlb: [], minors: {} };
    }

    const teamPlayers = state.players.filter((player) => player.teamId === teamId);
    const mlb = teamPlayers
      .filter((player) => player.rosterStatus === 'MLB')
      .sort((left, right) => right.overallRating - left.overallRating)
      .map((player) => toPlayerDTO(player));

    const minors: Record<string, PlayerDTO[]> = {};
    for (const level of ['AAA', 'AA', 'A_PLUS', 'A', 'ROOKIE', 'INTERNATIONAL']) {
      minors[level] = teamPlayers
        .filter((player) => player.rosterStatus === level)
        .sort((left, right) => right.overallRating - left.overallRating)
        .map((player) => toPlayerDTO(player));
    }
    return { mlb, minors };
  },

  getPlayer(playerId: string): PlayerDTO | null {
    if (!state) {
      return null;
    }

    const player = state.players.find((candidate) => candidate.id === playerId);
    return player ? toPlayerDTO(player) : null;
  },

  getLeagueLeaders(stat: string, limit: number = 20): PlayerDTO[] {
    const s = state;
    if (!s) {
      return [];
    }

    const withStats = s.players
      .filter((player) => player.rosterStatus === 'MLB')
      .map((player) => ({ player, stats: s.seasonState.playerSeasonStats.get(player.id) }))
      .filter((item): item is { player: GeneratedPlayer; stats: PlayerGameStats } =>
        item.stats != null && item.stats.pa > 0,
      );

    const sorted = [...withStats].sort((left, right) => {
      switch (stat) {
        case 'hr':
          return right.stats.hr - left.stats.hr;
        case 'rbi':
          return right.stats.rbi - left.stats.rbi;
        case 'hits':
          return right.stats.hits - left.stats.hits;
        case 'avg':
          return (right.stats.ab > 0 ? right.stats.hits / right.stats.ab : 0)
            - (left.stats.ab > 0 ? left.stats.hits / left.stats.ab : 0);
        case 'k':
          return right.stats.strikeouts - left.stats.strikeouts;
        case 'era':
          return (left.stats.ip > 0 ? (left.stats.earnedRuns / (left.stats.ip / 3)) * 9 : 99)
            - (right.stats.ip > 0 ? (right.stats.earnedRuns / (right.stats.ip / 3)) * 9 : 99);
        default:
          return right.stats.hr - left.stats.hr;
      }
    });

    return sorted.slice(0, limit).map((item) => toPlayerDTO(item.player, item.stats));
  },

  getPlayoffBracket(): PlayoffBracket | null {
    return state?.playoffBracket ?? null;
  },

  getSeasonFlowState() {
    return buildSeasonFlowStateView(requireState());
  },

  getUserTeamId(): string {
    return state?.userTeamId ?? 'nyy';
  },

  searchPlayers(query: string, limit: number = 20): PlayerDTO[] {
    if (!state || !query) {
      return [];
    }

    const normalized = query.toLowerCase();
    return state.players
      .filter((player) =>
        player.firstName.toLowerCase().includes(normalized)
        || player.lastName.toLowerCase().includes(normalized)
        || `${player.firstName} ${player.lastName}`.toLowerCase().includes(normalized),
      )
      .slice(0, limit)
      .map((player) => toPlayerDTO(player));
  },

  getInjuries(teamId: string) {
    const s = requireState();
    const results: { playerId: string; playerName: string; injury: string; daysRemaining: number }[] = [];

    for (const [playerId, injury] of s.injuries) {
      const player = s.players.find((candidate) => candidate.id === playerId);
      if (player && player.teamId === teamId) {
        results.push({
          playerId,
          playerName: `${player.firstName} ${player.lastName}`,
          injury: describeInjury(injury),
          daysRemaining: injury.daysRemaining,
        });
      }
    }

    return results;
  },

  scoutPlayerReport(playerId: string) {
    const s = requireState();
    const player = s.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return null;
    }

    const staff = s.scoutingStaffs.get(s.userTeamId);
    if (!staff || staff.length === 0) {
      return null;
    }

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

  getScoutingStaff() {
    const s = requireState();
    return s.scoutingStaffs.get(s.userTeamId) ?? [];
  },

  getDraftClass() {
    return buildDraftRoomView(requireState());
  },

  getPlayerTradeValue(playerId: string): PlayerTradeValue | null {
    const player = requireState().players.find((candidate) => candidate.id === playerId);
    return player ? evaluatePlayerTradeValue(player) : null;
  },

  getTradeOffers() {
    return buildTradeOffersView(requireState());
  },

  getTradeHistory() {
    return buildTradeHistoryView(requireState());
  },

  getRosterState(teamId: string): RosterState | null {
    return requireState().rosterStates.get(teamId) ?? null;
  },

  getFreeAgents(limit: number = 25): FreeAgent[] {
    const s = requireState();
    if (!s.freeAgencyMarket) {
      s.freeAgencyMarket = createFreeAgencyMarket(s.season, s.players);
    }
    return getTopFreeAgents(s.freeAgencyMarket, undefined, limit);
  },

  getOffseasonState() {
    return buildOffseasonStateView(requireState());
  },

  getNews(limit: number = 50) {
    return getUnreadNews(requireState().news).slice(0, limit);
  },

  getBriefing(limit: number = 5) {
    return requireState().briefingQueue.slice(0, limit);
  },

  getPressRoomFeed(limit: number = 100) {
    return buildPressRoomFeed(requireState(), limit);
  },

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
      .sort((left, right) => right.intensity - left.intensity);
  },

  getAwardHistory() {
    return getAwardHistory(requireState());
  },

  getSeasonHistory() {
    return getSeasonHistory(requireState());
  },

  resolveHistoryDisplayNames(playerIds: string[], teamIds: string[]) {
    return resolveNarrativeHistoryDisplayNames(requireState(), playerIds, teamIds);
  },

  getTeamFinances(teamId: string) {
    const payroll = calculateTeamPayroll(teamId, getTeamPlayers(teamId)).totalPayroll;
    const budget = getTeamBudget(teamId);
    const luxuryTax = calculateLuxuryTax(payroll);
    return {
      payroll,
      budget,
      luxuryTax,
      capSpace: budget - payroll,
    };
  },
};
