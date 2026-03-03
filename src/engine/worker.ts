/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import type { Player, PlayerSeasonStats } from '../types/player';
import type { Team } from '../types/team';
import type {
  LeagueState, SeasonResult, StandingsData, RosterData,
  LeaderboardEntry, PlayerProfileData, RosterPlayer, StandingsRow,
  LeaderboardFullEntry, LeaderboardFullOptions, AwardCandidate,
} from '../types/league';
import type { ScheduleEntry } from '../types/game';
import type { RosterStatus } from '../types/player';
import { createPRNG, serializeState, deserializeState } from './math/prng';
import { generateLeaguePlayers } from './player/generation';
import { buildInitialTeams } from '../data/teams';
import { generateScheduleTemplate as generateSchedule } from '../data/scheduleTemplate';
import { simulateSeason, advanceServiceTime, resetSeasonCounters } from './sim/seasonSimulator';
import {
  createSeasonSimState, simulateChunk, buildPartialResult,
  simulateRange, computeSim1DayTarget, computeSim1WeekTarget, computeSim1MonthTarget,
  type SeasonSimState, type ChunkResult, type SimRangeResult,
  SEGMENTS, SEGMENT_COUNT,
} from './sim/incrementalSimulator';
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
  type AISigningRecord,
} from './freeAgency';
import {
  generateTradeOffers, executeTrade as doTrade,
  evaluateProposedTrade, evaluatePlayer,
  shopPlayer as doShopPlayer, findTradesForNeed as doFindTradesForNeed,
  type TradeProposal, type TradeResult, type TradePlayerInfo,
} from './trading';
import { processSeasonInjuries } from './injuries';
import { ensureMinimumRosters } from './rosterGuard';
import { computeStaffBonuses, DEFAULT_BONUSES, type StaffBonuses } from './staffEffects';
import { createDraftPool, recoverOrphanedDraftPlayers, scoutDraftPool, getDraftRounds, generateAnnualDraftClass, type DraftProspect } from './draft/draftPool';
import { computePayrollReport, generateArbitrationCases, resolveArbitration, type PayrollReport, type ArbitrationCase } from './finances';
import {
  generateDraftOrder, getPickingTeam, getOverallPick,
  aiSelectPlayer, fillRemainingRosters,
  type DraftPick, type DraftBoardState,
} from './draft/draftAI';
import { processWaivers, type WaiverClaim } from './waivers';
import {
  identifyRule5Eligible, conductRule5Draft, userRule5Pick,
  type Rule5Selection,
} from './draft/rule5Draft';
import { processAIRosterMoves, type AIRosterMove } from './aiRosterManager';
import { identifyHOFCandidates, simulateHOFVoting, type HallOfFameInductee, type HallOfFameCandidate } from './hallOfFame';
import { updateFranchiseRecords, emptyRecordBook, type FranchiseRecordBook } from './franchiseRecords';
import type { RetiredPlayerRecord } from '../types/league';
import {
  generateIntlClass, signIntlProspect as signIntlProspectFn,
  processAIIntlSignings,
  type IntlProspect,
} from './internationalSigning';
import {
  computeAdvancedHitting, computeAdvancedPitching, computeLeagueAverages,
  type AdvancedHittingStats, type AdvancedPitchingStats, type LeagueAverages,
} from './advancedStats';
import type { DevAssignment, DevProgram } from './devPrograms';
import { generateScoutingReport, getDisplayGrades, gaussianNoise, type ScoutingReport } from './scouting';
// ─── Worker-side state ────────────────────────────────────────────────────────
// The worker owns the canonical game state. The UI queries for what it needs.

let _state: LeagueState | null = null;
let _playerMap = new Map<number, Player>();
let _teamMap = new Map<number, Team>();
let _playerSeasonStats = new Map<number, import('../types/player').PlayerSeasonStats>();
let _careerHistory = new Map<number, import('../types/player').PlayerSeasonStats[]>();
let _seasonResults: SeasonResult[] = [];
let _foStaff: import('../types/frontOffice').FOStaffMember[] = [];
let _lastAIRosterMoves: AIRosterMove[] = [];
let _cachedLeagueAverages: LeagueAverages | null = null;
let _retiredCareerHistory = new Map<number, import('../types/league').RetiredPlayerRecord>();
let _hallOfFame: import('./hallOfFame').HallOfFameInductee[] = [];
let _franchiseRecords: import('./franchiseRecords').FranchiseRecordBook | null = null;

// ─── Draft state ──────────────────────────────────────────────────────────────

interface InternalDraftState {
  mode: string;
  pool: Player[];                 // Actual Player objects (unassigned)
  prospects: DraftProspect[];     // Scouted views (with fog)
  picks: DraftPick[];
  draftOrder: number[];
  currentRound: number;
  currentPickInRound: number;
  totalRounds: number;
  userTeamId: number;
  isComplete: boolean;
}

let _draftState: InternalDraftState | null = null;

// ─── International signing state ────────────────────────────────────────

let _intlProspects: IntlProspect[] = [];

// ─── Dev Lab state ───────────────────────────────────────────────────────
let _devAssignments = new Map<number, DevAssignment>();

// ─── Scouting state ──────────────────────────────────────────────────────
let _scoutingReports = new Map<number, ScoutingReport>();

// ─── In-season sim state (for chunked play) ──────────────────────────────

let _seasonSimState: SeasonSimState | null = null;

// ─── Lineup/Rotation order ───────────────────────────────────────────────

let _lineupOrder: number[] = [];    // 9 player IDs in batting order
let _rotationOrder: number[] = [];  // 5 starter player IDs in rotation order

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _scrubLineupRotation(): void {
  if (!_state) return;
  const activeIds = new Set(
    _state.players
      .filter(p => p.teamId === _state!.userTeamId && p.rosterData.rosterStatus === 'MLB_ACTIVE')
      .map(p => p.playerId)
  );
  _lineupOrder = _lineupOrder.filter(id => activeIds.has(id));
  _rotationOrder = _rotationOrder.filter(id => activeIds.has(id));
  if (_lineupOrder.length !== 9) _lineupOrder = [];
}

function requireState(): LeagueState {
  if (!_state) throw new Error('No game loaded. Call newGame() first.');
  return _state;
}

function rebuildMaps(): void {
  if (!_state) return;
  _playerMap = new Map(_state.players.map(p => [p.playerId, p]));
  _teamMap   = new Map(_state.teams.map(t => [t.teamId, t]));
}

function _buildStandings(state: LeagueState): StandingsRow[] {
  return state.teams.map(t => ({
    teamId: t.teamId, name: t.name, abbreviation: t.abbreviation,
    league: t.league, division: t.division,
    wins: t.seasonRecord.wins, losses: t.seasonRecord.losses,
    pct: (t.seasonRecord.wins + t.seasonRecord.losses) > 0
      ? t.seasonRecord.wins / (t.seasonRecord.wins + t.seasonRecord.losses) : 0,
    gb: 0, runsScored: t.seasonRecord.runsScored, runsAllowed: t.seasonRecord.runsAllowed,
    pythagWins: Math.round(pythagenpatWinPct(t.seasonRecord.runsScored, t.seasonRecord.runsAllowed) * ((t.seasonRecord.wins + t.seasonRecord.losses) || 162)),
  }));
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
    injuryInfo: p.rosterData.currentInjury ? {
      type: p.rosterData.currentInjury.type,
      severity: p.rosterData.currentInjury.severity,
      daysRemaining: p.rosterData.currentInjury.recoveryDaysRemaining,
      description: p.rosterData.currentInjury.description,
    } : undefined,
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
    _careerHistory = new Map();
    _seasonResults = [];
    _retiredCareerHistory = new Map();
    _hallOfFame = [];
    _franchiseRecords = null;
    _foStaff = [];
    _lastAIRosterMoves = [];
    _draftState = null;
    _lineupOrder = [];
    _rotationOrder = [];
    rebuildMaps();

    return { ok: true, season: _state.season, teamCount: teams.length };
  },

  // ── Simulate a season ─────────────────────────────────────────────────────
  async simulateSeason(onProgressCallback?: (pct: number) => void): Promise<SeasonResult> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    // Ensure all teams have minimum viable rosters before sim
    ensureMinimumRosters(state.players, state.teams);

    // Reset counters at season start
    _cachedLeagueAverages = null;
    resetSeasonCounters(state.players);

    // Scrub lineup/rotation so stale player IDs don't persist
    _scrubLineupRotation();

    const result = await simulateSeason(
      state.teams,
      state.players,
      state.schedule,
      Number(gen.next()[0]),
      onProgressCallback,
      {
        season: state.season,
        userTeamId: state.userTeamId,
        userLineupOrder: _lineupOrder.length === 9 ? _lineupOrder : undefined,
        userRotationOrder: _rotationOrder.length > 0 ? _rotationOrder : undefined,
      },
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

    // Accumulate career history
    for (const ps of result.playerSeasons) {
      const record = { ...ps, season: state.season };
      const history = _careerHistory.get(ps.playerId) ?? [];
      history.push(record);
      _careerHistory.set(ps.playerId, history);
    }

    // ── Injuries (post-process — deterministic based on seed) ─────────────────
    const injurySeed = Number(gen.next()[0]);
    [, gen] = gen.next();
    // Clear any lingering injuries from previous season before processing
    for (const p of state.players) {
      if (p.rosterData.currentInjury) {
        p.rosterData.currentInjury = undefined;
        if (p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60') {
          p.rosterData.rosterStatus = 'MLB_ACTIVE';
        }
      }
    }
    // Compute FO staff bonuses (defaults to neutral 1.0x if no staff)
    const staffBonuses = _foStaff.length > 0 ? computeStaffBonuses(_foStaff) : DEFAULT_BONUSES;

    const injuryEvents = processSeasonInjuries(
      state.players, state.schedule.length, injurySeed, state.season,
      staffBonuses.injuryRateMultiplier,
      staffBonuses.recoverySpeedMultiplier,
    );

    // ── AI roster moves (call-ups, options, DFAs after injuries) ────────────
    const rosterMoveSeed = Math.abs(injurySeed * 3 + state.season * 17);
    _lastAIRosterMoves = processAIRosterMoves(
      state.players, state.teams, state.userTeamId, rosterMoveSeed,
    );

    // ── Cache league averages for advanced stats queries ────────────────────
    const allSeasonStats = Array.from(_playerSeasonStats.values());
    _cachedLeagueAverages = computeLeagueAverages(allSeasonStats);

    // ── Awards (computed before aging — players are at their in-season state) ──
    const awards = computeAwards(state.players, _playerSeasonStats, state.teams);
    const divisionChampions = computeDivisionChampions(state.teams);

    // ── Advance service time (172 game-days) ──────────────────────────────────
    for (let d = 0; d < 172; d++) {
      advanceServiceTime(state.players, d);
    }

    // ── Offseason: player development + aging ─────────────────────────────────
    const devAssignmentsObj: Record<number, DevAssignment> = {};
    for (const [pid, a] of _devAssignments) devAssignmentsObj[pid] = a;
    const offseasonResult = advanceOffseason(state.players, gen, {
      hitter: staffBonuses.hitterDevMultiplier,
      pitcher: staffBonuses.pitcherDevMultiplier,
    }, devAssignmentsObj);
    state.players = offseasonResult.players;
    gen = offseasonResult.gen;

    // ── Persist retired players' career stats before they're pruned ──────────
    const retiredEvents = (offseasonResult.events ?? []).filter(e => e.type === 'retirement');
    for (const evt of retiredEvents) {
      const career = _careerHistory.get(evt.playerId);
      if (career && career.length > 0) {
        const player = _playerMap.get(evt.playerId);
        _retiredCareerHistory.set(evt.playerId, {
          name: evt.playerName,
          position: player?.position ?? 'UT',
          seasons: career,
          retiredSeason: state.season,
        });
      }
    }

    // Rebuild the player map after development (ages/attrs changed)
    rebuildMaps();

    // ── Franchise records (user team only) ──────────────────────────────────
    const userTeamRecord = result.teamSeasons.find(ts => ts.teamId === state.userTeamId);
    if (userTeamRecord) {
      const recBook = _franchiseRecords ?? emptyRecordBook();
      const recResult = updateFranchiseRecords(
        recBook, _playerSeasonStats, _careerHistory, _playerMap,
        { wins: userTeamRecord.record.wins, losses: userTeamRecord.record.losses },
        state.season, state.userTeamId,
      );
      _franchiseRecords = recResult.records;
    }

    // ── Hall of Fame processing ─────────────────────────────────────────────
    const existingInducteeIds = new Set(_hallOfFame.map(i => i.playerId));
    const hofCandidates = identifyHOFCandidates(_retiredCareerHistory, state.season, existingInducteeIds);
    if (hofCandidates.length > 0) {
      const hofSeed = state.season * 31337;
      const votingResult = simulateHOFVoting(hofCandidates, hofSeed);
      _hallOfFame.push(...votingResult.inducted);
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
      injuryEvents,
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

    const team = state.teams.find(t => t.teamId === player.teamId);
    const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

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
        isPitcher,
        teamId: player.teamId,
        teamAbbr: team?.abbreviation ?? '---',
        optionYearsRemaining: player.rosterData.optionYearsRemaining,
        tradeValue: evaluatePlayer(player),
      },
      seasonStats,
      careerStats: _careerHistory.get(playerId) ?? [],
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
    if (result.ok) { rebuildMaps(); _scrubLineupRotation(); }
    return result;
  },

  async releasePlayer(playerId: number): Promise<TransactionResult> {
    requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = doRelease(player);
    if (result.ok) { rebuildMaps(); _scrubLineupRotation(); }
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
    if (isNaN(years) || isNaN(salary)) return { ok: false, error: 'Invalid contract terms.' };
    years = Math.max(1, Math.min(10, Math.round(years)));
    salary = Math.max(0.5, salary);
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };

    // Budget check: block signings that would exceed team budget by >15%
    const userTeam = _teamMap.get(state.userTeamId);
    if (userTeam) {
      const currentPayroll = state.players
        .filter(p => p.teamId === state.userTeamId && p.rosterData.rosterStatus === 'MLB_ACTIVE')
        .reduce((sum, p) => sum + p.rosterData.salary, 0);
      const newPayroll = currentPayroll + salary;
      if (newPayroll > userTeam.budget * 1_000_000 * 1.15) {
        return { ok: false, error: 'Signing would exceed team budget.' };
      }
    }

    const result = doSign(player, state.userTeamId, years, salary, state.players);
    if (result.ok) rebuildMaps();
    return result;
  },

  async finishOffseason(): Promise<{ aiSignings: number; signingDetails: AISigningRecord[] }> {
    const state = requireState();
    const standings = _buildStandings(state);
    const result = processAISignings(state.players, state.teams, state.userTeamId, standings);
    rebuildMaps();
    return { aiSignings: result.count, signingDetails: result.signings };
  },

  // ── Trading ──────────────────────────────────────────────────────────────
  async getTradeOffers(): Promise<TradeProposal[]> {
    const state = requireState();
    const standings = _buildStandings(state);
    return generateTradeOffers(state.userTeamId, state.players, state.teams, _playerSeasonStats, standings);
  },

  async shopPlayer(playerId: number): Promise<TradeProposal[]> {
    const state = requireState();
    const standings = _buildStandings(state);
    return doShopPlayer(playerId, state.players, state.teams, _playerSeasonStats, standings);
  },

  async findTradesForNeed(position: string): Promise<TradeProposal[]> {
    const state = requireState();
    const standings = _buildStandings(state);
    return doFindTradesForNeed(state.userTeamId, position, state.players, state.teams, _playerSeasonStats, standings);
  },

  async getTeamPlayers(teamId: number): Promise<TradePlayerInfo[]> {
    const state = requireState();
    return state.players
      .filter(p => p.teamId === teamId &&
        (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_')) &&
        p.overall >= 150)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 30)
      .map(p => {
        const isPitcher = ['SP', 'RP', 'CL'].includes(p.position);
        const raw = _playerSeasonStats.get(p.playerId);
        const stats: TradePlayerInfo['stats'] = {};
        if (raw) {
          if (isPitcher) {
            stats.era = raw.outs > 0 ? Number(((raw.er / raw.outs) * 27).toFixed(2)) : undefined;
            stats.k9 = raw.outs > 0 ? Number(((raw.ka / (raw.outs / 3)) * 9).toFixed(1)) : undefined;
            stats.whip = raw.outs > 0 ? Number(((raw.bba + raw.ha) / (raw.outs / 3)).toFixed(2)) : undefined;
          } else {
            stats.avg = raw.ab > 0 ? Number((raw.h / raw.ab).toFixed(3)) : undefined;
            stats.hr = raw.hr;
            if (raw.ab > 0 && raw.pa > 0) {
              const obp = (raw.h + raw.bb + raw.hbp) / raw.pa;
              const slg = (raw.h - raw.doubles - raw.triples - raw.hr + raw.doubles * 2 + raw.triples * 3 + raw.hr * 4) / raw.ab;
              stats.ops = Number((obp + slg).toFixed(3));
            }
          }
        }
        return {
          playerId: p.playerId,
          name: p.name,
          position: p.position,
          age: p.age,
          overall: p.overall,
          potential: p.potential,
          salary: p.rosterData.salary,
          contractYearsRemaining: p.rosterData.contractYearsRemaining,
          tradeValue: evaluatePlayer(p),
          isPitcher,
          stats,
        };
      });
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
    if (result.ok) { rebuildMaps(); _scrubLineupRotation(); }
    return { ...result, fair: true };
  },

  async acceptTradeOffer(
    partnerTeamId: number,
    userPlayerIds: number[],
    partnerPlayerIds: number[],
  ): Promise<TradeResult> {
    const state = requireState();
    const result = doTrade(state.players, state.userTeamId, partnerTeamId, userPlayerIds, partnerPlayerIds);
    if (result.ok) { rebuildMaps(); _scrubLineupRotation(); }
    return result;
  },

  async getTeamNeeds(teamId: number): Promise<{
    needs: Array<{ position: string; severity: 'critical' | 'moderate' | 'mild' }>;
    strengths: string[];
  }> {
    const state = requireState();
    const teamPlayers = state.players.filter(
      p => p.teamId === teamId &&
      (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_'))
    );

    const positionSlots = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP'];
    const posCount: Record<string, number> = {};
    const posOvr: Record<string, number> = {};

    for (const pos of positionSlots) {
      const atPos = teamPlayers.filter(p => p.position === pos);
      posCount[pos] = atPos.length;
      posOvr[pos] = atPos.length > 0
        ? atPos.reduce((s, p) => s + p.overall, 0) / atPos.length
        : 0;
    }

    const needs: Array<{ position: string; severity: 'critical' | 'moderate' | 'mild' }> = [];
    const strengths: string[] = [];

    for (const pos of positionSlots) {
      const count = posCount[pos];
      const avgOvr = posOvr[pos];

      if (pos === 'SP') {
        if (count < 3) needs.push({ position: pos, severity: 'critical' });
        else if (count < 5) needs.push({ position: pos, severity: 'moderate' });
        else if (avgOvr > 350) strengths.push(pos);
      } else if (pos === 'RP') {
        if (count < 3) needs.push({ position: pos, severity: 'critical' });
        else if (count < 5) needs.push({ position: pos, severity: 'moderate' });
        else if (avgOvr > 300) strengths.push('Bullpen');
      } else {
        if (count === 0) needs.push({ position: pos, severity: 'critical' });
        else if (count === 1 && avgOvr < 280) needs.push({ position: pos, severity: 'moderate' });
        else if (avgOvr > 350) strengths.push(pos);
      }
    }

    return { needs: needs.slice(0, 5), strengths: [...new Set(strengths)].slice(0, 4) };
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

  // ── Award Race ────────────────────────────────────────────────────────────
  async getAwardRace(): Promise<{
    mvp:     { al: AwardCandidate[]; nl: AwardCandidate[] };
    cyYoung: { al: AwardCandidate[]; nl: AwardCandidate[] };
    roy:     { al: AwardCandidate[]; nl: AwardCandidate[] };
  }> {
    const state = requireState();

    function computeHitterStats(s: PlayerSeasonStats) {
      const avg = s.ab > 0 ? s.h / s.ab : 0;
      const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
      const slg = s.ab > 0
        ? (s.h - s.doubles - s.triples - s.hr + s.doubles * 2 + s.triples * 3 + s.hr * 4) / s.ab : 0;
      const ops = obp + slg;
      return { avg, obp, slg, ops, hr: s.hr, rbi: s.rbi, pa: s.pa };
    }

    function computePitcherStats(s: PlayerSeasonStats) {
      const ip = s.outs / 3;
      const era = s.outs > 0 ? (s.er / s.outs) * 27 : 99;
      const k9 = ip > 0 ? (s.ka / ip) * 9 : 0;
      const whip = ip > 0 ? (s.bba + s.ha) / ip : 99;
      return { w: s.w, l: s.l, era, ip, k9, whip, sv: s.sv, ka: s.ka };
    }

    function mvpScore(s: PlayerSeasonStats): number {
      if (s.pa < 300) return -Infinity;
      const { ops, hr, rbi, avg } = computeHitterStats(s);
      return ops * 80 + hr * 0.25 + rbi * 0.08 + avg * 10;
    }

    function cyScore(s: PlayerSeasonStats): number {
      if (s.outs < 45) return -Infinity;
      const { era, k9, whip, ip, w } = computePitcherStats(s);
      return -era * 6 + w * 2.5 + k9 * 1.5 - whip * 8 + ip * 0.04;
    }

    function royScore(p: Player, s: PlayerSeasonStats): number {
      if (p.rosterData.serviceTimeDays > 130) return -Infinity;
      if (p.isPitcher) {
        if (s.outs < 30) return -Infinity;
        const { era, whip, ip, w } = computePitcherStats(s);
        return -era * 5 + w * 2 - whip * 7 + ip * 0.03;
      }
      if (s.pa < 100) return -Infinity;
      const { obp, slg, hr, avg } = computeHitterStats(s);
      return (obp + slg) * 60 + hr * 0.20 + avg * 8;
    }

    const teamMap = new Map(state.teams.map(t => [t.teamId, t]));

    function buildCandidates(
      players: Player[],
      scoreFn: (p: Player, s: PlayerSeasonStats) => number,
      filter?: (p: Player) => boolean,
    ): AwardCandidate[] {
      const scored: Array<{ p: Player; s: PlayerSeasonStats; score: number }> = [];
      for (const p of players) {
        if (filter && !filter(p)) continue;
        const s = _playerSeasonStats.get(p.playerId);
        if (!s) continue;
        const score = scoreFn(p, s);
        if (!isFinite(score)) continue;
        scored.push({ p, s, score });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 5).map(({ p, s, score }) => {
        const team = teamMap.get(p.teamId);
        const stats: Record<string, number> = {};
        if (p.isPitcher) {
          const ps = computePitcherStats(s);
          Object.assign(stats, { w: ps.w, l: ps.l, era: Number(ps.era.toFixed(2)), ip: Number(ps.ip.toFixed(1)), k9: Number(ps.k9.toFixed(1)), whip: Number(ps.whip.toFixed(2)), sv: ps.sv, k: ps.ka });
        } else {
          const hs = computeHitterStats(s);
          Object.assign(stats, { avg: Number(hs.avg.toFixed(3)), obp: Number(hs.obp.toFixed(3)), slg: Number(hs.slg.toFixed(3)), ops: Number(hs.ops.toFixed(3)), hr: hs.hr, rbi: hs.rbi });
        }
        return {
          playerId: p.playerId,
          name: p.name,
          teamAbbr: team?.abbreviation ?? '---',
          teamId: p.teamId,
          position: p.position,
          age: p.age,
          isPitcher: p.isPitcher,
          score: Math.round(score * 100) / 100,
          stats,
        };
      });
    }

    const alPlayers = state.players.filter(p => teamMap.get(p.teamId)?.league === 'AL');
    const nlPlayers = state.players.filter(p => teamMap.get(p.teamId)?.league === 'NL');

    return {
      mvp: {
        al: buildCandidates(alPlayers, (_p, s) => mvpScore(s), p => !p.isPitcher),
        nl: buildCandidates(nlPlayers, (_p, s) => mvpScore(s), p => !p.isPitcher),
      },
      cyYoung: {
        al: buildCandidates(alPlayers, (_p, s) => cyScore(s), p => p.isPitcher),
        nl: buildCandidates(nlPlayers, (_p, s) => cyScore(s), p => p.isPitcher),
      },
      roy: {
        al: buildCandidates(alPlayers, (p, s) => royScore(p, s)),
        nl: buildCandidates(nlPlayers, (p, s) => royScore(p, s)),
      },
    };
  },

  // ── Contract Extensions ──────────────────────────────────────────────────
  async offerExtension(
    playerId: number,
    years: number,
    annualSalary: number,
  ): Promise<{ accepted: boolean; counterYears?: number; counterSalary?: number }> {
    if (isNaN(years) || isNaN(annualSalary)) return { accepted: false };
    years = Math.max(1, Math.min(10, Math.round(years)));
    annualSalary = Math.max(0.5, annualSalary);
    const state = requireState();
    const player = state.players.find(p => p.playerId === playerId);
    if (!player) return { accepted: false };

    // Payroll check — block extensions that would exceed budget by >15%
    const teamId = player.teamId;
    const team = state.teams.find(t => t.teamId === teamId);
    if (team) {
      const currentPayroll = state.players
        .filter(p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE')
        .reduce((sum, p) => sum + p.rosterData.salary, 0);
      const newPayroll = currentPayroll + (annualSalary - player.rosterData.salary);
      if (newPayroll > team.budget * 1_000_000 * 1.15) {
        return { accepted: false };
      }
    }

    // Must be on the user's team — but we don't know user's team here,
    // so we just validate the player exists and has < 6 years service
    const serviceYears = Math.floor(player.rosterData.serviceTimeDays / 172);
    if (serviceYears >= 6) return { accepted: false }; // Already FA eligible

    const currentSalary = player.rosterData.salary;

    // Acceptance probability
    let prob = serviceYears < 3 ? 70 : 55; // Pre-arb vs arb-eligible base
    if (annualSalary >= currentSalary * 1.2) prob += 15;
    if (years > 2) prob += Math.min(20, (years - 2) * 10);
    if (annualSalary < currentSalary) prob -= 20;
    if (player.age <= 25) prob -= 10; // Wants to test FA

    // Clamp
    prob = Math.max(5, Math.min(95, prob));

    // Deterministic "random" from playerId + years + salary
    const seed = (playerId * 7919 + years * 31 + Math.round(annualSalary / 10000)) % 100;
    const accepted = seed < prob;

    if (accepted) {
      // Apply the extension
      player.rosterData.contractYearsRemaining = years;
      player.rosterData.salary = annualSalary;
      return { accepted: true };
    }

    // Counter-offer: 10% above what was offered, same years
    const counterSalary = Math.round(annualSalary * 1.10);
    return {
      accepted: false,
      counterYears: years,
      counterSalary,
    };
  },

  // ── Accept Counter-Offer ────────────────────────────────────────────────
  async acceptCounterOffer(
    playerId: number,
    years: number,
    annualSalary: number,
  ): Promise<{ ok: boolean }> {
    const state = requireState();
    const player = state.players.find(p => p.playerId === playerId);
    if (!player) return { ok: false };
    player.rosterData.contractYearsRemaining = years;
    player.rosterData.salary = annualSalary;
    return { ok: true };
  },

  // ── Finances ───────────────────────────────────────────────────────────
  async getPayrollReport(teamId: number): Promise<PayrollReport> {
    const state = requireState();
    const team = state.teams.find(t => t.teamId === teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);
    return computePayrollReport(state.players, team);
  },

  async getArbitrationCases(): Promise<ArbitrationCase[]> {
    const state = requireState();
    return generateArbitrationCases(state.players, state.userTeamId);
  },

  async resolveArbitrationCase(playerId: number, salary: number): Promise<{ ok: boolean }> {
    const state = requireState();
    const player = state.players.find(p => p.playerId === playerId);
    if (!player) return { ok: false };
    resolveArbitration(player, salary);
    rebuildMaps();
    return { ok: true };
  },

  // ── Front Office Staff ──────────────────────────────────────────────────
  async setFrontOffice(staff: import('../types/frontOffice').FOStaffMember[]): Promise<void> {
    _foStaff = staff;
  },

  async getStaffBonuses(): Promise<StaffBonuses> {
    return _foStaff.length > 0 ? computeStaffBonuses(_foStaff) : DEFAULT_BONUSES;
  },

  // ── Waivers ────────────────────────────────────────────────────────────────

  async processWaivers(): Promise<WaiverClaim[]> {
    const state = requireState();
    const standings = _buildStandings(state);
    const claims = processWaivers(state.players, state.teams, state.userTeamId, standings);
    rebuildMaps();
    return claims;
  },

  // ── Rule 5 Draft ──────────────────────────────────────────────────────────

  async getRule5Eligible(): Promise<Array<{
    playerId: number; name: string; position: string;
    overall: number; potential: number; age: number;
    teamId: number; teamAbbr: string;
  }>> {
    const state = requireState();
    const eligible = identifyRule5Eligible(state.players, state.season);
    return eligible.map(p => {
      const team = _teamMap.get(p.teamId);
      return {
        playerId: p.playerId,
        name: p.name,
        position: p.position,
        overall: p.overall,
        potential: p.potential,
        age: p.age,
        teamId: p.teamId,
        teamAbbr: team?.abbreviation ?? '???',
      };
    });
  },

  async conductRule5Draft(): Promise<Rule5Selection[]> {
    const state = requireState();
    const standings = _buildStandings(state);
    const selections = conductRule5Draft(state.players, state.teams, state.userTeamId, state.season, standings);
    rebuildMaps();
    return selections;
  },

  async userRule5Pick(playerId: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = userRule5Pick(player, state.userTeamId, state.players);
    if (result.ok) rebuildMaps();
    return result;
  },

  // ── Draft ─────────────────────────────────────────────────────────────────

  async startDraft(mode: string): Promise<DraftBoardState> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    // Extract MLB_ACTIVE players into draft pool
    const pool = createDraftPool(state.players);

    // Apply scouting fog using staff bonuses
    const staffBonuses = _foStaff.length > 0 ? computeStaffBonuses(_foStaff) : DEFAULT_BONUSES;
    let prospects: DraftProspect[];
    [prospects, gen] = scoutDraftPool(pool, staffBonuses.scoutingAccuracy, gen);

    // Generate draft order
    let draftOrder: number[];
    [draftOrder, gen] = generateDraftOrder(state.teams, gen);

    state.prngState = serializeState(gen);

    const totalRounds = getDraftRounds(mode);

    _draftState = {
      mode,
      pool,
      prospects,
      picks: [],
      draftOrder,
      currentRound: 1,
      currentPickInRound: 0,
      totalRounds,
      userTeamId: state.userTeamId,
      isComplete: false,
    };

    return this._buildDraftBoard();
  },

  async getDraftBoard(): Promise<DraftBoardState> {
    return this._buildDraftBoard();
  },

  async makeDraftPick(playerId: number): Promise<DraftBoardState> {
    if (!_draftState || _draftState.isComplete) throw new Error('No active draft');
    requireState();

    const pickingTeamId = getPickingTeam(
      _draftState.draftOrder, _draftState.currentRound, _draftState.currentPickInRound,
    );
    if (pickingTeamId !== _draftState.userTeamId) throw new Error('Not your turn');

    this._executePick(playerId, pickingTeamId);
    return this._buildDraftBoard();
  },

  async autoPickForUser(): Promise<DraftBoardState> {
    if (!_draftState || _draftState.isComplete) throw new Error('No active draft');
    requireState();

    const pickingTeamId = getPickingTeam(
      _draftState.draftOrder, _draftState.currentRound, _draftState.currentPickInRound,
    );
    if (pickingTeamId !== _draftState.userTeamId) throw new Error('Not your turn');

    const teamPicks = _draftState.picks.filter(p => p.teamId === pickingTeamId);
    const playerId = aiSelectPlayer(
      _draftState.prospects, teamPicks, _draftState.currentRound,
    );
    if (playerId >= 0) this._executePick(playerId, pickingTeamId);

    return this._buildDraftBoard();
  },

  async autoAdvanceDraft(): Promise<DraftBoardState> {
    if (!_draftState || _draftState.isComplete) throw new Error('No active draft');
    requireState();

    // AI picks until it's the user's turn or draft is complete
    while (!_draftState.isComplete) {
      const pickingTeamId = getPickingTeam(
        _draftState.draftOrder, _draftState.currentRound, _draftState.currentPickInRound,
      );
      if (pickingTeamId === _draftState.userTeamId) break;

      const teamPicks = _draftState.picks.filter(p => p.teamId === pickingTeamId);
      const playerId = aiSelectPlayer(
        _draftState.prospects, teamPicks, _draftState.currentRound,
      );
      if (playerId < 0) {
        // Pool exhausted — mark draft as complete so UI knows it ended early
        _draftState.isComplete = true;
        break;
      }
      this._executePick(playerId, pickingTeamId);
    }

    return this._buildDraftBoard();
  },

  async completeDraft(): Promise<void> {
    if (!_draftState) throw new Error('No draft to complete');
    const state = requireState();

    // Fill remaining roster spots from undrafted pool players
    fillRemainingRosters(state.players, state.teams);
    rebuildMaps();
    _draftState = null;
  },

  // ── Annual Amateur Draft ──────────────────────────────────────────────────

  async startAnnualDraft(): Promise<DraftBoardState> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    // Generate amateur draft class
    let annualClass: Player[];
    [annualClass, gen] = generateAnnualDraftClass(gen, state.season);

    // Assign unique IDs and add to global player list
    const maxId = state.players.reduce((m, p) => Math.max(m, p.playerId), 0);
    for (let i = 0; i < annualClass.length; i++) {
      annualClass[i].playerId = maxId + 1 + i;
    }
    state.players.push(...annualClass);

    // Scout the class with scouting accuracy from staff
    const staffBonuses = _foStaff.length > 0 ? computeStaffBonuses(_foStaff) : DEFAULT_BONUSES;
    let prospects: DraftProspect[];
    [prospects, gen] = scoutDraftPool(annualClass, staffBonuses.scoutingAccuracy, gen);

    // Draft order: inverse of standings (worst team picks first)
    const standings = state.teams
      .map(t => ({ teamId: t.teamId, wins: t.seasonRecord.wins }))
      .sort((a, b) => a.wins - b.wins);
    const draftOrder = standings.map(s => s.teamId);

    state.prngState = serializeState(gen);

    const totalRounds = getDraftRounds('annual'); // 5 rounds

    _draftState = {
      mode: 'annual',
      pool: annualClass,
      prospects,
      picks: [],
      draftOrder,
      currentRound: 1,
      currentPickInRound: 0,
      totalRounds,
      userTeamId: state.userTeamId,
      isComplete: false,
    };

    return this._buildDraftBoard();
  },

  async completeAnnualDraft(): Promise<{ draftedCount: number }> {
    if (!_draftState) throw new Error('No draft to complete');
    requireState();

    const draftedCount = _draftState.picks.length;

    // Undrafted annual prospects become free agents
    for (const p of _draftState.pool) {
      if (p.teamId === -1) {
        p.rosterData.rosterStatus = 'FREE_AGENT';
      }
    }

    rebuildMaps();
    _draftState = null;
    return { draftedCount };
  },

  // Internal: execute a single draft pick
  _executePick(playerId: number, teamId: number): void {
    if (!_draftState) return;

    // Find the player in pool
    const poolIdx = _draftState.pool.findIndex(p => p.playerId === playerId);
    if (poolIdx < 0) return;
    const player = _draftState.pool[poolIdx];

    // Assign to team
    player.teamId = teamId;
    if (_draftState.mode === 'annual') {
      // Annual draft picks start in minors with 6-year team control
      player.rosterData.rosterStatus = 'MINORS_ROOKIE';
      player.rosterData.isOn40Man = false;
      player.rosterData.contractYearsRemaining = 6;
      player.rosterData.salary = 500_000; // Pre-arb minimum
    } else {
      player.rosterData.rosterStatus = 'MLB_ACTIVE';
      player.rosterData.isOn40Man = true;
    }

    // Find prospect entry for display info
    const prospect = _draftState.prospects.find(p => p.playerId === playerId);
    const team = _teamMap.get(teamId);

    // Record pick
    const pick: DraftPick = {
      round: _draftState.currentRound,
      pickNumber: getOverallPick(
        _draftState.currentRound,
        _draftState.currentPickInRound,
        _draftState.draftOrder.length,
      ),
      teamId,
      teamAbbr: team?.abbreviation ?? '???',
      playerId,
      playerName: player.name,
      position: player.position,
      scoutedOvr: prospect?.scoutedOvr ?? 0,
    };
    _draftState.picks.push(pick);

    // Remove from available
    _draftState.pool.splice(poolIdx, 1);
    _draftState.prospects = _draftState.prospects.filter(p => p.playerId !== playerId);

    // Advance to next pick
    _draftState.currentPickInRound++;
    if (_draftState.currentPickInRound >= _draftState.draftOrder.length) {
      _draftState.currentRound++;
      _draftState.currentPickInRound = 0;
      if (_draftState.currentRound > _draftState.totalRounds) {
        _draftState.isComplete = true;
      }
    }

    rebuildMaps();
  },

  // Internal: build serializable board state for UI
  _buildDraftBoard(): DraftBoardState {
    if (!_draftState) throw new Error('No active draft');

    const pickingTeamId = _draftState.isComplete
      ? -1
      : getPickingTeam(_draftState.draftOrder, _draftState.currentRound, _draftState.currentPickInRound);
    const team = _teamMap.get(pickingTeamId);

    return {
      mode: _draftState.mode,
      available: _draftState.prospects.slice(0, 300),
      picks: _draftState.picks,
      draftOrder: _draftState.draftOrder,
      currentRound: _draftState.currentRound,
      currentPickInRound: _draftState.currentPickInRound,
      totalRounds: _draftState.totalRounds,
      userTeamId: _draftState.userTeamId,
      isUserTurn: pickingTeamId === _draftState.userTeamId,
      isComplete: _draftState.isComplete,
      pickingTeamId,
      pickingTeamAbbr: team?.abbreviation ?? '???',
      overallPick: _draftState.isComplete
        ? _draftState.picks.length
        : getOverallPick(_draftState.currentRound, _draftState.currentPickInRound, _draftState.draftOrder.length),
    };
  },

  // ── Advanced Stats ───────────────────────────────────────────────────────
  async getAdvancedStats(playerId: number): Promise<AdvancedHittingStats | AdvancedPitchingStats | null> {
    const stats = _playerSeasonStats.get(playerId);
    if (!stats) return null;
    const player = _playerMap.get(playerId);
    if (!player) return null;

    // Compute league averages if not cached
    if (!_cachedLeagueAverages) {
      const allStats = Array.from(_playerSeasonStats.values());
      _cachedLeagueAverages = computeLeagueAverages(allStats);
    }

    if (player.isPitcher) {
      return computeAdvancedPitching(stats, _cachedLeagueAverages);
    }
    return computeAdvancedHitting(stats, _cachedLeagueAverages);
  },

  async getLeaderboardAdvanced(
    category: 'hitting' | 'pitching',
    sortBy: string,
    limit = 30,
  ): Promise<Array<{
    rank: number;
    playerId: number;
    name: string;
    teamAbbr: string;
    position: string;
    age: number;
    stats: Record<string, number>;
  }>> {
    const state = requireState();

    if (!_cachedLeagueAverages) {
      const allStats = Array.from(_playerSeasonStats.values());
      _cachedLeagueAverages = computeLeagueAverages(allStats);
    }

    const entries: Array<{
      playerId: number;
      name: string;
      teamAbbr: string;
      position: string;
      age: number;
      sortValue: number;
      stats: Record<string, number>;
    }> = [];

    for (const [pid, seasonStats] of _playerSeasonStats) {
      const player = _playerMap.get(pid);
      if (!player) continue;

      if (category === 'hitting') {
        if (player.isPitcher) continue;
        if (seasonStats.pa < 100) continue;
        const adv = computeAdvancedHitting(seasonStats, _cachedLeagueAverages);
        const team = state.teams.find(t => t.teamId === player.teamId);
        entries.push({
          playerId: pid,
          name: player.name,
          teamAbbr: team?.abbreviation ?? '???',
          position: player.position,
          age: player.age,
          sortValue: (adv as unknown as Record<string, number>)[sortBy] ?? 0,
          stats: adv as unknown as Record<string, number>,
        });
      } else {
        if (!player.isPitcher) continue;
        if (seasonStats.outs < 60) continue; // 20+ IP
        const adv = computeAdvancedPitching(seasonStats, _cachedLeagueAverages);
        const team = state.teams.find(t => t.teamId === player.teamId);
        entries.push({
          playerId: pid,
          name: player.name,
          teamAbbr: team?.abbreviation ?? '???',
          position: player.position,
          age: player.age,
          sortValue: (adv as unknown as Record<string, number>)[sortBy] ?? 0,
          stats: adv as unknown as Record<string, number>,
        });
      }
    }

    // Sort: for FIP/ERA/xFIP/bb9/hr9/whip lower is better; for others higher is better
    const lowerIsBetter = ['fip', 'xFIP', 'era', 'bb9', 'hr9', 'whip', 'babip'];
    const ascending = lowerIsBetter.includes(sortBy);
    entries.sort((a, b) => ascending ? a.sortValue - b.sortValue : b.sortValue - a.sortValue);

    return entries.slice(0, limit).map((e, i) => ({
      rank: i + 1,
      playerId: e.playerId,
      name: e.name,
      teamAbbr: e.teamAbbr,
      position: e.position,
      age: e.age,
      stats: e.stats,
    }));
  },

  // ── AI Roster Moves ─────────────────────────────────────────────────────
  async getAIRosterMoves(): Promise<AIRosterMove[]> {
    return _lastAIRosterMoves;
  },

  // ── Lineup / Rotation Order ─────────────────────────────────────────────
  async setLineupOrder(ids: number[]): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    if (ids.length !== 9) return { ok: false, error: 'Lineup must have exactly 9 players.' };
    const unique = new Set(ids);
    if (unique.size !== 9) return { ok: false, error: 'Lineup contains duplicate players.' };
    // Validate all players exist and are on the user's active roster
    for (const id of ids) {
      const p = _playerMap.get(id);
      if (!p) return { ok: false, error: `Player #${id} not found.` };
      if (p.teamId !== state.userTeamId) return { ok: false, error: `${p.name} is not on your team.` };
      if (p.rosterData.rosterStatus !== 'MLB_ACTIVE') return { ok: false, error: `${p.name} is not on the active roster.` };
    }
    _lineupOrder = ids;
    return { ok: true };
  },

  async setRotationOrder(ids: number[]): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    if (ids.length === 0) return { ok: false, error: 'Rotation must have at least one pitcher.' };
    if (ids.length > 5) return { ok: false, error: 'Rotation can have at most 5 pitchers.' };
    const unique = new Set(ids);
    if (unique.size !== ids.length) return { ok: false, error: 'Rotation contains duplicate players.' };
    for (const id of ids) {
      const p = _playerMap.get(id);
      if (!p) return { ok: false, error: `Player #${id} not found.` };
      if (p.teamId !== state.userTeamId) return { ok: false, error: `${p.name} is not on your team.` };
      if (p.position !== 'SP') return { ok: false, error: `${p.name} is not a starting pitcher.` };
    }
    _rotationOrder = ids;
    return { ok: true };
  },

  async getLineupOrder(): Promise<number[]> {
    return _lineupOrder;
  },

  async getRotationOrder(): Promise<number[]> {
    return _rotationOrder;
  },

  // ── Career Leaderboards ────────────────────────────────────────────────────
  async getCareerLeaderboard(options: {
    category: 'hitting' | 'pitching';
    sortBy: string;
    limit?: number;
  }): Promise<Array<{
    rank: number;
    playerId: number;
    name: string;
    position: string;
    seasonsPlayed: number;
    isRetired: boolean;
    careerTotals: Record<string, number>;
  }>> {
    const { category, sortBy, limit = 25 } = options;
    const entries: Array<{
      playerId: number; name: string; position: string;
      seasonsPlayed: number; isRetired: boolean;
      sortValue: number; careerTotals: Record<string, number>;
    }> = [];

    // Helper: aggregate career totals
    function aggregate(seasons: import('../types/player').PlayerSeasonStats[]): Record<string, number> {
      const t: Record<string, number> = { g: 0, pa: 0, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0, w: 0, l: 0, sv: 0, hld: 0, bs: 0, gp: 0, gs: 0, outs: 0, ha: 0, ra: 0, er: 0, bba: 0, ka: 0, hra: 0 };
      for (const s of seasons) {
        for (const key of Object.keys(t)) {
          t[key] += (s as unknown as Record<string, number>)[key] ?? 0;
        }
      }
      // Derived stats
      t.avg = t.ab > 0 ? t.h / t.ab : 0;
      t.obp = t.pa > 0 ? (t.h + t.bb + t.hbp) / t.pa : 0;
      t.slg = t.ab > 0 ? (t.h - t.doubles - t.triples - t.hr + t.doubles * 2 + t.triples * 3 + t.hr * 4) / t.ab : 0;
      t.ops = t.obp + t.slg;
      t.era = t.outs > 0 ? (t.er / t.outs) * 27 : 0;
      t.whip = t.outs > 0 ? (t.ha + t.bba) / (t.outs / 3) : 0;
      t.ip = t.outs / 3;
      t.seasons = seasons.length;
      return t;
    }

    function isPitcherByStat(seasons: import('../types/player').PlayerSeasonStats[]): boolean {
      let totalOuts = 0; let totalAB = 0;
      for (const s of seasons) { totalOuts += s.outs; totalAB += s.ab; }
      return totalOuts > totalAB;
    }

    // Active players
    for (const [pid, seasons] of _careerHistory) {
      if (seasons.length === 0) continue;
      const isPitcher = isPitcherByStat(seasons);
      if ((category === 'hitting' && isPitcher) || (category === 'pitching' && !isPitcher)) continue;
      const player = _playerMap.get(pid);
      const totals = aggregate(seasons);
      entries.push({
        playerId: pid,
        name: player?.name ?? `Player ${pid}`,
        position: player?.position ?? 'UT',
        seasonsPlayed: seasons.length,
        isRetired: false,
        sortValue: totals[sortBy] ?? 0,
        careerTotals: totals,
      });
    }

    // Retired players
    for (const [pid, record] of _retiredCareerHistory) {
      if (record.seasons.length === 0) continue;
      const isPitcher = isPitcherByStat(record.seasons);
      if ((category === 'hitting' && isPitcher) || (category === 'pitching' && !isPitcher)) continue;
      const totals = aggregate(record.seasons);
      entries.push({
        playerId: pid,
        name: record.name,
        position: record.position,
        seasonsPlayed: record.seasons.length,
        isRetired: true,
        sortValue: totals[sortBy] ?? 0,
        careerTotals: totals,
      });
    }

    // Sort: for ERA/WHIP lower is better; for everything else higher is better
    const lowerIsBetter = ['era', 'whip'];
    const ascending = lowerIsBetter.includes(sortBy);
    entries.sort((a, b) => ascending ? a.sortValue - b.sortValue : b.sortValue - a.sortValue);

    return entries.slice(0, limit).map((e, i) => ({
      rank: i + 1,
      playerId: e.playerId,
      name: e.name,
      position: e.position,
      seasonsPlayed: e.seasonsPlayed,
      isRetired: e.isRetired,
      careerTotals: e.careerTotals,
    }));
  },

  // ── Hall of Fame ──────────────────────────────────────────────────────────
  async getHallOfFame(): Promise<HallOfFameInductee[]> {
    return _hallOfFame;
  },

  async getHOFCandidates(): Promise<HallOfFameCandidate[]> {
    if (!_state) return [];
    const existingInducteeIds = new Set(_hallOfFame.map(i => i.playerId));
    return identifyHOFCandidates(_retiredCareerHistory, _state.season, existingInducteeIds);
  },

  // ── Franchise Records ─────────────────────────────────────────────────────
  async getFranchiseRecords(): Promise<FranchiseRecordBook> {
    return _franchiseRecords ?? emptyRecordBook();
  },

  // ── Dev Lab ──────────────────────────────────────────────────────────────
  async assignDevProgram(playerId: number, program: DevProgram): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (player.teamId !== state.userTeamId) return { ok: false, error: 'Not your player' };
    // Max 10 active assignments
    const activeCount = Array.from(_devAssignments.values()).filter(a => a.program !== 'balanced').length;
    if (activeCount >= 10 && !_devAssignments.has(playerId)) {
      return { ok: false, error: 'Maximum 10 dev assignments reached' };
    }
    _devAssignments.set(playerId, { playerId, program, assignedSeason: state.season });
    return { ok: true };
  },

  async removeDevProgram(playerId: number): Promise<{ ok: boolean }> {
    _devAssignments.delete(playerId);
    return { ok: true };
  },

  async getDevAssignments(): Promise<Record<number, DevAssignment>> {
    const result: Record<number, DevAssignment> = {};
    for (const [pid, a] of _devAssignments) result[pid] = a;
    return result;
  },

  // ── Scouting ────────────────────────────────────────────────────────────
  async scoutPlayer(playerId: number): Promise<{ ok: boolean; report?: ScoutingReport; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (player.teamId === state.userTeamId) return { ok: false, error: 'Cannot scout your own players' };
    const staffBonuses = _foStaff.length > 0
      ? computeStaffBonuses(_foStaff) : DEFAULT_BONUSES;
    const existing = _scoutingReports.get(playerId);
    const report = generateScoutingReport(player, staffBonuses.scoutingAccuracy, state.season, existing);
    _scoutingReports.set(playerId, report);
    return { ok: true, report };
  },

  async getScoutingReports(): Promise<Record<number, ScoutingReport>> {
    const result: Record<number, ScoutingReport> = {};
    for (const [pid, r] of _scoutingReports) result[pid] = r;
    return result;
  },

  async getScoutedPlayerProfile(playerId: number): Promise<PlayerProfileData & { scoutingInfo?: { confidence: number; scouted: boolean } }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);
    const isUserTeam = player.teamId === state.userTeamId;
    const report = _scoutingReports.get(playerId);
    const display = getDisplayGrades(player, isUserTeam, report);

    const s = _playerSeasonStats.get(playerId);
    const grades: Record<string, number> = {};

    // For user team: show real grades; for others: apply fog
    if (isUserTeam) {
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
    } else {
      // Non-user team: show noisy grades based on scouting
      if (player.hitterAttributes) {
        const h = player.hitterAttributes;
        const noise = report ? (15 / (report.confidence + 0.3)) : 30;
        grades['CON'] = toScoutingScale(Math.round(h.contact + gaussianNoise(playerId * 10) * noise));
        grades['PWR'] = toScoutingScale(Math.round(h.power + gaussianNoise(playerId * 11) * noise));
        grades['EYE'] = toScoutingScale(Math.round(h.eye + gaussianNoise(playerId * 12) * noise));
        grades['SPD'] = toScoutingScale(Math.round(h.speed + gaussianNoise(playerId * 13) * noise));
        grades['FLD'] = toScoutingScale(Math.round(h.fielding + gaussianNoise(playerId * 14) * noise));
        grades['ARM'] = toScoutingScale(Math.round(h.armStrength + gaussianNoise(playerId * 15) * noise));
      } else if (player.pitcherAttributes) {
        const p = player.pitcherAttributes;
        const noise = report ? (15 / (report.confidence + 0.3)) : 30;
        grades['STF'] = toScoutingScale(Math.round(p.stuff + gaussianNoise(playerId * 10) * noise));
        grades['MOV'] = toScoutingScale(Math.round(p.movement + gaussianNoise(playerId * 11) * noise));
        grades['CMD'] = toScoutingScale(Math.round(p.command + gaussianNoise(playerId * 12) * noise));
        grades['STM'] = toScoutingScale(Math.round(p.stamina + gaussianNoise(playerId * 13) * noise));
      }
    }

    const seasonStats: null | { season: number; [key: string]: number } = s ? {
      season: state.season - 1,
      pa: s.pa, ab: s.ab, h: s.h, hr: s.hr, rbi: s.rbi, bb: s.bb, k: s.k, sb: s.sb,
      avg: s.ab > 0 ? Number((s.h / s.ab).toFixed(3)) : 0,
      obp: s.pa > 0 ? Number(((s.h + s.bb + s.hbp) / s.pa).toFixed(3)) : 0,
      w: s.w, l: s.l, sv: s.sv, era: s.outs > 0 ? Number(((s.er / s.outs) * 27).toFixed(2)) : 0,
      ip: Number((s.outs / 3).toFixed(1)), ka: s.ka, bba: s.bba,
    } : null;

    const team = state.teams.find(t => t.teamId === player.teamId);
    const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

    return {
      player: {
        playerId: player.playerId,
        name: player.name,
        age: player.age,
        position: player.position,
        bats: player.bats,
        throws: player.throws,
        overall: display.overall,
        potential: display.potential,
        grades,
        rosterStatus: player.rosterData.rosterStatus,
        serviceTimeDays: player.rosterData.serviceTimeDays,
        salary: player.rosterData.salary,
        contractYearsRemaining: player.rosterData.contractYearsRemaining,
        isPitcher,
        teamId: player.teamId,
        teamAbbr: team?.abbreviation ?? '---',
        optionYearsRemaining: player.rosterData.optionYearsRemaining,
        tradeValue: evaluatePlayer(player),
      },
      seasonStats,
      careerStats: _careerHistory.get(playerId) ?? [],
      scoutingInfo: !isUserTeam ? {
        confidence: display.confidence ?? 0,
        scouted: display.scouted,
      } : undefined,
    };
  },

  async getScoutablePlayers(
    teamId?: number,
    position?: string,
  ): Promise<Array<{
    playerId: number; name: string; position: string; age: number;
    teamId: number; teamAbbr: string; isPitcher: boolean;
    observedOverall: number; observedPotential: number;
    scouted: boolean; confidence: number | null;
  }>> {
    const state = requireState();
    return state.players
      .filter(p => {
        if (p.teamId === state.userTeamId) return false;
        if (p.rosterData.rosterStatus === 'RETIRED') return false;
        if (teamId !== undefined && p.teamId !== teamId) return false;
        if (position !== undefined && p.position !== position) return false;
        return true;
      })
      .map(p => {
        const report = _scoutingReports.get(p.playerId);
        const display = getDisplayGrades(p, false, report);
        const team = _teamMap.get(p.teamId);
        return {
          playerId: p.playerId,
          name: p.name,
          position: p.position,
          age: p.age,
          teamId: p.teamId,
          teamAbbr: team?.abbreviation ?? '---',
          isPitcher: p.isPitcher,
          observedOverall: display.overall,
          observedPotential: display.potential,
          scouted: display.scouted,
          confidence: display.confidence,
        };
      });
  },

  // ── Save / Load ────────────────────────────────────────────────────────────
  async getFullState(): Promise<LeagueState | null> {
    if (!_state) return null;
    // Serialize career history into the state for persistence
    const careerHistory: Record<string, import('../types/player').PlayerSeasonStats[]> = {};
    for (const [playerId, seasons] of _careerHistory) {
      careerHistory[String(playerId)] = seasons;
    }
    // Serialize retired career history
    const retiredPlayers: Record<string, RetiredPlayerRecord> = {};
    for (const [playerId, record] of _retiredCareerHistory) {
      retiredPlayers[String(playerId)] = record;
    }
    // Serialize player season stats
    const playerSeasonStats: Record<string, import('../types/player').PlayerSeasonStats> = {};
    for (const [playerId, stats] of _playerSeasonStats) {
      playerSeasonStats[String(playerId)] = stats;
    }
    // Serialize dev assignments
    const devAssignments: Record<string, DevAssignment> = {};
    for (const [pid, a] of _devAssignments) devAssignments[String(pid)] = a;
    // Serialize scouting reports
    const scoutingReports: Record<string, ScoutingReport> = {};
    for (const [pid, r] of _scoutingReports) scoutingReports[String(pid)] = r;
    return {
      ..._state,
      careerHistory,
      retiredPlayers,
      hallOfFame: _hallOfFame,
      franchiseRecords: _franchiseRecords ?? undefined,
      playerSeasonStats,
      lastAIRosterMoves: _lastAIRosterMoves,
      foStaff: _foStaff,
      draftState: _draftState ?? undefined,
      lineupOrder: _lineupOrder.length > 0 ? _lineupOrder : undefined,
      rotationOrder: _rotationOrder.length > 0 ? _rotationOrder : undefined,
      seasonResults: _seasonResults.length > 0 ? _seasonResults : undefined,
      seasonSimState: _seasonSimState ?? undefined,
      devAssignments: Object.keys(devAssignments).length > 0 ? devAssignments : undefined,
      scoutingReports: Object.keys(scoutingReports).length > 0 ? scoutingReports : undefined,
    };
  },

  async loadState(state: LeagueState): Promise<void> {
    // Clear all state before loading to prevent stale data
    _careerHistory = new Map();
    _retiredCareerHistory = new Map();
    _playerSeasonStats = new Map();
    _hallOfFame = [];
    _franchiseRecords = null;
    _foStaff = [];
    _lastAIRosterMoves = [];
    _draftState = null;
    _lineupOrder = [];
    _rotationOrder = [];
    _seasonResults = [];
    _seasonSimState = null;

    // Restore career history from serialized state
    if (state.careerHistory) {
      for (const [key, seasons] of Object.entries(state.careerHistory)) {
        _careerHistory.set(Number(key), seasons);
      }
    }
    // Restore retired career history
    if (state.retiredPlayers) {
      for (const [key, record] of Object.entries(state.retiredPlayers)) {
        _retiredCareerHistory.set(Number(key), record);
      }
    }
    // Restore player season stats
    if (state.playerSeasonStats) {
      for (const [key, stats] of Object.entries(state.playerSeasonStats)) {
        _playerSeasonStats.set(Number(key), stats);
      }
    }
    // Restore hall of fame and franchise records
    _hallOfFame = state.hallOfFame ?? [];
    _franchiseRecords = state.franchiseRecords ?? null;
    // Restore FO staff, AI roster moves, draft state
    _foStaff = state.foStaff ?? [];
    _lastAIRosterMoves = state.lastAIRosterMoves ?? [];
    _draftState = state.draftState ?? null;
    // Restore lineup/rotation order
    _lineupOrder = state.lineupOrder ?? [];
    _rotationOrder = state.rotationOrder ?? [];
    // Restore season results
    _seasonResults = state.seasonResults ?? [];
    // Restore in-season state (mid-season save)
    _seasonSimState = state.seasonSimState ?? null;
    // Restore dev assignments
    _devAssignments = new Map();
    if (state.devAssignments) {
      for (const [key, a] of Object.entries(state.devAssignments)) {
        _devAssignments.set(Number(key), a as DevAssignment);
      }
    }
    // Restore scouting reports
    _scoutingReports = new Map();
    if (state.scoutingReports) {
      for (const [key, r] of Object.entries(state.scoutingReports)) {
        _scoutingReports.set(Number(key), r as ScoutingReport);
      }
    }

    _state = state;

    // Recover any orphaned DRAFT_ELIGIBLE players (e.g. save during initial draft)
    recoverOrphanedDraftPlayers(state.players);

    rebuildMaps();
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  async getPlayerNameMap(): Promise<Record<number, string>> {
    const result: Record<number, string> = {};
    for (const [id, p] of _playerMap) {
      result[id] = p.name;
    }
    return result;
  },

  // ── International Signing Period ─────────────────────────────────────────

  async startIntlSigning(): Promise<{
    prospects: import('./internationalSigning').IntlProspect[];
    bonusPool: number;
  }> {
    const state = requireState();
    let gen = deserializeState(state.prngState);
    const maxId = state.players.reduce((m, p) => Math.max(m, p.playerId), 0);

    const [prospects, players, nextGen] = generateIntlClass(gen, maxId, state.season);
    gen = nextGen;

    // Add the raw players to the global pool
    state.players.push(...players);
    rebuildMaps();

    state.prngState = serializeState(gen);

    _intlProspects = prospects;

    return {
      prospects: prospects.filter(p => !p.signed),
      bonusPool: 5_500_000,
    };
  },

  async signIntlProspect(
    playerId: number,
    bonus: number,
  ): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Prospect not found.' };

    const result = signIntlProspectFn(player, state.userTeamId, bonus);
    if (result.ok) {
      // Mark as signed in prospect list
      const prospect = _intlProspects.find(p => p.playerId === playerId);
      if (prospect) {
        prospect.signed = true;
        prospect.signedByTeamId = state.userTeamId;
      }
      rebuildMaps();
    }
    return result;
  },

  async finishIntlSigning(): Promise<{
    aiSignings: Array<{ prospectName: string; teamId: number; teamAbbr: string; bonus: number }>;
  }> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    const teamInfos = state.teams.map(t => ({ teamId: t.teamId, abbreviation: t.abbreviation }));
    const [aiSignings, nextGen] = processAIIntlSignings(
      _intlProspects, state.players, teamInfos, state.userTeamId, gen,
    );
    gen = nextGen;

    // Unsigned prospects become free agents (will age out)
    for (const prospect of _intlProspects) {
      if (!prospect.signed) {
        const player = _playerMap.get(prospect.playerId);
        if (player) {
          player.rosterData.rosterStatus = 'FREE_AGENT';
        }
      }
    }

    state.prngState = serializeState(gen);
    rebuildMaps();
    _intlProspects = [];

    return { aiSignings };
  },

  // ── Pennant Race ──────────────────────────────────────────────────────────

  async getPennantRace(): Promise<{
    userDivisionRank: number;
    userGamesBack: number;
    userWildCardRank: number;
    userWCGamesBack: number;
    divisionLeader: { teamId: number; abbr: string; wins: number; losses: number };
    isInPlayoffPosition: boolean;
    magicNumber: number | null;
    eliminationNumber: number | null;
  }> {
    const state = requireState();
    const userTeam = _teamMap.get(state.userTeamId);
    if (!userTeam) throw new Error('User team not found');

    const standings = _buildStandings(state);
    const userRow = standings.find(r => r.teamId === state.userTeamId);
    if (!userRow) throw new Error('User team not in standings');

    // Division standings
    const divTeams = standings
      .filter(r => r.league === userRow.league && r.division === userRow.division)
      .sort((a, b) => b.pct - a.pct || b.wins - a.wins);

    const divRank = divTeams.findIndex(r => r.teamId === state.userTeamId) + 1;
    const divLeader = divTeams[0];
    const divGB = divRank > 1
      ? ((divLeader.wins - userRow.wins) + (userRow.losses - divLeader.losses)) / 2
      : 0;

    // Wild card standings (league-wide, excluding div winners)
    const leagueTeams = standings.filter(r => r.league === userRow.league).sort((a, b) => b.pct - a.pct);
    const divWinnerIds = new Set<number>();
    const divs = ['East', 'Central', 'West'];
    for (const div of divs) {
      const divStandings = leagueTeams.filter(r => r.division === div);
      if (divStandings.length > 0) divWinnerIds.add(divStandings[0].teamId);
    }

    const wcTeams = leagueTeams.filter(r => !divWinnerIds.has(r.teamId));
    const wcRank = wcTeams.findIndex(r => r.teamId === state.userTeamId) + 1;
    const wcGamesBack = wcRank > 3 && wcTeams[2]
      ? ((wcTeams[2].wins - userRow.wins) + (userRow.losses - wcTeams[2].losses)) / 2
      : 0;

    const isInPlayoffPosition = divRank === 1 || wcRank <= 3;
    const totalGames = 162;
    const userGamesPlayed = userRow.wins + userRow.losses;
    const gamesRemaining = totalGames - userGamesPlayed;

    // Magic number: games remaining + 1 - lead over next team
    let magicNumber: number | null = null;
    if (divRank === 1 && divTeams.length > 1) {
      const secondPlace = divTeams[1];
      const secondRemaining = totalGames - secondPlace.wins - secondPlace.losses;
      magicNumber = Math.max(0, secondRemaining + 1 - (userRow.wins - secondPlace.wins));
      if (magicNumber <= 0) magicNumber = 0; // Already clinched
    }

    // Elimination number
    let eliminationNumber: number | null = null;
    if (divRank > 1 && gamesRemaining > 0) {
      eliminationNumber = gamesRemaining + 1 - Math.abs(divGB * 2);
      if (eliminationNumber <= 0) eliminationNumber = 0; // Eliminated
    }

    return {
      userDivisionRank: divRank,
      userGamesBack: divGB,
      userWildCardRank: wcRank,
      userWCGamesBack: wcGamesBack,
      divisionLeader: {
        teamId: divLeader.teamId,
        abbr: divLeader.abbreviation,
        wins: divLeader.wins,
        losses: divLeader.losses,
      },
      isInPlayoffPosition,
      magicNumber,
      eliminationNumber,
    };
  },

  // ── Playoff MVP ────────────────────────────────────────────────────────────

  async getPlayoffMVP(bracket: import('./sim/playoffSimulator').PlayoffBracket): Promise<{
    playerId: number;
    name: string;
    teamAbbr: string;
    position: string;
    statLine: string;
  } | null> {
    if (!bracket.championId) return null;
    const state = requireState();

    // Find the champion's players
    const champPlayers = state.players.filter(p => p.teamId === bracket.championId);
    if (champPlayers.length === 0) return null;

    // Simple MVP: highest OVR on champion team
    const mvp = champPlayers.reduce((best, p) => p.overall > best.overall ? p : best, champPlayers[0]);
    const team = _teamMap.get(mvp.teamId);
    const stats = _playerSeasonStats.get(mvp.playerId);

    let statLine: string;
    if (mvp.isPitcher && stats) {
      const era = stats.outs > 0 ? ((stats.er / stats.outs) * 27).toFixed(2) : '0.00';
      statLine = `${stats.w}-${stats.l}, ${era} ERA`;
    } else if (stats) {
      const avg = stats.ab > 0 ? (stats.h / stats.ab).toFixed(3) : '.000';
      statLine = `${avg} / ${stats.hr} HR / ${stats.rbi} RBI`;
    } else {
      statLine = 'OVR ' + Math.round(20 + (mvp.overall / 550) * 60);
    }

    return {
      playerId: mvp.playerId,
      name: mvp.name,
      teamAbbr: team?.abbreviation ?? '???',
      position: mvp.position,
      statLine,
    };
  },

  // ── Interactive Season Pacing — Chunked simulation ─────────────────────────

  /**
   * Initialize a new season for chunked (interactive) play.
   * Performs all the same setup as simulateSeason() (roster guard, counter reset,
   * lineup scrub) but does NOT sim any games. Returns segment metadata.
   */
  async startInSeason(): Promise<{
    totalGames: number;
    segmentCount: number;
    segments: Array<{ index: number; label: string }>;
  }> {
    const state = requireState();
    const gen = deserializeState(state.prngState);

    // Same setup as simulateSeason() preamble
    ensureMinimumRosters(state.players, state.teams);
    _cachedLeagueAverages = null;
    resetSeasonCounters(state.players);
    _scrubLineupRotation();

    // Reset team season records to zero for the new season
    for (const t of state.teams) {
      t.seasonRecord = { wins: 0, losses: 0, runsScored: 0, runsAllowed: 0 };
    }

    // Create the incremental sim state
    _seasonSimState = createSeasonSimState(
      state.teams,
      state.schedule.length,
      state.season,
      Number(gen.next()[0]),
    );

    return {
      totalGames: state.schedule.length,
      segmentCount: SEGMENT_COUNT,
      segments: SEGMENTS.map(s => ({ index: s.index, label: s.label })),
    };
  },

  /**
   * Simulate the next month's chunk of games.
   * Returns the segment result with partial standings, user record, and next event.
   */
  async simNextChunk(onProgress?: (pct: number) => void): Promise<ChunkResult> {
    const state = requireState();
    if (!_seasonSimState) throw new Error('Call startInSeason() first');
    if (_seasonSimState.isComplete) throw new Error('Season already complete');

    const chunkResult = simulateChunk(
      _seasonSimState,
      state.teams,
      state.players,
      state.schedule,
      {
        userTeamId: state.userTeamId,
        userLineupOrder: _lineupOrder.length === 9 ? _lineupOrder : undefined,
        userRotationOrder: _rotationOrder.length > 0 ? _rotationOrder : undefined,
      },
      onProgress,
    );

    // Sync player season stats to worker-level cache (so getStandings/getRoster work)
    _playerSeasonStats.clear();
    for (const [key, val] of Object.entries(_seasonSimState.playerStats)) {
      _playerSeasonStats.set(Number(key), val);
    }

    return chunkResult;
  },

  /**
   * Granular simulation: sim by day, week, or month.
   * Stops at segment boundaries to preserve event triggers.
   */
  async simRange(
    mode: 'day' | 'week' | 'month',
    onProgress?: (pct: number) => void,
  ): Promise<SimRangeResult> {
    const state = requireState();
    if (!_seasonSimState) throw new Error('Call startInSeason() first');
    if (_seasonSimState.isComplete) throw new Error('Season already complete');

    let targetIndex: number;
    switch (mode) {
      case 'day':
        targetIndex = computeSim1DayTarget(_seasonSimState, state.schedule);
        break;
      case 'week':
        targetIndex = computeSim1WeekTarget(_seasonSimState, state.schedule);
        break;
      case 'month':
        targetIndex = computeSim1MonthTarget(_seasonSimState, state.schedule);
        break;
    }

    const result = simulateRange(
      _seasonSimState,
      state.teams,
      state.players,
      state.schedule,
      targetIndex,
      {
        userTeamId: state.userTeamId,
        userLineupOrder: _lineupOrder.length === 9 ? _lineupOrder : undefined,
        userRotationOrder: _rotationOrder.length > 0 ? _rotationOrder : undefined,
      },
      onProgress,
    );

    // Sync player season stats to worker-level cache
    _playerSeasonStats.clear();
    for (const [key, val] of Object.entries(_seasonSimState.playerStats)) {
      _playerSeasonStats.set(Number(key), val);
    }

    return result;
  },

  /**
   * Get current schedule position info for UI display.
   */
  async getCurrentScheduleInfo(): Promise<{
    gamesCompleted: number;
    totalGames: number;
    currentDate: string | null;
    currentSegment: number;
  }> {
    if (!_seasonSimState) throw new Error('No in-season state');
    const state = requireState();
    const idx = _seasonSimState.gamesCompleted;
    const currentDate = idx < state.schedule.length
      ? state.schedule[idx]!.date
      : null;
    return {
      gamesCompleted: _seasonSimState.gamesCompleted,
      totalGames: _seasonSimState.totalGames,
      currentDate,
      currentSegment: _seasonSimState.currentSegment,
    };
  },

  /**
   * Fast-forward: sim all remaining chunks, then finalize the season.
   * Equivalent to calling simNextChunk() in a loop then finalizeSeason().
   * Returns the full enriched SeasonResult.
   */
  async simRemainingChunks(onProgress?: (pct: number) => void): Promise<SeasonResult> {
    const state = requireState();
    if (!_seasonSimState) throw new Error('Call startInSeason() first');

    // Sim all remaining chunks
    while (!_seasonSimState.isComplete) {
      simulateChunk(
        _seasonSimState,
        state.teams,
        state.players,
        state.schedule,
        {
          userTeamId: state.userTeamId,
          userLineupOrder: _lineupOrder.length === 9 ? _lineupOrder : undefined,
          userRotationOrder: _rotationOrder.length > 0 ? _rotationOrder : undefined,
        },
        onProgress,
      );
    }

    // Sync player stats
    _playerSeasonStats.clear();
    for (const [key, val] of Object.entries(_seasonSimState.playerStats)) {
      _playerSeasonStats.set(Number(key), val);
    }

    // Finalize
    return this.finalizeSeason();
  },

  /**
   * Finalize the season after all chunks complete.
   * Runs post-sim processing: injuries, AI roster moves, awards, development,
   * service time, franchise records, Hall of Fame, PRNG serialization.
   */
  async finalizeSeason(): Promise<SeasonResult> {
    const state = requireState();
    if (!_seasonSimState) throw new Error('No in-season state');

    const partial = buildPartialResult(_seasonSimState, state.teams);

    // Build the base SeasonResult from partial
    const result: SeasonResult = {
      season: partial.season,
      teamSeasons: partial.teamSeasons,
      playerSeasons: partial.playerSeasons,
      boxScores: [],
      leagueBA: partial.leagueBA,
      leagueERA: partial.leagueERA,
      leagueRPG: partial.leagueRPG,
      teamWinsSD: partial.teamWinsSD,
    };

    // Accumulate career history
    for (const ps of result.playerSeasons) {
      const record = { ...ps, season: state.season };
      const history = _careerHistory.get(ps.playerId) ?? [];
      history.push(record);
      _careerHistory.set(ps.playerId, history);
    }

    // ── Injuries ────────────────────────────────────────────────────────────
    let gen = deserializeState(state.prngState);
    // Advance gen past the seed used for startInSeason
    [, gen] = gen.next();

    const injurySeed = Number(gen.next()[0]);
    [, gen] = gen.next();

    for (const p of state.players) {
      if (p.rosterData.currentInjury) {
        p.rosterData.currentInjury = undefined;
        if (p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60') {
          p.rosterData.rosterStatus = 'MLB_ACTIVE';
        }
      }
    }

    const staffBonuses = _foStaff.length > 0 ? computeStaffBonuses(_foStaff) : DEFAULT_BONUSES;

    const injuryEvents = processSeasonInjuries(
      state.players, state.schedule.length, injurySeed, state.season,
      staffBonuses.injuryRateMultiplier,
      staffBonuses.recoverySpeedMultiplier,
    );

    // ── AI roster moves ────────────────────────────────────────────────────
    const rosterMoveSeed = Math.abs(injurySeed * 3 + state.season * 17);
    _lastAIRosterMoves = processAIRosterMoves(
      state.players, state.teams, state.userTeamId, rosterMoveSeed,
    );

    // ── Cache league averages ────────────────────────────────────────────
    const allSeasonStats = Array.from(_playerSeasonStats.values());
    _cachedLeagueAverages = computeLeagueAverages(allSeasonStats);

    // ── Awards ──────────────────────────────────────────────────────────────
    const awards = computeAwards(state.players, _playerSeasonStats, state.teams);
    const divisionChampions = computeDivisionChampions(state.teams);

    // ── Service time ────────────────────────────────────────────────────────
    for (let d = 0; d < 172; d++) {
      advanceServiceTime(state.players, d);
    }

    // ── Offseason development ──────────────────────────────────────────────
    const devAssignmentsObj2: Record<number, DevAssignment> = {};
    for (const [pid, a] of _devAssignments) devAssignmentsObj2[pid] = a;
    const offseasonResult = advanceOffseason(state.players, gen, {
      hitter: staffBonuses.hitterDevMultiplier,
      pitcher: staffBonuses.pitcherDevMultiplier,
    }, devAssignmentsObj2);
    state.players = offseasonResult.players;
    gen = offseasonResult.gen;

    // ── Retired players ────────────────────────────────────────────────────
    const retiredEvents = (offseasonResult.events ?? []).filter(e => e.type === 'retirement');
    for (const evt of retiredEvents) {
      const career = _careerHistory.get(evt.playerId);
      if (career && career.length > 0) {
        const player = _playerMap.get(evt.playerId);
        _retiredCareerHistory.set(evt.playerId, {
          name: evt.playerName,
          position: player?.position ?? 'UT',
          seasons: career,
          retiredSeason: state.season,
        });
      }
    }

    rebuildMaps();

    // ── Franchise records ──────────────────────────────────────────────────
    const userTeamRecord = result.teamSeasons.find(ts => ts.teamId === state.userTeamId);
    if (userTeamRecord) {
      const recBook = _franchiseRecords ?? emptyRecordBook();
      const recResult = updateFranchiseRecords(
        recBook, _playerSeasonStats, _careerHistory, _playerMap,
        { wins: userTeamRecord.record.wins, losses: userTeamRecord.record.losses },
        state.season, state.userTeamId,
      );
      _franchiseRecords = recResult.records;
    }

    // ── Hall of Fame ────────────────────────────────────────────────────────
    const existingInducteeIds = new Set(_hallOfFame.map(i => i.playerId));
    const hofCandidates = identifyHOFCandidates(_retiredCareerHistory, state.season, existingInducteeIds);
    if (hofCandidates.length > 0) {
      const hofSeed = state.season * 31337;
      const votingResult = simulateHOFVoting(hofCandidates, hofSeed);
      _hallOfFame.push(...votingResult.inducted);
    }

    state.prngState = serializeState(gen);
    _seasonResults.push(result);
    state.season++;

    // Clear in-season state (season is done)
    _seasonSimState = null;

    return {
      ...result,
      awards,
      divisionChampions,
      developmentEvents: offseasonResult.events,
      injuryEvents,
    };
  },

  /** Get current in-season state (for UI display during pauses). */
  async getInSeasonState(): Promise<SeasonSimState | null> {
    return _seasonSimState;
  },

  async ping(): Promise<string> {
    return 'pong';
  },
};

export type WorkerAPI = typeof api;
Comlink.expose(api);
