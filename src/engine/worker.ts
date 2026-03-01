/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import type { Player } from '../types/player';
import type { Team } from '../types/team';
import type {
  LeagueState, SeasonResult, StandingsData, RosterData,
  LeaderboardEntry, PlayerProfileData, RosterPlayer, StandingsRow,
  LeaderboardFullEntry, LeaderboardFullOptions,
} from '../types/league';
import type { ScheduleEntry } from '../types/game';
import type { RosterStatus } from '../types/player';
import { createPRNG, serializeState, deserializeState } from './math/prng';
import { generateLeaguePlayers } from './player/generation';
import { buildInitialTeams } from '../data/teams';
import { generateScheduleTemplate as generateSchedule } from '../data/scheduleTemplate';
import { simulateSeason, advanceServiceTime, resetSeasonCounters } from './sim/seasonSimulator';
import { pythagenpatWinPct } from './math/bayesian';
import { toScoutingScale } from './player/attributes';
import { advanceOffseason } from './player/development';
import { computeAwards, computeDivisionChampions } from './player/awards';
import { simulateFullPlayoffs, type PlayoffBracket } from './sim/playoffSimulator';
import {
  promotePlayer as doPromote, demotePlayer as doDemote,
  dfaPlayer as doDFA, releasePlayer as doRelease,
  countActive, count40Man,
  type TransactionResult,
} from './rosterActions';
import {
  generateFreeAgentClass, signFreeAgent as doSign,
  processAISignings, projectSalary, projectYears,
} from './freeAgency';
import {
  generateTradeOffers, executeTrade as doTrade,
  evaluateProposedTrade, evaluatePlayer,
  type TradeProposal, type TradeResult, type TradePlayerInfo,
} from './trading';
// ─── Worker-side state ────────────────────────────────────────────────────────
// The worker owns the canonical game state. The UI queries for what it needs.

let _state: LeagueState | null = null;
let _playerMap = new Map<number, Player>();
let _teamMap = new Map<number, Team>();
let _playerSeasonStats = new Map<number, import('../types/player').PlayerSeasonStats>();
let _seasonResults: SeasonResult[] = [];

// ─── Internal helpers ─────────────────────────────────────────────────────────

function requireState(): LeagueState {
  if (!_state) throw new Error('No game loaded. Call newGame() first.');
  return _state;
}

function rebuildMaps(): void {
  if (!_state) return;
  _playerMap = new Map(_state.players.map(p => [p.playerId, p]));
  _teamMap   = new Map(_state.teams.map(t => [t.teamId, t]));
}


function playerToRosterPlayer(p: Player, stats: import('../types/player').PlayerSeasonStats | undefined): RosterPlayer {
  const s = stats;
  const ip = s ? s.outs / 3 : 0;
  const era = (s && s.outs > 0) ? (s.er / s.outs) * 27 : 0;
  const whip = (s && s.outs > 0) ? ((s.bba + s.ha) / (s.outs / 3)) : 0;
  const k9 = (s && s.outs > 0) ? (s.ka / (s.outs / 3)) * 9 : 0;
  const bb9 = (s && s.outs > 0) ? (s.bba / (s.outs / 3)) * 9 : 0;
  const avg = (s && s.ab > 0) ? s.h / s.ab : 0;
  const obp = (s && (s.pa > 0)) ? (s.h + s.bb + s.hbp) / s.pa : 0;
  const slg = (s && s.ab > 0) ? (s.h - s.doubles - s.triples - s.hr + s.doubles * 2 + s.triples * 3 + s.hr * 4) / s.ab : 0;

  return {
    playerId: p.playerId,
    name: p.name,
    position: p.position,
    age: p.age,
    bats: p.bats,
    throws: p.throws,
    isPitcher: p.isPitcher,
    overall: p.overall,
    potential: p.potential,
    rosterStatus: p.rosterData.rosterStatus,
    isOn40Man: p.rosterData.isOn40Man,
    optionYearsRemaining: p.rosterData.optionYearsRemaining,
    serviceTimeDays: p.rosterData.serviceTimeDays,
    salary: p.rosterData.salary,
    contractYearsRemaining: p.rosterData.contractYearsRemaining,
    stats: p.isPitcher
      ? { w: s?.w, l: s?.l, sv: s?.sv, era: Number(era.toFixed(2)), ip: Number(ip.toFixed(1)), k9: Number(k9.toFixed(1)), bb9: Number(bb9.toFixed(1)), whip: Number(whip.toFixed(2)) }
      : { pa: s?.pa, avg: Number(avg.toFixed(3)), obp: Number(obp.toFixed(3)), slg: Number(slg.toFixed(3)), hr: s?.hr, rbi: s?.rbi, sb: s?.sb, k: s?.k, bb: s?.bb },
  };
}

// ─── Public API (Comlink-exposed) ─────────────────────────────────────────────
const api = {

  // ── New game ───────────────────────────────────────────────────────────────
  async newGame(seed: number, userTeamId: number): Promise<{ ok: boolean; season: number; teamCount: number }> {
    const gen = createPRNG(seed);
    const teams = buildInitialTeams();
    const [players, nextGen] = generateLeaguePlayers(gen, teams, 2026);
    const schedule: ScheduleEntry[] = generateSchedule();

    _state = {
      season: 2026,
      teams,
      players,
      schedule,
      environment: { pitcherBuffFactor: 1.0, hitterBuffFactor: 1.0, babipAdjustment: 0 },
      prngState: serializeState(nextGen),
      userTeamId,
    };
    _playerSeasonStats = new Map();
    _seasonResults = [];
    rebuildMaps();

    return { ok: true, season: _state.season, teamCount: teams.length };
  },

  // ── Simulate a season ─────────────────────────────────────────────────────
  async simulateSeason(onProgressCallback?: (pct: number) => void): Promise<SeasonResult> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    // Reset counters at season start
    resetSeasonCounters(state.players);

    const result = await simulateSeason(
      state.teams,
      state.players,
      state.schedule,
      Number(gen.next()[0]),
      onProgressCallback,
    );

    // Advance the gen
    [, gen] = gen.next();

    // Update team records from result
    for (const ts of result.teamSeasons) {
      const team = _teamMap.get(ts.teamId);
      if (team) {
        team.seasonRecord = ts.record;
      }
    }

    // Store player season stats for queries
    for (const ps of result.playerSeasons) {
      _playerSeasonStats.set(ps.playerId, ps);
    }

    // ── Awards (computed before aging — players are at their in-season state) ──
    const awards = computeAwards(state.players, _playerSeasonStats, state.teams);
    const divisionChampions = computeDivisionChampions(state.teams);

    // ── Advance service time (172 game-days) ──────────────────────────────────
    for (let d = 0; d < 172; d++) {
      advanceServiceTime(state.players, d);
    }

    // ── Offseason: player development + aging ─────────────────────────────────
    const offseasonResult = advanceOffseason(state.players, gen);
    state.players = offseasonResult.players;
    gen = offseasonResult.gen;

    // Rebuild the player map after development (ages/attrs changed)
    rebuildMaps();

    state.prngState = serializeState(gen);
    _seasonResults.push(result);
    state.season++;

    // Augment the result with post-season data
    const fullResult: SeasonResult = {
      ...result,
      awards,
      divisionChampions,
      developmentEvents: offseasonResult.events,
    };

    return fullResult;
  },

  // ── Standings ──────────────────────────────────────────────────────────────
  async getStandings(): Promise<StandingsData> {
    const state = requireState();
    const rows: StandingsRow[] = state.teams.map(team => {
      const { wins, losses, runsScored, runsAllowed } = team.seasonRecord;
      const total = wins + losses;
      const pct = total > 0 ? wins / total : 0;
      const pythagWins = Math.round(pythagenpatWinPct(runsScored, runsAllowed) * (total || 162));

      return {
        teamId: team.teamId,
        name: team.name,
        abbreviation: team.abbreviation,
        league: team.league,
        division: team.division,
        wins,
        losses,
        pct: Number(pct.toFixed(3)),
        gb: 0, // computed client-side per division
        runsScored,
        runsAllowed,
        pythagWins,
      };
    });

    return { season: state.season, standings: rows };
  },

  // ── Roster ─────────────────────────────────────────────────────────────────
  async getRoster(teamId: number): Promise<RosterData> {
    const state = requireState();
    const teamPlayers = state.players.filter(p => p.teamId === teamId);

    const toRP = (p: Player) => playerToRosterPlayer(p, _playerSeasonStats.get(p.playerId));

    return {
      teamId,
      season: state.season,
      active:  teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE').map(toRP),
      il:      teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60').map(toRP),
      minors:  teamPlayers.filter(p => ['MINORS_AAA', 'MINORS_AA', 'MINORS_ROOKIE'].includes(p.rosterData.rosterStatus) && p.rosterData.isOn40Man).map(toRP),
      dfa:     teamPlayers.filter(p => p.rosterData.rosterStatus === 'DFA').map(toRP),
    };
  },

  // ── Full Leaderboard (multi-stat) ────────────────────────────────────────
  async getLeaderboardFull(options: LeaderboardFullOptions): Promise<LeaderboardFullEntry[]> {
    requireState();
    const { category, sortBy, minPA = 100, minIP = 20, position, limit = 50 } = options;
    const entries: Array<{ player: Player; stats: Record<string, number>; sortVal: number }> = [];

    for (const [playerId, s] of _playerSeasonStats) {
      const player = _playerMap.get(playerId);
      if (!player) continue;

      // Category filter
      if (category === 'hitting' && player.isPitcher) continue;
      if (category === 'pitching' && !player.isPitcher) continue;

      // Position filter
      if (position && player.position !== position) continue;

      // Min threshold
      if (category === 'hitting' && s.pa < minPA) continue;
      if (category === 'pitching' && (s.outs / 3) < minIP) continue;

      let computed: Record<string, number>;

      if (category === 'hitting') {
        const avg = s.ab > 0 ? s.h / s.ab : 0;
        const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
        const tb = s.h + s.doubles + s.triples * 2 + s.hr * 3;
        const slg = s.ab > 0 ? tb / s.ab : 0;
        const ops = obp + slg;
        computed = {
          g: s.g, pa: s.pa, ab: s.ab, r: s.r, h: s.h,
          '2b': s.doubles, '3b': s.triples, hr: s.hr, rbi: s.rbi,
          bb: s.bb, k: s.k, sb: s.sb,
          avg: Number(avg.toFixed(3)), obp: Number(obp.toFixed(3)),
          slg: Number(slg.toFixed(3)), ops: Number(ops.toFixed(3)),
        };
      } else {
        const ip = s.outs / 3;
        const era = ip > 0 ? (s.er / ip) * 9 : 0;
        const whip = ip > 0 ? (s.bba + s.ha) / ip : 0;
        const k9 = ip > 0 ? (s.ka / ip) * 9 : 0;
        const bb9 = ip > 0 ? (s.bba / ip) * 9 : 0;
        computed = {
          g: s.gp, gs: s.gs, w: s.w, l: s.l, sv: s.sv,
          ip: Number(ip.toFixed(1)), h: s.ha, er: s.er, bb: s.bba, k: s.ka,
          era: Number(era.toFixed(2)), whip: Number(whip.toFixed(2)),
          k9: Number(k9.toFixed(1)), bb9: Number(bb9.toFixed(1)), hra: s.hra,
        };
      }

      // Determine sort value
      const INVERT = new Set(['era', 'whip', 'bb9']);
      const raw = computed[sortBy] ?? 0;
      const sortVal = INVERT.has(sortBy) ? -raw : raw;

      entries.push({ player, stats: computed, sortVal });
    }

    entries.sort((a, b) => b.sortVal - a.sortVal);
    return entries.slice(0, limit).map((e, i) => {
      const team = _teamMap.get(e.player.teamId);
      return {
        rank: i + 1,
        playerId: e.player.playerId,
        name: e.player.name,
        teamAbbr: team?.abbreviation ?? '---',
        teamId: e.player.teamId,
        position: e.player.position,
        age: e.player.age,
        isPitcher: e.player.isPitcher,
        stats: e.stats,
      };
    });
  },

  // ── Leaderboard (single-stat, legacy) ─────────────────────────────────────
  async getLeaderboard(stat: string, limit = 50): Promise<LeaderboardEntry[]> {
    requireState();
    const results: Array<{ player: Player; value: number }> = [];

    for (const [playerId, s] of _playerSeasonStats) {
      const player = _playerMap.get(playerId);
      if (!player) continue;

      let value = 0;
      switch (stat) {
        case 'hr':   value = s.hr; break;
        case 'rbi':  value = s.rbi; break;
        case 'avg':  value = s.ab > 100 ? s.h / s.ab : 0; break;
        case 'obp':  value = s.pa > 100 ? (s.h + s.bb + s.hbp) / s.pa : 0; break;
        case 'sb':   value = s.sb; break;
        case 'era':  value = s.outs > 10 ? -((s.er / s.outs) * 27) : -99; break; // negative for sorting
        case 'k':    value = s.ka; break;
        case 'wins': value = s.w; break;
        case 'whip': value = s.outs > 10 ? -((s.bba + s.ha) / (s.outs / 3)) : -99; break;
        default:     value = 0;
      }
      if (value !== 0 || stat === 'avg') results.push({ player, value });
    }

    results.sort((a, b) => b.value - a.value);
    const top = results.slice(0, limit);

    return top.map((r, i) => {
      const team = _teamMap.get(r.player.teamId);
      let displayValue = r.value.toFixed(stat === 'avg' || stat === 'obp' ? 3 : 0);
      if (stat === 'era' || stat === 'whip') displayValue = (-r.value).toFixed(2);
      return {
        rank: i + 1,
        playerId: r.player.playerId,
        name: r.player.name,
        teamAbbr: team?.abbreviation ?? '---',
        position: r.player.position,
        age: r.player.age,
        value: r.value,
        displayValue,
      };
    });
  },

  // ── Player profile ─────────────────────────────────────────────────────────
  async getPlayerProfile(playerId: number): Promise<PlayerProfileData> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    const s = _playerSeasonStats.get(playerId);
    const grades: Record<string, number> = {};

    if (player.hitterAttributes) {
      const h = player.hitterAttributes;
      grades['CON'] = toScoutingScale(h.contact);
      grades['PWR'] = toScoutingScale(h.power);
      grades['EYE'] = toScoutingScale(h.eye);
      grades['SPD'] = toScoutingScale(h.speed);
      grades['FLD'] = toScoutingScale(h.fielding);
      grades['ARM'] = toScoutingScale(h.armStrength);
    } else if (player.pitcherAttributes) {
      const p = player.pitcherAttributes;
      grades['STF'] = toScoutingScale(p.stuff);
      grades['MOV'] = toScoutingScale(p.movement);
      grades['CMD'] = toScoutingScale(p.command);
      grades['STM'] = toScoutingScale(p.stamina);
    }

    const seasonStats: null | { season: number; [key: string]: number } = s ? {
      season: state.season - 1,
      pa: s.pa, ab: s.ab, h: s.h, hr: s.hr, rbi: s.rbi, bb: s.bb, k: s.k, sb: s.sb,
      avg: s.ab > 0 ? Number((s.h / s.ab).toFixed(3)) : 0,
      obp: s.pa > 0 ? Number(((s.h + s.bb + s.hbp) / s.pa).toFixed(3)) : 0,
      w: s.w, l: s.l, sv: s.sv, era: s.outs > 0 ? Number(((s.er / s.outs) * 27).toFixed(2)) : 0,
      ip: Number((s.outs / 3).toFixed(1)), ka: s.ka, bba: s.bba,
    } : null;

    return {
      player: {
        playerId: player.playerId,
        name: player.name,
        age: player.age,
        position: player.position,
        bats: player.bats,
        throws: player.throws,
        overall: player.overall,
        potential: player.potential,
        grades,
        rosterStatus: player.rosterData.rosterStatus,
        serviceTimeDays: player.rosterData.serviceTimeDays,
        salary: player.rosterData.salary,
        contractYearsRemaining: player.rosterData.contractYearsRemaining,
      },
      seasonStats,
      careerStats: { seasons: 1, ...(seasonStats ?? {}) },
    };
  },

  // ── Roster Transactions ──────────────────────────────────────────────────
  async promotePlayer(playerId: number, targetStatus: RosterStatus): Promise<TransactionResult> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = doPromote(player, targetStatus, state.players);
    if (result.ok) rebuildMaps();
    return result;
  },

  async demotePlayer(playerId: number, targetStatus: RosterStatus): Promise<TransactionResult> {
    requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = doDemote(player, targetStatus);
    if (result.ok) rebuildMaps();
    return result;
  },

  async dfaPlayer(playerId: number): Promise<TransactionResult> {
    requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = doDFA(player);
    if (result.ok) rebuildMaps();
    return result;
  },

  async releasePlayer(playerId: number): Promise<TransactionResult> {
    requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = doRelease(player);
    if (result.ok) rebuildMaps();
    return result;
  },

  // ── Extended roster (all minor league levels) ───────────────────────────
  async getFullRoster(teamId: number): Promise<RosterData & {
    aaa: RosterPlayer[]; aa: RosterPlayer[]; aPlus: RosterPlayer[];
    aMinus: RosterPlayer[]; rookie: RosterPlayer[]; intl: RosterPlayer[];
    fortyManCount: number; activeCount: number;
  }> {
    const state = requireState();
    const teamPlayers = state.players.filter(p => p.teamId === teamId);
    const toRP = (p: Player) => playerToRosterPlayer(p, _playerSeasonStats.get(p.playerId));

    return {
      teamId,
      season: state.season,
      active:  teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE').map(toRP),
      il:      teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60').map(toRP),
      minors:  teamPlayers.filter(p => p.rosterData.rosterStatus.startsWith('MINORS_') && p.rosterData.isOn40Man).map(toRP),
      dfa:     teamPlayers.filter(p => p.rosterData.rosterStatus === 'DFA').map(toRP),
      aaa:     teamPlayers.filter(p => p.rosterData.rosterStatus === 'MINORS_AAA').map(toRP),
      aa:      teamPlayers.filter(p => p.rosterData.rosterStatus === 'MINORS_AA').map(toRP),
      aPlus:   teamPlayers.filter(p => p.rosterData.rosterStatus === 'MINORS_APLUS').map(toRP),
      aMinus:  teamPlayers.filter(p => p.rosterData.rosterStatus === 'MINORS_AMINUS').map(toRP),
      rookie:  teamPlayers.filter(p => p.rosterData.rosterStatus === 'MINORS_ROOKIE').map(toRP),
      intl:    teamPlayers.filter(p => p.rosterData.rosterStatus === 'MINORS_INTL').map(toRP),
      fortyManCount: count40Man(state.players, teamId),
      activeCount:   countActive(state.players, teamId),
    };
  },

  // ── Playoffs ─────────────────────────────────────────────────────────────
  async simulatePlayoffs(): Promise<PlayoffBracket | null> {
    const state = requireState();
    // Get current standings
    const standingsRows = state.teams.map(team => {
      const { wins, losses, runsScored, runsAllowed } = team.seasonRecord;
      return {
        teamId: team.teamId,
        name: team.name,
        abbreviation: team.abbreviation,
        league: team.league,
        division: team.division,
        wins, losses,
        pct: (wins + losses) > 0 ? wins / (wins + losses) : 0,
        gb: 0,
        runsScored, runsAllowed,
        pythagWins: wins,
      };
    });

    if (standingsRows.length < 12) return null;

    const seed = Number(deserializeState(state.prngState).next()[0]);
    const bracket = simulateFullPlayoffs(standingsRows, state.teams, state.players, seed);
    return bracket;
  },

  // ── Free Agency ────────────────────────────────────────────────────────────
  async startOffseason(): Promise<{ freeAgentCount: number }> {
    const state = requireState();
    const count = generateFreeAgentClass(state.players);
    rebuildMaps();
    return { freeAgentCount: count };
  },

  async getFreeAgents(limit = 50): Promise<(RosterPlayer & { projectedSalary: number; projectedYears: number })[]> {
    const state = requireState();
    const fas = state.players
      .filter(p => p.rosterData.rosterStatus === 'FREE_AGENT')
      .sort((a, b) => b.overall - a.overall)
      .slice(0, limit);

    return fas.map(p => {
      const rp = playerToRosterPlayer(p, _playerSeasonStats.get(p.playerId));
      return {
        ...rp,
        projectedSalary: projectSalary(p),
        projectedYears:  projectYears(p),
      };
    });
  },

  async signFreeAgent(playerId: number, years: number, salary: number): Promise<TransactionResult> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = doSign(player, state.userTeamId, years, salary, state.players);
    if (result.ok) rebuildMaps();
    return result;
  },

  async finishOffseason(): Promise<{ aiSignings: number }> {
    const state = requireState();
    const aiSignings = processAISignings(state.players, state.teams, state.userTeamId);
    rebuildMaps();
    return { aiSignings };
  },

  // ── Trading ──────────────────────────────────────────────────────────────
  async getTradeOffers(): Promise<TradeProposal[]> {
    const state = requireState();
    return generateTradeOffers(state.userTeamId, state.players, state.teams);
  },

  async getTeamPlayers(teamId: number): Promise<TradePlayerInfo[]> {
    const state = requireState();
    return state.players
      .filter(p => p.teamId === teamId &&
        (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_')) &&
        p.overall >= 150)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 30)
      .map(p => ({
        playerId: p.playerId,
        name: p.name,
        position: p.position,
        age: p.age,
        overall: p.overall,
        potential: p.potential,
        salary: p.rosterData.salary,
        contractYearsRemaining: p.rosterData.contractYearsRemaining,
        tradeValue: evaluatePlayer(p),
      }));
  },

  async proposeTrade(
    partnerTeamId: number,
    userPlayerIds: number[],
    partnerPlayerIds: number[],
  ): Promise<TradeResult & { fair?: boolean }> {
    const state = requireState();
    const evaluation = evaluateProposedTrade(state.players, userPlayerIds, partnerPlayerIds);
    if (!evaluation.fair) {
      return { ok: false, error: 'Trade rejected — the other team wants more value in return.' };
    }
    const result = doTrade(state.players, state.userTeamId, partnerTeamId, userPlayerIds, partnerPlayerIds);
    if (result.ok) rebuildMaps();
    return { ...result, fair: true };
  },

  async acceptTradeOffer(
    partnerTeamId: number,
    userPlayerIds: number[],
    partnerPlayerIds: number[],
  ): Promise<TradeResult> {
    const state = requireState();
    const result = doTrade(state.players, state.userTeamId, partnerTeamId, userPlayerIds, partnerPlayerIds);
    if (result.ok) rebuildMaps();
    return result;
  },

  // ── League / Team Info ───────────────────────────────────────────────────
  async getLeagueTeams(): Promise<Array<{
    teamId: number; name: string; abbreviation: string;
    league: string; division: string; budget: number;
    wins: number; losses: number;
  }>> {
    const state = requireState();
    return state.teams.map(t => ({
      teamId: t.teamId,
      name: t.name,
      abbreviation: t.abbreviation,
      league: t.league,
      division: t.division,
      budget: t.budget,
      wins: t.seasonRecord.wins,
      losses: t.seasonRecord.losses,
    }));
  },

  // ── Save / Load ────────────────────────────────────────────────────────────
  async getFullState(): Promise<LeagueState | null> {
    return _state;
  },

  async loadState(state: LeagueState): Promise<void> {
    _state = state;
    _playerSeasonStats = new Map();
    rebuildMaps();
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  async ping(): Promise<string> {
    return 'pong';
  },
};

export type WorkerAPI = typeof api;
Comlink.expose(api);
