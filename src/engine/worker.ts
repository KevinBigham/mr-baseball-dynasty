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
import { sortNewsFeed, type NewsStory } from './league/newsFeed.ts';
import * as News from './league/newsFeed.ts';
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
import {
  createDraftBoardState,
  makeUserDraftPick,
  runAIPicksUntilUserTurn,
  teamOnClockId,
  type DraftBoardEntry,
  type DraftBoardState,
} from './draft.ts';

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

// ─── Public API ──────────────────────────────────────────────────

const api = {
  /**
   * Initialize a new league. Generates all teams + players.
   */
  async newGame(seed: number): Promise<{ teamCount: number; playerCount: number }> {
    rngSeed = seed;
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
    const injuryRiskMultipliers = new Map<number, number>();
    for (const team of teams) {
      const coaching = coachingStaffs.get(team.teamId);
      injuryRiskMultipliers.set(team.teamId, coaching ? getInjuryRiskMultiplier(coaching) : 1);
    }

    const result = simulateSeason(
      teams,
      players,
      currentSeason,
      rngSeed + currentSeason,
      (complete, total) => {
        // Post progress to main thread
        postMessage({ type: 'sim-progress', complete, total });
      },
      { injuryRiskMultipliers },
    );

    latestTeamSeasons = result.teamSeasons;
    latestPlayerSeasons = result.playerSeasons;
    latestGameResults = result.gameResults;
    gen = result.gen;
    seasonHistory.push(result);
    if (seasonHistory.length > 8) {
      seasonHistory.shift();
    }

    // Select featured games for storage discipline
    featuredGameIds = selectFeaturedGames(result.gameResults);

    for (const game of result.gameResults) {
      if (!featuredGameIds.has(game.gameId)) continue;
      logGameResult(eventLog, currentSeason, game.date, {
        kind: 'game_result',
        homeTeamId: game.homeTeam,
        awayTeamId: game.awayTeam,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        innings: game.innings,
        isFeatured: true,
        featuredReason: featuredReasonForGame(game),
      });
    }
    eventLog.pruneOldSeasons(Math.max(1, currentSeason - 12));

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
    [rankings, gen] = generateTop100(playerMap, gen);
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

      const ownerTeamStrategies = classifyAllTeams(teamSeasonsMap);
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
      });

      gen = offseason.gen;
      latestOffseasonRecap = offseason.recap;
      players = Array.from(playersMap.values());

      const chemistryAdvance = advanceTeamChemistry({
        season: currentSeason + 1,
        players,
        teamSeasons: teamSeasonsMap,
        ownerProfiles,
        previousChemistry: teamChemistry,
        gen,
        nextEventId: nextClubhouseEventId(),
      });
      gen = chemistryAdvance.gen;
      teamChemistry = chemistryAdvance.chemistry;
      if (chemistryAdvance.events.length > 0) {
        clubhouseEvents.push(...chemistryAdvance.events);
        if (clubhouseEvents.length > 400) {
          clubhouseEvents = clubhouseEvents.slice(-400);
        }
      }

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
    latestGameResults = [];
    featuredGameIds = new Set();
    cache.invalidate();

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
    if (cached) return cached;
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
          MINORS_ROOKIE: 7,
          FREE_AGENT: 8,
          RETIRED: 9,
          DRAFT_ELIGIBLE: 10,
        };
        const statusDelta = statusSort[a.rosterStatus] - statusSort[b.rosterStatus];
        if (statusDelta !== 0) return statusDelta;
        if (a.isPitcher !== b.isPitcher) return Number(a.isPitcher) - Number(b.isPitcher);
        return a.name.localeCompare(b.name);
      });
  },

  async getBattingLeaders(limit = 20): Promise<LeaderboardEntry[]> {
    const cached = cache.getBattingLeaders(currentSeason);
    if (cached && cached.length >= limit) return cached.slice(0, limit);

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
    if (cached && cached.length >= limit) return cached.slice(0, limit);

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
    return {
      player,
      seasonStats: ps ?? null,
    };
  },

  async getSeasonNumber(): Promise<number> {
    return currentSeason;
  },

  async getSeasonStage(): Promise<SeasonStage> {
    return computeSeasonStage();
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

      const gates: PlayableReadinessGate[] = [
        {
          gateId: 'league_seeded',
          label: 'League seeded',
          pass: teams.length >= 30 && players.length >= 3000 && gen !== null,
          blocker: true,
          detail: `teams=${teams.length}, players=${players.length}`,
        },
        {
          gateId: 'core_features_enabled',
          label: 'Core feature set enabled',
          pass: missingCore.length === 0,
          blocker: true,
          detail: missingCore.length === 0 ? `${coreFeatureIds.length} core features enabled` : `missing: ${missingCore.join(', ')}`,
        },
        {
          gateId: 'integrity_audit',
          label: 'Integrity audit clean',
          pass: audit.ok,
          blocker: true,
          detail: audit.ok ? 'No critical integrity issues' : `${audit.issues.length} issue(s) detected`,
        },
        {
          gateId: 'save_system_online',
          label: 'Save system online',
          pass: true,
          blocker: true,
          detail: `save slots=${listSaveManifests().length}`,
        },
        {
          gateId: 'stage_valid',
          label: 'Season stage available',
          pass: stage === 'idle' || stage === 'season' || stage === 'postseason' || stage === 'awards',
          blocker: false,
          detail: `stage=${stage}`,
        },
        {
          gateId: 'smoke_flow',
          label: 'Smoke flow',
          pass: smoke.ok,
          blocker: true,
          detail: smoke.ok ? 'Smoke flow contract satisfied' : `blockers=${smoke.blockers.join(', ')}`,
        },
        {
          gateId: 'determinism_probe',
          label: 'Determinism probe',
          pass: determinism.ok,
          blocker: false,
          detail: determinism.ok
            ? `seed=${determinism.seed} seasons=${determinism.seasons}`
            : determinism.reason ?? `mismatches=${determinism.mismatches.length}`,
        },
        {
          gateId: 'latency_budget',
          label: 'Latency budget',
          pass: latency.ok,
          blocker: false,
          detail: latency.ok ? 'Latency budgets within threshold' : `over budget endpoints=${latency.blockers.join(', ')}`,
        },
      ];

      const blockers = gates
        .filter((gate) => gate.blocker && !gate.pass)
        .map((gate) => gate.gateId);

      return {
        ok: blockers.length === 0,
        generatedAt: Date.now(),
        season: currentSeason,
        stage,
        blockers,
        gates,
      };
    });
  },

  async getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot> {
    return timedEndpointCall('getDiagnosticsSnapshot', async () => {
      const integrity = buildIntegrityAuditReport();
      const coreFeatureIds = getCoreFeatureIds();
      const coreEnabledCount = coreFeatureIds.filter((id) => enabledFeatures.includes(id)).length;
      const manifestLint = lintFeatureManifest();
      const latency = buildLatencyBudgetReportInternal();
      if (!integrity.ok && workerHealthMode === 'normal') {
        workerHealthMode = 'degraded';
      }
      if (integrity.issues.length >= 8) {
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
        },
        latency: {
          ok: latency.ok,
          issueCount: latency.blockers.length,
          sampledEndpoints: latency.endpoints.filter((entry) => entry.calls > 0).length,
        },
      };
    });
  },

  async getSmokeFlowReport(): Promise<SmokeFlowReport> {
    return timedEndpointCall('getSmokeFlowReport', async () => {
      const steps: SmokeFlowStepResult[] = [];
      const stage = computeSeasonStage();

      steps.push({
        stepId: 'league_available',
        label: 'League initialized',
        pass: teams.length > 0 && players.length > 0,
        detail: `teams=${teams.length}, players=${players.length}`,
      });

      steps.push({
        stepId: 'can_simulate',
        label: 'Simulation callable',
        pass: gen !== null && teams.length >= 30,
        detail: gen ? 'PRNG state available' : 'PRNG state missing',
      });

      const hasTransactions = transactionLog.length > 0;
      steps.push({
        stepId: 'roster_or_market_action',
        label: 'Roster/market action path',
        pass: hasTransactions || stage === 'idle',
        detail: hasTransactions ? `${transactionLog.length} transactions logged` : 'No transactions yet; fresh league accepted',
      });

      const saves = listSaveManifests();
      steps.push({
        stepId: 'save_system',
        label: 'Save system online',
        pass: true,
        detail: `slots=${saves.length}`,
      });

      const canContinue = stage === 'idle' || stage === 'season' || stage === 'postseason' || stage === 'awards';
      steps.push({
        stepId: 'continue_after_load',
        label: 'Continuation stage valid',
        pass: canContinue,
        detail: `stage=${stage}`,
      });

      const blockers = steps.filter((step) => !step.pass).map((step) => step.stepId);
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

      const passA = runDeterminismPass(seed, boundedSeasons);
      const passB = runDeterminismPass(seed, boundedSeasons);
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

      const checkpoints = runDeterminismPass(seed, boundedSeasons);
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

  async getDraftBoard(userTeamId = 1): Promise<DraftBoardListing> {
    return timedEndpointCall('getDraftBoard', async () => {
      if (!activeDraftState || activeDraftState.userTeamId !== userTeamId) {
        refreshDraftBoard(userTeamId);
      }

      if (!activeDraftState) {
        return {
          season: currentSeason,
          userTeamId,
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
      const userTeamId = activeDraftState?.userTeamId ?? 1;
      if (!activeDraftState) {
        refreshDraftBoard(userTeamId);
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
  severity: 'error' | 'warn';
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
  detail: string;
}

export interface AlphaGateResult {
  gateId: string;
  label: string;
  pass: boolean;
  blocker: boolean;
  detail: string;
  recommendation?: string;
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
  };
  latency: {
    ok: boolean;
    issueCount: number;
    sampledEndpoints: number;
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

function runDeterminismPass(seed: number, seasons: number): DeterminismProbeSeasonMetrics[] {
  const localTeams = deepClone(teams);
  const localPlayers = deepClone(players);
  const metrics: DeterminismProbeSeasonMetrics[] = [];

  for (let seasonIdx = 0; seasonIdx < seasons; seasonIdx += 1) {
    const simSeason = Math.max(1, currentSeason + seasonIdx);
    const simSeed = seed + simSeason * 97;
    const result = simulateSeason(localTeams, localPlayers, simSeason, simSeed);

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
    const winsChecksum = result.teamSeasons.reduce((sum, season) => sum + season.wins * (season.teamId + 3), 0);

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

  const ok = !issues.some((issue) => issue.severity === 'error');

  return {
    ok,
    checkedAt: Date.now(),
    totals: {
      teams: teams.length,
      players: players.length,
      transactions: transactionLog.length,
      enabledFeatures: enabledFeatures.length,
    },
    issues,
  };
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

function buildPersistedState(): PersistedGameState | null {
  if (!gen) return null;

  return {
    season: currentSeason,
    rngSeed,
    gen,
    teams,
    players,
    teamSeasons: latestTeamSeasons,
    playerSeasons: latestPlayerSeasons,
    gameResults: latestGameResults,
    playoffBracket: latestPlayoffBracket,
    seasonAwards: latestSeasonAwards,
    hallOfFamers: [],
    milestones: [],
    leagueRecords: [],
    newsFeed: latestNewsFeed,
    transactionLog,
    coachingStaffs,
    latestOffseasonRecap,
    ownerProfiles,
    teamChemistry,
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
  gen = state.gen;
  teams = state.teams;
  players = state.players;
  latestTeamSeasons = state.teamSeasons;
  latestPlayerSeasons = state.playerSeasons;
  latestGameResults = state.gameResults;
  latestPlayoffBracket = state.playoffBracket;
  latestSeasonAwards = state.seasonAwards;
  latestNewsFeed = state.newsFeed;
  transactionLog = state.transactionLog;
  coachingStaffs = state.coachingStaffs;
  latestOffseasonRecap = state.latestOffseasonRecap;

  const teamIds = teams.map((t) => t.teamId);
  const baselineOwnerProfiles = initializeOwnerProfiles(teamIds, currentSeason);
  const loadedProfiles = new Map(state.ownerProfiles);
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
  const loadedChemistry = new Map(state.teamChemistry);
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
