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
import { simulateSeason, simulateGamesRange, advanceServiceTime, resetSeasonCounters } from './sim/seasonSimulator';
import type { PitcherRestMap } from './sim/pitcherRest';
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
import { recordSeasonStats, evaluateHOFCandidates, getAllTimeLeaders, getCareerRecords, restoreCareerRecords, getFranchiseRecords, type CareerStat, type AllTimeLeader, type HOFCandidate, type FranchiseRecord, type CareerRecord } from './history/careerStats';
import { processSeasonInjuries, type Injury } from './injuries/injuryEngine';
import { runRule5Draft, identifyRule5Eligible, protectPlayer, type Rule5Selection, type Rule5Eligible } from './offseason/rule5Draft';
import { processArbitration, type ArbitrationCase } from './offseason/arbitration';
import { simulateTradeDeadline, type DeadlineDeal } from './trade/tradeDeadline';
import { generateIntlClass, runAIIntlSigning, type IntlProspect } from './offseason/intlSigning';
import { optimizeLineup } from './sim/lineupOptimizer';
import { recordSeasonAwards, recordChampion, recordTransaction, checkMilestones, getAwardHistory, getChampionHistory, getTransactionLog, getMilestones, restoreAwardsHistory, type AwardHistoryEntry, type ChampionHistoryEntry, type TransactionLog as TxnLog, type SeasonMilestone } from './history/awardsHistory';
import { computeAllAdvancedStats, type AdvancedHitterStats, type AdvancedPitcherStats, type LeagueEnvironment } from './analytics/sabermetrics';
import { generateInitialStaff, generateCoachingPool, getCoachingStaffData, computeCoachingEffects, advanceCoachContracts, type Coach, type CoachingStaffData } from './coaching/coachingStaff';
import { getExtensionCandidates, evaluateExtension, runAIExtensions, type ExtensionOffer, type ExtensionResult, type ExtensionCandidate } from './contracts/extensions';
import { processWaivers, getWaiverPlayers, claimWaiverPlayer, type WaiverPlayer, type WaiverClaim } from './waivers/waiverWire';
import { computeTeamChemistry, type TeamChemistryData } from './chemistry/teamChemistry';
import { initializeOwnerGoals, evaluateSeason as evaluateGMSeason, generateSeasonGoals, type OwnerGoalsState } from './owner/ownerGoals';
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
let _seasonInjuries: Injury[] = [];               // Current season's injuries
let _arbHistory: ArbitrationCase[] = [];           // All arbitration cases
let _rule5History: Rule5Selection[] = [];          // All Rule 5 selections
let _deadlineDeals: DeadlineDeal[] = [];           // All trade deadline deals
let _intlProspects: IntlProspect[] = [];           // Current intl signing class
let _coachingStaff = new Map<number, Coach[]>();    // teamId → coaches
let _coachingPool: Coach[] = [];                    // Available coaches for hiring
let _extensionHistory: ExtensionResult[] = [];      // All extension results
let _waiverHistory: WaiverClaim[] = [];             // All waiver claims
let _ownerGoals: OwnerGoalsState | null = null;     // Owner/GM goals state

// ─── Granular sim tracking ──────────────────────────────────────────────────
let _gamesPlayed = 0;         // How many schedule entries have been simulated this season
let _simRotationIndex = new Map<number, number>();
let _simBullpenOffset = new Map<number, number>();
let _simPitcherRestMap: PitcherRestMap = new Map();
let _recentGames: import('../types/game').GameSummary[] = [];
let _simTeamWins = new Map<number, number>();
let _simTeamLosses = new Map<number, number>();
let _simTeamRS = new Map<number, number>();
let _simTeamRA = new Map<number, number>();

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

    // Initialize coaching staffs for all teams
    let coachGen = nextGen;
    for (const team of teams) {
      let coachSeed: number;
      [coachSeed, coachGen] = coachGen.next();
      let s = coachSeed >>> 0;
      const rand = () => { s = Math.imul(s + 0x9e3779b9, s) >>> 0; return s / 0x100000000; };
      _coachingStaff.set(team.teamId, generateInitialStaff(rand));
    }
    // Generate hiring pool
    let poolSeed: number;
    [poolSeed, coachGen] = coachGen.next();
    let ps = poolSeed >>> 0;
    _coachingPool = generateCoachingPool(25, () => { ps = Math.imul(ps + 0x9e3779b9, ps) >>> 0; return ps / 0x100000000; });

    // Initialize owner/GM goals
    let ownerSeed: number;
    [ownerSeed, coachGen] = coachGen.next();
    let os = ownerSeed >>> 0;
    _ownerGoals = initializeOwnerGoals('balanced', 'competitive', () => { os = Math.imul(os + 0x9e3779b9, os) >>> 0; return os / 0x100000000; });

    return { ok: true, season: _state.season, teamCount: teams.length };
  },

  // ── Simulate a season ─────────────────────────────────────────────────────
  async simulateSeason(onProgressCallback?: (pct: number) => void): Promise<SeasonResult> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    // Reset counters at season start
    resetSeasonCounters(state.players);

    // Build lineups map from saved data
    const lineupsMap = new Map<number, number[]>();
    for (const [teamId, lu] of _lineups) {
      lineupsMap.set(teamId, lu.battingOrder);
    }

    const result = await simulateSeason(
      state.teams,
      state.players,
      state.schedule,
      Number(gen.next()[0]),
      onProgressCallback,
      lineupsMap,
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

    // ── Mid-season injuries ─────────────────────────────────────────────────────
    let injSeed: number;
    [injSeed, gen] = gen.next();
    const injuryReport = processSeasonInjuries(
      state.players, 162,
      (gameNum, playerIdx) => ((injSeed >>> 0) * 31 + gameNum * 7919 + playerIdx * 104729) >>> 0,
    );
    _seasonInjuries = injuryReport.seasonInjuries;

    // ── Mid-season trade deadline (after ~100 games) ────────────────────────────
    const deadlineResult = simulateTradeDeadline(state.players, state.teams, state.userTeamId);
    _deadlineDeals.push(...deadlineResult.deals);
    for (const deal of deadlineResult.deals) {
      recordTransaction(state.season, 'Trade Deadline', 'Trade', deal.headline, [deal.buyerTeamId, deal.sellerTeamId]);
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

    // ── Record awards history ────────────────────────────────────────────────────
    recordSeasonAwards(
      state.season, awards,
      state.teams.map(t => ({ teamId: t.teamId, name: t.name })),
      _playerSeasonStats as Map<number, { pa: number; ab: number; h: number; hr: number; rbi: number; outs: number; er: number; w: number; ka: number; sv: number }>,
    );

    // Record champion
    if (playoffBracket?.champion) {
      const champ = playoffBracket.champion;
      const champTeam = state.teams.find(t => t.teamId === champ.teamId);
      if (champTeam) {
        recordChampion(
          state.season, champTeam.teamId, champTeam.name,
          `${champTeam.seasonRecord.wins}-${champTeam.seasonRecord.losses}`,
        );
      }
    }

    // ── Check career milestones ────────────────────────────────────────────────
    const careerMap = new Map<number, { name: string; h: number; hr: number; ka: number; w: number; sv: number }>();
    for (const [pid, s] of _playerSeasonStats) {
      const player = _playerMap.get(pid);
      if (!player) continue;
      careerMap.set(pid, { name: player.name, h: s.h, hr: s.hr, ka: s.ka, w: s.w, sv: s.sv });
    }
    checkMilestones(state.season, careerMap);

    // ── Arbitration (pre-FA salary hearings) ─────────────────────────────────────
    const arbResult = processArbitration(state.players);
    _arbHistory.push(...arbResult.cases);
    for (const c of arbResult.cases) {
      const outcome = c.isSettled ? 'settled' : (c.playerWon ? 'player won hearing' : 'team won hearing');
      recordTransaction(state.season, 'Offseason', 'Arbitration',
        `${c.name} (${c.position}) — $${(c.projectedSalary / 1_000_000).toFixed(1)}M (${outcome})`,
        [c.teamId]);
    }

    // ── Rule 5 Draft ─────────────────────────────────────────────────────────────
    const rule5Result = runRule5Draft(state.players, state.teams, state.userTeamId, state.season);
    _rule5History.push(...rule5Result.selections);
    for (const sel of rule5Result.selections) {
      recordTransaction(state.season, 'Offseason', 'Rule 5',
        `${sel.toTeamName} select ${sel.playerName} (${sel.position}) from ${sel.fromTeamName}`,
        [sel.toTeamId, sel.fromTeamId]);
    }

    // ── International Signing Period ─────────────────────────────────────────────
    const userTeam = _teamMap.get(state.userTeamId);
    let intlProspects: IntlProspect[];
    [intlProspects, gen] = generateIntlClass(gen, userTeam?.scoutingQuality ?? 0.7, state.season);
    const intlResult = runAIIntlSigning(intlProspects, state.players, state.teams, state.userTeamId);
    _intlProspects = intlProspects;
    for (const sig of intlResult.signings) {
      recordTransaction(state.season, 'J2 Period', 'Intl Signing',
        `${sig.teamName} sign ${sig.playerName} ($${(sig.bonus / 1_000_000).toFixed(1)}M bonus)`,
        [sig.teamId]);
    }

    // ── AI free agency (AI teams sign available free agents) ───────────────────
    const faResult = runAIFreeAgency(state.players, state.teams, state.userTeamId);
    for (const sig of faResult.signings) {
      recordTransaction(state.season, 'Offseason', 'Signing',
        `${sig.teamName} sign ${sig.playerName} (${sig.years}yr/$${(sig.salary / 1_000_000).toFixed(1)}M)`,
        [sig.teamId]);
    }

    // ── Process waivers (DFA'd players claimed or cleared) ────────────────────
    const waiverResult = processWaivers(state.players, state.teams, state.userTeamId);
    _waiverHistory.push(...waiverResult.claims);
    for (const claim of waiverResult.claims) {
      recordTransaction(state.season, 'Offseason', 'DFA',
        `${claim.claimTeamName} claim ${claim.playerName} (${claim.position}) off waivers from ${claim.formerTeamName}`,
        [claim.claimTeamId, claim.formerTeamId]);
    }

    // ── AI contract extensions ─────────────────────────────────────────────────
    const extTeams = state.teams.map(t => ({ teamId: t.teamId, name: t.name, budget: t.budget, strategy: t.strategy }));
    const extResults = runAIExtensions(state.players, extTeams, state.userTeamId);
    _extensionHistory.push(...extResults);
    for (const ext of extResults) {
      recordTransaction(state.season, 'Offseason', 'Signing',
        `${ext.playerName} signs ${ext.years}yr/$${(ext.totalValue / 1_000_000).toFixed(1)}M extension`,
        []);
    }

    // ── Advance coaching contracts ─────────────────────────────────────────────
    for (const [teamId, coaches] of _coachingStaff) {
      const { remaining } = advanceCoachContracts(coaches);
      _coachingStaff.set(teamId, remaining);
    }

    // ── Evaluate owner/GM goals ────────────────────────────────────────────────
    if (_ownerGoals) {
      const userTeamRecord = state.teams.find(t => t.teamId === state.userTeamId);
      const madePlayoffs = result.teamSeasons.some(ts =>
        ts.teamId === state.userTeamId && ts.playoffRound !== undefined
      );
      const wonChamp = playoffBracket?.champion?.teamId === state.userTeamId;
      const payroll = computePayroll(state.players, state.userTeamId);
      const prospectsPromoted = state.players.filter(p =>
        p.teamId === state.userTeamId &&
        p.rosterData.rosterStatus === 'MLB_ACTIVE' &&
        p.rosterData.serviceTimeDays <= 172
      ).length;

      const gmEval = evaluateGMSeason(
        _ownerGoals, state.season,
        userTeamRecord?.seasonRecord.wins ?? 0,
        userTeamRecord?.seasonRecord.losses ?? 0,
        madePlayoffs, wonChamp, payroll,
        userTeamRecord?.budget ?? 100_000_000,
        prospectsPromoted,
      );
      _ownerGoals.evaluations.push(gmEval);
      _ownerGoals.jobSecurity = gmEval.jobSecurity;
      _ownerGoals.yearsAsGM++;
      if (gmEval.mandateChange) {
        _ownerGoals.mandate = gmEval.mandateChange;
      }
      // Generate next season's goals
      _ownerGoals.seasonGoals = generateSeasonGoals(
        _ownerGoals.mandate, _ownerGoals.owner,
        userTeamRecord?.seasonRecord.wins ?? 81,
      );
    }

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

  // ── Granular Sim Controls ────────────────────────────────────────────────
  // Sim a specific number of games from current position
  async simGames(
    count: number,
    onProgress?: (pct: number) => void,
  ): Promise<{ gamesPlayed: number; totalScheduled: number }> {
    const state = requireState();
    const gen = deserializeState(state.prngState);
    const baseSeed = Number(gen.next()[0]);

    const endIdx = Math.min(_gamesPlayed + count, state.schedule.length);

    // Build lineups map from saved data
    const lineupsForSim = new Map<number, number[]>();
    for (const [tid, lu] of _lineups) {
      lineupsForSim.set(tid, lu.battingOrder);
    }

    const result = await simulateGamesRange({
      teams: state.teams,
      players: state.players,
      schedule: state.schedule,
      baseSeed,
      startGameIndex: _gamesPlayed,
      endGameIndex: endIdx,
      lineups: lineupsForSim,
      existingStats: _playerSeasonStats,
      existingTeamWins: _simTeamWins,
      existingTeamLosses: _simTeamLosses,
      existingTeamRS: _simTeamRS,
      existingTeamRA: _simTeamRA,
      rotationIndex: _simRotationIndex,
      bullpenOffset: _simBullpenOffset,
      pitcherRestMap: _simPitcherRestMap,
      userTeamId: state.userTeamId,
      onProgress,
    });

    // Update carry-over state
    _playerSeasonStats = result.playerStatsMap;
    _simTeamWins = result.teamWins;
    _simTeamLosses = result.teamLosses;
    _simTeamRS = result.teamRS;
    _simTeamRA = result.teamRA;
    _simRotationIndex = result.rotationIndex;
    _simBullpenOffset = result.bullpenOffset;
    _simPitcherRestMap = result.pitcherRestMap;
    _recentGames = result.recentGames;
    _gamesPlayed = endIdx;

    // Update team records so standings reflect partial season
    for (const team of state.teams) {
      team.seasonRecord = {
        wins: result.teamWins.get(team.teamId) ?? 0,
        losses: result.teamLosses.get(team.teamId) ?? 0,
        runsScored: result.teamRS.get(team.teamId) ?? 0,
        runsAllowed: result.teamRA.get(team.teamId) ?? 0,
      };
    }

    return { gamesPlayed: _gamesPlayed, totalScheduled: state.schedule.length };
  },

  // Sim one week (~11 games per team, ~45 total league games)
  async simWeek(onProgress?: (pct: number) => void) {
    return this.simGames(45, onProgress);
  },

  // Sim one month (~27 games per team, ~200 total league games)
  async simMonth(onProgress?: (pct: number) => void) {
    return this.simGames(200, onProgress);
  },

  // Sim to the All-Star break (~half season, ~1215 games)
  async simToAllStarBreak(onProgress?: (pct: number) => void) {
    const state = requireState();
    const allStarGame = Math.floor(state.schedule.length / 2);
    const remaining = Math.max(0, allStarGame - _gamesPlayed);
    return this.simGames(remaining, onProgress);
  },

  // Sim to the trade deadline (~100 games per team, ~1620 total)
  async simToTradeDeadline(onProgress?: (pct: number) => void) {
    const state = requireState();
    const deadline = Math.floor(state.schedule.length * 0.62); // ~100/162 of season
    const remaining = Math.max(0, deadline - _gamesPlayed);
    return this.simGames(remaining, onProgress);
  },

  // Sim remaining games to end of season
  async simRest(onProgress?: (pct: number) => void) {
    const state = requireState();
    const remaining = Math.max(0, state.schedule.length - _gamesPlayed);
    return this.simGames(remaining, onProgress);
  },

  // Get current sim progress
  async getSimProgress(): Promise<{ gamesPlayed: number; totalScheduled: number; pct: number }> {
    const state = requireState();
    const total = state.schedule.length;
    return {
      gamesPlayed: _gamesPlayed,
      totalScheduled: total,
      pct: total > 0 ? _gamesPlayed / total : 0,
    };
  },

  // ── Recent Games ─────────────────────────────────────────────────────────
  async getRecentGames(): Promise<import('../types/game').GameSummary[]> {
    return _recentGames;
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
        case 'slg': {
          if (s.ab < 100) { value = 0; break; }
          const tb = (s.h - s.doubles - s.triples - s.hr) + s.doubles * 2 + s.triples * 3 + s.hr * 4;
          value = tb / s.ab;
          break;
        }
        case 'ops': {
          if (s.ab < 100 || s.pa < 100) { value = 0; break; }
          const obp = (s.h + s.bb + s.hbp) / s.pa;
          const totalBases = (s.h - s.doubles - s.triples - s.hr) + s.doubles * 2 + s.triples * 3 + s.hr * 4;
          value = obp + totalBases / s.ab;
          break;
        }
        case 'h':    value = s.h; break;
        case 'sb':   value = s.sb; break;
        case 'era':  value = s.outs > 10 ? -((s.er / s.outs) * 27) : -99; break; // negative for sorting
        case 'k':    value = s.ka; break;
        case 'wins': value = s.w; break;
        case 'whip': value = s.outs > 10 ? -((s.bba + s.ha) / (s.outs / 3)) : -99; break;
        case 'sv':   value = s.sv; break;
        case 'qs':   value = s.qs; break;
        case 'k9': {
          const ip = s.outs / 3;
          value = ip > 20 ? (s.ka / ip) * 9 : 0;
          break;
        }
        case 'bb9': {
          const ip2 = s.outs / 3;
          value = ip2 > 20 ? -((s.bba / ip2) * 9) : -99; // negative for ascending sort (lower = better)
          break;
        }
        case 'fip': {
          const ip3 = s.outs / 3;
          value = ip3 > 20 ? -((13 * s.hra + 3 * s.bba - 2 * s.ka) / ip3 + 3.10) : -99;
          break;
        }
        case 'r':    value = s.r; break;
        case '2b':   value = s.doubles; break;
        case 'bb':   value = s.bb; break;
        case 'k_h':  value = s.k; break;
        case '3b':   value = s.triples; break;
        case 'cg':   value = s.cg; break;
        case 'ip':   value = s.outs / 3; break;
        case 'sho':  value = s.sho; break;
        case 'gsc': {
          // Average Game Score: compute from season totals (starters only)
          if (s.gs < 5) { value = 0; break; }
          let gs2 = 50;
          gs2 += s.outs;
          gs2 += Math.max(0, Math.floor((s.outs - 12) / 3)) * 2;
          gs2 += s.ka;
          gs2 -= s.ha * 2;
          gs2 -= s.er * 4;
          gs2 -= (s.ra - s.er) * 2;
          gs2 -= s.bba;
          value = gs2 / s.gs; // per-start average
          break;
        }
        default:     value = 0;
      }
      if (value !== 0 || stat === 'avg') results.push({ player, value });
    }

    results.sort((a, b) => b.value - a.value);
    const top = results.slice(0, limit);

    return top.map((r, i) => {
      const team = _teamMap.get(r.player.teamId);
      const isRateStat = ['avg', 'obp', 'slg', 'ops'].includes(stat);
      let displayValue = r.value.toFixed(isRateStat ? 3 : 0);
      if (stat === 'era' || stat === 'whip' || stat === 'fip') displayValue = (-r.value).toFixed(2);
      if (stat === 'k9' || stat === 'gsc' || stat === 'ip') displayValue = r.value.toFixed(1);
      if (stat === 'bb9') displayValue = (-r.value).toFixed(1);
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
      grades['DUR'] = toScoutingScale(h.durability);
      grades['BIQ'] = toScoutingScale(h.baserunningIQ);
    } else if (player.pitcherAttributes) {
      const p = player.pitcherAttributes;
      grades['STF'] = toScoutingScale(p.stuff);
      grades['MOV'] = toScoutingScale(p.movement);
      grades['CMD'] = toScoutingScale(p.command);
      grades['STM'] = toScoutingScale(p.stamina);
      grades['DUR'] = toScoutingScale(p.durability);
      grades['PIQ'] = toScoutingScale(p.pitchingIQ);
    }

    const seasonStats: null | { season: number; [key: string]: number } = s ? (() => {
      const ip = s.outs / 3;
      const avg = s.ab > 0 ? s.h / s.ab : 0;
      const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
      const tb = (s.h - s.doubles - s.triples - s.hr) + s.doubles * 2 + s.triples * 3 + s.hr * 4;
      const slg = s.ab > 0 ? tb / s.ab : 0;
      const era = ip > 0 ? (s.er / ip) * 9 : 0;
      const whip = ip > 0 ? (s.bba + s.ha) / ip : 0;
      const fip = ip > 0 ? (13 * s.hra + 3 * s.bba - 2 * s.ka) / ip + 3.10 : 0;
      return {
        season: state.season - 1,
        pa: s.pa, ab: s.ab, h: s.h, hr: s.hr, rbi: s.rbi, bb: s.bb, k: s.k, sb: s.sb,
        doubles: s.doubles, triples: s.triples,
        avg: Number(avg.toFixed(3)),
        obp: Number(obp.toFixed(3)),
        slg: Number(slg.toFixed(3)),
        ops: Number((obp + slg).toFixed(3)),
        w: s.w, l: s.l, sv: s.sv,
        era: Number(era.toFixed(2)),
        whip: Number(whip.toFixed(2)),
        fip: Number(fip.toFixed(2)),
        qs: s.qs,
        ip: Number(ip.toFixed(1)), ka: s.ka, bba: s.bba, hra: s.hra,
      };
    })() : null;

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
      splits: s && !player.isPitcher ? (() => {
        const buildSplit = (sp: { pa: number; ab: number; h: number; hr: number; bb: number; k: number; doubles: number; triples: number } | undefined) => {
          if (!sp || sp.pa === 0) return { pa: 0, ab: 0, avg: 0, obp: 0, slg: 0, ops: 0, hr: 0, bb: 0, k: 0 };
          const avg = sp.ab > 0 ? sp.h / sp.ab : 0;
          const obp = sp.pa > 0 ? (sp.h + sp.bb) / sp.pa : 0;
          const tb2 = (sp.h - sp.doubles - sp.triples - sp.hr) + sp.doubles * 2 + sp.triples * 3 + sp.hr * 4;
          const slg2 = sp.ab > 0 ? tb2 / sp.ab : 0;
          return {
            pa: sp.pa, ab: sp.ab,
            avg: Number(avg.toFixed(3)), obp: Number(obp.toFixed(3)),
            slg: Number(slg2.toFixed(3)), ops: Number((obp + slg2).toFixed(3)),
            hr: sp.hr, bb: sp.bb, k: sp.k,
          };
        };
        return { vsLHP: buildSplit(s.vsLHP), vsRHP: buildSplit(s.vsRHP) };
      })() : null,
      pitchMix: player.pitcherAttributes?.pitchTypeMix ? {
        fastball: Math.round(player.pitcherAttributes.pitchTypeMix.fastball * 100),
        breaking: Math.round(player.pitcherAttributes.pitchTypeMix.breaking * 100),
        offspeed: Math.round(player.pitcherAttributes.pitchTypeMix.offspeed * 100),
      } : null,
      careerStats: (() => {
        const career = getCareerRecords().get(playerId);
        if (career) {
          const cAvg = career.ab > 0 ? Number((career.h / career.ab).toFixed(3)) : 0;
          const cObp = career.pa > 0 ? Number(((career.h + career.bb + career.hbp) / career.pa).toFixed(3)) : 0;
          const cEra = career.outs > 0 ? Number(((career.er / career.outs) * 27).toFixed(2)) : 0;
          return {
            seasons: career.seasons,
            pa: career.pa, ab: career.ab, h: career.h, hr: career.hr,
            rbi: career.rbi, bb: career.bb, k: career.k, sb: career.sb,
            avg: cAvg, obp: cObp,
            w: career.w, l: career.l, sv: career.sv, era: cEra,
            ip: Number((career.outs / 3).toFixed(1)), ka: career.ka, bba: career.bba,
          };
        }
        // Fallback: first season — use current season stats or zeros
        const ss = seasonStats ?? {};
        const base: Record<string, number> = { seasons: 1 };
        for (const [k, v] of Object.entries(ss)) {
          if (typeof v === 'number') base[k] = v;
        }
        return base as { seasons: number; [key: string]: number };
      })(),
    };
  },

  // ── Save / Load ────────────────────────────────────────────────────────────
  async getFullState(): Promise<LeagueState | null> {
    if (!_state) return null;
    // Snapshot all auxiliary state so it survives save/load
    return {
      ..._state,
      aux: {
        seasonResults: _seasonResults,
        tradeHistory: _tradeHistory,
        lineups: Array.from(_lineups.entries()),
        financialHistory: Array.from(_financialHistory.entries()),
        teamCash: Array.from(_teamCash.entries()),
        luxuryTaxYears: Array.from(_luxuryTaxYears.entries()),
        seasonInjuries: _seasonInjuries,
        arbHistory: _arbHistory,
        rule5History: _rule5History,
        deadlineDeals: _deadlineDeals,
        intlProspects: _intlProspects,
        coachingStaff: Array.from(_coachingStaff.entries()),
        coachingPool: _coachingPool,
        extensionHistory: _extensionHistory,
        waiverHistory: _waiverHistory,
        ownerGoals: _ownerGoals,
        playerSeasonStats: Array.from(_playerSeasonStats.entries()),
        careerRecords: Array.from(getCareerRecords().entries()),
        awardsHistory: {
          awardHistory: getAwardHistory(),
          championHistory: getChampionHistory(),
          transactionLog: getTransactionLog(),
          milestones: getMilestones(),
        },
        gamesPlayed: _gamesPlayed,
        simRotationIndex: Array.from(_simRotationIndex.entries()),
        simBullpenOffset: Array.from(_simBullpenOffset.entries()),
        simPitcherRestMap: Array.from(_simPitcherRestMap.entries()),
        recentGames: _recentGames,
        simTeamWins: Array.from(_simTeamWins.entries()),
        simTeamLosses: Array.from(_simTeamLosses.entries()),
        simTeamRS: Array.from(_simTeamRS.entries()),
        simTeamRA: Array.from(_simTeamRA.entries()),
      },
    };
  },

  async loadState(state: LeagueState): Promise<void> {
    _state = state;
    rebuildMaps();

    // Restore auxiliary state if present
    if (state.aux) {
      const a = state.aux;
      _seasonResults = a.seasonResults as typeof _seasonResults;
      _tradeHistory = a.tradeHistory as typeof _tradeHistory;
      _lineups = new Map(a.lineups as Array<[number, LineupData]>);
      _financialHistory = new Map(a.financialHistory as Array<[number, FinancialHistory[]]>);
      _teamCash = new Map(a.teamCash);
      _luxuryTaxYears = new Map(a.luxuryTaxYears);
      _seasonInjuries = a.seasonInjuries as typeof _seasonInjuries;
      _arbHistory = a.arbHistory as typeof _arbHistory;
      _rule5History = a.rule5History as typeof _rule5History;
      _deadlineDeals = a.deadlineDeals as typeof _deadlineDeals;
      _intlProspects = a.intlProspects as typeof _intlProspects;
      _coachingStaff = new Map(a.coachingStaff as Array<[number, Coach[]]>);
      _coachingPool = a.coachingPool as typeof _coachingPool;
      _extensionHistory = a.extensionHistory as typeof _extensionHistory;
      _waiverHistory = a.waiverHistory as typeof _waiverHistory;
      _ownerGoals = a.ownerGoals as typeof _ownerGoals;
      _playerSeasonStats = new Map(a.playerSeasonStats as Array<[number, import('../types/player').PlayerSeasonStats]>);
      if (a.careerRecords) {
        restoreCareerRecords(a.careerRecords as Array<[number, CareerRecord]>);
      }
      if (a.awardsHistory) {
        restoreAwardsHistory(a.awardsHistory as {
          awardHistory: AwardHistoryEntry[];
          championHistory: ChampionHistoryEntry[];
          transactionLog: TxnLog[];
          milestones: SeasonMilestone[];
        });
      }
      _gamesPlayed = a.gamesPlayed ?? 0;
      _simRotationIndex = new Map(a.simRotationIndex ?? []);
      _simBullpenOffset = new Map(a.simBullpenOffset ?? []);
      _simPitcherRestMap = new Map(a.simPitcherRestMap ?? []);
      _recentGames = (a.recentGames as typeof _recentGames) ?? [];
      _simTeamWins = new Map(a.simTeamWins ?? []);
      _simTeamLosses = new Map(a.simTeamLosses ?? []);
      _simTeamRS = new Map(a.simTeamRS ?? []);
      _simTeamRA = new Map(a.simTeamRA ?? []);
    } else {
      _playerSeasonStats = new Map();
    }
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

  async optimizeLineup(teamId: number): Promise<LineupData> {
    const state = requireState();
    const existing = _lineups.get(teamId) ?? await this.getLineup(teamId);

    const playerMap = new Map(state.players.map(p => [p.playerId, p]));
    const batters = existing.battingOrder
      .map(id => playerMap.get(id))
      .filter((p): p is Player => p != null && !p.isPitcher);

    if (batters.length < 9) return existing;

    const ordered = optimizeLineup(batters);
    const order = ordered.map(p => p.playerId);

    const optimized: LineupData = { ...existing, battingOrder: order };
    _lineups.set(teamId, optimized);
    return optimized;
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

  // ── Injury System ──────────────────────────────────────────────────────
  async getInjuryReport(): Promise<Injury[]> {
    return _seasonInjuries;
  },

  // ── Arbitration ───────────────────────────────────────────────────────
  async getArbitrationHistory(): Promise<ArbitrationCase[]> {
    return _arbHistory;
  },

  // ── Rule 5 Draft ──────────────────────────────────────────────────────
  async getRule5History(): Promise<Rule5Selection[]> {
    return _rule5History;
  },

  async getRule5Eligible(): Promise<Rule5Eligible[]> {
    const state = requireState();
    return identifyRule5Eligible(state.players, state.teams, state.season);
  },

  async protectFromRule5(playerId: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    return protectPlayer(player, state.players);
  },

  // ── Trade Deadline ────────────────────────────────────────────────────
  async getDeadlineDeals(): Promise<DeadlineDeal[]> {
    return _deadlineDeals;
  },

  // ── International Signing ─────────────────────────────────────────────
  async getIntlProspects(): Promise<IntlProspect[]> {
    return _intlProspects;
  },

  // ── Awards History ────────────────────────────────────────────────────
  async getAwardHistory(): Promise<AwardHistoryEntry[]> {
    return getAwardHistory();
  },

  async getChampionHistory(): Promise<ChampionHistoryEntry[]> {
    return getChampionHistory();
  },

  async getTransactionLog(): Promise<TxnLog[]> {
    return getTransactionLog();
  },

  async getMilestones(): Promise<SeasonMilestone[]> {
    return getMilestones();
  },

  // ── Advanced Analytics ──────────────────────────────────────────────────
  async getAdvancedStats(): Promise<{ hitters: AdvancedHitterStats[]; pitchers: AdvancedPitcherStats[]; env: LeagueEnvironment }> {
    const state = requireState();
    const isPitcherMap = new Map(state.players.map(p => [p.playerId, p.isPitcher]));
    const playerMeta = new Map(state.players.map(p => {
      const team = _teamMap.get(p.teamId);
      return [p.playerId, { name: p.name, teamAbbr: team?.abbreviation ?? '---', position: p.position }] as const;
    }));
    return computeAllAdvancedStats(_playerSeasonStats, isPitcherMap, playerMeta);
  },

  // ── Coaching Staff ────────────────────────────────────────────────────
  async getCoachingStaff(teamId: number): Promise<CoachingStaffData> {
    const coaches = _coachingStaff.get(teamId) ?? [];
    return getCoachingStaffData(teamId, coaches);
  },

  async getCoachingPool(): Promise<Coach[]> {
    return _coachingPool;
  },

  async hireCoach(coachId: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const coach = _coachingPool.find(c => c.coachId === coachId);
    if (!coach) return { ok: false, error: 'Coach not available.' };

    const current = _coachingStaff.get(state.userTeamId) ?? [];
    // Check if already have someone in this role
    const existingInRole = current.find(c => c.role === coach.role);
    if (existingInRole) return { ok: false, error: `Already have a ${coach.role}. Fire them first.` };

    current.push(coach);
    _coachingStaff.set(state.userTeamId, current);
    _coachingPool = _coachingPool.filter(c => c.coachId !== coachId);
    return { ok: true };
  },

  async fireCoach(coachId: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const current = _coachingStaff.get(state.userTeamId) ?? [];
    const idx = current.findIndex(c => c.coachId === coachId);
    if (idx < 0) return { ok: false, error: 'Coach not found on staff.' };

    const [fired] = current.splice(idx, 1);
    _coachingStaff.set(state.userTeamId, current);
    _coachingPool.push(fired);
    return { ok: true };
  },

  // ── Contract Extensions ───────────────────────────────────────────────
  async getExtensionCandidates(): Promise<ExtensionCandidate[]> {
    const state = requireState();
    return getExtensionCandidates(state.players, state.userTeamId);
  },

  async offerExtension(offer: ExtensionOffer): Promise<ExtensionResult> {
    const state = requireState();
    const player = _playerMap.get(offer.playerId);
    if (!player) return { accepted: false, playerId: offer.playerId, playerName: '???', years: offer.years, aav: offer.aav, totalValue: offer.totalValue, reason: 'Player not found.' };
    const result = evaluateExtension(offer, player);
    _extensionHistory.push(result);
    if (result.accepted) {
      recordTransaction(state.season, 'Offseason', 'Signing',
        `${result.playerName} signs ${result.years}yr/$${(result.totalValue / 1_000_000).toFixed(1)}M extension`,
        [state.userTeamId]);
    }
    return result;
  },

  async getExtensionHistory(): Promise<ExtensionResult[]> {
    return _extensionHistory;
  },

  // ── Waiver Wire ───────────────────────────────────────────────────────
  async getWaiverPlayers(): Promise<WaiverPlayer[]> {
    const state = requireState();
    return getWaiverPlayers(state.players, state.teams);
  },

  async claimWaiverPlayer(playerId: number): Promise<{ ok: boolean; error?: string }> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    const result = claimWaiverPlayer(player, state.userTeamId, state.players);
    if (result.ok) {
      rebuildMaps();
    }
    return result;
  },

  async getWaiverHistory(): Promise<WaiverClaim[]> {
    return _waiverHistory;
  },

  // ── Team Chemistry ────────────────────────────────────────────────────
  async getTeamChemistry(teamId: number): Promise<TeamChemistryData> {
    const state = requireState();
    const team = _teamMap.get(teamId);
    const coaches = _coachingStaff.get(teamId) ?? [];
    const effects = computeCoachingEffects(coaches);
    return computeTeamChemistry(
      state.players, teamId, state.season,
      team?.seasonRecord.wins ?? 0, team?.seasonRecord.losses ?? 0,
      effects.chemistryBoost,
    );
  },

  // ── Owner/GM Goals ────────────────────────────────────────────────────
  async getOwnerGoals(): Promise<OwnerGoalsState | null> {
    return _ownerGoals;
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  async ping(): Promise<string> {
    return 'pong';
  },
};

export type WorkerAPI = typeof api;
Comlink.expose(api);
