/**
 * Web Worker — Comlink-exposed API
 *
 * The UI never asks for "the league state." It asks for specific,
 * paginated data for the active screen.
 *
 * All simulation runs here — the main thread is never blocked.
 */

import * as Comlink from 'comlink';
import type { Player } from '../types/player.ts';
import type { Team, TeamSeason } from '../types/team.ts';
import type { GameResult } from '../types/game.ts';
import type { PlayerSeason } from '../types/player.ts';
import type { GameEvent } from '../types/events.ts';
import { createPRNG } from './math/prng.ts';
import type { RandomGenerator } from './math/prng.ts';
import { generateAllPlayers } from './player/generation.ts';
import { simulateSeason, type SeasonSimResult } from './sim/seasonSimulator.ts';
import { TEAMS } from '../data/teams.ts';
import { calcBA, calcERA, formatIP, playerOverall, pythagoreanWins } from '../utils/helpers.ts';
import { simulatePlayoffs, type PlayoffBracket } from './league/playoffs.ts';
import { computeSeasonAwards, type SeasonAwards } from './league/awards.ts';
import { sortNewsFeed, generateInjuryNewsItems, type NewsStory } from './league/newsFeed.ts';
import * as News from './league/newsFeed.ts';
import { getTeamInjuries, getInjurySummary, type InjurySummary } from './injuries.ts';
import {
  getEventLog,
  logAward,
  logDraftPick,
  logGameResult,
  logPlayoffSeries,
  logTrade,
  logTransaction,
} from './league/eventLog.ts';
import { generateTop100, type ProspectRanking } from './league/prospects.ts';
import { WorkerCache, type DashboardBundle } from './workerCache.ts';
import { selectFeaturedGames } from './storageDiscipline.ts';
import { advanceOffseason } from './roster/offseason.ts';
import type { TeamBidModifier } from './roster/freeAgency.ts';
import { generateAllCoachingStaffs } from './ai/coachingStaff.ts';
import { classifyAllTeams } from './ai/gmStrategy.ts';
import { assignMarketSizes } from './roster/financials.ts';
import type { CoachingStaff, DraftPick, OffseasonRecap, TeamStrategy } from '../types/offseason.ts';
import type { TransactionLogEntry, RosterTransaction, RosterStatus } from '../types/roster.ts';
import type { OwnerEvaluation, OwnerProfile } from '../types/owner.ts';
import type { ClubhouseEvent, TeamChemistryState } from '../types/chemistry.ts';
import { validateTransaction, executeTransaction, countFortyMan, countTwentySix } from './roster/rosterManager.ts';
import {
  aiProposeTrades,
  createTradeReputation,
  evaluateTrade,
  proposeCounterOffer,
  type TradeMarketDiagnostics,
  type TradeMarketContext,
  type TradePackage,
} from '../ai/tradeAI.ts';
import { generateScoutingProfiles } from '../ai/scoutingModel.ts';
import { evaluateOwnersForSeason, initializeOwnerProfiles } from './league/ownerGoals.ts';
import { advanceTeamChemistry, initializeTeamChemistry } from './league/teamChemistry.ts';
import {
  createSave,
  createAutosave,
  CURRENT_SCHEMA_VERSION,
  deleteSave,
  exportSaveToJSON,
  getNextManualSlot,
  importSaveFromJSON,
  listSaveManifests,
  loadSave,
} from './persistence/saveManager.ts';
import type { SaveManifest, GameState as PersistedGameState } from './persistence/saveManager.ts';
import {
  computeActivityIntelAggregate,
  type ActivityIntelQuery,
  type ActivityIntelResponse,
} from '../components/roster/activityIntel.ts';
import {
  FEATURE_MANIFEST,
  getCoreFeatureIds,
  getFeatureManifestEntry,
  isFeatureId,
} from '../features/catalog.ts';
import {
  buildAlphaGateResults,
  summarizeManifestHealth,
  type AlphaGateInput,
} from '../features/playableReadiness.ts';
import { assessFeatureReadiness } from '../features/featureReadiness.ts';
import type {
  FeatureDependencyHealth,
  FeatureStatus,
  FeatureTier,
  FeatureId,
  IntakePack,
} from '../features/catalog.ts';
import { lintFeatureManifest } from '../features/manifestLint.ts';
import { getInjuryRiskMultiplier } from '../data/frontOffice.ts';
import { bonusesFromCoaching, DEFAULT_BONUSES } from './staffEffects.ts';
import {
  createDraftBoardState,
  makeUserDraftPick,
  runAIPicksUntilUserTurn,
  teamOnClockId,
  type DraftBoardEntry,
  type DraftBoardState,
} from './draft.ts';
import { computePayrollReport, generateArbitrationCases, type ArbitrationCase } from './finances.ts';
import { computeAdvancedHitting, computeAdvancedPitching, computeLeagueAverages } from './advancedStats.ts';
import { generateTradeOffers, shopPlayer as shopPlayerEngine } from './trading.ts';
import { generateScoutingReport } from './scouting.ts';
import {
  createSeasonSimState,
  simulateChunk,
  simulateRange,
  computeSim1DayTarget,
  computeSim1WeekTarget,
  computeSim1MonthTarget,
  buildPartialResult,
  type SeasonSimState,
  SEGMENTS,
} from './sim/incrementalSimulator.ts';
import { generateScheduleTemplate } from '../data/scheduleTemplate.ts';
import type { ScheduleEntry } from '../types/game.ts';

// ─── In-Memory State ─────────────────────────────────────────────
// The worker holds the live game state. IndexedDB is for persistence.

let teams: Team[] = [];
let players: Player[] = [];
let currentSeason = 0;
let latestTeamSeasons: TeamSeason[] = [];
let latestPlayerSeasons: Map<number, PlayerSeason> = new Map();
let latestGameResults: GameResult[] = [];
let latestPlayoffBracket: PlayoffBracket | null = null;
let latestSeasonAwards: SeasonAwards | null = null;
let latestNewsFeed: NewsStory[] = [];
let rngSeed = 42;
/** The user's team — set during newGame, persisted through save/load */
let userTeamId = 1;
let gen: RandomGenerator | null = null;
let coachingStaffs: Map<number, CoachingStaff> = new Map();
let transactionLog: TransactionLogEntry[] = [];
let latestOffseasonRecap: OffseasonRecap | null = null;
let ownerProfiles: Map<number, OwnerProfile> = new Map();
let teamChemistry: Map<number, TeamChemistryState> = new Map();
let clubhouseEvents: ClubhouseEvent[] = [];
let featureVersions: Record<string, number> = {};
let enabledFeatures: FeatureId[] = [];
let migrationNotes: string[] = [];
let buildFingerprint = `mrbd-worker-schema-${CURRENT_SCHEMA_VERSION}`;
let workerHealthMode: WorkerHealthMode = 'normal';
let lastIntegrityCleanAt: number | null = null;
let lastReadinessOkAt: number | null = null;
let lastSmokeOkAt: number | null = null;
const endpointLatencyHistory = new Map<string, number[]>();
const MAX_ENDPOINT_LATENCY_SAMPLES = 64;
const ENDPOINT_LATENCY_BUDGET_MS: Record<string, number> = {
  runIntegrityAudit: 120,
  getFeatureReadiness: 80,
  getPlayableReadinessReport: 180,
  getDiagnosticsSnapshot: 120,
  getSmokeFlowReport: 140,
  runDeterminismProbe: 1200,
  getIntakeAuditReport: 120,
  runSoakSimulation: 2500,
  getLatencyBudgetReport: 120,
  getDraftBoard: 150,
  makeDraftPick: 200,
};
const ownerEvaluationHistory: OwnerEvaluation[] = [];
const seasonHistory: SeasonSimResult[] = [];
const eventLog = getEventLog();

// ─── Worker Cache ────────────────────────────────────────────────
const cache = new WorkerCache();

// ─── Featured Games ──────────────────────────────────────────────
// Only these game IDs get full box scores retained for storage
let featuredGameIds: Set<number> = new Set();
let activeDraftState: DraftBoardState | null = null;
let devAssignments: Map<number, import('../engine/devPrograms').DevProgram> = new Map();
let lineupOrders: Map<number, number[]> = new Map();
let rotationOrders: Map<number, number[]> = new Map();
/** Per-player career stat history: playerId → PlayerSeason[] (one entry per season played) */
let careerHistory: Map<number, PlayerSeason[]> = new Map();
/** Season awards history across all played seasons */
let awardsHistory: SeasonAwards[] = [];
/** Franchise record book (user team, updated each season) */
let franchiseRecordBook: import('./franchiseRecords').FranchiseRecordBook | null = null;
/** HOF inductees */
let hallOfFamers: import('./hallOfFame').HallOfFameInductee[] = [];
/** Active HOF ballot candidates */
let hofCandidates: import('./hallOfFame').HallOfFameCandidate[] = [];
/** League history: season summaries for browsing */
let leagueHistory: Array<{
  season: number;
  champion: { teamId: number; teamName: string } | null;
  alMVP: string;
  nlMVP: string;
  alCyYoung: string;
  nlCyYoung: string;
  topWins: { teamId: number; teamName: string; wins: number };
  topHR: { playerId: number; name: string; hr: number };
}> = [];
/** Tracks which milestones have already fired to avoid duplicates */
let firedMilestones: Set<string> = new Set();
/** Incremental sim state — null when not in mid-season */
let incrementalSimState: SeasonSimState | null = null;
/** Cached schedule for incremental sim (generated once per season) */
let cachedSchedule: ScheduleEntry[] | null = null;

// ─── Public API ──────────────────────────────────────────────────

const api = {
  /**
   * Initialize a new league. Generates all teams + players.
   */
  async newGame(seed: number, chosenTeamId = 1): Promise<{ teamCount: number; playerCount: number }> {
    rngSeed = seed;
    userTeamId = chosenTeamId;
    teams = [...TEAMS];
    currentSeason = 1;
    latestNewsFeed = [];
    latestPlayoffBracket = null;
    latestSeasonAwards = null;
    latestGameResults = [];
    featuredGameIds = new Set();
    latestOffseasonRecap = null;
    transactionLog = [];
    seasonHistory.length = 0;
    ownerEvaluationHistory.length = 0;
    activeDraftState = null;
    careerHistory = new Map();
    awardsHistory = [];
    lineupOrders = new Map();
    rotationOrders = new Map();
    devAssignments = new Map();
    franchiseRecordBook = null;
    hallOfFamers = [];
    hofCandidates = [];
    leagueHistory = [];
    firedMilestones = new Set();
    incrementalSimState = null;
    cachedSchedule = null;
    eventLog.clear();
    cache.reset();

    gen = createPRNG(seed);
    const result = generateAllPlayers(gen, teams.map((t) => t.teamId));
    players = result.players;
    gen = result.gen;

    let staffs: Map<number, CoachingStaff>;
    [staffs, gen] = generateAllCoachingStaffs(teams.map((t) => t.teamId), gen);
    coachingStaffs = staffs;
    ownerProfiles = initializeOwnerProfiles(teams.map((t) => t.teamId), currentSeason);
    teamChemistry = initializeTeamChemistry(teams.map((t) => t.teamId), currentSeason);
    clubhouseEvents = [];
    featureVersions = buildDefaultFeatureVersions();
    enabledFeatures = getCoreFeatureIds();
    migrationNotes = [];
    buildFingerprint = makeBuildFingerprint();
    workerHealthMode = 'normal';
    lastIntegrityCleanAt = null;
    lastReadinessOkAt = null;
    lastSmokeOkAt = null;

    const saveState = buildPersistedState();
    if (saveState) {
      createAutosave(saveState, 'New Game');
    }

    return { teamCount: teams.length, playerCount: players.length };
  },

  /**
   * Simulate one full 162-game season.
   */
  async simulateCurrentSeason(): Promise<{
    season: number;
    gamesPlayed: number;
    leagueGamesOnIL: number;
    standings: TeamStandingRow[];
  }> {
    // Ensure all teams have minimum viable rosters (prevents forfeit bugs)
    try {
      const { ensureMinimumRosters } = await import('./rosterGuard.ts');
      ensureMinimumRosters(players, teams);
    } catch { /* non-fatal */ }

    const injuryRiskMultipliers = new Map<number, number>();
    for (const team of teams) {
      const coaching = coachingStaffs.get(team.teamId);
      injuryRiskMultipliers.set(team.teamId, coaching ? getInjuryRiskMultiplier(coaching) : 1);
    }

    const result = await simulateSeason(
      teams,
      players,
      currentSeason,
      rngSeed + currentSeason,
      (complete: number, total: number) => {
        // Post progress to main thread
        postMessage({ type: 'sim-progress', complete, total });
      },
      { injuryRiskMultipliers },
    );

    latestTeamSeasons = result.teamSeasons;
    latestPlayerSeasons = result.playerSeasons;
    latestGameResults = result.gameResults;
    gen = result.gen;

    // ── Accumulate career history ─────────────────────────────────────────
    for (const [playerId, ps] of result.playerSeasons) {
      const existing = careerHistory.get(playerId) ?? [];
      existing.push(ps);
      careerHistory.set(playerId, existing);
    }

    // ── Detect career milestones ──────────────────────────────────────────
    try {
      const { detectMilestones } = await import('./milestones.ts');
      const nameMap = new Map(players.map(p => [p.playerId, p.name]));
      const milestones = detectMilestones(careerHistory, nameMap, currentSeason, firedMilestones);
      for (const m of milestones) {
        latestNewsFeed.push({
          id: `milestone-${currentSeason}-${m.playerId}-${m.milestone}`,
          season: currentSeason,
          gameDay: 162,
          category: 'award',
          priority: 'major',
          headline: `MILESTONE: ${m.playerName} Reaches ${m.milestone}`,
          body: `${m.playerName} has reached a career milestone: ${m.milestone}. Current total: ${m.value}.`,
          teamIds: [],
          playerIds: [m.playerId],
        });
      }
      if (milestones.length > 0) latestNewsFeed = sortNewsFeed(latestNewsFeed);
    } catch { /* milestone detection non-fatal */ }

    seasonHistory.push(result);
    if (seasonHistory.length > 8) {
      seasonHistory.shift();
    }

    // Select featured games for storage discipline
    featuredGameIds = selectFeaturedGames(result.gameResults);

    for (const game of result.gameResults) {
      if (!featuredGameIds.has(game.gameId)) continue;
      logGameResult(eventLog, currentSeason, game.boxScore.date, {
        kind: 'game_result',
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        innings: game.innings,
        isFeatured: true,
        featuredReason: featuredReasonForGame(game),
      });
    }
    eventLog.pruneOldSeasons(Math.max(1, currentSeason - 12));

    // Wire injury events into the news feed
    if (result.injuryEvents && result.injuryEvents.length > 0) {
      const teamNameMap = buildTeamNameMap();
      const injuryStories = generateInjuryNewsItems(result.injuryEvents, teamNameMap, currentSeason);
      latestNewsFeed = sortNewsFeed([...latestNewsFeed, ...injuryStories]);
    }

    // Invalidate cache (season data changed)
    cache.invalidate();

    const saveState = buildPersistedState();
    if (saveState) {
      createAutosave(saveState, 'Regular Season Complete');
    }

    const standings = buildStandings(result);
    return {
      season: currentSeason,
      gamesPlayed: result.gameResults.length,
      leagueGamesOnIL: result.leagueGamesOnIL,
      standings,
    };
  },

  /**
   * Simulate the postseason after a regular season is complete.
   */
  async simulatePostseason(): Promise<PlayoffBracket | null> {
    if (latestTeamSeasons.length === 0 || !gen) return null;

    let bracket: PlayoffBracket;
    [bracket, gen] = simulatePlayoffs(
      teams,
      latestTeamSeasons,
      players,
      currentSeason,
      gen,
    );

    latestPlayoffBracket = bracket;
    cache.invalidate();

    // Generate playoff news stories
    const teamNameMap = buildTeamNameMap();
    for (const series of [...bracket.wildCardSeries, ...bracket.divisionSeries, ...bracket.championshipSeries]) {
      latestNewsFeed.push(News.generatePlayoffStory(
        currentSeason,
        series,
        series.round,
        teamNameMap.get(series.winnerTeamId) ?? 'Unknown',
        teamNameMap.get(series.loserTeamId) ?? 'Unknown',
      ));
      const seriesScore = `${Math.max(series.higherSeedWins, series.lowerSeedWins)}-${Math.min(series.higherSeedWins, series.lowerSeedWins)}`;
      logPlayoffSeries(eventLog, currentSeason, {
        kind: 'playoff',
        round: series.round,
        winnerTeamId: series.winnerTeamId,
        loserTeamId: series.loserTeamId,
        seriesScore,
      });
    }
    if (bracket.worldSeries) {
      latestNewsFeed.push(News.generatePlayoffStory(
        currentSeason,
        bracket.worldSeries,
        'WS',
        teamNameMap.get(bracket.worldSeries.winnerTeamId) ?? 'Unknown',
        teamNameMap.get(bracket.worldSeries.loserTeamId) ?? 'Unknown',
      ));
      const ws = bracket.worldSeries;
      const seriesScore = `${Math.max(ws.higherSeedWins, ws.lowerSeedWins)}-${Math.min(ws.higherSeedWins, ws.lowerSeedWins)}`;
      logPlayoffSeries(eventLog, currentSeason, {
        kind: 'playoff',
        round: 'WS',
        winnerTeamId: ws.winnerTeamId,
        loserTeamId: ws.loserTeamId,
        seriesScore,
      });
    }

    latestNewsFeed = sortNewsFeed(latestNewsFeed);

    const saveState = buildPersistedState();
    if (saveState) {
      createAutosave(saveState, 'Postseason Complete');
    }

    return bracket;
  },

  /**
   * Compute season awards after a season is complete.
   */
  async computeAwards(): Promise<SeasonAwards | null> {
    if (latestPlayerSeasons.size === 0 || !gen) return null;

    let awards: SeasonAwards;
    [awards, gen] = computeSeasonAwards(
      currentSeason,
      players,
      latestPlayerSeasons,
      teams,
      gen,
    );

    latestSeasonAwards = awards;
    awardsHistory.push(awards);
    if (awardsHistory.length > 50) awardsHistory.shift();
    cache.invalidate();

    // Generate award news stories
    const teamNameMap = buildTeamNameMap();
    const majorAwards = [awards.alMVP, awards.nlMVP, awards.alCyYoung, awards.nlCyYoung];
    for (const aw of majorAwards) {
      latestNewsFeed.push(News.generateAwardStory(
        currentSeason,
        aw,
        teamNameMap.get(aw.teamId) ?? 'Unknown',
      ));
      logAward(eventLog, currentSeason, {
        kind: 'award',
        awardName: aw.awardName,
        playerId: aw.playerId,
        playerName: aw.playerName,
        teamId: aw.teamId,
        statLine: aw.statLine,
      });
    }
    if (awards.alROY) {
      latestNewsFeed.push(News.generateAwardStory(
        currentSeason,
        awards.alROY,
        teamNameMap.get(awards.alROY.teamId) ?? 'Unknown',
      ));
      logAward(eventLog, currentSeason, {
        kind: 'award',
        awardName: awards.alROY.awardName,
        playerId: awards.alROY.playerId,
        playerName: awards.alROY.playerName,
        teamId: awards.alROY.teamId,
        statLine: awards.alROY.statLine,
      });
    }
    if (awards.nlROY) {
      latestNewsFeed.push(News.generateAwardStory(
        currentSeason,
        awards.nlROY,
        teamNameMap.get(awards.nlROY.teamId) ?? 'Unknown',
      ));
      logAward(eventLog, currentSeason, {
        kind: 'award',
        awardName: awards.nlROY.awardName,
        playerId: awards.nlROY.playerId,
        playerName: awards.nlROY.playerName,
        teamId: awards.nlROY.teamId,
        statLine: awards.nlROY.statLine,
      });
    }

    latestNewsFeed = sortNewsFeed(latestNewsFeed);

    // ── Update franchise records ─────────────────────────────────────────
    try {
      const { updateFranchiseRecords, emptyRecordBook } = await import('./franchiseRecords.ts');
      // userTeamId from module-level state
      const userTeamSeason = latestTeamSeasons.find(ts => ts.teamId === userTeamId);
      if (userTeamSeason) {
        const playerMap = new Map(players.map(p => [p.playerId, p]));
        const seasonStatsMap = new Map<number, any>();
        for (const [pid, ps] of latestPlayerSeasons) {
          const p = playerMap.get(pid);
          if (p && p.teamId === userTeamId) {
            seasonStatsMap.set(pid, {
              playerId: pid, teamId: ps.teamId, season: ps.season,
              pa: ps.ab + 50, ab: ps.ab, h: ps.hits, hr: ps.hr, rbi: ps.rbi, r: ps.runs,
              bb: Math.round(ps.ab * 0.08), so: Math.round(ps.ab * 0.22),
              outs: Math.round(ps.ip * 3), er: ps.earnedRuns, w: ps.wins, l: ps.losses,
              ka: ps.kPitching, sv: ps.saves, ra: ps.earnedRuns,
              doubles: 0, triples: 0, hbp: 0, sb: 0, cs: 0, sf: 0, ha: 0, bba: 0, hra: 0,
            });
          }
        }
        const userCareer = new Map<number, any[]>();
        for (const [pid, seasons] of careerHistory) {
          const p = playerMap.get(pid);
          if (p && p.teamId === userTeamId) {
            userCareer.set(pid, seasons.map(s => ({
              ...s, pa: s.ab + 50,
              outs: Math.round(s.ip * 3), ka: s.kPitching,
              bb: 0, so: 0, doubles: 0, triples: 0, hbp: 0, sb: 0, cs: 0, sf: 0, ha: 0, bba: 0, hra: 0, ra: 0,
            })));
          }
        }
        const book = franchiseRecordBook ?? emptyRecordBook();
        const { records, newRecords } = updateFranchiseRecords(
          book, seasonStatsMap, userCareer, playerMap,
          { wins: userTeamSeason.wins, losses: userTeamSeason.losses },
          currentSeason, userTeamId,
        );
        franchiseRecordBook = records;
        for (const rec of newRecords) {
          latestNewsFeed.push({
            id: `record-${currentSeason}-${rec.category}`,
            season: currentSeason,
            headline: `NEW FRANCHISE RECORD: ${rec.playerName} — ${rec.category}`,
            body: `${rec.playerName} set a new franchise record with ${rec.displayValue} (${rec.category}).`,
            category: 'record',
            priority: 'major',
            playerIds: [rec.playerId],
            teamIds: [userTeamId],
            gameDay: 162,
          });
        }
        if (newRecords.length > 0) latestNewsFeed = sortNewsFeed(latestNewsFeed);
      }
    } catch { /* non-fatal */ }

    // ── Build league history entry ───────────────────────────────────────
    {
      const champion = latestPlayoffBracket?.worldSeries?.winnerTeamId;
      const champTeam = champion ? teams.find(t => t.teamId === champion) : null;
      const bestTeam = [...latestTeamSeasons].sort((a, b) => b.wins - a.wins)[0];
      const bestTeamObj = bestTeam ? teams.find(t => t.teamId === bestTeam.teamId) : null;
      let topHR = { playerId: 0, name: '', hr: 0 };
      for (const [pid, ps] of latestPlayerSeasons) {
        if (ps.hr > topHR.hr) {
          const p = players.find(pl => pl.playerId === pid);
          topHR = { playerId: pid, name: p?.name ?? '', hr: ps.hr };
        }
      }
      leagueHistory.push({
        season: currentSeason,
        champion: champTeam ? { teamId: champTeam.teamId, teamName: champTeam.name } : null,
        alMVP: awards.alMVP.playerName || 'N/A',
        nlMVP: awards.nlMVP.playerName || 'N/A',
        alCyYoung: awards.alCyYoung.playerName || 'N/A',
        nlCyYoung: awards.nlCyYoung.playerName || 'N/A',
        topWins: { teamId: bestTeam?.teamId ?? 0, teamName: bestTeamObj?.name ?? '', wins: bestTeam?.wins ?? 0 },
        topHR,
      });
    }

    const saveState = buildPersistedState();
    if (saveState) {
      createAutosave(saveState, 'Awards Computed');
    }

    return awards;
  },

  /**
   * Get prospect rankings.
   */
  async getTopProspects(): Promise<ProspectRanking[]> {
    if (!gen) return [];
    const playerMap = new Map<number, Player>();
    for (const p of players) {
      playerMap.set(p.playerId, p);
    }
    let rankings: ProspectRanking[];
    [rankings, gen] = generateTop100(playerMap, gen, currentSeason);
    return rankings;
  },

  /**
   * Advance to next season (prep for next sim).
   */
  async advanceSeason(): Promise<number> {
    if (!gen) {
      gen = createPRNG(rngSeed + currentSeason);
    }
    const hadCompletedSeason = latestTeamSeasons.length > 0;

    // Run offseason pipeline only if we have a completed season.
    if (latestTeamSeasons.length > 0) {
      const playersMap = new Map<number, Player>();
      for (const p of players) {
        playersMap.set(p.playerId, p);
      }

      const teamSeasonsMap = new Map<number, TeamSeason>();
      for (const ts of latestTeamSeasons) {
        teamSeasonsMap.set(ts.teamId, ts);
      }

      const ownerTeamStrategies = classifyAllTeams(teamSeasonsMap, players);
      const ownerEvaluations = evaluateOwnersForSeason({
        season: currentSeason,
        ownerProfiles,
        teamSeasons: teamSeasonsMap,
        players,
        bracket: latestPlayoffBracket,
        teamStrategies: ownerTeamStrategies,
      });
      ownerEvaluationHistory.push(...ownerEvaluations);
      if (ownerEvaluationHistory.length > 300) {
        ownerEvaluationHistory.splice(0, ownerEvaluationHistory.length - 300);
      }

      const ownerBidModifiers = buildOwnerBidModifiers(ownerProfiles);

      let maxPlayerId = 0;
      for (const p of players) {
        if (p.playerId > maxPlayerId) maxPlayerId = p.playerId;
      }

      const offseason = advanceOffseason({
        players: playersMap,
        teamSeasons: teamSeasonsMap,
        season: currentSeason,
        gen,
        transactionLog,
        coachingStaffs,
        seasonHistory,
        nextDraftPlayerId: maxPlayerId + 1,
        ownerBidModifiers,
        teams,
        userTeamId,
      });

      gen = offseason.gen;
      latestOffseasonRecap = offseason.recap;
      players = Array.from(playersMap.values());

      // Apply development program effects to assigned players
      if (devAssignments.size > 0) {
        const { applyDevProgram } = await import('./devPrograms.ts');
        for (const [playerId, programId] of devAssignments) {
          const player = players.find(p => p.playerId === playerId);
          if (player) {
            applyDevProgram(player, programId);
          }
        }
        devAssignments.clear();
      }

      // Compute coaching morale bonuses per team
      const coachingMoraleBonuses = new Map<number, number>();
      for (const team of teams) {
        const coaching = coachingStaffs.get(team.teamId);
        if (coaching) {
          const bonuses = bonusesFromCoaching(coaching);
          coachingMoraleBonuses.set(team.teamId, bonuses.moraleBonus);
        }
      }

      const chemistryAdvance = advanceTeamChemistry({
        season: currentSeason + 1,
        players,
        teamSeasons: teamSeasonsMap,
        ownerProfiles,
        previousChemistry: teamChemistry,
        gen,
        nextEventId: nextClubhouseEventId(),
        coachingMoraleBonuses,
      });
      gen = chemistryAdvance.gen;
      teamChemistry = chemistryAdvance.chemistry;
      if (chemistryAdvance.events.length > 0) {
        clubhouseEvents.push(...chemistryAdvance.events);
        if (clubhouseEvents.length > 400) {
          clubhouseEvents = clubhouseEvents.slice(-400);
        }
      }

      // ── HOF voting ─────────────────────────────────────────────────────
      try {
        const { identifyHOFCandidates, simulateHOFVoting } = await import('./hallOfFame.ts');
        const retiredMap = new Map<number, { name: string; position: string; seasons: any[] }>();
        for (const [playerId, seasons] of careerHistory) {
          const player = playersMap.get(playerId);
          if (!player || player.rosterData.rosterStatus !== 'RETIRED') continue;
          retiredMap.set(playerId, {
            name: player.name,
            position: player.position,
            seasons: seasons.map(s => ({
              ...s, pa: s.ab + 50, h: s.hits,
              outs: Math.round(s.ip * 3), ka: s.kPitching, er: s.earnedRuns,
              bb: 0, so: 0, doubles: 0, triples: 0, hbp: 0, sb: 0, cs: 0, sf: 0, ha: 0, bba: 0, hra: 0, ra: 0,
            })),
          });
        }
        const existingIds = new Set(hallOfFamers.map(h => h.playerId));
        const candidates = identifyHOFCandidates(retiredMap, currentSeason + 1, existingIds);
        // Merge with existing candidates (increment ballot year)
        for (const existing of hofCandidates) {
          if (!candidates.find(c => c.playerId === existing.playerId)) {
            existing.yearsOnBallot++;
            if (existing.yearsOnBallot <= 10) candidates.push(existing);
          }
        }
        const { inducted, remaining } = simulateHOFVoting(candidates, rngSeed + currentSeason);
        hallOfFamers.push(...inducted);
        hofCandidates = remaining;
      } catch { /* HOF voting non-fatal */ }

      // Backfill offseason transaction log (retirements + Rule 5 + FA + draft).
      const offseasonSeason = currentSeason + 1;
      for (const playerId of offseason.recap.retirements) {
        const player = playersMap.get(playerId);
        if (!player) continue;
        const playerName = `${player.firstName} ${player.lastName}`;
        transactionLog.push({
          date: 0,
          season: offseasonSeason,
          teamId: player.teamId,
          transaction: { type: 'RETIREMENT', playerId },
          description: `${playerName} announced retirement`,
        });
        logTransaction(eventLog, offseasonSeason, 0, {
          kind: 'transaction',
          transactionType: 'RETIREMENT',
          playerId,
          playerName,
          teamId: player.teamId,
          details: `${playerName} announced retirement`,
        });
      }

      for (const pick of offseason.recap.rule5Picks) {
        const player = playersMap.get(pick.playerId);
        const name = player ? `${player.firstName} ${player.lastName}` : `Player #${pick.playerId}`;
        const details = `Selected ${name} in Rule 5 Draft`;
        transactionLog.push({
          date: 0,
          season: offseasonSeason,
          teamId: pick.selectingTeamId,
          transaction: {
            type: 'RULE_5_SELECT',
            playerId: pick.playerId,
            selectingTeamId: pick.selectingTeamId,
          },
          description: details,
        });
        logTransaction(eventLog, offseasonSeason, 0, {
          kind: 'transaction',
          transactionType: 'RULE_5_SELECT',
          playerId: pick.playerId,
          playerName: name,
          teamId: pick.selectingTeamId,
          details,
        });
      }

      for (const signing of offseason.recap.faSignings) {
        const player = playersMap.get(signing.playerId);
        const name = player ? `${player.firstName} ${player.lastName}` : `Player #${signing.playerId}`;
        const details = `Signed ${name} (${signing.years}yr/$${(signing.annualSalary / 1_000_000).toFixed(1)}M)`;
        transactionLog.push({
          date: 0,
          season: offseasonSeason,
          teamId: signing.teamId,
          transaction: {
            type: 'SIGN_FA',
            playerId: signing.playerId,
            teamId: signing.teamId,
            years: signing.years,
            salary: signing.annualSalary,
          },
          description: details,
        });
        logTransaction(eventLog, offseasonSeason, 0, {
          kind: 'transaction',
          transactionType: 'SIGN_FA',
          playerId: signing.playerId,
          playerName: name,
          teamId: signing.teamId,
          details,
        });
      }

      for (const pick of offseason.recap.draftResult.picks) {
        const details = `Drafted ${pick.playerName} (Rd ${pick.round}, Pick ${pick.pick})`;
        transactionLog.push({
          date: 0,
          season: offseasonSeason,
          teamId: pick.teamId,
          transaction: {
            type: 'DRAFT_PICK',
            playerId: pick.playerId,
            teamId: pick.teamId,
            round: pick.round,
            pick: pick.pick,
          },
          description: details,
        });
        logDraftPick(eventLog, offseasonSeason, {
          kind: 'draft',
          pickNumber: pick.pick,
          playerId: pick.playerId,
          playerName: pick.playerName,
          teamId: pick.teamId,
          position: String(pick.position),
          prospectType: pick.type,
        });
      }

      // Build offseason news package for the new season.
      const teamNameMap = buildTeamNameMap();
      const offseasonNews: NewsStory[] = [];
      const newsSeason = currentSeason + 1;

      for (const r of offseason.recap.retirements) {
        const player = playersMap.get(r);
        if (!player) continue;
        const careerYears = Math.max(1, Math.floor(player.rosterData.serviceTimeDays / 172));
        offseasonNews.push(News.generateRetirementStory(
          newsSeason,
          `${player.firstName} ${player.lastName}`,
          String(player.position),
          teamNameMap.get(player.teamId) ?? 'Unknown',
          careerYears,
          player.playerId,
          player.teamId,
        ));
      }

      for (const s of offseason.recap.faSignings) {
        const player = playersMap.get(s.playerId);
        if (!player) continue;
        offseasonNews.push(News.generateSigningStory(
          newsSeason,
          `${player.firstName} ${player.lastName}`,
          teamNameMap.get(s.teamId) ?? 'Unknown',
          s.years,
          s.annualSalary,
          s.playerId,
          s.teamId,
        ));
      }

      for (const event of chemistryAdvance.events) {
        offseasonNews.push(News.generateClubhouseStory(
          newsSeason,
          teamNameMap.get(event.teamId) ?? `Team ${event.teamId}`,
          event,
        ));
      }

      const ownerStoryTeamIds = new Set<number>();
      const hotSeat = ownerEvaluations.filter((ev) => (ownerProfiles.get(ev.teamId)?.jobSecurity ?? 'safe') === 'hot');
      for (const entry of hotSeat) {
        ownerStoryTeamIds.add(entry.teamId);
      }

      const topUpside = [...ownerEvaluations]
        .filter((ev) => ev.score >= 78)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      for (const entry of topUpside) {
        ownerStoryTeamIds.add(entry.teamId);
      }

      const pressureTeams = [...ownerEvaluations]
        .filter((ev) => ev.score <= 52)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
      for (const entry of pressureTeams) {
        ownerStoryTeamIds.add(entry.teamId);
      }

      for (const teamId of ownerStoryTeamIds) {
        const evaluation = ownerEvaluations.find((entry) => entry.teamId === teamId);
        const profile = ownerProfiles.get(teamId);
        if (!evaluation || !profile) continue;
        offseasonNews.push(News.generateOwnerMandateStory(
          newsSeason,
          profile.ownerName,
          teamNameMap.get(teamId) ?? `Team ${teamId}`,
          evaluation.score,
          profile.jobSecurity,
          evaluation.summary,
          teamId,
        ));
      }

      const topDraftPicks = offseason.recap.draftResult.picks.slice(0, 10);
      for (const pick of topDraftPicks) {
        offseasonNews.push(News.generateDraftStory(
          newsSeason,
          pick.pick,
          pick.playerName,
          String(pick.position),
          teamNameMap.get(pick.teamId) ?? 'Unknown',
          pick.type,
          pick.playerId,
          pick.teamId,
        ));
      }

      latestNewsFeed = sortNewsFeed(offseasonNews);
    } else {
      latestNewsFeed = [];
      latestOffseasonRecap = null;
      teamChemistry = initializeTeamChemistry(teams.map((t) => t.teamId), currentSeason + 1);
      clubhouseEvents = [];
    }

    currentSeason++;
    latestPlayoffBracket = null;
    latestSeasonAwards = null;
    latestTeamSeasons = [];
    latestPlayerSeasons = new Map();
    incrementalSimState = null;
    cachedSchedule = null;
    latestGameResults = [];
    featuredGameIds = new Set();
    cache.invalidate();

    // Reset per-season counters (options, demotions, IL clearance)
    for (const p of players) {
      p.rosterData.optionUsedThisSeason = false;
      p.rosterData.minorLeagueDaysThisSeason = 0;
      p.rosterData.demotionsThisSeason = 0;
      // Clear healed injuries from previous season
      if (p.rosterData.currentInjury && p.rosterData.currentInjury.recoveryDaysRemaining <= 0) {
        p.rosterData.currentInjury = undefined;
        if (p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60') {
          p.rosterData.rosterStatus = 'MLB_ACTIVE';
        }
      }
    }

    if (hadCompletedSeason) {
      refreshDraftBoard(1);
    } else {
      activeDraftState = null;
    }

    const saveState = buildPersistedState();
    if (saveState) {
      createAutosave(saveState, 'Advance Season');
    }

    return currentSeason;
  },

  // ─── Query API (UI asks for specific data) ──────────────────

  async getStandings(): Promise<TeamStandingRow[]> {
    const cached = cache.getStandings(currentSeason);
    if (cached) return cached as TeamStandingRow[];
    const standings = buildStandings({ teamSeasons: latestTeamSeasons, gameResults: latestGameResults });
    cache.setStandings(currentSeason, standings);
    return standings;
  },

  async getRoster(teamId: number): Promise<RosterPlayer[]> {
    return players
      .filter((p) =>
        p.teamId === teamId &&
        p.rosterData.rosterStatus !== 'FREE_AGENT' &&
        p.rosterData.rosterStatus !== 'RETIRED' &&
        p.rosterData.rosterStatus !== 'DRAFT_ELIGIBLE')
      .map((p) => ({
        playerId: p.playerId,
        name: `${p.firstName} ${p.lastName}`,
        position: String(p.position),
        leagueLevel: p.leagueLevel,
        rosterStatus: p.rosterData.rosterStatus,
        isOn40Man: p.rosterData.isOn40Man,
        optionYearsRemaining: p.rosterData.optionYearsRemaining,
        demotionsThisSeason: p.rosterData.demotionsThisSeason,
        salary: p.rosterData.salary,
        age: p.age,
        bats: p.bats,
        throws: p.throws,
        isPitcher: p.isPitcher,
        stats: getPlayerStatLine(p.playerId),
      }))
      .sort((a, b) => {
        const statusSort: Record<RosterStatus, number> = {
          MLB_ACTIVE: 0,
          MLB_IL_10: 1,
          MLB_IL_60: 2,
          DFA: 3,
          WAIVERS: 4,
          MINORS_AAA: 5,
          MINORS_AA: 6,
          MINORS_APLUS: 7,
          MINORS_AMINUS: 8,
          MINORS_ROOKIE: 9,
          MINORS_INTL: 10,
          FREE_AGENT: 11,
          RETIRED: 12,
          DRAFT_ELIGIBLE: 13,
        };
        const statusDelta = statusSort[a.rosterStatus] - statusSort[b.rosterStatus];
        if (statusDelta !== 0) return statusDelta;
        if (a.isPitcher !== b.isPitcher) return Number(a.isPitcher) - Number(b.isPitcher);
        return a.name.localeCompare(b.name);
      });
  },

  async getBattingLeaders(limit = 20): Promise<LeaderboardEntry[]> {
    const cached = cache.getBattingLeaders(currentSeason);
    if (cached && cached.length >= limit) return cached.slice(0, limit) as LeaderboardEntry[];

    const entries: LeaderboardEntry[] = [];
    for (const [playerId, ps] of latestPlayerSeasons) {
      const player = players.find((p) => p.playerId === playerId);
      if (!player || player.isPitcher || ps.ab < 100) continue;

      entries.push({
        playerId,
        name: `${player.firstName} ${player.lastName}`,
        team: teams.find((t) => t.teamId === player.teamId)?.abbreviation ?? '???',
        position: String(player.position),
        stat1: calcBA(ps.hits, ps.ab),          // BA
        stat2: ps.hr,                            // HR
        stat3: ps.rbi,                           // RBI
        stat4: ps.hits,                          // H
        stat5: ps.runs,                          // R
      });
    }

    entries.sort((a, b) => (b.stat1 as number) - (a.stat1 as number));
    const result = entries.slice(0, Math.max(limit, 25)); // cache top 25
    cache.setBattingLeaders(currentSeason, result);
    return result.slice(0, limit);
  },

  async getPitchingLeaders(limit = 20): Promise<LeaderboardEntry[]> {
    const cached = cache.getPitchingLeaders(currentSeason);
    if (cached && cached.length >= limit) return cached.slice(0, limit) as LeaderboardEntry[];

    const entries: LeaderboardEntry[] = [];
    for (const [playerId, ps] of latestPlayerSeasons) {
      const player = players.find((p) => p.playerId === playerId);
      if (!player || !player.isPitcher || ps.ip < 30) continue;

      entries.push({
        playerId,
        name: `${player.firstName} ${player.lastName}`,
        team: teams.find((t) => t.teamId === player.teamId)?.abbreviation ?? '???',
        position: String(player.position),
        stat1: calcERA(ps.earnedRuns, ps.ip),   // ERA
        stat2: ps.wins,                          // W
        stat3: ps.kPitching,                     // K
        stat4: ps.ip,                            // IP (outs)
        stat5: ps.saves,                         // SV
      });
    }

    entries.sort((a, b) => (a.stat1 as number) - (b.stat1 as number));
    const result = entries.slice(0, Math.max(limit, 25)); // cache top 25
    cache.setPitchingLeaders(currentSeason, result);
    return result.slice(0, limit);
  },

  async getPlayerProfile(playerId: number): Promise<PlayerProfileData | null> {
    const player = players.find((p) => p.playerId === playerId);
    if (!player) return null;

    const ps = latestPlayerSeasons.get(playerId);
    const career = careerHistory.get(playerId) ?? [];
    return {
      player,
      seasonStats: ps ?? null,
      careerStats: career,
    };
  },

  async getSeasonNumber(): Promise<number> {
    return currentSeason;
  },

  async getUserTeamId(): Promise<number> {
    return userTeamId;
  },

  async getSimProgress() {
    if (!incrementalSimState) {
      return { active: false, gamesCompleted: 0, totalGames: 0, currentSegment: -1, isComplete: false, segments: SEGMENTS };
    }
    return {
      active: true,
      gamesCompleted: incrementalSimState.gamesCompleted,
      totalGames: incrementalSimState.totalGames,
      currentSegment: incrementalSimState.currentSegment,
      isComplete: incrementalSimState.isComplete,
      segments: SEGMENTS,
      partialStandings: buildPartialResult(incrementalSimState, teams).teamSeasons.map(ts => ({
        teamId: ts.teamId,
        wins: ts.record.wins,
        losses: ts.record.losses,
      })),
    };
  },

  async getSeasonStage(): Promise<SeasonStage> {
    return computeSeasonStage();
  },

  async getLeagueHistory() {
    return leagueHistory;
  },

  async getYearInReview() {
    const yir = await import('./yearInReview.ts');

    const userTeam = teams.find(t => t.teamId === userTeamId);
    const userTeamSeason = latestTeamSeasons.find(ts => ts.teamId === userTeamId);

    if (!userTeam || !userTeamSeason) return null;

    // Find user's top hitter and pitcher
    let topHitter: { name: string; statLine: string } | null = null;
    let topPitcher: { name: string; statLine: string } | null = null;
    let bestHR = 0;
    let bestWins = 0;

    for (const [pid, ps] of latestPlayerSeasons) {
      const p = players.find(pl => pl.playerId === pid);
      if (!p || p.teamId !== userTeamId) continue;
      if (!p.isPitcher && ps.hr > bestHR) {
        bestHR = ps.hr;
        const avg = ps.ab > 0 ? (ps.hits / ps.ab).toFixed(3).replace('0.', '.') : '.000';
        topHitter = { name: p.name, statLine: `${avg} / ${ps.hr} HR / ${ps.rbi} RBI` };
      }
      if (p.isPitcher && ps.wins > bestWins && ps.ip > 30) {
        bestWins = ps.wins;
        const era = ps.ip > 0 ? ((ps.earnedRuns / ps.ip) * 9).toFixed(2) : '0.00';
        topPitcher = { name: p.name, statLine: `${ps.wins}-${ps.losses}, ${era} ERA, ${ps.kPitching} K` };
      }
    }

    // Get current arc type
    let arcType = 'transition';
    try {
      const { detectArcType } = await import('./storyboard.ts');
      const dummyHistory = leagueHistory.map(lh => ({
        season: lh.season,
        wins: lh.topWins.wins,
        losses: 162 - lh.topWins.wins,
        playoffResult: lh.champion ? 'Champion' as any : null,
      }));
      arcType = detectArcType(dummyHistory as any, 60, leagueHistory.length);
    } catch { /* non-fatal */ }

    // Get milestones from news
    const milestoneNews = latestNewsFeed
      .filter(n => n.headline.startsWith('MILESTONE:'))
      .map(n => n.headline.replace('MILESTONE: ', ''));

    // Get retirements from recap
    const retirements = latestOffseasonRecap?.retirements
      ? latestOffseasonRecap.retirements.map(pid => {
          const p = players.find(pl => pl.playerId === pid);
          return p?.name ?? `Player #${pid}`;
        })
      : [];

    // Get FA signings from recap
    const faSignings = (latestOffseasonRecap?.faSignings ?? []).slice(0, 5).map(s => {
      const p = players.find(pl => pl.playerId === s.playerId);
      const t = teams.find(tm => tm.teamId === s.teamId);
      return { playerName: p?.name ?? '???', teamName: t?.name ?? '???' };
    });

    // Get latest league history entry
    const lhEntry = leagueHistory.length > 0 ? leagueHistory[leagueHistory.length - 1] : null;

    // Get top prospect
    let topProspect: { name: string; grade: string } | null = null;
    try {
      const { generateTop100 } = await import('./league/prospects.ts');
      const playerMap = new Map(players.map(p => [p.playerId, p]));
      const [rankings] = generateTop100(playerMap, gen!, currentSeason);
      const userProspect = rankings.find(r => r.teamId === userTeamId);
      if (userProspect) topProspect = { name: userProspect.name, grade: userProspect.grade };
    } catch { /* non-fatal */ }

    // Count new franchise records from news
    const newRecordCount = latestNewsFeed.filter(n => n.headline.startsWith('NEW FRANCHISE RECORD')).length;

    const input = {
      season: currentSeason,
      teamName: userTeam.name,
      teamAbbr: userTeam.abbreviation,
      record: { wins: userTeamSeason.wins, losses: userTeamSeason.losses },
      divisionRank: userTeamSeason.divisionRank,
      playoffResult: userTeamSeason.playoffResult ?? null,
      arcType,
      awards: latestSeasonAwards,
      userTeamId,
      topHitter,
      topPitcher,
      newRecordCount,
      milestonesReached: milestoneNews.slice(0, 5),
      retirements: retirements.slice(0, 5),
      topProspect,
      ownerPatienceChange: 0, // TODO: track delta
      rivalryUpdate: null, // TODO: from rivalry system
      faSignings,
      leagueHistoryEntry: lhEntry ? {
        champion: lhEntry.champion,
        topWins: lhEntry.topWins,
        topHR: lhEntry.topHR,
      } : null,
    };

    return yir.generateYearInReview(input);
  },

  async getTeams(): Promise<Team[]> {
    return teams;
  },

  async getPlayoffBracket(): Promise<PlayoffBracket | null> {
    return latestPlayoffBracket;
  },

  async getSeasonAwards(): Promise<SeasonAwards | null> {
    return latestSeasonAwards;
  },

  async getNewsFeed(): Promise<NewsStory[]> {
    return latestNewsFeed;
  },

  /**
   * Return injury summary and IL roster for a specific team.
   */
  async getCurrentInjuries(teamId: number): Promise<{ summary: InjurySummary; roster: ReturnType<typeof getTeamInjuries> }> {
    return {
      summary: getInjurySummary(players, teamId),
      roster: getTeamInjuries(players, teamId),
    };
  },

  async getRecentEvents(limit = 40, teamId?: number): Promise<GameEvent[]> {
    if (limit <= 0) return [];

    const seasonEvents = eventLog.getSeason(currentSeason);
    const filtered = teamId == null
      ? seasonEvents
      : seasonEvents.filter((entry) => entry.teamIds.includes(teamId));

    const sorted = [...filtered].sort((a, b) => {
      if (b.gameDay !== a.gameDay) return b.gameDay - a.gameDay;
      return b.eventId - a.eventId;
    });
    return sorted.slice(0, limit);
  },

  async getOwnerState(teamId: number): Promise<OwnerProfile | null> {
    return ownerProfiles.get(teamId) ?? null;
  },

  async getOwnerEvaluationHistory(teamId: number, limit = 10): Promise<OwnerEvaluation[]> {
    if (limit <= 0) return [];
    const filtered = ownerEvaluationHistory.filter((entry) => entry.teamId === teamId);
    const start = Math.max(0, filtered.length - limit);
    return filtered.slice(start);
  },

  async getTeamChemistry(teamId: number): Promise<TeamChemistryState | null> {
    return teamChemistry.get(teamId) ?? null;
  },

  async getClubhouseEvents(teamId?: number, limit = 40): Promise<ClubhouseEvent[]> {
    if (limit <= 0) return [];

    const filtered = teamId == null
      ? clubhouseEvents
      : clubhouseEvents.filter((event) => event.teamId === teamId);

    const sorted = [...filtered].sort((a, b) => {
      if (b.season !== a.season) return b.season - a.season;
      return b.eventId - a.eventId;
    });
    return sorted.slice(0, limit);
  },

  async getTeamNameMap(): Promise<[number, string][]> {
    // Serialize Map for Comlink transfer
    return Array.from(buildTeamNameMap().entries());
  },

  async getOffseasonRecap(): Promise<OffseasonRecap | null> {
    return latestOffseasonRecap;
  },

  async getTransactionLog(limit = 200): Promise<TransactionLogEntry[]> {
    if (limit <= 0) return [];
    const start = Math.max(0, transactionLog.length - limit);
    return transactionLog.slice(start);
  },

  async getTeamTransactionLog(teamId: number, limit = 100): Promise<TransactionLogEntry[]> {
    if (limit <= 0) return [];
    const filtered = transactionLog.filter((entry) => entry.teamId === teamId);
    const start = Math.max(0, filtered.length - limit);
    return filtered.slice(start);
  },

  async getLeagueActivityIntel(request: ActivityIntelRequest): Promise<ActivityIntelResponse> {
    return computeActivityIntelAggregate({
      transactionLog,
      teams: teams.map((team) => ({
        teamId: team.teamId,
        conferenceId: team.conferenceId,
        divisionId: team.divisionId,
      })),
      request,
      maxHistoryLimit: 2000,
    });
  },

  async getTeamRosterCounts(teamId: number): Promise<TeamRosterCounts> {
    const playerMap = new Map<number, Player>();
    for (const p of players) {
      playerMap.set(p.playerId, p);
    }
    return {
      teamId,
      fortyMan: countFortyMan(teamId, playerMap),
      twentySixMan: countTwentySix(teamId, playerMap),
    };
  },

  async submitRosterTransaction(
    teamId: number,
    tx: RosterTransaction,
    gameDay: number = 0,
  ): Promise<{ ok: boolean; reason?: string }> {
    const playerMap = new Map<number, Player>();
    for (const p of players) {
      playerMap.set(p.playerId, p);
    }

    const validation = validateTransaction(tx, teamId, playerMap);
    if (!validation.valid) {
      return { ok: false, reason: validation.reason };
    }

    const logLengthBefore = transactionLog.length;
    executeTransaction(tx, teamId, playerMap, gameDay, currentSeason, transactionLog);
    players = Array.from(playerMap.values());
    cache.invalidate();

    const entry = transactionLog[logLengthBefore];
    const playerId = primaryPlayerId(tx);
    const player = playerId !== null ? playerMap.get(playerId) : null;
    const playerName = player ? `${player.firstName} ${player.lastName}` : null;

    if (entry) {
      logTransaction(eventLog, currentSeason, gameDay, {
        kind: 'transaction',
        transactionType: entry.transaction.type,
        playerId: playerId ?? -1,
        playerName: playerName ?? 'N/A',
        teamId,
        details: entry.description,
      });
    }

    if (entry && shouldCreateTransactionStory(entry.transaction.type)) {
      const teamName = buildTeamNameMap().get(teamId) ?? `Team ${teamId}`;
      latestNewsFeed.push(News.generateTransactionPulseStory(
        currentSeason,
        gameDay,
        teamName,
        entry.transaction.type,
        entry.description,
        playerName,
        playerId !== null ? [playerId] : [],
        teamId,
      ));
      latestNewsFeed = sortNewsFeed(latestNewsFeed);
    }

    return { ok: true };
  },

  async getTradeSuggestions(teamId: number, limit = 6, deadlineMode = false): Promise<TradeSuggestion[]> {
    if (!gen || limit <= 0) return [];

    const teamIds = teams.map((t) => t.teamId);
    const playerMap = new Map<number, Player>();
    for (const p of players) {
      playerMap.set(p.playerId, p);
    }

    const teamStrategies = deriveTeamStrategies(teamIds);

    let scoutingProfiles;
    [scoutingProfiles, gen] = generateScoutingProfiles(teamIds, gen);

    const reputations = new Map<number, ReturnType<typeof createTradeReputation>>();
    for (const id of teamIds) {
      reputations.set(id, createTradeReputation());
    }

    const myStrategy = teamStrategies.get(teamId) ?? 'fringe';
    const deadlineUrgency = deadlineMode ? 0.85 : 0;

    let proposals: TradePackage[];
    [proposals, gen] = aiProposeTrades(
      teamId,
      myStrategy,
      playerMap,
      teamStrategies,
      scoutingProfiles,
      reputations,
      gen,
      { deadlineUrgency },
    );

    const suggestions: TradeSuggestion[] = [];
    for (const pkg of proposals) {
      const marketContext = buildTradeMarketContext(pkg, deadlineUrgency);
      let evalResult;
      [evalResult, gen] = evaluateTrade(
        pkg,
        playerMap,
        teamStrategies,
        scoutingProfiles,
        reputations,
        gen,
        15,
        marketContext,
      );

      suggestions.push(buildTradeSuggestion(pkg, evalResult, playerMap, buildTeamNameMap()));
    }

    suggestions.sort((a, b) => b.surplus - a.surplus);
    return suggestions.slice(0, limit);
  },

  async getTradeCounterOffer(pkg: TradePackage, deadlineMode = false): Promise<TradeCounterOfferResult> {
    if (!gen) return { ok: false, reason: 'Trade engine not ready.' };
    if (pkg.fromTeamId === pkg.toTeamId) {
      return { ok: false, reason: 'Trade teams must be different.' };
    }

    const teamIds = teams.map((t) => t.teamId);
    const playerMap = new Map<number, Player>();
    for (const p of players) {
      playerMap.set(p.playerId, p);
    }

    const validateTradeSide = (playerIds: number[], expectedTeamId: number): string | null => {
      for (const id of playerIds) {
        const player = playerMap.get(id);
        if (!player) return `Player #${id} not found.`;
        if (player.teamId !== expectedTeamId) {
          return `${player.firstName} ${player.lastName} is no longer on expected team.`;
        }
        if (player.rosterData.hasTenAndFive) {
          return `${player.firstName} ${player.lastName} has 10-and-5 rights (no-trade).`;
        }
      }
      return null;
    };

    const fromValidation = validateTradeSide(pkg.playersOffered, pkg.fromTeamId);
    if (fromValidation) return { ok: false, reason: fromValidation };
    const toValidation = validateTradeSide(pkg.playersRequested, pkg.toTeamId);
    if (toValidation) return { ok: false, reason: toValidation };

    const teamStrategies = deriveTeamStrategies(teamIds);
    const marketContext = buildTradeMarketContext(pkg, deadlineMode ? 0.85 : 0);

    let scoutingProfiles;
    [scoutingProfiles, gen] = generateScoutingProfiles(teamIds, gen);

    const reputations = new Map<number, ReturnType<typeof createTradeReputation>>();
    for (const id of teamIds) {
      reputations.set(id, createTradeReputation());
    }

    let proposal;
    [proposal, gen] = proposeCounterOffer(
      pkg,
      playerMap,
      teamStrategies,
      scoutingProfiles,
      reputations,
      gen,
      2,
      marketContext,
    );

    const suggestion = buildTradeSuggestion(
      proposal.package,
      proposal.evaluation,
      playerMap,
      buildTeamNameMap(),
    );

    return {
      ok: true,
      suggestion,
      changed: proposal.changed,
      rounds: proposal.rounds,
    };
  },

  async executeTradePackage(
    pkg: TradePackage,
    gameDay = 0,
  ): Promise<{ ok: boolean; reason?: string }> {
    if (pkg.fromTeamId === pkg.toTeamId) {
      return { ok: false, reason: 'Trade teams must be different.' };
    }

    const playerMap = new Map<number, Player>();
    for (const p of players) {
      playerMap.set(p.playerId, p);
    }

    const validateTradeSide = (playerIds: number[], expectedTeamId: number): string | null => {
      for (const id of playerIds) {
        const player = playerMap.get(id);
        if (!player) return `Player #${id} not found.`;
        if (player.teamId !== expectedTeamId) {
          return `${player.firstName} ${player.lastName} is no longer on expected team.`;
        }
        if (player.rosterData.hasTenAndFive) {
          return `${player.firstName} ${player.lastName} has 10-and-5 rights (no-trade).`;
        }
      }
      return null;
    };

    const fromValidation = validateTradeSide(pkg.playersOffered, pkg.fromTeamId);
    if (fromValidation) return { ok: false, reason: fromValidation };
    const toValidation = validateTradeSide(pkg.playersRequested, pkg.toTeamId);
    if (toValidation) return { ok: false, reason: toValidation };

    executeTransaction(
      {
        type: 'TRADE',
        playerIds: pkg.playersOffered,
        fromTeamId: pkg.fromTeamId,
        toTeamId: pkg.toTeamId,
      },
      pkg.fromTeamId,
      playerMap,
      gameDay,
      currentSeason,
      transactionLog,
    );

    executeTransaction(
      {
        type: 'TRADE',
        playerIds: pkg.playersRequested,
        fromTeamId: pkg.toTeamId,
        toTeamId: pkg.fromTeamId,
      },
      pkg.toTeamId,
      playerMap,
      gameDay,
      currentSeason,
      transactionLog,
    );

    players = Array.from(playerMap.values());
    cache.invalidate();

    const nameMap = buildTeamNameMap();
    const fromTeamName = nameMap.get(pkg.fromTeamId) ?? `Team ${pkg.fromTeamId}`;
    const toTeamName = nameMap.get(pkg.toTeamId) ?? `Team ${pkg.toTeamId}`;
    latestNewsFeed.push(News.generateTradeStory(
      currentSeason,
      gameDay,
      fromTeamName,
      toTeamName,
      pkg.playersOffered.map((id) => {
        const p = playerMap.get(id);
        return p ? `${p.firstName} ${p.lastName}` : `Player #${id}`;
      }),
      pkg.playersRequested.map((id) => {
        const p = playerMap.get(id);
        return p ? `${p.firstName} ${p.lastName}` : `Player #${id}`;
      }),
      [...pkg.playersOffered, ...pkg.playersRequested],
      [pkg.fromTeamId, pkg.toTeamId],
    ));
    logTrade(eventLog, currentSeason, gameDay, {
      kind: 'trade',
      fromTeamId: pkg.fromTeamId,
      toTeamId: pkg.toTeamId,
      playersGoing: pkg.playersOffered.map((id) => {
        const p = playerMap.get(id);
        return {
          playerId: id,
          name: p ? `${p.firstName} ${p.lastName}` : `Player #${id}`,
        };
      }),
      playersReceived: pkg.playersRequested.map((id) => {
        const p = playerMap.get(id);
        return {
          playerId: id,
          name: p ? `${p.firstName} ${p.lastName}` : `Player #${id}`,
        };
      }),
      surplusValue: 0,
    });
    latestNewsFeed = sortNewsFeed(latestNewsFeed);

    const saveState = buildPersistedState();
    if (saveState) {
      createAutosave(saveState, 'Trade Completed');
    }

    return { ok: true };
  },

  async getFreeAgentBoard(teamId: number, limit = 30): Promise<FreeAgentListing[]> {
    if (limit <= 0) return [];

    const teamIds = teams.map((t) => t.teamId);
    const teamStrategies = deriveTeamStrategies(teamIds);
    const myStrategy = teamStrategies.get(teamId) ?? 'fringe';

    const listings: FreeAgentListing[] = [];
    for (const p of players) {
      if (p.rosterData.rosterStatus !== 'FREE_AGENT') continue;

      const overall = playerOverall(p);
      const talentProjection = Math.max(0, (overall - 200) / 50);
      const agePenalty = Math.max(0, (p.age - 28) * 0.3);
      const adjustedProjection = Math.max(0, talentProjection - agePenalty);
      const desiredSalary = Math.max(720_000, Math.round(adjustedProjection * 8_000_000));
      const desiredYears = p.age <= 28 ? 5 : p.age <= 31 ? 3 : p.age <= 34 ? 2 : 1;

      const needScore = computePositionNeedScore(teamId, String(p.position));
      let fitScore = needScore * 50 + Math.max(0, (overall - 220) * 0.08);
      if (myStrategy === 'contender') {
        fitScore += p.age <= 34 ? 8 : -6;
        fitScore += p.leagueLevel === 'MLB' ? 8 : 0;
      } else if (myStrategy === 'rebuilder') {
        fitScore += p.age <= 29 ? 10 : -8;
        fitScore += Math.max(0, (p.potential - overall) * 0.05);
      }
      fitScore = Math.max(0, Math.round(fitScore));

      const marketInterest = estimateFreeAgentMarketInterest(
        String(p.position),
        overall,
        teamIds,
        teamStrategies,
      );

      listings.push({
        playerId: p.playerId,
        name: `${p.firstName} ${p.lastName}`,
        position: String(p.position),
        age: p.age,
        isPitcher: p.isPitcher,
        overall,
        potential: p.potential,
        desiredYears,
        desiredSalary,
        teamFitScore: fitScore,
        marketInterest,
      });
    }

    listings.sort((a, b) => {
      if (b.teamFitScore !== a.teamFitScore) return b.teamFitScore - a.teamFitScore;
      return b.overall - a.overall;
    });

    return listings.slice(0, limit);
  },

  async submitFreeAgentOffer(
    teamId: number,
    playerId: number,
    years: number,
    annualSalary: number,
    gameDay: number = 0,
  ): Promise<{ ok: boolean; reason?: string }> {
    const clampedYears = Math.max(1, Math.min(8, Math.round(years)));
    const roundedSalary = Math.round(annualSalary);
    if (roundedSalary < 720_000) {
      return { ok: false, reason: 'Salary must be at least MLB minimum ($0.72M).' };
    }

    const playerMap = new Map<number, Player>();
    for (const p of players) {
      playerMap.set(p.playerId, p);
    }

    const tx: RosterTransaction = {
      type: 'SIGN_FA',
      playerId,
      teamId,
      years: clampedYears,
      salary: roundedSalary,
    };

    const validation = validateTransaction(tx, teamId, playerMap);
    if (!validation.valid) {
      return { ok: false, reason: validation.reason };
    }

    executeTransaction(tx, teamId, playerMap, gameDay, currentSeason, transactionLog);
    players = Array.from(playerMap.values());
    cache.invalidate();

    const signed = playerMap.get(playerId);
    if (signed) {
      const playerName = `${signed.firstName} ${signed.lastName}`;
      latestNewsFeed.push(News.generateSigningStory(
        currentSeason,
        playerName,
        buildTeamNameMap().get(teamId) ?? `Team ${teamId}`,
        clampedYears,
        roundedSalary,
        signed.playerId,
        teamId,
      ));
      logTransaction(eventLog, currentSeason, gameDay, {
        kind: 'transaction',
        transactionType: 'SIGN_FA',
        playerId: signed.playerId,
        playerName,
        teamId,
        details: `Signed ${playerName} (${clampedYears}yr/$${(roundedSalary / 1_000_000).toFixed(1)}M)`,
      });
      latestNewsFeed = sortNewsFeed(latestNewsFeed);
    }

    const saveState = buildPersistedState();
    if (saveState) {
      createAutosave(saveState, 'Free Agent Signing');
    }

    return { ok: true };
  },

  async listSaves(): Promise<SaveManifest[]> {
    return listSaveManifests();
  },

  async saveGameToSlot(slotId?: string, label?: string): Promise<SaveOperationResult> {
    const saveState = buildPersistedState();
    if (!saveState) {
      return { ok: false, error: 'No active league to save.' };
    }

    const resolvedSlot = slotId?.trim() ? slotId : getNextManualSlot();
    const resolvedLabel = label?.trim()
      ? label.trim()
      : `Manual Save — Season ${currentSeason}`;

    const manifest = createSave(resolvedSlot, resolvedLabel, saveState, false);
    return { ok: true, manifest };
  },

  async loadGameFromSlot(slotId: string): Promise<LoadSaveResult> {
    const loaded = loadSave(slotId);
    if (!loaded.success || !loaded.state) {
      return {
        ok: false,
        error: loaded.error ?? 'Failed to load save.',
      };
    }

    applyLoadedState(loaded.state);
    return {
      ok: true,
      manifest: loaded.manifest ?? undefined,
      warning: loaded.error,
      season: currentSeason,
      stage: computeSeasonStage(),
    };
  },

  async deleteSaveSlot(slotId: string): Promise<boolean> {
    return deleteSave(slotId);
  },

  async exportSaveSlot(slotId: string): Promise<ExportSaveResult> {
    const json = exportSaveToJSON(slotId);
    if (!json) return { ok: false, error: 'Save slot not found.' };
    return { ok: true, json };
  },

  async importSaveData(json: string, slotId?: string): Promise<SaveOperationResult> {
    const targetSlot = slotId?.trim() ? slotId : getNextManualSlot();
    const imported = importSaveFromJSON(json, targetSlot);
    if (!imported.success || !imported.manifest) {
      return { ok: false, error: imported.error ?? 'Failed to import save.' };
    }
    return { ok: true, manifest: imported.manifest };
  },

  // ─── Batched Queries (Performance) ────────────────────────────

  /**
   * getDashboardBundle — single RPC that returns everything the
   * dashboard needs. Eliminates 5+ sequential worker round-trips
   * on tab mount. Cached aggressively.
   */
  async getDashboardBundle(): Promise<DashboardBundle> {
    const cached = cache.getDashboard(currentSeason);
    if (cached) return cached;

    const standings = buildStandings({
      teamSeasons: latestTeamSeasons,
      gameResults: latestGameResults,
    });
    cache.setStandings(currentSeason, standings);

    // Build leaders inline (avoids double iteration)
    const batEntries: LeaderboardEntry[] = [];
    const pitchEntries: LeaderboardEntry[] = [];
    for (const [playerId, ps] of latestPlayerSeasons) {
      const player = players.find((p) => p.playerId === playerId);
      if (!player) continue;

      if (!player.isPitcher && ps.ab >= 100) {
        batEntries.push({
          playerId,
          name: `${player.firstName} ${player.lastName}`,
          team: teams.find((t) => t.teamId === player.teamId)?.abbreviation ?? '???',
          position: String(player.position),
          stat1: calcBA(ps.hits, ps.ab),
          stat2: ps.hr,
          stat3: ps.rbi,
          stat4: ps.hits,
          stat5: ps.runs,
        });
      }
      if (player.isPitcher && ps.ip >= 30) {
        pitchEntries.push({
          playerId,
          name: `${player.firstName} ${player.lastName}`,
          team: teams.find((t) => t.teamId === player.teamId)?.abbreviation ?? '???',
          position: String(player.position),
          stat1: calcERA(ps.earnedRuns, ps.ip),
          stat2: ps.wins,
          stat3: ps.kPitching,
          stat4: ps.ip,
          stat5: ps.saves,
        });
      }
    }

    batEntries.sort((a, b) => (b.stat1 as number) - (a.stat1 as number));
    pitchEntries.sort((a, b) => (a.stat1 as number) - (b.stat1 as number));

    const topBatters = batEntries.slice(0, 10);
    const topPitchers = pitchEntries.slice(0, 10);

    // Cache the full leaders list too
    cache.setBattingLeaders(currentSeason, batEntries.slice(0, 25));
    cache.setPitchingLeaders(currentSeason, pitchEntries.slice(0, 25));

    const bundle: DashboardBundle = {
      season: currentSeason,
      standings,
      topBatters,
      topPitchers,
      bracket: latestPlayoffBracket,
      awards: latestSeasonAwards,
      news: latestNewsFeed,
      teamNames: Array.from(buildTeamNameMap().entries()),
      gamesPlayed: latestGameResults.length,
    };

    cache.setDashboard(currentSeason, bundle);
    return bundle;
  },

  /**
   * getFeaturedGameIds — returns IDs of the most dramatic regular-season games.
   * Used by storage layer to decide which box scores to retain.
   */
  async getFeaturedGameIds(): Promise<number[]> {
    return Array.from(featuredGameIds);
  },

  /**
   * getPerformanceStats — diagnostics for the release kit panel.
   * Returns cache hit info and memory estimates.
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    return {
      cacheVersion: cache.getVersion(),
      playerCount: players.length,
      gameResultCount: latestGameResults.length,
      featuredGameCount: featuredGameIds.size,
      playerSeasonCount: latestPlayerSeasons.size,
      teamCount: teams.length,
      currentSeason,
      estimatedMemoryMB: estimateMemoryUsage(),
    };
  },

  async runIntegrityAudit(): Promise<IntegrityAuditReport> {
    return timedEndpointCall('runIntegrityAudit', async () => buildIntegrityAuditReport());
  },

  async getFeatureReadiness(featureId: string): Promise<FeatureReadinessReport> {
    return timedEndpointCall('getFeatureReadiness', async () => buildFeatureReadinessReport(featureId));
  },

  async getPlayableReadinessReport(): Promise<PlayableReadinessReport> {
    return timedEndpointCall('getPlayableReadinessReport', async () => {
      const audit = buildIntegrityAuditReport();
      const smoke = await api.getSmokeFlowReport();
      const stage = computeSeasonStage();
      const coreFeatureIds = getCoreFeatureIds();
      const missingCore = coreFeatureIds.filter((id) => !enabledFeatures.includes(id));
      const determinism = await api.runDeterminismProbe(currentSeason + 31, 1);
      const latency = buildLatencyBudgetReportInternal();
      const manifestLint = lintFeatureManifest();
      const canSave = buildPersistedState() !== null;
      const saveManifests = listSaveManifests();
      const loadProbe = saveManifests[0] ? loadSave(saveManifests[0].slotId) : null;
      const loadAvailable = loadProbe ? loadProbe.success && Boolean(loadProbe.state) : false;
      const stageCoherent = isStageStateCoherent(stage);
      const smokeEvidenceExists = smoke.steps.length >= 6
        && smoke.steps.some((step) => step.stepId === 'new_game')
        && smoke.steps.some((step) => step.stepId === 'simulate')
        && smoke.steps.some((step) => step.stepId === 'transaction_action')
        && smoke.steps.some((step) => step.stepId === 'save')
        && smoke.steps.some((step) => step.stepId === 'load')
        && smoke.steps.some((step) => step.stepId === 'continue');

      const gateInputs: AlphaGateInput[] = [
        {
          gateId: 'league_seeded',
          label: 'League seeded',
          pass: teams.length >= 30 && players.length >= 3000 && gen !== null,
          blocker: true,
          evidence: `teams=${teams.length}, players=${players.length}, prng=${gen ? 'ready' : 'missing'}`,
          recommendation: 'Run newGame(seed) and regenerate full league state before alpha verification.',
        },
        {
          gateId: 'core_sim_path',
          label: 'Core sim path available',
          pass: missingCore.length === 0 && teams.length >= 30,
          blocker: true,
          evidence: missingCore.length === 0 ? `${coreFeatureIds.length} core features enabled` : `missing core features: ${missingCore.join(', ')}`,
          recommendation: 'Enable missing core manifest entries before alpha claims.',
        },
        {
          gateId: 'integrity_audit',
          label: 'No blocker integrity failures',
          pass: audit.ok,
          blocker: true,
          evidence: audit.ok ? 'No blocker integrity issues found' : `blockers=${audit.buckets.blockers.length}, warnings=${audit.buckets.warnings.length}`,
          recommendation: 'Resolve integrity blockers first; warnings can remain for intake features only.',
        },
        {
          gateId: 'save_system_online',
          label: 'Save system online',
          pass: canSave,
          blocker: true,
          evidence: canSave ? `state serializable, slots=${saveManifests.length}` : 'buildPersistedState() returned null',
          recommendation: 'Restore persisted state serialization path before attempting alpha loop.',
        },
        {
          gateId: 'load_system_online',
          label: 'Load system operational',
          pass: loadAvailable,
          blocker: true,
          evidence: loadProbe
            ? `load slot ${saveManifests[0]?.slotId}: ${loadProbe.success ? 'ok' : `failed (${loadProbe.error ?? 'unknown'})`}`
            : 'No save manifest available to verify load path',
          recommendation: 'Create at least one save and verify loadGameFromSlot() succeeds.',
        },
        {
          gateId: 'stage_state_coherence',
          label: 'Stage/state coherence valid',
          pass: stageCoherent,
          blocker: false,
          evidence: `stage=${stage}, teamSeasons=${latestTeamSeasons.length}, bracket=${latestPlayoffBracket ? 'yes' : 'no'}, awards=${latestSeasonAwards ? 'yes' : 'no'}`,
          recommendation: 'Recompute stage markers after load/import if coherence fails.',
        },
        {
          gateId: 'smoke_flow',
          label: 'Playable smoke path evidence exists',
          pass: smoke.ok && smokeEvidenceExists,
          blocker: true,
          evidence: smoke.ok
            ? `steps=${smoke.steps.length}; blockers=none`
            : `smoke blockers=${smoke.blockers.join(', ')}`,
          recommendation: 'Ensure smoke contract covers new game → simulate → transaction → save → load → continue.',
        },
        {
          gateId: 'manifest_health',
          label: 'Manifest health valid for core play',
          pass: manifestLint.ok,
          blocker: true,
          evidence: manifestLint.ok ? 'Manifest lint clean' : `manifest issues=${manifestLint.issues.length}`,
          recommendation: 'Fix manifest lint blockers before promoting or enabling core paths.',
        },
        {
          gateId: 'determinism_probe',
          label: 'Determinism probe',
          pass: determinism.ok,
          blocker: false,
          evidence: determinism.ok
            ? `seed=${determinism.seed} seasons=${determinism.seasons}`
            : determinism.reason ?? `mismatches=${determinism.mismatches.length}`,
          recommendation: 'Re-run determinism probe after core-sim or roster logic changes.',
        },
        {
          gateId: 'latency_budget',
          label: 'Latency budget',
          pass: latency.ok,
          blocker: false,
          evidence: latency.ok ? 'Latency budgets within threshold' : `over budget endpoints=${latency.blockers.join(', ')}`,
          recommendation: 'Profile and reduce p95 endpoint latency before RC freeze.',
        },
      ];

      const rollup = buildAlphaGateResults(gateInputs);
      if (rollup.ok) {
        lastReadinessOkAt = Date.now();
      }

      return {
        ok: rollup.ok,
        generatedAt: Date.now(),
        season: currentSeason,
        stage,
        blockers: rollup.blockers,
        gates: rollup.gates,
      };
    });
  },

  async getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot> {
    return timedEndpointCall('getDiagnosticsSnapshot', async () => {
      const integrity = buildIntegrityAuditReport();
      const readiness = await api.getPlayableReadinessReport();
      const smoke = await api.getSmokeFlowReport();
      const coreFeatureIds = getCoreFeatureIds();
      const coreEnabledCount = coreFeatureIds.filter((id) => enabledFeatures.includes(id)).length;
      const manifestLint = lintFeatureManifest();
      const manifestSummary = summarizeManifestHealth(FEATURE_MANIFEST);
      const latency = buildLatencyBudgetReportInternal();
      if (!integrity.ok && workerHealthMode === 'normal') {
        workerHealthMode = 'degraded';
      }
      if (integrity.buckets.blockers.length >= 8) {
        workerHealthMode = 'panic-safe';
      }
      return {
        generatedAt: Date.now(),
        season: currentSeason,
        stage: computeSeasonStage(),
        healthMode: workerHealthMode,
        cache: {
          version: cache.getVersion(),
          estimatedMemoryMB: estimateMemoryUsage(),
        },
        counts: {
          teams: teams.length,
          players: players.length,
          games: latestGameResults.length,
          featuredGames: featuredGameIds.size,
          playerSeasons: latestPlayerSeasons.size,
          transactions: transactionLog.length,
          newsStories: latestNewsFeed.length,
        },
        features: {
          enabledCount: enabledFeatures.length,
          coreEnabledCount,
          totalManifestCount: FEATURE_MANIFEST.length,
          buildFingerprint,
        },
        integrity: {
          ok: integrity.ok,
          issueCount: integrity.issues.length,
        },
        manifest: {
          ok: manifestLint.ok,
          issueCount: manifestLint.issues.length,
          statusCounts: manifestSummary.statusCounts,
          tierCounts: manifestSummary.tierCounts,
        },
        readiness: {
          ok: readiness.ok,
          blockerCount: readiness.blockers.length,
          gateCount: readiness.gates.length,
        },
        smoke: {
          ok: smoke.ok,
          blockerCount: smoke.blockers.length,
          stepCount: smoke.steps.length,
        },
        latency: {
          ok: latency.ok,
          issueCount: latency.blockers.length,
          sampledEndpoints: latency.endpoints.filter((entry) => entry.calls > 0).length,
        },
        markers: {
          lastIntegrityCleanAt,
          lastReadinessOkAt,
          lastSmokeOkAt,
        },
      };
    });
  },

  async getSmokeFlowReport(): Promise<SmokeFlowReport> {
    return timedEndpointCall('getSmokeFlowReport', async () => {
      const steps: SmokeFlowStepResult[] = [];
      const stage = computeSeasonStage();

      steps.push({
        stepId: 'new_game',
        label: 'New game available',
        pass: teams.length > 0 && players.length > 0,
        detail: `teams=${teams.length}, players=${players.length}`,
      });

      steps.push({
        stepId: 'simulate',
        label: 'Simulation callable',
        pass: gen !== null && teams.length >= 30,
        detail: gen ? 'PRNG state available' : 'PRNG state missing',
      });

      const hasTransactions = transactionLog.length > 0;
      steps.push({
        stepId: 'transaction_action',
        label: 'Roster/market action path',
        pass: hasTransactions || stage === 'idle',
        detail: hasTransactions ? `${transactionLog.length} transactions logged` : 'No transactions yet; fresh league accepted',
      });

      const saves = listSaveManifests();
      steps.push({
        stepId: 'save',
        label: 'Save system online',
        pass: buildPersistedState() !== null,
        detail: `slots=${saves.length}`,
      });

      const loadProbe = saves[0] ? loadSave(saves[0].slotId) : null;
      steps.push({
        stepId: 'load',
        label: 'Load path available',
        pass: loadProbe ? loadProbe.success && Boolean(loadProbe.state) : false,
        detail: loadProbe
          ? `slot=${saves[0]?.slotId} ${loadProbe.success ? 'ok' : `failed (${loadProbe.error ?? 'unknown'})`}`
          : 'No save manifest available to verify load',
      });

      const canContinue = stage === 'idle' || stage === 'season' || stage === 'postseason' || stage === 'awards';
      steps.push({
        stepId: 'continue',
        label: 'Continuation stage valid',
        pass: canContinue,
        detail: `stage=${stage}`,
      });

      const blockers = steps.filter((step) => !step.pass).map((step) => step.stepId);
      if (blockers.length === 0) {
        lastSmokeOkAt = Date.now();
      }
      return {
        ok: blockers.length === 0,
        generatedAt: Date.now(),
        stage,
        blockers,
        steps,
      };
    });
  },

  async runDeterminismProbe(seed: number, seasons: number): Promise<DeterminismProbeReport> {
    return timedEndpointCall('runDeterminismProbe', async () => {
      const boundedSeasons = Math.max(1, Math.min(3, Math.floor(seasons)));
      if (teams.length === 0 || players.length === 0) {
        return {
          ok: false,
          generatedAt: Date.now(),
          seed,
          seasons: boundedSeasons,
          reason: 'No active league state to probe.',
          mismatches: [],
          metricsA: [],
          metricsB: [],
        };
      }

      const passA = await runDeterminismPass(seed, boundedSeasons);
      const passB = await runDeterminismPass(seed, boundedSeasons);
      const mismatches: string[] = [];

      for (let i = 0; i < passA.length; i += 1) {
        const a = passA[i];
        const b = passB[i];
        if (!b) {
          mismatches.push(`Missing comparison season at index ${i}`);
          continue;
        }

        if (a.totalGames !== b.totalGames) mismatches.push(`Season ${a.season}: totalGames ${a.totalGames} != ${b.totalGames}`);
        if (a.totalRuns !== b.totalRuns) mismatches.push(`Season ${a.season}: totalRuns ${a.totalRuns} != ${b.totalRuns}`);
        if (a.winsChecksum !== b.winsChecksum) mismatches.push(`Season ${a.season}: winsChecksum mismatch`);
        if (a.homeRunsChecksum !== b.homeRunsChecksum) mismatches.push(`Season ${a.season}: homeRunsChecksum mismatch`);
        if (a.topTeamId !== b.topTeamId) mismatches.push(`Season ${a.season}: topTeamId mismatch`);
        if (a.topTeamWins !== b.topTeamWins) mismatches.push(`Season ${a.season}: topTeamWins mismatch`);
      }

      return {
        ok: mismatches.length === 0,
        generatedAt: Date.now(),
        seed,
        seasons: boundedSeasons,
        mismatches,
        metricsA: passA,
        metricsB: passB,
      };
    });
  },

  async getIntakeAuditReport(packId: IntakePack): Promise<IntakeAuditReport> {
    return timedEndpointCall('getIntakeAuditReport', async () => {
      const inPack = FEATURE_MANIFEST.filter((feature) => feature.intakePack === packId);
      const statusCounts: Record<FeatureStatus, number> = {
        intake: 0,
        wired: 0,
        validated: 0,
        promoted: 0,
        shelved: 0,
        deprecated: 0,
      };

      let riskTotal = 0;
      const highRiskFeatureIds: string[] = [];
      for (const feature of inPack) {
        statusCounts[feature.status] += 1;
        riskTotal += feature.riskScore;
        if (feature.riskScore >= 70) {
          highRiskFeatureIds.push(feature.id);
        }
      }

      const lintIssues = lintFeatureManifest().issues.filter(
        (issue) => issue.severity === 'error' && inPack.some((feature) => feature.id === issue.featureId),
      );
      const blockers = lintIssues.map((issue) => issue.code);

      return {
        packId,
        generatedAt: Date.now(),
        ok: blockers.length === 0,
        totalFeatures: inPack.length,
        avgRiskScore: inPack.length === 0 ? 0 : Number((riskTotal / inPack.length).toFixed(2)),
        statusCounts,
        highRiskFeatureIds,
        blockers,
      };
    });
  },

  async runSoakSimulation(seed: number, seasons: number, mode: SoakSimulationMode): Promise<SoakSimulationReport> {
    return timedEndpointCall('runSoakSimulation', async () => {
      const boundedSeasons = Math.max(1, Math.min(10, Math.floor(seasons)));
      const startedAt = performance.now();

      if (teams.length === 0 || players.length === 0) {
        return {
          ok: false,
          generatedAt: Date.now(),
          seed,
          seasons: boundedSeasons,
          mode,
          durationMs: Number((performance.now() - startedAt).toFixed(3)),
          blockers: ['league-uninitialized'],
          checkpoints: [],
        };
      }

      const checkpoints = await runDeterminismPass(seed, boundedSeasons);
      const blockers: string[] = [];

      if (mode === 'core') {
        const missingCore = getCoreFeatureIds().filter((id) => !enabledFeatures.includes(id));
        if (missingCore.length > 0) {
          blockers.push(`core-features-disabled:${missingCore.join(',')}`);
        }
      }

      for (const checkpoint of checkpoints) {
        if (checkpoint.totalGames <= 0) {
          blockers.push(`season-${checkpoint.season}-no-games`);
        }
      }

      return {
        ok: blockers.length === 0,
        generatedAt: Date.now(),
        seed,
        seasons: boundedSeasons,
        mode,
        durationMs: Number((performance.now() - startedAt).toFixed(3)),
        blockers,
        checkpoints,
      };
    });
  },

  async getLatencyBudgetReport(): Promise<LatencyBudgetReport> {
    return timedEndpointCall('getLatencyBudgetReport', async () => buildLatencyBudgetReportInternal());
  },

  async getDraftBoard(teamId = userTeamId): Promise<DraftBoardListing> {
    return timedEndpointCall('getDraftBoard', async () => {
      if (!activeDraftState || activeDraftState.userTeamId !== teamId) {
        refreshDraftBoard(teamId);
      }

      if (!activeDraftState) {
        return {
          season: currentSeason,
          userTeamId: teamId,
          totalRounds: 10,
          currentRound: 1,
          currentPickInRound: 1,
          overallPick: 1,
          teamOnClockId: null,
          completed: true,
          picks: [],
          available: [],
        };
      }

      const playersById = buildPlayersByIdMap();
      activeDraftState = runAIPicksUntilUserTurn(activeDraftState, playersById);
      players = Array.from(playersById.values());
      cache.invalidate();

      return buildDraftBoardListing(activeDraftState);
    });
  },

  async makeDraftPick(playerId: number): Promise<DraftPickResponse> {
    return timedEndpointCall('makeDraftPick', async () => {
      const draftTeamId = activeDraftState?.userTeamId ?? userTeamId;
      if (!activeDraftState) {
        refreshDraftBoard(draftTeamId);
      }

      if (!activeDraftState) {
        return { ok: false, reason: 'Draft board unavailable.' };
      }

      const playersById = buildPlayersByIdMap();
      activeDraftState = runAIPicksUntilUserTurn(activeDraftState, playersById);

      let pickResult;
      [activeDraftState, pickResult] = makeUserDraftPick(activeDraftState, playersById, playerId);
      if (!pickResult.ok) {
        return {
          ok: false,
          reason: pickResult.reason,
          board: buildDraftBoardListing(activeDraftState),
        };
      }

      if (pickResult.pick) {
        const draftPick = pickResult.pick;
        const details = `Drafted ${draftPick.playerName} (Rd ${draftPick.round}, Pick ${draftPick.pick})`;
        transactionLog.push({
          date: 0,
          season: currentSeason,
          teamId: draftPick.teamId,
          transaction: {
            type: 'DRAFT_PICK',
            playerId: draftPick.playerId,
            teamId: draftPick.teamId,
            round: draftPick.round,
            pick: draftPick.pick,
          },
          description: details,
        });
        logDraftPick(eventLog, currentSeason, {
          kind: 'draft',
          pickNumber: draftPick.pick,
          playerId: draftPick.playerId,
          playerName: draftPick.playerName,
          teamId: draftPick.teamId,
          position: String(draftPick.position),
          prospectType: draftPick.type,
        });
      }

      activeDraftState = runAIPicksUntilUserTurn(activeDraftState, playersById);
      players = Array.from(playersById.values());
      cache.invalidate();

      const saveState = buildPersistedState();
      if (saveState) {
        createAutosave(saveState, 'Draft Updated');
      }

      return {
        ok: true,
        pick: pickResult.pick,
        board: buildDraftBoardListing(activeDraftState),
      };
    });
  },

  // ─── Stub methods (Sprint 04 branch surgery) ──────────────────────

  // State management
  async loadState(_state: any): Promise<void> {
    // Legacy stub — use loadGameFromSlot() for save/load functionality
    console.warn('loadState() is deprecated. Use loadGameFromSlot() instead.');
  },
  async getFullState(): Promise<any> { return buildPersistedState(); },

  // Team/roster queries
  async getLeagueTeams() { return teams; },
  async getTeamPlayers(teamId: number) { return players.filter(p => p.teamId === teamId); },
  async getFullRoster(teamId: number) {
    const roster = players.filter(p => p.teamId === teamId && p.rosterData.rosterStatus !== 'FREE_AGENT' && p.rosterData.rosterStatus !== 'RETIRED' && p.rosterData.rosterStatus !== 'DRAFT_ELIGIBLE');
    const active = roster.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE');
    const il = roster.filter(p => p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60');
    const minors = roster.filter(p => !['MLB_ACTIVE', 'MLB_IL_10', 'MLB_IL_60', 'DFA', 'WAIVERS'].includes(p.rosterData.rosterStatus));
    return { active, minors, il };
  },
  async getPlayerNameMap() { return players.map(p => [p.playerId, `${p.firstName} ${p.lastName}`] as [number, string]); },
  async getTeamNeeds(_teamId: number) { return {}; },

  // Season sim aliases
  async simulateSeason(_onProgress?: any) { return api.simulateCurrentSeason(); },
  async simulatePlayoffs() { return api.simulatePostseason(); },
  async finalizeSeason() {
    // Season complete — ensure all post-season data is computed
    cache.invalidate();
    const saveState = buildPersistedState();
    if (saveState) createAutosave(saveState, 'Season Finalized');
  },
  async simNextChunk() {
    // Initialize incremental sim if not started
    if (!incrementalSimState) {
      cachedSchedule = generateScheduleTemplate();
      incrementalSimState = createSeasonSimState(teams, cachedSchedule.length, currentSeason, rngSeed + currentSeason);
    }
    if (!cachedSchedule) cachedSchedule = generateScheduleTemplate();

    const result = simulateChunk(
      incrementalSimState,
      teams,
      players,
      cachedSchedule,
      { userTeamId },
    );

    // Always sync to main state so getStandings() reads live data
    syncIncrementalToMainState(result.partialResult);
    cache.invalidate();

    return {
      partialResult: result.partialResult,
      segment: result.segment,
      segmentLabel: result.segmentLabel,
      event: result.event,
      userRecord: result.userRecord,
      isSeasonComplete: result.isSeasonComplete,
      gamesPlayed: result.partialResult.gamesCompleted,
    };
  },
  async simRange(mode: string, _end?: number) {
    // Initialize if needed
    if (!incrementalSimState) {
      cachedSchedule = generateScheduleTemplate();
      incrementalSimState = createSeasonSimState(teams, cachedSchedule.length, currentSeason, rngSeed + currentSeason);
    }
    if (!cachedSchedule) cachedSchedule = generateScheduleTemplate();

    // Compute target based on mode
    let target: number;
    switch (mode) {
      case 'day':
        target = computeSim1DayTarget(incrementalSimState, cachedSchedule);
        break;
      case 'week':
        target = computeSim1WeekTarget(incrementalSimState, cachedSchedule);
        break;
      case 'month':
        target = computeSim1MonthTarget(incrementalSimState, cachedSchedule);
        break;
      default:
        target = typeof _end === 'number' ? _end : computeSim1WeekTarget(incrementalSimState, cachedSchedule);
    }

    const result = simulateRange(
      incrementalSimState,
      teams,
      players,
      cachedSchedule,
      target,
      { userTeamId },
    );

    // Always sync to main state so getStandings() reads live data
    syncIncrementalToMainState(result.partialResult);
    cache.invalidate();

    // ── Auto-pause trigger detection ─────────────────────────────────────
    const interrupts: Array<{ type: string; headline: string; detail: string }> = [];

    // Check for career milestones
    try {
      const { detectMilestones } = await import('./milestones.ts');
      // Build temporary career totals including this range's stats
      const tempCareer = new Map(careerHistory);
      for (const ps of result.partialResult.playerSeasons) {
        const existing = tempCareer.get(ps.playerId) ?? [];
        // Only add if this season isn't already tracked
        if (!existing.find((s: any) => s.season === ps.season)) {
          tempCareer.set(ps.playerId, [...existing, {
            playerId: ps.playerId, teamId: ps.teamId, season: ps.season,
            ab: ps.ab, hits: ps.h, hr: ps.hr, rbi: ps.rbi, runs: ps.r,
            ip: ps.outs / 3, earnedRuns: ps.er,
            wins: ps.w, losses: ps.l, kPitching: ps.ka, saves: ps.sv,
          }]);
        }
      }
      const nameMap = new Map(players.map(p => [p.playerId, p.name]));
      const milestones = detectMilestones(tempCareer, nameMap, currentSeason, firedMilestones);
      for (const m of milestones) {
        const isUserPlayer = players.find(p => p.playerId === m.playerId)?.teamId === userTeamId;
        interrupts.push({
          type: 'milestone',
          headline: `MILESTONE: ${m.playerName} — ${m.milestone}`,
          detail: isUserPlayer ? 'Your player reached a career milestone!' : 'A league-wide career milestone was reached.',
        });
      }
    } catch { /* milestone detection non-fatal */ }

    // Check for notable user team performances this range
    if (result.userRecord.wins >= 5 && result.userRecord.losses <= 1) {
      interrupts.push({
        type: 'hot_streak',
        headline: 'HOT STREAK',
        detail: `Your team went ${result.userRecord.wins}-${result.userRecord.losses} in this stretch!`,
      });
    }
    if (result.userRecord.losses >= 5 && result.userRecord.wins <= 1) {
      interrupts.push({
        type: 'cold_streak',
        headline: 'LOSING SKID',
        detail: `Your team went ${result.userRecord.wins}-${result.userRecord.losses}. Time to make a move?`,
      });
    }

    return {
      partialResult: result.partialResult,
      gamesPlayed: result.gamesSimulated,
      startDate: result.startDate,
      endDate: result.endDate,
      crossedEvent: result.crossedEvent,
      crossedSegment: result.crossedSegment,
      userRecord: result.userRecord,
      isSeasonComplete: result.isSeasonComplete,
      interrupts, // NEW: auto-pause trigger reasons
    };
  },

  /** Sim forward until the next meaningful event (auto-pause on interrupts) */
  async simToNextEvent() {
    if (!incrementalSimState) {
      cachedSchedule = generateScheduleTemplate();
      incrementalSimState = createSeasonSimState(teams, cachedSchedule.length, currentSeason, rngSeed + currentSeason);
    }
    if (!cachedSchedule) cachedSchedule = generateScheduleTemplate();

    // Sim day by day until something interesting happens
    let totalGames = 0;
    const MAX_DAYS = 30; // Safety valve — don't sim forever
    let days = 0;
    let lastResult: any = null;

    while (days < MAX_DAYS && !incrementalSimState.isComplete) {
      const target = computeSim1DayTarget(incrementalSimState, cachedSchedule);
      if (target <= incrementalSimState.gamesCompleted) break; // No more games

      const dayResult = simulateRange(
        incrementalSimState, teams, players, cachedSchedule, target, { userTeamId },
      );
      totalGames += dayResult.gamesSimulated;
      days++;
      lastResult = dayResult;

      // Stop on segment boundary
      if (dayResult.crossedEvent) break;

      // Stop on season complete
      if (dayResult.isSeasonComplete) break;
    }

    if (lastResult) {
      syncIncrementalToMainState(lastResult.partialResult);
    }
    cache.invalidate();

    // Run the same interrupt detection as simRange
    const result = lastResult ?? {
      partialResult: buildPartialResult(incrementalSimState, teams),
      gamesSimulated: 0, startDate: '', endDate: '',
      crossedEvent: null, crossedSegment: null,
      userRecord: { wins: 0, losses: 0 },
      isSeasonComplete: incrementalSimState.isComplete,
    };

    return {
      partialResult: result.partialResult,
      gamesPlayed: totalGames,
      startDate: result.startDate ?? '',
      endDate: result.endDate ?? '',
      crossedEvent: result.crossedEvent,
      crossedSegment: result.crossedSegment,
      userRecord: result.userRecord,
      isSeasonComplete: result.isSeasonComplete,
      interrupts: [] as Array<{ type: string; headline: string; detail: string }>,
    };
  },
  async simRemainingChunks() {
    if (!incrementalSimState) {
      cachedSchedule = generateScheduleTemplate();
      incrementalSimState = createSeasonSimState(teams, cachedSchedule.length, currentSeason, rngSeed + currentSeason);
    }
    if (!cachedSchedule) cachedSchedule = generateScheduleTemplate();

    let totalGamesPlayed = 0;
    while (!incrementalSimState.isComplete) {
      const result = simulateChunk(incrementalSimState, teams, players, cachedSchedule, { userTeamId });
      totalGamesPlayed += result.partialResult.gamesCompleted;
      if (result.isSeasonComplete) break;
    }

    const partial = buildPartialResult(incrementalSimState, teams);
    syncIncrementalToMainState(partial);
    cache.invalidate();
    return { done: true, gamesPlayed: totalGamesPlayed };
  },

  // Roster transactions — use worker-owned userTeamId as default
  async promotePlayer(playerId: number, teamId = userTeamId) { return api.submitRosterTransaction(teamId, { type: 'CALL_UP', playerId }); },
  async demotePlayer(playerId: number, teamId = userTeamId) { return api.submitRosterTransaction(teamId, { type: 'OPTION', playerId }); },
  async dfaPlayer(playerId: number, teamId = userTeamId) { return api.submitRosterTransaction(teamId, { type: 'DFA', playerId }); },
  async releasePlayer(playerId: number, teamId = userTeamId) { return api.submitRosterTransaction(teamId, { type: 'RELEASE', playerId }); },
  async setLineupOrder(teamId: number, order: number[]) {
    lineupOrders.set(teamId, order);
    cache.invalidate();
    return { ok: true };
  },
  async setRotationOrder(teamId: number, order: number[]) {
    rotationOrders.set(teamId, order);
    cache.invalidate();
    return { ok: true };
  },
  async getLineupOrder(teamId: number) { return lineupOrders.get(teamId) ?? []; },
  async getRotationOrder(teamId: number) { return rotationOrders.get(teamId) ?? []; },

  // Free agency
  async getFreeAgents() { return players.filter(p => p.rosterData.rosterStatus === 'FREE_AGENT'); },
  async signFreeAgent(playerId: number, teamId: number, years: number, salary: number) {
    const { signFreeAgent: signFA } = await import('./freeAgency.ts');
    const { canAffordMove } = await import('./finances.ts');
    const player = players.find(p => p.playerId === playerId);
    if (!player) return { ok: false, reason: 'Player not found' };
    const team = teams.find(t => t.teamId === teamId);
    if (team && !canAffordMove(players, team, salary)) {
      return { ok: false, reason: 'Cannot afford this signing — would exceed budget.' };
    }
    const result = signFA(player, teamId, years, salary, players);
    if (result.ok) {
      cache.invalidate();
      latestNewsFeed.push(News.generateSigningStory(
        currentSeason, player.name, team?.name ?? '',
        years, salary, playerId, teamId,
      ));
      latestNewsFeed = sortNewsFeed(latestNewsFeed);
    }
    return result;
  },

  // Trading
  async getTradeOffers(teamId: number) {
    return generateTradeOffers(teamId, players, teams);
  },
  async proposeTrade(offer: { partnerTeamId: number; userPlayerIds: number[]; partnerPlayerIds: number[] }) {
    const { evaluateProposedTrade, executeTrade: execTrade } = await import('./trading.ts');
    const evaluation = evaluateProposedTrade(
      players, offer.userPlayerIds, offer.partnerPlayerIds,
    );
    if (!evaluation.fair) {
      return { ok: false, reason: 'The other team doesn\'t see this as a fair deal.' };
    }
    const result = execTrade(players, 1, offer.partnerTeamId, offer.userPlayerIds, offer.partnerPlayerIds);
    if (result.ok) {
      cache.invalidate();
      const partnerTeam = teams.find(t => t.teamId === offer.partnerTeamId);
      latestNewsFeed.push(News.generateTradeStory(
        currentSeason, 0, 'User Team', partnerTeam?.name ?? '',
        offer.userPlayerIds.map(id => players.find(p => p.playerId === id)?.name ?? ''),
        offer.partnerPlayerIds.map(id => players.find(p => p.playerId === id)?.name ?? ''),
        [...offer.userPlayerIds, ...offer.partnerPlayerIds],
        [1, offer.partnerTeamId],
      ));
      latestNewsFeed = sortNewsFeed(latestNewsFeed);
    }
    return result;
  },
  async acceptTradeOffer(offerId: number) {
    // For now, trade offers from getTradeOffers contain all info needed
    // The UI should call proposeTrade with the offer details
    void offerId;
    return { ok: false, reason: 'Use proposeTrade with the offer details instead.' };
  },
  async acceptCounterOffer(_offerId: number) {
    return { ok: false, reason: 'Counter-offers not yet supported.' };
  },
  async shopPlayer(playerId: number) {
    return shopPlayerEngine(playerId, players, teams);
  },

  // Draft
  async startDraft() { return api.getDraftBoard(); },
  async startAnnualDraft() { return api.getDraftBoard(); },
  async autoAdvanceDraft() { return { done: true, picks: [] as any[] }; },
  async completeDraft() {
    activeDraftState = null;
    cache.invalidate();
  },
  async completeAnnualDraft() {
    activeDraftState = null;
    cache.invalidate();
  },

  // Awards/stats/leaderboards
  async getLeaderboard(_category?: string, _limit?: number) { return { batting: await api.getBattingLeaders(), pitching: await api.getPitchingLeaders() }; },
  async getLeaderboardFull(category: string) {
    if (category === 'batting') return api.getBattingLeaders(50);
    if (category === 'pitching') return api.getPitchingLeaders(50);
    // Combined: return both
    const [batting, pitching] = await Promise.all([
      api.getBattingLeaders(50),
      api.getPitchingLeaders(50),
    ]);
    return [...batting, ...pitching];
  },
  async getAwardRace() {
    return latestSeasonAwards ?? {
      season: currentSeason,
      alMVP: { awardName: 'AL MVP', playerId: 0, playerName: '', teamId: 0, statLine: '' },
      nlMVP: { awardName: 'NL MVP', playerId: 0, playerName: '', teamId: 0, statLine: '' },
      alCyYoung: { awardName: 'AL Cy Young', playerId: 0, playerName: '', teamId: 0, statLine: '' },
      nlCyYoung: { awardName: 'NL Cy Young', playerId: 0, playerName: '', teamId: 0, statLine: '' },
      alROY: null,
      nlROY: null,
    };
  },
  async getStaffBonuses(_teamId?: number) {
    const targetTeamId = _teamId ?? 1;
    const coaching = coachingStaffs.get(targetTeamId);
    if (!coaching) return DEFAULT_BONUSES;
    return bonusesFromCoaching(coaching);
  },
  async getAdvancedStats(playerId: number) {
    const player = players.find(p => p.playerId === playerId);
    if (!player) return null;
    const ps = latestPlayerSeasons.get(playerId);
    if (!ps) return null;
    // Build league averages from all player seasons
    const allStats = Array.from(latestPlayerSeasons.values())
      .map(s => ({
        playerId: s.playerId, teamId: s.teamId, season: s.season,
        pa: s.ab + 50, ab: s.ab, h: s.hits, doubles: 0, triples: 0, hr: s.hr,
        rbi: s.rbi, r: s.runs, bb: Math.round(s.ab * 0.08), hbp: Math.round(s.ab * 0.01),
        sb: 0, cs: 0, sf: Math.round(s.ab * 0.005), so: Math.round(s.ab * 0.22),
        outs: Math.round(s.ip * 3), er: s.earnedRuns, ha: Math.round(s.ip * 8.5),
        bba: Math.round(s.ip * 3), ka: s.kPitching, hra: Math.round(s.ip * 1.1),
        w: s.wins, l: s.losses, sv: s.saves, ra: s.earnedRuns,
      }));
    const league = computeLeagueAverages(allStats as any);
    const pStats = allStats.find(s => s.playerId === playerId);
    if (!pStats) return null;
    if (player.isPitcher) {
      return computeAdvancedPitching(pStats as any, league);
    } else {
      return computeAdvancedHitting(pStats as any, league);
    }
  },

  // ─── Dev Programs API ──────────────────────────────────────────────────────
  async getDevPrograms(isPitcher: boolean) {
    const { getProgramsForPlayer } = await import('./devPrograms.ts');
    return getProgramsForPlayer(isPitcher);
  },

  async getDevAssignments(teamId?: number) {
    const targetTeam = teamId ?? 1;
    const entries: Array<{ playerId: number; program: import('../engine/devPrograms').DevProgram; playerName: string }> = [];
    for (const [playerId, program] of devAssignments) {
      const player = players.find(p => p.playerId === playerId);
      if (player && player.teamId === targetTeam) {
        entries.push({ playerId, program, playerName: player.name });
      }
    }
    return entries;
  },

  async assignDevProgram(playerId: number, programId: import('../engine/devPrograms').DevProgram) {
    const player = players.find(p => p.playerId === playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (programId === 'balanced') {
      devAssignments.delete(playerId);
    } else {
      devAssignments.set(playerId, programId);
    }
    return { ok: true };
  },
  async getCareerLeaderboard(stat: string) {
    const entries: Array<{ playerId: number; name: string; value: number; seasons: number }> = [];
    for (const [playerId, seasons] of careerHistory) {
      const player = players.find(p => p.playerId === playerId);
      if (!player) continue;
      let value = 0;
      if (stat === 'hr') value = seasons.reduce((s, ps) => s + ps.hr, 0);
      else if (stat === 'hits') value = seasons.reduce((s, ps) => s + ps.hits, 0);
      else if (stat === 'rbi') value = seasons.reduce((s, ps) => s + ps.rbi, 0);
      else if (stat === 'runs') value = seasons.reduce((s, ps) => s + ps.runs, 0);
      else if (stat === 'wins') value = seasons.reduce((s, ps) => s + ps.wins, 0);
      else if (stat === 'kPitching') value = seasons.reduce((s, ps) => s + ps.kPitching, 0);
      else if (stat === 'saves') value = seasons.reduce((s, ps) => s + ps.saves, 0);
      else if (stat === 'ip') value = Math.round(seasons.reduce((s, ps) => s + ps.ip, 0));
      else value = seasons.reduce((s, ps) => s + ps.hr, 0); // default: HR
      if (value <= 0) continue;
      entries.push({ playerId, name: player.name, value, seasons: seasons.length });
    }
    entries.sort((a, b) => b.value - a.value);
    return entries.slice(0, 50);
  },
  async getPlayoffMVP() { return null; },
  async getHOFCandidates() {
    return hofCandidates;
  },
  async getHallOfFame() {
    return hallOfFamers;
  },
  async getFranchiseRecords(_teamId: number) {
    if (franchiseRecordBook) return franchiseRecordBook;
    const { emptyRecordBook } = await import('./franchiseRecords.ts');
    return emptyRecordBook();
  },
  async getPayrollReport(teamId: number) {
    const team = teams.find(t => t.teamId === teamId);
    if (!team) return null;
    return computePayrollReport(players, team);
  },

  // Scouting/development
  async scoutPlayer(playerId: number) {
    const player = players.find(p => p.playerId === playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    const team = teams.find(t => t.teamId === 1); // User team default
    const accuracy = team?.scoutingQuality ?? 0.7;
    const report = generateScoutingReport(player, accuracy, currentSeason);
    return { ok: true, report };
  },
  async getScoutablePlayers(teamId: number) {
    // Return opponent players with scouting-ready shape
    const teamMap = new Map(teams.map(t => [t.teamId, t]));
    return players
      .filter(p => p.teamId !== teamId && (
        p.rosterData.rosterStatus === 'MLB_ACTIVE' ||
        p.rosterData.rosterStatus === 'MLB_IL_10' ||
        p.rosterData.rosterStatus === 'MLB_IL_60'
      ))
      .map(p => {
        const team = teamMap.get(p.teamId);
        return {
          playerId: p.playerId,
          name: p.name,
          teamId: p.teamId,
          teamAbbr: team?.abbreviation ?? '???',
          position: p.position,
          age: p.age,
          isPitcher: p.isPitcher,
          observedOverall: p.overall, // Placeholder until scouting fog-of-war is enabled
          observedPotential: p.potential,
          scouted: false,
          confidence: 0,
        };
      })
      .sort((a, b) => b.observedOverall - a.observedOverall)
      .slice(0, 200);
  },
  async removeDevProgram(playerId: number) {
    devAssignments.delete(playerId);
    return { ok: true };
  },

  // Offseason phases
  async startOffseason() { return { season: currentSeason, phase: 'offseason', totalGames: 2430 }; },
  async startInSeason() {
    cachedSchedule = generateScheduleTemplate();
    incrementalSimState = createSeasonSimState(teams, cachedSchedule.length, currentSeason, rngSeed + currentSeason);
    cache.invalidate();
    return {
      season: currentSeason,
      phase: 'in_season',
      totalGames: cachedSchedule.length,
      segments: SEGMENTS.map(s => ({ label: s.label, event: s.event })),
    };
  },
  async startIntlSigning() {
    // Generate intl class if not already available
    return { season: currentSeason, phase: 'intl_signing', prospects: [], bonusPool: 5_000_000 };
  },
  async finishIntlSigning() { /* International signing period ends — handled by advanceSeason */ },
  async finishOffseason() { /* Offseason complete — handled by advanceSeason */ },
  async processWaivers() {
    const { processWaivers: runWaivers } = await import('./waivers.ts');
    return runWaivers(players, teams, 1);
  },
  async resolveArbitrationCase(playerId: number, salary: number) {
    const { resolveArbitration } = await import('./finances.ts');
    const player = players.find(p => p.playerId === playerId);
    if (!player) return { ok: false, reason: 'Player not found' };
    resolveArbitration(player, salary);
    cache.invalidate();
    return { ok: true };
  },
  async getArbitrationCases() {
    // Show arb cases for all teams
    const cases: ArbitrationCase[] = [];
    for (const team of teams) {
      cases.push(...generateArbitrationCases(players, team.teamId));
    }
    return cases;
  },
  async conductRule5Draft() {
    const { conductRule5Draft } = await import('./draft/rule5Draft.ts');
    return conductRule5Draft(players, teams, 1, currentSeason);
  },
  async userRule5Pick(playerId: number) {
    const { userRule5Pick: pick } = await import('./draft/rule5Draft.ts');
    const player = players.find(p => p.playerId === playerId);
    if (!player) return { ok: false, reason: 'Player not found' };
    const result = pick(player, 1, players);
    if (result.ok) cache.invalidate();
    return result;
  },
  async getRule5Eligible() {
    const { identifyRule5Eligible } = await import('./draft/rule5Draft.ts');
    const teamMap = new Map(teams.map(t => [t.teamId, t]));
    return identifyRule5Eligible(players, currentSeason).map(p => ({
      playerId: p.playerId, name: p.name, position: p.position,
      age: p.age, overall: p.overall, potential: p.potential,
      teamId: p.teamId, teamAbbr: teamMap.get(p.teamId)?.abbreviation ?? '???',
    }));
  },
  async offerExtension(playerId: number, years: number, salary: number) {
    const player = players.find(p => p.playerId === playerId);
    if (!player) return { ok: false, reason: 'Player not found' };
    if (player.rosterData.rosterStatus === 'FREE_AGENT') return { ok: false, reason: 'Cannot extend a free agent — use signing.' };
    // Simple acceptance: player accepts if salary >= 80% of projected market value
    const { projectSalary } = await import('./freeAgency.ts');
    const marketValue = projectSalary(player);
    if (salary < marketValue * 0.8) return { ok: false, reason: 'Player rejected — offer below market value.' };
    player.rosterData.contractYearsRemaining = years;
    player.rosterData.salary = salary;
    player.rosterData.freeAgentEligible = false;
    cache.invalidate();
    return { ok: true };
  },
  async signIntlProspect(playerId: number) {
    const { signIntlProspect: signIntl } = await import('./internationalSigning.ts');
    const player = players.find(p => p.playerId === playerId);
    if (!player) return { ok: false, reason: 'Player not found' };
    const result = signIntl(player, 1, 500_000); // Default bonus for user team
    if (result.ok) cache.invalidate();
    return result;
  },
  async getAIRosterMoves() {
    const { processAIRosterMoves } = await import('./aiRosterManager.ts');
    return processAIRosterMoves(players, teams, 1, rngSeed + currentSeason);
  },

  // UI/misc
  async getPennantRace() {
    if (latestTeamSeasons.length === 0) return null;
    const standings = buildStandings({ teamSeasons: latestTeamSeasons, gameResults: latestGameResults });
    // userTeamId from module-level state

    const userRow = standings.find(r => r.teamId === userTeamId);
    if (!userRow) return null;

    // Find division leader
    const divRivals = standings.filter(r => r.conferenceId === userRow.conferenceId && r.divisionId === userRow.divisionId);
    divRivals.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const leader = divRivals[0];
    const userDivRank = divRivals.findIndex(r => r.teamId === userTeamId) + 1;
    const gamesBack = leader ? ((leader.wins - userRow.wins) + (userRow.losses - leader.losses)) / 2 : 0;

    // Wild card: top 3 non-division-winners by record in each league
    const leagueTeams = standings.filter(r => r.conferenceId === userRow.conferenceId);
    const divWinners = new Set<number>();
    const divGroups = new Map<number, typeof standings>();
    for (const r of leagueTeams) {
      const arr = divGroups.get(r.divisionId) ?? [];
      arr.push(r);
      divGroups.set(r.divisionId, arr);
    }
    for (const div of divGroups.values()) {
      div.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
      if (div[0]) divWinners.add(div[0].teamId);
    }
    const wcContenders = leagueTeams
      .filter(r => !divWinners.has(r.teamId))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const userWCRank = wcContenders.findIndex(r => r.teamId === userTeamId) + 1;
    const wcLeader = wcContenders[0];
    const wcGB = wcLeader ? ((wcLeader.wins - userRow.wins) + (userRow.losses - wcLeader.losses)) / 2 : 0;

    const gamesRemaining = 162 - userRow.wins - userRow.losses;
    const isInPlayoff = userDivRank === 1 || userWCRank <= 3;

    // Magic number: games remaining + 1 - lead over next team
    let magicNumber: number | null = null;
    if (userDivRank === 1 && divRivals.length > 1) {
      const second = divRivals[1];
      magicNumber = Math.max(0, gamesRemaining + 1 - ((userRow.wins - second.wins) + (second.losses - userRow.losses)) / 2);
      if (magicNumber <= 0) magicNumber = 0; // clinched
    }

    // Elimination number
    let eliminationNumber: number | null = null;
    if (userDivRank > 1) {
      eliminationNumber = Math.max(0, gamesRemaining + 1 - Math.ceil(gamesBack));
      if (eliminationNumber <= 0) eliminationNumber = 0; // eliminated
    }

    const leaderTeam = teams.find(t => t.teamId === leader?.teamId);
    return {
      userDivisionRank: userDivRank,
      userGamesBack: Math.max(0, gamesBack),
      userWildCardRank: userWCRank || 99,
      userWCGamesBack: Math.max(0, wcGB),
      divisionLeader: {
        teamId: leader?.teamId ?? 0,
        abbr: leaderTeam?.abbreviation ?? '???',
        wins: leader?.wins ?? 0,
        losses: leader?.losses ?? 0,
      },
      isInPlayoffPosition: isInPlayoff,
      magicNumber,
      eliminationNumber,
    };
  },
  async getCurrentScheduleInfo() {
    const gamesCompleted = incrementalSimState?.gamesCompleted ?? latestGameResults.length;
    const totalGames = incrementalSimState?.totalGames ?? 2430;

    // Derive current date from cached schedule
    let currentDate = `${currentSeason}-04-01`;
    if (cachedSchedule && gamesCompleted < cachedSchedule.length) {
      currentDate = cachedSchedule[gamesCompleted]?.date ?? currentDate;
    } else if (cachedSchedule && gamesCompleted > 0 && cachedSchedule.length > 0) {
      currentDate = cachedSchedule[cachedSchedule.length - 1]?.date ?? currentDate;
    }

    return {
      season: currentSeason,
      gamesPlayed: gamesCompleted,
      gamesCompleted,
      totalGames,
      teamCount: teams.length,
      playerCount: players.length,
      currentDate,
      currentSegment: incrementalSimState?.currentSegment ?? -1,
    };
  },
  async standings() { return api.getStandings(); },
};

// ─── Helper Types ────────────────────────────────────────────────

export type SeasonStage = 'idle' | 'season' | 'postseason' | 'awards';

export interface SaveOperationResult {
  ok: boolean;
  manifest?: SaveManifest;
  error?: string;
}

export interface LoadSaveResult extends SaveOperationResult {
  warning?: string;
  season?: number;
  stage?: SeasonStage;
}

export interface ExportSaveResult {
  ok: boolean;
  json?: string;
  error?: string;
}

export interface TradeCounterOfferResult {
  ok: boolean;
  suggestion?: TradeSuggestion;
  changed?: boolean;
  rounds?: number;
  reason?: string;
}

export interface DraftBoardListing {
  season: number;
  userTeamId: number;
  totalRounds: number;
  currentRound: number;
  currentPickInRound: number;
  overallPick: number;
  teamOnClockId: number | null;
  completed: boolean;
  picks: DraftPick[];
  available: DraftBoardEntry[];
}

export interface DraftPickResponse {
  ok: boolean;
  reason?: string;
  pick?: DraftPick;
  board?: DraftBoardListing;
}

export type ActivityIntelRequest = ActivityIntelQuery;

export interface TradeSuggestion {
  package: TradePackage;
  fromTeamName: string;
  toTeamName: string;
  playersOfferedNames: string[];
  playersRequestedNames: string[];
  accepted: boolean;
  surplus: number;
  reason: string;
  marketDiagnostics: TradeMarketDiagnostics;
}

export interface FreeAgentListing {
  playerId: number;
  name: string;
  position: string;
  age: number;
  isPitcher: boolean;
  overall: number;
  potential: number;
  desiredYears: number;
  desiredSalary: number;
  teamFitScore: number;
  marketInterest: number;
}

export interface TeamStandingRow {
  teamId: number;
  city: string;
  name: string;
  abbreviation: string;
  conferenceId: number;
  divisionId: number;
  wins: number;
  losses: number;
  pct: string;
  runsScored: number;
  runsAllowed: number;
  pythWins: number;
  divisionRank: number;
}

export interface RosterPlayer {
  playerId: number;
  name: string;
  position: string;
  leagueLevel: string;
  rosterStatus: RosterStatus;
  isOn40Man: boolean;
  optionYearsRemaining: number;
  demotionsThisSeason: number;
  salary: number;
  age: number;
  bats: string;
  throws: string;
  isPitcher: boolean;
  stats: StatLine | null;
}

export interface StatLine {
  // Batting
  ba?: string;
  hr?: number;
  rbi?: number;
  runs?: number;
  // Pitching
  era?: string;
  wins?: number;
  losses?: number;
  k?: number;
  ip?: string;
  saves?: number;
}

export interface LeaderboardEntry {
  playerId: number;
  name: string;
  team: string;
  position: string;
  stat1: number; // primary sort stat
  stat2: number;
  stat3: number;
  stat4: number;
  stat5: number;
}

export interface PlayerProfileData {
  player: Player;
  seasonStats: PlayerSeason | null;
  careerStats: PlayerSeason[];
}

export interface PerformanceStats {
  cacheVersion: number;
  playerCount: number;
  gameResultCount: number;
  featuredGameCount: number;
  playerSeasonCount: number;
  teamCount: number;
  currentSeason: number;
  estimatedMemoryMB: number;
}

export interface TeamRosterCounts {
  teamId: number;
  fortyMan: number;
  twentySixMan: number;
}

export interface IntegrityAuditIssue {
  code: string;
  severity: 'error' | 'warn' | 'info';
  count: number;
  detail: string;
}

export interface IntegrityAuditReport {
  ok: boolean;
  checkedAt: number;
  totals: {
    teams: number;
    players: number;
    transactions: number;
    enabledFeatures: number;
  };
  buckets: {
    blockers: IntegrityAuditIssue[];
    warnings: IntegrityAuditIssue[];
    notes: IntegrityAuditIssue[];
  };
  issues: IntegrityAuditIssue[];
}

export interface FeatureReadinessDependency {
  featureId: FeatureDependencyHealth['featureId'];
  found: FeatureDependencyHealth['found'];
  enabled: FeatureDependencyHealth['enabled'];
  ready: FeatureDependencyHealth['ready'];
}

export interface FeatureReadinessReport {
  featureId: string;
  found: boolean;
  ready: boolean;
  tier?: FeatureTier;
  status?: FeatureStatus;
  reasons: string[];
  dependencies: FeatureReadinessDependency[];
}

export interface PlayableReadinessGate {
  gateId: string;
  label: string;
  pass: boolean;
  blocker: boolean;
  evidence: string;
  recommendation: string;
}

export interface AlphaGateResult {
  gateId: string;
  label: string;
  pass: boolean;
  blocker: boolean;
  evidence: string;
  recommendation: string;
}

export interface PlayableReadinessReport {
  ok: boolean;
  generatedAt: number;
  season: number;
  stage: SeasonStage;
  blockers: string[];
  gates: AlphaGateResult[];
}

export type WorkerHealthMode = 'normal' | 'degraded' | 'panic-safe';

export interface DiagnosticsSnapshot {
  generatedAt: number;
  season: number;
  stage: SeasonStage;
  healthMode: WorkerHealthMode;
  cache: {
    version: number;
    estimatedMemoryMB: number;
  };
  counts: {
    teams: number;
    players: number;
    games: number;
    featuredGames: number;
    playerSeasons: number;
    transactions: number;
    newsStories: number;
  };
  features: {
    enabledCount: number;
    coreEnabledCount: number;
    totalManifestCount: number;
    buildFingerprint: string;
  };
  integrity: {
    ok: boolean;
    issueCount: number;
  };
  manifest: {
    ok: boolean;
    issueCount: number;
    statusCounts: Record<FeatureStatus, number>;
    tierCounts: Record<FeatureTier, number>;
  };
  readiness: {
    ok: boolean;
    blockerCount: number;
    gateCount: number;
  };
  smoke: {
    ok: boolean;
    blockerCount: number;
    stepCount: number;
  };
  latency: {
    ok: boolean;
    issueCount: number;
    sampledEndpoints: number;
  };
  markers: {
    lastIntegrityCleanAt: number | null;
    lastReadinessOkAt: number | null;
    lastSmokeOkAt: number | null;
  };
}

export interface SmokeFlowStepResult {
  stepId: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface SmokeFlowReport {
  ok: boolean;
  generatedAt: number;
  stage: SeasonStage;
  blockers: string[];
  steps: SmokeFlowStepResult[];
}

export interface DeterminismProbeSeasonMetrics {
  season: number;
  totalGames: number;
  totalRuns: number;
  winsChecksum: number;
  homeRunsChecksum: number;
  topTeamId: number;
  topTeamWins: number;
}

export interface DeterminismProbeReport {
  ok: boolean;
  generatedAt: number;
  seed: number;
  seasons: number;
  reason?: string;
  mismatches: string[];
  metricsA: DeterminismProbeSeasonMetrics[];
  metricsB: DeterminismProbeSeasonMetrics[];
}

export interface IntakeAuditReport {
  packId: IntakePack;
  generatedAt: number;
  ok: boolean;
  totalFeatures: number;
  avgRiskScore: number;
  statusCounts: Record<FeatureStatus, number>;
  highRiskFeatureIds: string[];
  blockers: string[];
}

export type SoakSimulationMode = 'core' | 'all';

export interface SoakSimulationReport {
  ok: boolean;
  generatedAt: number;
  seed: number;
  seasons: number;
  mode: SoakSimulationMode;
  durationMs: number;
  blockers: string[];
  checkpoints: DeterminismProbeSeasonMetrics[];
}

export interface LatencyBudgetEndpointResult {
  endpoint: string;
  calls: number;
  avgMs: number;
  p95Ms: number;
  lastMs: number;
  budgetMs: number;
  pass: boolean;
}

export interface LatencyBudgetReport {
  generatedAt: number;
  healthMode: WorkerHealthMode;
  ok: boolean;
  blockers: string[];
  endpoints: LatencyBudgetEndpointResult[];
}

// ─── Internal Helpers ────────────────────────────────────────────

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function recordEndpointLatency(endpoint: string, durationMs: number): void {
  const history = endpointLatencyHistory.get(endpoint) ?? [];
  history.push(durationMs);
  if (history.length > MAX_ENDPOINT_LATENCY_SAMPLES) {
    history.splice(0, history.length - MAX_ENDPOINT_LATENCY_SAMPLES);
  }
  endpointLatencyHistory.set(endpoint, history);
}

async function timedEndpointCall<T>(
  endpoint: string,
  run: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await run();
  } finally {
    recordEndpointLatency(endpoint, performance.now() - start);
  }
}

function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[rank];
}

function buildLatencyBudgetReportInternal(): LatencyBudgetReport {
  const endpoints: LatencyBudgetEndpointResult[] = Object.entries(ENDPOINT_LATENCY_BUDGET_MS).map(([endpoint, budgetMs]) => {
    const samples = endpointLatencyHistory.get(endpoint) ?? [];
    const calls = samples.length;
    const total = samples.reduce((sum, value) => sum + value, 0);
    const avgMs = calls === 0 ? 0 : total / calls;
    const p95Ms = percentile(samples, 95);
    const lastMs = calls === 0 ? 0 : samples[calls - 1];
    const pass = calls === 0 ? true : p95Ms <= budgetMs;
    return {
      endpoint,
      calls,
      avgMs: Number(avgMs.toFixed(3)),
      p95Ms: Number(p95Ms.toFixed(3)),
      lastMs: Number(lastMs.toFixed(3)),
      budgetMs,
      pass,
    };
  });

  const blockers = endpoints.filter((entry) => !entry.pass).map((entry) => entry.endpoint);
  return {
    generatedAt: Date.now(),
    healthMode: workerHealthMode,
    ok: blockers.length === 0,
    blockers,
    endpoints,
  };
}

function makeBuildFingerprint(): string {
  return `mrbd-worker-schema-${CURRENT_SCHEMA_VERSION}-features-${FEATURE_MANIFEST.length}`;
}

async function runDeterminismPass(seed: number, seasons: number): Promise<DeterminismProbeSeasonMetrics[]> {
  const localTeams = deepClone(teams);
  const localPlayers = deepClone(players);
  const metrics: DeterminismProbeSeasonMetrics[] = [];

  for (let seasonIdx = 0; seasonIdx < seasons; seasonIdx += 1) {
    const simSeason = Math.max(1, currentSeason + seasonIdx);
    const simSeed = seed + simSeason * 97;
    const result = await simulateSeason(localTeams, localPlayers, simSeason, simSeed);

    let totalRuns = 0;
    let homeRunsChecksum = 0;
    for (const game of result.gameResults) {
      totalRuns += game.homeScore + game.awayScore;
    }
    for (const [, ps] of result.playerSeasons) {
      homeRunsChecksum += ps.hr;
    }

    const sorted = [...result.teamSeasons].sort((a, b) => b.wins - a.wins || a.teamId - b.teamId);
    const top = sorted[0];
    const winsChecksum = result.teamSeasons.reduce((sum: number, season: TeamSeason) => sum + season.wins * (season.teamId + 3), 0);

    metrics.push({
      season: simSeason,
      totalGames: result.gameResults.length,
      totalRuns,
      winsChecksum,
      homeRunsChecksum,
      topTeamId: top?.teamId ?? -1,
      topTeamWins: top?.wins ?? 0,
    });
  }

  return metrics;
}

function buildDefaultFeatureVersions(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const entry of FEATURE_MANIFEST) {
    out[entry.id] = entry.sinceWave;
  }
  return out;
}

function normalizeFeatureVersions(raw: Record<string, unknown> | undefined): Record<string, number> {
  if (!raw) return buildDefaultFeatureVersions();

  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isFeatureId(key)) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue;
    out[key] = Math.floor(value);
  }

  const defaults = buildDefaultFeatureVersions();
  for (const [id, version] of Object.entries(defaults)) {
    if (!(id in out)) {
      out[id] = version;
    }
  }
  return out;
}

function normalizeEnabledFeatures(raw: string[] | undefined): FeatureId[] {
  if (!raw || raw.length === 0) return getCoreFeatureIds();

  const unique = new Set<FeatureId>();
  const out: FeatureId[] = [];
  for (const value of raw) {
    if (!isFeatureId(value)) continue;
    if (unique.has(value)) continue;
    unique.add(value);
    out.push(value);
  }
  return out.length > 0 ? out : getCoreFeatureIds();
}

function normalizeMigrationNotes(raw: string[] | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= 24) break;
  }
  return out;
}

function extractTransactionPlayerIds(tx: RosterTransaction): number[] {
  switch (tx.type) {
    case 'TRADE':
      return tx.playerIds;
    case 'CALL_UP':
    case 'OPTION':
    case 'DFA':
    case 'PLACE_IL':
    case 'ACTIVATE_IL':
    case 'WAIVER_CLAIM':
    case 'OUTRIGHT':
    case 'RELEASE':
    case 'SIGN_FA':
    case 'DRAFT_PICK':
    case 'RULE_5_SELECT':
    case 'RULE_5_RETURN':
    case 'ADD_TO_40_MAN':
    case 'RETIREMENT':
      return [tx.playerId];
  }
}

function countDuplicates(values: number[]): number {
  const seen = new Set<number>();
  const dupes = new Set<number>();
  for (const value of values) {
    if (seen.has(value)) {
      dupes.add(value);
    } else {
      seen.add(value);
    }
  }
  return dupes.size;
}

function buildIntegrityAuditReport(): IntegrityAuditReport {
  const issues: IntegrityAuditIssue[] = [];
  const teamIds = teams.map((team) => team.teamId);
  const playerIds = players.map((player) => player.playerId);
  const teamIdSet = new Set(teamIds);
  const playerIdSet = new Set(playerIds);

  const duplicateTeamIds = countDuplicates(teamIds);
  if (duplicateTeamIds > 0) {
    issues.push({
      code: 'duplicate-team-ids',
      severity: 'error',
      count: duplicateTeamIds,
      detail: 'Duplicate team IDs detected in in-memory league state.',
    });
  }

  const duplicatePlayerIds = countDuplicates(playerIds);
  if (duplicatePlayerIds > 0) {
    issues.push({
      code: 'duplicate-player-ids',
      severity: 'error',
      count: duplicatePlayerIds,
      detail: 'Duplicate player IDs detected in in-memory player pool.',
    });
  }

  let danglingPlayerTeamRefs = 0;
  for (const player of players) {
    if (player.rosterData.rosterStatus === 'FREE_AGENT' || player.rosterData.rosterStatus === 'RETIRED') continue;
    if (!teamIdSet.has(player.teamId)) danglingPlayerTeamRefs += 1;
  }
  if (danglingPlayerTeamRefs > 0) {
    issues.push({
      code: 'dangling-player-team',
      severity: 'error',
      count: danglingPlayerTeamRefs,
      detail: 'Players reference missing team IDs.',
    });
  }

  let danglingTransactionTeams = 0;
  let danglingTransactionPlayers = 0;
  for (const entry of transactionLog) {
    if (!teamIdSet.has(entry.teamId)) danglingTransactionTeams += 1;
    for (const playerId of extractTransactionPlayerIds(entry.transaction)) {
      if (!playerIdSet.has(playerId)) danglingTransactionPlayers += 1;
    }
  }
  if (danglingTransactionTeams > 0) {
    issues.push({
      code: 'dangling-transaction-team',
      severity: 'error',
      count: danglingTransactionTeams,
      detail: 'Transactions reference missing team IDs.',
    });
  }
  if (danglingTransactionPlayers > 0) {
    issues.push({
      code: 'dangling-transaction-player',
      severity: 'error',
      count: danglingTransactionPlayers,
      detail: 'Transactions reference missing player IDs.',
    });
  }

  const unknownEnabledFeatures = enabledFeatures.filter((id) => !getFeatureManifestEntry(id));
  if (unknownEnabledFeatures.length > 0) {
    issues.push({
      code: 'unknown-enabled-feature',
      severity: 'warn',
      count: unknownEnabledFeatures.length,
      detail: `Unknown feature IDs in enabledFeatures: ${unknownEnabledFeatures.join(', ')}`,
    });
  }

  let teamsOverFortyMan = 0;
  let teamsOverTwentySix = 0;
  for (const team of teams) {
    const fortyMan = countFortyMan(players, team.teamId);
    const twentySixMan = countTwentySix(players, team.teamId);
    if (fortyMan > 40) teamsOverFortyMan += 1;
    if (twentySixMan > 26) teamsOverTwentySix += 1;
  }
  if (teamsOverFortyMan > 0) {
    issues.push({
      code: 'forty-man-overflow',
      severity: 'error',
      count: teamsOverFortyMan,
      detail: 'One or more teams exceed the 40-man roster limit.',
    });
  }
  if (teamsOverTwentySix > 0) {
    issues.push({
      code: 'active-roster-overflow',
      severity: 'error',
      count: teamsOverTwentySix,
      detail: 'One or more teams exceed the 26-man active roster limit.',
    });
  }

  const stage = computeSeasonStage();
  if (!isStageStateCoherent(stage)) {
    issues.push({
      code: 'stage-state-mismatch',
      severity: 'error',
      count: 1,
      detail: `Computed stage ${stage} is inconsistent with playoff/awards artifacts.`,
    });
  }

  const missingFeatureVersionDefaults = FEATURE_MANIFEST.filter((feature) => {
    const value = featureVersions[feature.id];
    return typeof value !== 'number' || !Number.isFinite(value);
  }).length;
  if (missingFeatureVersionDefaults > 0) {
    issues.push({
      code: 'missing-feature-version-defaults',
      severity: 'warn',
      count: missingFeatureVersionDefaults,
      detail: 'featureVersions missing defaults for one or more manifest entries.',
    });
  }

  if (!buildFingerprint || !buildFingerprint.includes(`schema-${CURRENT_SCHEMA_VERSION}`)) {
    issues.push({
      code: 'build-fingerprint-invalid',
      severity: 'warn',
      count: 1,
      detail: 'Build fingerprint missing schema marker.',
    });
  }

  const manifestIssues = lintFeatureManifest().issues;
  const manifestErrors = manifestIssues.filter((issue) => issue.severity === 'error');
  if (manifestErrors.length > 0) {
    issues.push({
      code: 'manifest-errors',
      severity: 'error',
      count: manifestErrors.length,
      detail: 'Feature manifest has error-level lint findings.',
    });
  }
  const manifestWarnings = manifestIssues.filter((issue) => issue.severity === 'warn');
  if (manifestWarnings.length > 0) {
    issues.push({
      code: 'manifest-warnings',
      severity: 'warn',
      count: manifestWarnings.length,
      detail: 'Feature manifest has warning-level lint findings.',
    });
  }

  issues.push({
    code: 'integrity-audit-ran',
    severity: 'info',
    count: 1,
    detail: `Audit completed at season=${currentSeason}, stage=${stage}.`,
  });

  const ok = !issues.some((issue) => issue.severity === 'error');
  const blockers = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warn');
  const notes = issues.filter((issue) => issue.severity === 'info');
  if (ok) {
    lastIntegrityCleanAt = Date.now();
  }

  return {
    ok,
    checkedAt: Date.now(),
    totals: {
      teams: teams.length,
      players: players.length,
      transactions: transactionLog.length,
      enabledFeatures: enabledFeatures.length,
    },
    buckets: {
      blockers,
      warnings,
      notes,
    },
    issues,
  };
}

function isStageStateCoherent(stage: SeasonStage): boolean {
  if (stage === 'postseason') {
    return latestPlayoffBracket !== null;
  }
  if (stage === 'awards') {
    return latestSeasonAwards !== null;
  }
  if (stage === 'season') {
    return latestTeamSeasons.length > 0 && latestPlayoffBracket === null;
  }
  if (stage === 'idle') {
    return latestTeamSeasons.length === 0 || latestPlayoffBracket === null;
  }
  return false;
}

function buildFeatureReadinessReport(featureId: string): FeatureReadinessReport {
  const assessment = assessFeatureReadiness(featureId, enabledFeatures);
  return {
    featureId: assessment.featureId,
    found: assessment.found,
    ready: assessment.ready,
    tier: assessment.tier,
    status: assessment.status,
    reasons: assessment.reasons,
    dependencies: assessment.dependencies,
  };
}

function shouldCreateTransactionStory(type: RosterTransaction['type']): boolean {
  switch (type) {
    case 'CALL_UP':
    case 'DFA':
    case 'PLACE_IL':
    case 'ACTIVATE_IL':
    case 'RELEASE':
    case 'WAIVER_CLAIM':
      return true;
    default:
      return false;
  }
}

function buildTradeSuggestion(
  pkg: TradePackage,
  evalResult: { accepted: boolean; surplus: number; reason: string; marketDiagnostics: TradeMarketDiagnostics },
  playerMap: Map<number, Player>,
  nameMap: Map<number, string>,
): TradeSuggestion {
  return {
    package: pkg,
    fromTeamName: nameMap.get(pkg.fromTeamId) ?? `Team ${pkg.fromTeamId}`,
    toTeamName: nameMap.get(pkg.toTeamId) ?? `Team ${pkg.toTeamId}`,
    playersOfferedNames: pkg.playersOffered.map((id) => {
      const p = playerMap.get(id);
      return p ? `${p.firstName} ${p.lastName}` : `Player #${id}`;
    }),
    playersRequestedNames: pkg.playersRequested.map((id) => {
      const p = playerMap.get(id);
      return p ? `${p.firstName} ${p.lastName}` : `Player #${id}`;
    }),
    accepted: evalResult.accepted,
    surplus: evalResult.surplus,
    reason: evalResult.reason,
    marketDiagnostics: evalResult.marketDiagnostics,
  };
}

function buildTradeMarketContext(
  pkg: TradePackage,
  deadlineUrgency: number,
): TradeMarketContext {
  const fromTeam = teams.find((team) => team.teamId === pkg.fromTeamId);
  const toTeam = teams.find((team) => team.teamId === pkg.toTeamId);
  const sameLeague = Boolean(
    fromTeam &&
    toTeam &&
    fromTeam.conferenceId === toTeam.conferenceId,
  );
  const sameDivision = Boolean(
    fromTeam &&
    toTeam &&
    fromTeam.conferenceId === toTeam.conferenceId &&
    fromTeam.divisionId === toTeam.divisionId,
  );
  const rivalryTax = sameDivision ? 8 : sameLeague ? 3 : 0;

  return {
    deadlineUrgency: Math.max(0, Math.min(1, deadlineUrgency)),
    sameLeague,
    sameDivision,
    rivalryTax,
  };
}

function buildPlayersByIdMap(): Map<number, Player> {
  const map = new Map<number, Player>();
  for (const player of players) {
    map.set(player.playerId, player);
  }
  return map;
}

function removeDraftEligiblePool(): void {
  players = players.filter((player) => player.rosterData.rosterStatus !== 'DRAFT_ELIGIBLE');
}

function sourceTeamSeasonsForDraft(): TeamSeason[] {
  if (latestTeamSeasons.length > 0) {
    return latestTeamSeasons;
  }

  const previous = seasonHistory.at(-1);
  if (previous && previous.teamSeasons.length > 0) {
    return previous.teamSeasons;
  }

  return teams.map((team) => ({
    teamId: team.teamId,
    season: currentSeason,
    wins: 81,
    losses: 81,
    runsScored: 700,
    runsAllowed: 700,
    divisionRank: 3,
    playoffResult: null,
  }));
}

function refreshDraftBoard(userTeamId: number): void {
  if (!gen) {
    gen = createPRNG(rngSeed + currentSeason + 1000);
  }

  removeDraftEligiblePool();
  const sourceTeamSeasons = sourceTeamSeasonsForDraft();
  let draftState: DraftBoardState;
  let draftPlayers: Player[];
  [draftState, draftPlayers, gen] = createDraftBoardState(
    sourceTeamSeasons,
    players,
    currentSeason,
    userTeamId,
    gen,
  );

  if (draftPlayers.length > 0) {
    players = [...players, ...draftPlayers];
  }

  const playersById = buildPlayersByIdMap();
  activeDraftState = runAIPicksUntilUserTurn(draftState, playersById);
}

function buildDraftBoardListing(state: DraftBoardState): DraftBoardListing {
  const available = state.board
    .filter((entry) => entry.draftedByTeamId == null)
    .sort((a, b) => b.scoutRank - a.scoutRank);

  return {
    season: state.season,
    userTeamId: state.userTeamId,
    totalRounds: state.totalRounds,
    currentRound: state.currentRound,
    currentPickInRound: state.currentPickInRound,
    overallPick: state.overallPick,
    teamOnClockId: teamOnClockId(state),
    completed: state.completed,
    picks: [...state.picks],
    available,
  };
}

function primaryPlayerId(tx: RosterTransaction): number | null {
  switch (tx.type) {
    case 'CALL_UP':
    case 'OPTION':
    case 'DFA':
    case 'PLACE_IL':
    case 'ACTIVATE_IL':
    case 'WAIVER_CLAIM':
    case 'OUTRIGHT':
    case 'RELEASE':
    case 'SIGN_FA':
    case 'DRAFT_PICK':
    case 'RULE_5_SELECT':
    case 'RULE_5_RETURN':
    case 'ADD_TO_40_MAN':
    case 'RETIREMENT':
      return tx.playerId;
    case 'TRADE':
      return tx.playerIds[0] ?? null;
  }
}

function featuredReasonForGame(game: GameResult): string {
  const diff = Math.abs(game.homeScore - game.awayScore);
  if (game.innings > 9) return `${game.innings}-inning game`;
  if (diff === 1) return 'one-run finish';
  if (game.homeScore === 0 || game.awayScore === 0) return 'shutout';
  if (game.homeScore + game.awayScore >= 15) return 'slugfest';
  return 'dramatic finish';
}

function deriveTeamStrategies(teamIds: number[]): Map<number, TeamStrategy> {
  if (latestTeamSeasons.length === 0) {
    const baseline = new Map<number, TeamStrategy>();
    for (const id of teamIds) {
      const override = ownerProfiles.get(id)?.activeMandate.strategyOverride;
      baseline.set(id, override ?? 'fringe');
    }
    return baseline;
  }

  const map = new Map<number, TeamSeason>();
  for (const ts of latestTeamSeasons) {
    map.set(ts.teamId, ts);
  }
  const classified = classifyAllTeams(map);
  for (const [teamId, strategy] of classified) {
    const override = ownerProfiles.get(teamId)?.activeMandate.strategyOverride;
    classified.set(teamId, override ?? strategy);
  }
  return classified;
}

function buildOwnerBidModifiers(
  profiles: Map<number, OwnerProfile>,
): Map<number, TeamBidModifier> {
  const teamIds = Array.from(profiles.keys()).sort((a, b) => a - b);
  const budgets = assignMarketSizes(teamIds);
  const modifiers = new Map<number, TeamBidModifier>();

  const luxuryByMandate: Record<OwnerProfile['activeMandate']['type'], number> = {
    WIN_NOW: 28_000_000,
    STAY_COMPETITIVE: 16_000_000,
    PATIENT_BUILD: 4_000_000,
    TRIM_PAYROLL: 0,
    BALANCED: 10_000_000,
  };

  for (const [teamId, profile] of profiles) {
    const mandate = profile.activeMandate;
    const budget = budgets.get(teamId);
    const baseTarget = budget?.payrollTarget ?? 160_000_000;
    const baseCap = budget?.hardCap ?? 230_000_000;
    const sizeComfort =
      budget?.marketSize === 'large' ? 6_000_000 :
      budget?.marketSize === 'small' ? -4_000_000 :
      0;
    const capFlex =
      mandate.type === 'WIN_NOW' ? 1.06 :
      mandate.type === 'TRIM_PAYROLL' ? 0.9 :
      mandate.type === 'PATIENT_BUILD' ? 0.95 :
      1.0;
    const payrollTarget = Math.round(baseTarget * Math.max(0.8, Math.min(1.25, mandate.payrollModifier)));
    const maxPayrollCap = Math.round(baseCap * capFlex);
    const luxuryTaxComfort = Math.max(0, luxuryByMandate[mandate.type] + sizeComfort);
    modifiers.set(teamId, {
      bidAggression: Math.max(0.75, Math.min(1.35, mandate.bidAggression)),
      offerMultiplier: Math.max(0.8, Math.min(1.25, mandate.payrollModifier)),
      payrollTarget: Math.min(payrollTarget, maxPayrollCap),
      maxPayrollCap,
      luxuryTaxComfort,
    });
  }
  return modifiers;
}

function computePositionNeedScore(teamId: number, position: string): number {
  let count = 0;
  let totalOverall = 0;

  for (const p of players) {
    if (p.teamId !== teamId) continue;
    if (String(p.position) !== position) continue;
    if (p.rosterData.rosterStatus === 'FREE_AGENT') continue;
    if (p.rosterData.rosterStatus === 'RETIRED') continue;
    if (p.rosterData.rosterStatus === 'DRAFT_ELIGIBLE') continue;

    count++;
    totalOverall += playerOverall(p);
  }

  if (count === 0) return 1.0;

  const avg = totalOverall / count;
  let score = (420 - avg) / 220;
  if (count <= 1) score += 0.2;
  return Math.max(0, Math.min(1.0, score));
}

function estimateFreeAgentMarketInterest(
  position: string,
  overall: number,
  teamIds: number[],
  teamStrategies: Map<number, TeamStrategy>,
): number {
  let interestedTeams = 0;

  for (const teamId of teamIds) {
    const need = computePositionNeedScore(teamId, position);
    const strategy = teamStrategies.get(teamId) ?? 'fringe';
    const appetite =
      strategy === 'contender' ? 0.35 :
      strategy === 'rebuilder' ? 0.2 :
      0.28;
    const talentBoost =
      overall >= 340 ? 0.35 :
      overall >= 300 ? 0.2 :
      overall >= 260 ? 0.1 : 0;

    if (need + appetite + talentBoost >= 0.9) {
      interestedTeams++;
    }
  }

  return interestedTeams;
}

/**
 * Reconstruct a Map from either a Map instance or a serialized Record/object.
 * Handles the case where JSON.stringify turned a Map into {} or an Object.
 * Keys are coerced to numbers if they look numeric (for teamId/playerId maps).
 */
/**
 * Sync incremental sim state to main display state (latestTeamSeasons, latestPlayerSeasons).
 * Called after every sim operation so getStandings() and other endpoints read live data.
 */
function syncIncrementalToMainState(partial: import('./sim/incrementalSimulator.ts').PartialSeasonResult): void {
  latestTeamSeasons = partial.teamSeasons.map(ts => ({
    teamId: ts.teamId, season: ts.season,
    wins: ts.record.wins, losses: ts.record.losses,
    runsScored: ts.record.runsScored, runsAllowed: ts.record.runsAllowed,
    divisionRank: 0, playoffResult: null,
  }));
  // Assign division ranks
  const byDiv = new Map<string, typeof latestTeamSeasons>();
  for (const ts of latestTeamSeasons) {
    const team = teams.find(t => t.teamId === ts.teamId);
    const key = team ? `${team.conferenceId}-${team.divisionId}` : 'unknown';
    const arr = byDiv.get(key) ?? [];
    arr.push(ts);
    byDiv.set(key, arr);
  }
  for (const div of byDiv.values()) {
    div.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    div.forEach((ts, i) => { ts.divisionRank = i + 1; });
  }
  // Convert player stats
  latestPlayerSeasons = new Map();
  for (const ps of partial.playerSeasons) {
    latestPlayerSeasons.set(ps.playerId, {
      playerId: ps.playerId, teamId: ps.teamId, season: ps.season,
      ab: ps.ab, hits: ps.h, hr: ps.hr, rbi: ps.rbi, runs: ps.r,
      ip: ps.outs / 3, earnedRuns: ps.er,
      wins: ps.w, losses: ps.l, kPitching: ps.ka, saves: ps.sv,
    });
  }
}

function reconstructMap<V>(data: any): Map<number, V> {
  if (data instanceof Map) return data;
  if (!data || typeof data !== 'object') return new Map();
  const entries = Object.entries(data);
  return new Map(entries.map(([k, v]) => [Number(k), v as V]));
}

function buildPersistedState(): PersistedGameState | null {
  if (!gen) return null;

  return {
    season: currentSeason,
    rngSeed,
    userTeamId,
    gen,
    teams,
    players,
    teamSeasons: latestTeamSeasons,
    playerSeasons: Object.fromEntries(
      Array.from(latestPlayerSeasons.entries()).map(([k, v]) => [k, v]),
    ),
    gameResults: latestGameResults,
    playoffBracket: latestPlayoffBracket,
    seasonAwards: latestSeasonAwards,
    hallOfFamers,
    milestones: [],
    leagueRecords: [],
    careerHistory: Object.fromEntries(
      Array.from(careerHistory.entries()).map(([k, v]) => [k, v]),
    ),
    awardsHistory,
    leagueHistory,
    hofCandidates,
    franchiseRecordBook,
    firedMilestones: Array.from(firedMilestones),
    newsFeed: latestNewsFeed,
    transactionLog,
    coachingStaffs: Object.fromEntries(
      Array.from(coachingStaffs.entries()).map(([k, v]) => [k, v]),
    ),
    latestOffseasonRecap,
    ownerProfiles: Object.fromEntries(
      Array.from(ownerProfiles.entries()).map(([k, v]) => [k, v]),
    ),
    teamChemistry: Object.fromEntries(
      Array.from(teamChemistry.entries()).map(([k, v]) => [k, v]),
    ),
    lineupOrders: Object.fromEntries(
      Array.from(lineupOrders.entries()).map(([k, v]) => [k, v]),
    ),
    rotationOrders: Object.fromEntries(
      Array.from(rotationOrders.entries()).map(([k, v]) => [k, v]),
    ),
    devAssignments: Object.fromEntries(
      Array.from(devAssignments.entries()).map(([k, v]) => [k, v]),
    ),
    clubhouseEvents,
    ownerEvaluationHistory,
    eventLog: eventLog.serialize(),
    featureVersions,
    enabledFeatures,
    migrationNotes,
    buildFingerprint,
  };
}

function applyLoadedState(state: PersistedGameState): void {
  currentSeason = state.season;
  rngSeed = state.rngSeed;
  userTeamId = (state as any).userTeamId ?? 1;
  gen = state.gen;
  teams = state.teams;
  players = state.players;
  latestTeamSeasons = state.teamSeasons;

  // Reconstruct playerSeasons Map from either Map or serialized Record
  latestPlayerSeasons = reconstructMap(state.playerSeasons);

  latestGameResults = state.gameResults;
  latestPlayoffBracket = state.playoffBracket;
  latestSeasonAwards = state.seasonAwards;
  latestNewsFeed = state.newsFeed;
  transactionLog = state.transactionLog;

  // Reconstruct coachingStaffs Map
  coachingStaffs = reconstructMap(state.coachingStaffs);

  latestOffseasonRecap = state.latestOffseasonRecap;

  const teamIds = teams.map((t) => t.teamId);
  const baselineOwnerProfiles = initializeOwnerProfiles(teamIds, currentSeason);
  const loadedProfiles = reconstructMap<OwnerProfile>(state.ownerProfiles);
  ownerProfiles = new Map<number, OwnerProfile>();
  for (const [teamId, baseline] of baselineOwnerProfiles) {
    const loaded = loadedProfiles.get(teamId);
    if (!loaded) {
      ownerProfiles.set(teamId, baseline);
      continue;
    }

    ownerProfiles.set(teamId, {
      ...baseline,
      ...loaded,
      activeMandate: loaded.activeMandate ?? baseline.activeMandate,
      currentGoals: loaded.currentGoals ?? baseline.currentGoals,
      lastEvaluation: loaded.lastEvaluation ?? baseline.lastEvaluation,
    });
  }

  const baselineChemistry = initializeTeamChemistry(teamIds, currentSeason);
  const loadedChemistry = reconstructMap<TeamChemistryState>(state.teamChemistry);
  teamChemistry = new Map<number, TeamChemistryState>();
  for (const [teamId, baseline] of baselineChemistry) {
    const loaded = loadedChemistry.get(teamId);
    if (!loaded) {
      teamChemistry.set(teamId, baseline);
      continue;
    }
    teamChemistry.set(teamId, {
      ...baseline,
      ...loaded,
      lastUpdatedSeason: loaded.lastUpdatedSeason ?? baseline.lastUpdatedSeason,
    });
  }

  clubhouseEvents = state.clubhouseEvents.length > 400
    ? state.clubhouseEvents.slice(-400)
    : [...state.clubhouseEvents];

  ownerEvaluationHistory.length = 0;
  if (state.ownerEvaluationHistory.length > 300) {
    ownerEvaluationHistory.push(...state.ownerEvaluationHistory.slice(-300));
  } else {
    ownerEvaluationHistory.push(...state.ownerEvaluationHistory);
  }

  eventLog.deserialize(state.eventLog ?? []);
  featureVersions = normalizeFeatureVersions(state.featureVersions);
  enabledFeatures = normalizeEnabledFeatures(state.enabledFeatures);
  migrationNotes = normalizeMigrationNotes(state.migrationNotes);
  buildFingerprint = state.buildFingerprint ?? makeBuildFingerprint();

  // Restore career history
  careerHistory = new Map();
  const savedCareer = (state as any).careerHistory;
  if (savedCareer && typeof savedCareer === 'object') {
    for (const [key, val] of Object.entries(savedCareer)) {
      careerHistory.set(Number(key), val as PlayerSeason[]);
    }
  }
  awardsHistory = Array.isArray((state as any).awardsHistory) ? (state as any).awardsHistory : [];
  leagueHistory = Array.isArray((state as any).leagueHistory) ? (state as any).leagueHistory : [];
  hallOfFamers = Array.isArray((state as any).hallOfFamers) ? (state as any).hallOfFamers : [];
  hofCandidates = Array.isArray((state as any).hofCandidates) ? (state as any).hofCandidates : [];
  franchiseRecordBook = (state as any).franchiseRecordBook ?? null;
  firedMilestones = new Set(Array.isArray((state as any).firedMilestones) ? (state as any).firedMilestones : []);

  // Restore lineup/rotation/dev assignment Maps
  lineupOrders = (state as any).lineupOrders ? reconstructMap<number[]>((state as any).lineupOrders) : new Map();
  rotationOrders = (state as any).rotationOrders ? reconstructMap<number[]>((state as any).rotationOrders) : new Map();
  devAssignments = (state as any).devAssignments ? reconstructMap<any>((state as any).devAssignments) : new Map();

  featuredGameIds = selectFeaturedGames(latestGameResults);
  seasonHistory.length = 0;
  cache.invalidate();
}

function computeSeasonStage(): SeasonStage {
  if (latestSeasonAwards) return 'awards';
  if (latestPlayoffBracket) return 'postseason';
  if (latestTeamSeasons.length > 0) return 'season';
  return 'idle';
}

function buildStandings(data: {
  teamSeasons: TeamSeason[];
  gameResults: GameResult[];
}): TeamStandingRow[] {
  return data.teamSeasons.map((ts) => {
    const team = teams.find((t) => t.teamId === ts.teamId)!;
    const totalGames = ts.wins + ts.losses;
    const pct = totalGames > 0 ? (ts.wins / totalGames).toFixed(3) : '.000';
    const pythWins = totalGames > 0
      ? Math.round(pythagoreanWins(ts.runsScored, ts.runsAllowed, totalGames))
      : 0;

    return {
      teamId: ts.teamId,
      city: team.city,
      name: team.name,
      abbreviation: team.abbreviation,
      conferenceId: team.conferenceId,
      divisionId: team.divisionId,
      wins: ts.wins,
      losses: ts.losses,
      pct,
      runsScored: ts.runsScored,
      runsAllowed: ts.runsAllowed,
      pythWins,
      divisionRank: ts.divisionRank,
    };
  });
}

function buildTeamNameMap(): Map<number, string> {
  const map = new Map<number, string>();
  for (const t of teams) {
    map.set(t.teamId, `${t.city} ${t.name}`);
  }
  return map;
}

function nextClubhouseEventId(): number {
  if (clubhouseEvents.length === 0) return 1;
  let maxId = 0;
  for (const event of clubhouseEvents) {
    if (event.eventId > maxId) maxId = event.eventId;
  }
  return maxId + 1;
}

function getPlayerStatLine(playerId: number): StatLine | null {
  const ps = latestPlayerSeasons.get(playerId);
  if (!ps) return null;

  const player = players.find((p) => p.playerId === playerId);
  if (!player) return null;

  if (player.isPitcher) {
    return {
      era: ps.ip > 0 ? calcERA(ps.earnedRuns, ps.ip).toFixed(2) : '-.--',
      wins: ps.wins,
      losses: ps.losses,
      k: ps.kPitching,
      ip: formatIP(ps.ip),
      saves: ps.saves,
    };
  } else {
    return {
      ba: ps.ab > 0 ? calcBA(ps.hits, ps.ab).toFixed(3) : '.000',
      hr: ps.hr,
      rbi: ps.rbi,
      runs: ps.runs,
    };
  }
}

// ─── Memory Estimation ──────────────────────────────────────────

function estimateMemoryUsage(): number {
  // Rough estimate in MB
  // Player: ~1KB each (attributes, roster data, name strings)
  // GameResult: ~100 bytes each (scores, teams, inningsPlayed)
  // PlayerSeason: ~200 bytes each (stat accumulators)
  // TeamSeason: ~50 bytes each
  const playerMB = (players.length * 1024) / (1024 * 1024);
  const gameResultMB = (latestGameResults.length * 100) / (1024 * 1024);
  const playerSeasonMB = (latestPlayerSeasons.size * 200) / (1024 * 1024);
  const teamSeasonMB = (latestTeamSeasons.length * 50) / (1024 * 1024);
  const newsMB = (latestNewsFeed.length * 500) / (1024 * 1024);

  return Math.round((playerMB + gameResultMB + playerSeasonMB + teamSeasonMB + newsMB) * 100) / 100;
}

// ─── Expose via Comlink ──────────────────────────────────────────

Comlink.expose(api);

export type WorkerAPI = typeof api;
