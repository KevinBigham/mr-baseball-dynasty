/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import type { Player } from '../types/player';
import type { Team } from '../types/team';
import type {
  LeagueState, SeasonResult, StandingsData, RosterData,
  LeaderboardEntry, PlayerProfileData, RosterPlayer, StandingsRow,
} from '../types/league';
import type { ScheduleEntry } from '../types/game';
import { createPRNG, serializeState, deserializeState } from './math/prng';
import { generateLeaguePlayers } from './player/generation';
import { buildInitialTeams } from '../data/teams';
import { generateScheduleTemplate as generateSchedule } from '../data/scheduleTemplate';
import { simulateSeason, advanceServiceTime, resetSeasonCounters } from './sim/seasonSimulator';
import { pythagenpatWinPct } from './math/bayesian';
import { toScoutingScale } from './player/attributes';
import { advanceOffseason } from './player/development';
import { computeAwards, computeDivisionChampions } from './player/awards';
import { simulatePlayoffs, getPlayoffResults } from './sim/playoffs';
import { calculatePlayerValue } from './trade/valuation';
import { evaluateTrade, executeTrade, getTradeablePlayers, type TradeProposal, type TradeEvaluation, type TradeRecord } from './trade/tradeEngine';
import { identifyFreeAgents, signFreeAgent as signFA, runAIFreeAgency, type FreeAgent, type FreeAgencyResult } from './offseason/freeAgency';
import type { TradeablePlayer, LineupData } from '../types/trade';
import { generateDraftClass, buildDraftOrder, aiSelectPick, executeDraftPick, type DraftProspect, type DraftState } from './draft/draftEngine';
import { generateLeagueProspectRankings, generateOrgProspectRankings, type ProspectReport } from './scouting/prospectRankings';
import { computeTeamFinancials, computePayroll, type TeamFinancials, type FinancialHistory } from './finance/financeEngine';
import { recordSeasonStats, evaluateHOFCandidates, getAllTimeLeaders, getCareerRecords, getFranchiseRecords, type CareerStat, type AllTimeLeader, type HOFCandidate, type FranchiseRecord, type CareerRecord } from './history/careerStats';
// ─── Worker-side state ────────────────────────────────────────────────────────
// The worker owns the canonical game state. The UI queries for what it needs.

let _state: LeagueState | null = null;
let _playerMap = new Map<number, Player>();
let _teamMap = new Map<number, Team>();
let _playerSeasonStats = new Map<number, import('../types/player').PlayerSeasonStats>();
let _seasonResults: SeasonResult[] = [];
let _tradeHistory: TradeRecord[] = [];
let _lineups = new Map<number, LineupData>();
let _draftState: DraftState | null = null;
let _financialHistory = new Map<number, FinancialHistory[]>();  // teamId → history
let _teamCash = new Map<number, number>();       // teamId → accumulated cash
let _luxuryTaxYears = new Map<number, number>(); // teamId → consecutive years over CBT

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

    // ── Playoffs ────────────────────────────────────────────────────────────────
    // Build standings from team records to determine playoff field
    const standingsRows = state.teams.map(team => ({
      teamId: team.teamId,
      name: team.name,
      abbreviation: team.abbreviation,
      league: team.league,
      division: team.division,
      wins: team.seasonRecord.wins,
      losses: team.seasonRecord.losses,
      pct: team.seasonRecord.wins / Math.max(1, team.seasonRecord.wins + team.seasonRecord.losses),
      gb: 0,
      runsScored: team.seasonRecord.runsScored,
      runsAllowed: team.seasonRecord.runsAllowed,
      pythagWins: 0,
    }));

    let playoffSeed: number;
    [playoffSeed, gen] = gen.next();
    const playoffBracket = simulatePlayoffs(
      standingsRows, state.teams, state.players,
      state.season, (playoffSeed >>> 0),
    );

    // Apply playoff results to team season stats
    const playoffResultMap = getPlayoffResults(playoffBracket);
    for (const ts of result.teamSeasons) {
      const pr = playoffResultMap.get(ts.teamId);
      if (pr) {
        ts.playoffRound = pr;
      }
    }

    // ── Advance service time (172 game-days) ──────────────────────────────────
    for (let d = 0; d < 172; d++) {
      advanceServiceTime(state.players, d);
    }

    // ── Offseason: player development + aging ─────────────────────────────────
    const offseasonResult = advanceOffseason(state.players, gen);
    state.players = offseasonResult.players;
    gen = offseasonResult.gen;

    // ── AI free agency (AI teams sign available free agents) ───────────────────
    const faResult = runAIFreeAgency(state.players, state.teams, state.userTeamId);

    // Rebuild the player map after development + free agency (ages/attrs/teams changed)
    rebuildMaps();

    // Clear lineups and draft (rosters changed, new offseason)
    _lineups.clear();
    _draftState = null;

    // ── Record career stats ──────────────────────────────────────────────────
    const awardsList: Array<{ playerId: number; award: string }> = [];
    if (awards) {
      if (awards.mvpAL) awardsList.push({ playerId: awards.mvpAL.playerId, award: 'MVP (AL)' });
      if (awards.mvpNL) awardsList.push({ playerId: awards.mvpNL.playerId, award: 'MVP (NL)' });
      if (awards.cyYoungAL) awardsList.push({ playerId: awards.cyYoungAL.playerId, award: 'Cy Young (AL)' });
      if (awards.cyYoungNL) awardsList.push({ playerId: awards.cyYoungNL.playerId, award: 'Cy Young (NL)' });
      if (awards.royAL) awardsList.push({ playerId: awards.royAL.playerId, award: 'ROY (AL)' });
      if (awards.royNL) awardsList.push({ playerId: awards.royNL.playerId, award: 'ROY (NL)' });
    }
    recordSeasonStats(
      result.playerSeasons,
      state.players.map(p => ({ playerId: p.playerId, name: p.name, age: p.age, position: p.position, isPitcher: p.isPitcher })),
      state.teams.map(t => ({ teamId: t.teamId, name: t.name })),
      state.season,
      awardsList,
    );

    // ── Track financial history ──────────────────────────────────────────────
    for (const team of state.teams) {
      const prevCash = _teamCash.get(team.teamId) ?? 0;
      const luxYears = _luxuryTaxYears.get(team.teamId) ?? 0;
      const fin = computeTeamFinancials(team, state.players, state.season, prevCash, luxYears);
      _teamCash.set(team.teamId, fin.cashOnHand);
      _luxuryTaxYears.set(team.teamId, fin.luxuryTaxYears);

      const hist = _financialHistory.get(team.teamId) ?? [];
      hist.push({
        season: state.season,
        revenue: fin.totalRevenue,
        expenses: fin.totalExpenses,
        profit: fin.operatingIncome,
        payroll: fin.payroll,
        wins: team.seasonRecord.wins,
      });
      _financialHistory.set(team.teamId, hist);
    }

    state.prngState = serializeState(gen);
    _seasonResults.push(result);
    state.season++;

    // Augment the result with post-season data
    const fullResult: SeasonResult = {
      ...result,
      awards,
      divisionChampions,
      developmentEvents: offseasonResult.events,
      playoffBracket,
      freeAgencySignings: faResult.signings.length,
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

    const minorStatuses = ['MINORS_AAA', 'MINORS_AA', 'MINORS_APLUS', 'MINORS_AMINUS', 'MINORS_ROOKIE', 'MINORS_INTL'];

    return {
      teamId,
      season: state.season,
      active:  teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE').map(toRP),
      il:      teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60').map(toRP),
      minors:  teamPlayers.filter(p => minorStatuses.includes(p.rosterData.rosterStatus)).map(toRP),
      dfa:     teamPlayers.filter(p => p.rosterData.rosterStatus === 'DFA').map(toRP),
    };
  },

  // ── Leaderboard ────────────────────────────────────────────────────────────
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

  // ── Save / Load ────────────────────────────────────────────────────────────
  async getFullState(): Promise<LeagueState | null> {
    return _state;
  },

  async loadState(state: LeagueState): Promise<void> {
    _state = state;
    _playerSeasonStats = new Map();
    rebuildMaps();
  },

  // ── Roster Management ────────────────────────────────────────────────────
  async promotePlayer(playerId: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };

    const status = player.rosterData.rosterStatus;

    // Can only promote from minor league levels
    const promotionPath: Record<string, import('../types/player').RosterStatus> = {
      'MINORS_INTL':   'MINORS_ROOKIE',
      'MINORS_ROOKIE': 'MINORS_AMINUS',
      'MINORS_AMINUS': 'MINORS_APLUS',
      'MINORS_APLUS':  'MINORS_AA',
      'MINORS_AA':     'MINORS_AAA',
      'MINORS_AAA':    'MLB_ACTIVE',
    };

    const nextStatus = promotionPath[status];
    if (!nextStatus) return { ok: false, error: `Cannot promote from ${status}` };

    // Check 26-man roster limit for MLB promotion
    if (nextStatus === 'MLB_ACTIVE') {
      const activeCount = state.players.filter(
        p => p.teamId === player.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE',
      ).length;
      if (activeCount >= 26) return { ok: false, error: 'Active roster full (26 max). Demote or DFA someone first.' };

      // Auto-add to 40-man if not already
      if (!player.rosterData.isOn40Man) {
        const fortyManCount = state.players.filter(
          p => p.teamId === player.teamId && p.rosterData.isOn40Man,
        ).length;
        if (fortyManCount >= 40) return { ok: false, error: '40-man roster full. DFA someone first.' };
        player.rosterData.isOn40Man = true;
      }
    }

    player.rosterData.rosterStatus = nextStatus;
    return { ok: true };
  },

  async demotePlayer(playerId: number): Promise<{ ok: boolean; error?: string }> {
    requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };

    const status = player.rosterData.rosterStatus;

    // Can only demote from MLB or upper minors
    const demotionPath: Record<string, import('../types/player').RosterStatus> = {
      'MLB_ACTIVE':    'MINORS_AAA',
      'MINORS_AAA':    'MINORS_AA',
      'MINORS_AA':     'MINORS_APLUS',
      'MINORS_APLUS':  'MINORS_AMINUS',
      'MINORS_AMINUS': 'MINORS_ROOKIE',
    };

    const nextStatus = demotionPath[status];
    if (!nextStatus) return { ok: false, error: `Cannot demote from ${status}` };

    // Check option requirements for MLB demotions
    if (status === 'MLB_ACTIVE') {
      if (player.rosterData.optionYearsRemaining <= 0 && player.rosterData.serviceTimeDays >= 516) {
        return { ok: false, error: 'No options remaining — must DFA or trade to remove from 26-man.' };
      }
      if (player.rosterData.optionYearsRemaining > 0) {
        player.rosterData.optionUsedThisSeason = true;
        player.rosterData.optionYearsRemaining--;
      }
    }

    player.rosterData.rosterStatus = nextStatus;
    return { ok: true };
  },

  async dfaPlayer(playerId: number): Promise<{ ok: boolean; error?: string }> {
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };

    const status = player.rosterData.rosterStatus;
    if (status === 'DFA' || status === 'FREE_AGENT' || status === 'RETIRED') {
      return { ok: false, error: `Cannot DFA from ${status}` };
    }

    player.rosterData.rosterStatus = 'DFA';
    player.rosterData.isOn40Man = false;
    return { ok: true };
  },

  // ── Trade System ─────────────────────────────────────────────────────────
  async getTradeablePlayers(teamId: number): Promise<TradeablePlayer[]> {
    const state = requireState();
    const tradeable = getTradeablePlayers(state.players, teamId);
    return tradeable.map(p => ({
      playerId:    p.playerId,
      name:        p.name,
      position:    p.position,
      age:         p.age,
      overall:     p.overall,
      potential:   p.potential,
      tradeValue:  calculatePlayerValue(p),
      salary:      p.rosterData.salary,
      contractYrs: p.rosterData.contractYearsRemaining,
      rosterStatus: p.rosterData.rosterStatus,
      isPitcher:   p.isPitcher,
    })).sort((a, b) => b.tradeValue - a.tradeValue);
  },

  async evaluateTrade(proposal: TradeProposal): Promise<TradeEvaluation> {
    const state = requireState();
    return evaluateTrade(proposal, state.teams, state.players);
  },

  async executeTrade(proposal: TradeProposal): Promise<TradeRecord> {
    const state = requireState();
    const record = executeTrade(proposal, state.players, state.season);
    _tradeHistory.push(record);
    rebuildMaps();
    return record;
  },

  async getTradeHistory(): Promise<TradeRecord[]> {
    return _tradeHistory;
  },

  // ── Free Agency ─────────────────────────────────────────────────────────
  async getFreeAgents(): Promise<FreeAgent[]> {
    const state = requireState();
    return identifyFreeAgents(state.players);
  },

  async signFreeAgent(playerId: number, salary: number, years: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };

    // Verify they're actually a free agent
    if (player.rosterData.rosterStatus !== 'FREE_AGENT' &&
        !(player.rosterData.contractYearsRemaining <= 0 && player.rosterData.serviceTimeDays >= 172 * 6)) {
      return { ok: false, error: 'Player is not a free agent.' };
    }

    // Check 40-man limit
    const fortyManCount = state.players.filter(
      p => p.teamId === state.userTeamId && p.rosterData.isOn40Man,
    ).length;
    if (fortyManCount >= 40) return { ok: false, error: '40-man roster full. DFA someone first.' };

    signFA(player, state.userTeamId, salary, years);
    rebuildMaps();
    return { ok: true };
  },

  async runAIFreeAgency(): Promise<FreeAgencyResult> {
    const state = requireState();
    const result = runAIFreeAgency(state.players, state.teams, state.userTeamId);
    rebuildMaps();
    return result;
  },

  // ── Lineup Management ───────────────────────────────────────────────────
  async getLineup(teamId: number): Promise<LineupData> {
    const state = requireState();
    const existing = _lineups.get(teamId);
    if (existing) return existing;

    // Auto-generate default lineup
    const teamPlayers = state.players.filter(p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE');
    const hitters = teamPlayers.filter(p => !p.isPitcher)
      .sort((a, b) => {
        const aVal = (a.hitterAttributes?.contact ?? 0) + (a.hitterAttributes?.power ?? 0) * 0.8 + (a.hitterAttributes?.eye ?? 0) * 0.6;
        const bVal = (b.hitterAttributes?.contact ?? 0) + (b.hitterAttributes?.power ?? 0) * 0.8 + (b.hitterAttributes?.eye ?? 0) * 0.6;
        return bVal - aVal;
      });
    const starters = teamPlayers.filter(p => p.position === 'SP')
      .sort((a, b) => b.overall - a.overall);
    const closers = teamPlayers.filter(p => p.position === 'CL')
      .sort((a, b) => b.overall - a.overall);

    const lineup: LineupData = {
      teamId,
      battingOrder: hitters.slice(0, 9).map(p => p.playerId),
      rotation: starters.slice(0, 5).map(p => p.playerId),
      closer: closers[0]?.playerId ?? null,
    };

    _lineups.set(teamId, lineup);
    return lineup;
  },

  async setLineup(lineup: LineupData): Promise<{ ok: boolean; error?: string }> {
    requireState();
    if (lineup.battingOrder.length !== 9) return { ok: false, error: 'Batting order must have exactly 9 players.' };
    if (lineup.rotation.length < 1 || lineup.rotation.length > 5) return { ok: false, error: 'Rotation must have 1-5 pitchers.' };
    _lineups.set(lineup.teamId, lineup);
    return { ok: true };
  },

  // ── Draft System ─────────────────────────────────────────────────────────
  async getDraftState(): Promise<DraftState | null> {
    return _draftState;
  },

  async startDraft(): Promise<DraftState> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    // Find user team's scouting quality
    const userTeam = _teamMap.get(state.userTeamId);
    const scoutingQuality = userTeam?.scoutingQuality ?? 0.7;

    // Generate draft class
    let prospects: DraftProspect[];
    [prospects, gen] = generateDraftClass(gen, scoutingQuality, state.season);

    // Build draft order from standings (inverse)
    const teams = state.teams.map(t => ({
      teamId: t.teamId,
      name: t.name,
      wins: t.seasonRecord.wins,
    }));
    const picks = buildDraftOrder(teams, 5);

    _draftState = {
      season: state.season,
      prospects,
      picks,
      currentPick: 0,
      completed: false,
    };

    state.prngState = serializeState(gen);
    return _draftState;
  },

  async makeDraftPick(prospectId: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    if (!_draftState) return { ok: false, error: 'No draft in progress.' };
    if (_draftState.completed) return { ok: false, error: 'Draft is already complete.' };

    const pickEntry = _draftState.picks[_draftState.currentPick];
    if (pickEntry.teamId !== state.userTeamId) return { ok: false, error: 'Not your pick.' };

    const prospect = _draftState.prospects.find(p => p.prospectId === prospectId);
    if (!prospect) return { ok: false, error: 'Prospect not found.' };

    // Check if already drafted
    if (_draftState.picks.some(pk => pk.prospectId === prospectId)) {
      return { ok: false, error: 'Prospect already drafted.' };
    }

    // Execute the pick
    const player = executeDraftPick(prospect, state.userTeamId, state.season);
    state.players.push(player);
    _playerMap.set(player.playerId, player);

    pickEntry.prospectId = prospectId;
    pickEntry.playerName = prospect.name;
    _draftState.currentPick++;

    if (_draftState.currentPick >= _draftState.picks.length) {
      _draftState.completed = true;
    }

    return { ok: true };
  },

  async simDraftToNextUserPick(): Promise<{ ok: boolean; completed: boolean }> {
    const state = requireState();
    if (!_draftState) return { ok: false, completed: false };
    if (_draftState.completed) return { ok: true, completed: true };

    while (_draftState.currentPick < _draftState.picks.length) {
      const pickEntry = _draftState.picks[_draftState.currentPick];

      // If it's the user's pick, stop
      if (pickEntry.teamId === state.userTeamId) break;

      // AI pick
      const available = _draftState.prospects.filter(p =>
        !_draftState!.picks.some(pk => pk.prospectId === p.prospectId)
      );

      const team = _teamMap.get(pickEntry.teamId);
      const aiPick = aiSelectPick(
        pickEntry.teamId,
        available,
        state.players,
        team?.strategy ?? 'fringe',
      );

      if (aiPick) {
        const player = executeDraftPick(aiPick, pickEntry.teamId, state.season);
        state.players.push(player);
        _playerMap.set(player.playerId, player);
        pickEntry.prospectId = aiPick.prospectId;
        pickEntry.playerName = aiPick.name;
      }

      _draftState.currentPick++;
    }

    if (_draftState.currentPick >= _draftState.picks.length) {
      _draftState.completed = true;
    }

    return { ok: true, completed: _draftState.completed };
  },

  // ── Prospect Rankings ───────────────────────────────────────────────────
  async getLeagueProspects(): Promise<ProspectReport[]> {
    const state = requireState();
    const userTeam = _teamMap.get(state.userTeamId);
    return generateLeagueProspectRankings(
      state.players, state.teams,
      userTeam?.scoutingQuality ?? 0.7,
      state.season,
      100,
    );
  },

  async getOrgProspects(teamId: number): Promise<ProspectReport[]> {
    const state = requireState();
    const team = _teamMap.get(teamId);
    return generateOrgProspectRankings(
      state.players, teamId,
      team?.name ?? '???',
      team?.scoutingQuality ?? 0.7,
      state.season,
      30,
    );
  },

  // ── Financial System ────────────────────────────────────────────────────
  async getTeamFinancials(teamId: number): Promise<TeamFinancials> {
    const state = requireState();
    const team = _teamMap.get(teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);

    const prevCash = _teamCash.get(teamId) ?? 0;
    const luxYears = _luxuryTaxYears.get(teamId) ?? 0;
    return computeTeamFinancials(team, state.players, state.season, prevCash, luxYears);
  },

  async getFinancialHistory(teamId: number): Promise<FinancialHistory[]> {
    return _financialHistory.get(teamId) ?? [];
  },

  async getLeagueFinancials(): Promise<Array<{ teamName: string; payroll: number; budget: number; profit: number }>> {
    const state = requireState();
    return state.teams.map(team => {
      const payroll = computePayroll(state.players, team.teamId);
      const fin = computeTeamFinancials(team, state.players, state.season, 0, 0);
      return {
        teamName: team.name,
        payroll,
        budget: team.budget,
        profit: fin.operatingIncome,
      };
    });
  },

  // ── Career Stats ────────────────────────────────────────────────────────
  async getAllTimeLeaders(stat: CareerStat, limit?: number): Promise<AllTimeLeader[]> {
    return getAllTimeLeaders(stat, limit);
  },

  async getCareerStats(playerId: number): Promise<CareerRecord | null> {
    return getCareerRecords().get(playerId) ?? null;
  },

  async getHOFCandidates(): Promise<HOFCandidate[]> {
    const state = requireState();
    const retired = state.players
      .filter(p => p.rosterData.rosterStatus === 'RETIRED')
      .map(p => p.playerId);
    const info = state.players.map(p => ({
      playerId: p.playerId,
      position: p.position,
      isPitcher: p.isPitcher,
    }));
    return evaluateHOFCandidates(retired, info);
  },

  async getFranchiseRecords(teamId: number): Promise<FranchiseRecord[]> {
    return getFranchiseRecords(teamId);
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  async ping(): Promise<string> {
    return 'pong';
  },
};

export type WorkerAPI = typeof api;
Comlink.expose(api);
