import type { RandomGenerator } from 'pure-rand';
import type { Player, PlayerGameStats, PitcherGameStats } from '../../types/player';
import type { Team } from '../../types/team';
import type { BoxScore, GameResult, PAOutcome } from '../../types/game';
import { createPRNG, nextInt } from '../math/prng';
import { resolvePlateAppearance } from './plateAppearance';
import { applyOutcome, INITIAL_INNING_STATE, type MarkovState } from './markov';
import { PARK_FACTORS } from '../../data/parkFactors';
import {
  createInitialFSMContext, startGame, advanceBatterLineup,
  scoreRuns, switchSides, updateRunners, shouldUseMannedRunner,
  type GameFSMContext,
} from './fsm';

// ─── Lineup and pitcher selection ────────────────────────────────────────────

function buildLineup(players: Player[], teamId: number): Player[] {
  const hitters = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher,
  );
  // Sort by composite offensive rating (contact + power + eye)
  hitters.sort((a, b) => {
    const aVal = (a.hitterAttributes?.contact ?? 0) + (a.hitterAttributes?.power ?? 0) * 0.8
               + (a.hitterAttributes?.eye ?? 0) * 0.6;
    const bVal = (b.hitterAttributes?.contact ?? 0) + (b.hitterAttributes?.power ?? 0) * 0.8
               + (b.hitterAttributes?.eye ?? 0) * 0.6;
    return bVal - aVal;
  });
  // Return top 9 (simple lineup; batting order optimization is v1.0)
  return hitters.slice(0, 9);
}

function pickStarter(players: Player[], teamId: number, rotationIndex: number): Player | null {
  const starters = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && p.position === 'SP',
  );
  if (starters.length === 0) return null;
  starters.sort((a, b) => b.overall - a.overall);
  return starters[rotationIndex % starters.length] ?? null;
}

function pickReliever(
  players: Player[],
  teamId: number,
  bullpenCounter: number,
  excludeIds: Set<number>,
  wantCloser: boolean,
): Player | null {
  const relievers = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && (p.position === 'RP' || (wantCloser && p.position === 'CL'))
      && !excludeIds.has(p.playerId),
  );
  if (relievers.length === 0) return null;
  relievers.sort((a, b) => b.overall - a.overall);
  return relievers[bullpenCounter % relievers.length] ?? null;
}

// ─── Blank stat accumulators ──────────────────────────────────────────────────

function blankBatterStats(playerId: number): PlayerGameStats {
  return { playerId, pa: 0, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, sb: 0, cs: 0 };
}

function blankPitcherStats(playerId: number): PitcherGameStats {
  return { playerId, outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, pitchCount: 0 };
}

// ─── Stat accumulation ────────────────────────────────────────────────────────

function accumulateBatterStat(
  stats: Map<number, PlayerGameStats>,
  playerId: number,
  outcome: PAOutcome,
  rbi: number,
  scored: boolean,
): void {
  const s = stats.get(playerId) ?? blankBatterStats(playerId);
  s.pa++;
  // AB: not counted for BB, HBP, SF
  if (outcome !== 'BB' && outcome !== 'HBP' && outcome !== 'SF') s.ab++;
  if (outcome === 'BB')  s.bb++;
  if (outcome === 'K')   s.k++;
  if (outcome === '1B')  { s.h++; }
  if (outcome === '2B')  { s.h++; s.doubles++; }
  if (outcome === '3B')  { s.h++; s.triples++; }
  if (outcome === 'HR')  { s.h++; s.hr++; }
  if (scored) s.r++;
  s.rbi += rbi;
  stats.set(playerId, s);
}

function accumulatePitcherStat(
  stats: Map<number, PitcherGameStats>,
  playerId: number,
  outcome: PAOutcome,
  runsAllowed: number,
  pitches: number,
): void {
  const s = stats.get(playerId) ?? blankPitcherStats(playerId);
  s.pitchCount += pitches;
  s.r += runsAllowed;
  s.er += runsAllowed; // simplified: all runs earned
  if (outcome === 'K')  s.k++;
  if (outcome === 'BB') s.bb++;
  if (outcome === 'HR') { s.hr++; }
  if (outcome === '1B' || outcome === '2B' || outcome === '3B' || outcome === 'HR') s.h++;
  // Count outs
  if (outcome === 'K' || outcome === 'GB_OUT' || outcome === 'FB_OUT'
    || outcome === 'LD_OUT' || outcome === 'PU_OUT' || outcome === 'SF') {
    s.outs++;
  }
  if (outcome === 'GDP') s.outs += 2;
  stats.set(playerId, s);
}

// Rough pitch count estimate per PA outcome
function estimatePitches(outcome: PAOutcome): number {
  switch (outcome) {
    case 'K': return 6;
    case 'BB': return 6;
    case 'HR': return 4;
    case '1B': return 4;
    case '2B': case '3B': return 4;
    case 'GDP': return 3;
    default: return 3;
  }
}

// ─── Half-inning simulation ───────────────────────────────────────────────────

interface HalfInningResult {
  runsScored: number;
  lineupPosAfter: number;
  outersUsedGen: RandomGenerator;
}

function simulateHalfInning(
  gen: RandomGenerator,
  ctx: GameFSMContext,
  lineup: Player[],
  lineupPos: number,
  pitcher: Player,
  pitchCountRef: { value: number },
  timesThroughRef: { value: number },
  batterStats: Map<number, PlayerGameStats>,
  pitcherStats: Map<number, PitcherGameStats>,
  parkFactor: (typeof PARK_FACTORS)[number],
  defenseRating: number,
  mannedRunner: boolean,
): [number, number, RandomGenerator] { // [runs, lineupPosAfter, gen]
  let markov: MarkovState = { ...INITIAL_INNING_STATE };
  if (mannedRunner) {
    // Start with runner on 2nd (Manfred runner)
    markov = { runners: 0b010, outs: 0, runsScored: 0 };
  }

  let pos = lineupPos;
  let runsBefore = 0;

  while (markov.outs < 3) {
    const batter = lineup[pos % 9]!;
    const paInput = {
      batter,
      pitcher,
      runners: markov.runners,
      outs: markov.outs,
      pitchCount: pitchCountRef.value,
      timesThrough: timesThroughRef.value,
      parkFactor,
      defenseRating,
    };

    let paResult: import('../../types/game').PAResult;
    [paResult, gen] = resolvePlateAppearance(gen, paInput);
    const outcome = paResult.outcome;

    const pitchesThisPA = estimatePitches(outcome);
    pitchCountRef.value += pitchesThisPA;

    // Update Markov state
    const runsBefore2 = markov.runsScored;
    [markov, gen] = applyOutcome(gen, markov, outcome, batter.hitterAttributes?.speed ?? 350, 350);
    const runsThisPA = markov.runsScored - runsBefore2;

    // Accumulate stats
    accumulateBatterStat(batterStats, batter.playerId, outcome, runsThisPA, false);
    accumulatePitcherStat(pitcherStats, pitcher.playerId, outcome, runsThisPA, pitchesThisPA);

    pos++;

    // Track times through order
    if (pos % 9 === 0) timesThroughRef.value++;
  }

  return [markov.runsScored - runsBefore, pos % 9, gen];
}

// ─── Full game simulation ─────────────────────────────────────────────────────

export interface SimulateGameInput {
  gameId: number;
  season: number;
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  players: Player[];
  seed: number;
}

export function simulateGame(input: SimulateGameInput): GameResult {
  let gen = createPRNG(input.seed);

  const parkFactor = PARK_FACTORS[input.homeTeam.parkFactorId]
    ?? PARK_FACTORS[4]!; // fallback to neutral

  // Build lineups
  const homeLineup = buildLineup(input.players, input.homeTeam.teamId);
  const awayLineup = buildLineup(input.players, input.awayTeam.teamId);

  // Pick starters using rotation index
  let homeSP = pickStarter(input.players, input.homeTeam.teamId, input.homeTeam.rotationIndex);
  let awaySP = pickStarter(input.players, input.awayTeam.teamId, input.awayTeam.rotationIndex);

  // Fallback: use a reliever as "spot starter" if no SP
  if (!homeSP) {
    homeSP = pickReliever(input.players, input.homeTeam.teamId, 0, new Set(), false);
  }
  if (!awaySP) {
    awaySP = pickReliever(input.players, input.awayTeam.teamId, 0, new Set(), false);
  }

  if (!homeSP || !awaySP || homeLineup.length < 9 || awayLineup.length < 9) {
    // Forfeit: can't play without enough players
    return {
      gameId: input.gameId,
      homeTeamId: input.homeTeam.teamId,
      awayTeamId: input.awayTeam.teamId,
      homeScore: 0,
      awayScore: 9,
      innings: 9,
      boxScore: makeEmptyBoxScore(input),
    };
  }

  // Stat trackers
  const homeBatterStats = new Map<number, PlayerGameStats>();
  const awayBatterStats = new Map<number, PlayerGameStats>();
  const homePitcherStats = new Map<number, PitcherGameStats>();
  const awayPitcherStats = new Map<number, PitcherGameStats>();

  // Game state
  let ctx = createInitialFSMContext();
  ctx = startGame(ctx);

  let homePitcher = homeSP;
  let awayPitcher = awaySP;
  const homeUsedPitchers = new Set<number>([homeSP.playerId]);
  const awayUsedPitchers = new Set<number>([awaySP.playerId]);

  const homePitchCount = { value: 0 };
  const awayPitchCount = { value: 0 };
  const homeTimesThrough = { value: 1 };
  const awayTimesThrough = { value: 1 };

  let homeLineupPos = 0;
  let awayLineupPos = 0;

  const homeDefRating = input.players
    .filter(p => p.teamId === input.homeTeam.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher)
    .slice(0, 9)
    .reduce((sum, p) => sum + (p.hitterAttributes?.fielding ?? 350), 0) / 9;

  const awayDefRating = input.players
    .filter(p => p.teamId === input.awayTeam.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher)
    .slice(0, 9)
    .reduce((sum, p) => sum + (p.hitterAttributes?.fielding ?? 350), 0) / 9;

  const MAX_INNINGS = 25;

  for (let inning = 1; inning <= MAX_INNINGS; inning++) {
    // ── TOP of inning (away bats) ──────────────────────────────────────────
    const topManned = shouldUseMannedRunner({ ...ctx, inning, isTop: true });
    let awayRuns: number;
    [awayRuns, awayLineupPos, gen] = simulateHalfInning(
      gen,
      { ...ctx, inning, isTop: true },
      awayLineup,
      awayLineupPos,
      homePitcher,
      homePitchCount,
      homeTimesThrough,
      awayBatterStats,
      homePitcherStats,
      parkFactor,
      homeDefRating,
      topManned,
    );
    ctx = { ...ctx, awayScore: ctx.awayScore + awayRuns, inning, outs: 0, runners: 0 };

    // Pitcher management: pull home starter?
    homePitcher = managePitcher(
      gen,
      homePitcher,
      homePitchCount,
      homeTimesThrough,
      input.players,
      input.homeTeam.teamId,
      homeUsedPitchers,
      inning,
      false, // not save situation for top
    );

    // ── BOTTOM of inning (home bats) ───────────────────────────────────────
    const bottomManned = shouldUseMannedRunner({ ...ctx, inning, isTop: false });
    let homeRuns: number;
    [homeRuns, homeLineupPos, gen] = simulateHalfInning(
      gen,
      { ...ctx, inning, isTop: false },
      homeLineup,
      homeLineupPos,
      awayPitcher,
      awayPitchCount,
      awayTimesThrough,
      homeBatterStats,
      awayPitcherStats,
      parkFactor,
      awayDefRating,
      bottomManned,
    );
    ctx = { ...ctx, homeScore: ctx.homeScore + homeRuns, outs: 0, runners: 0 };

    // Pitcher management: pull away starter?
    awayPitcher = managePitcher(
      gen,
      awayPitcher,
      awayPitchCount,
      awayTimesThrough,
      input.players,
      input.awayTeam.teamId,
      awayUsedPitchers,
      inning,
      false,
    );

    // ── Game over? ─────────────────────────────────────────────────────────
    if (inning >= 9 && ctx.homeScore !== ctx.awayScore) break;
    if (inning >= MAX_INNINGS) break; // Tie after 25 innings: break (shouldn't happen)
  }

  // Assign decisions (W/L/S/H)
  assignPitcherDecisions(homePitcherStats, awayPitcherStats, ctx.homeScore, ctx.awayScore);

  const boxScore: BoxScore = {
    gameId: input.gameId,
    season: input.season,
    date: input.date,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    innings: 9, // tracked externally
    homeBatting: Array.from(homeBatterStats.values()),
    awayBatting: Array.from(awayBatterStats.values()),
    homePitching: Array.from(homePitcherStats.values()),
    awayPitching: Array.from(awayPitcherStats.values()),
  };

  return {
    gameId: input.gameId,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    innings: 9,
    boxScore,
  };
}

// ─── Pitcher management ───────────────────────────────────────────────────────

function managePitcher(
  gen: RandomGenerator,
  currentPitcher: Player,
  pitchCountRef: { value: number },
  timesThroughRef: { value: number },
  players: Player[],
  teamId: number,
  usedIds: Set<number>,
  inning: number,
  isSaveSituation: boolean,
): Player {
  const isPitcher = (p: Player) => p.isPitcher;
  const pc = pitchCountRef.value;
  const tto = timesThroughRef.value;

  const shouldPull =
    pc > 110 ||
    (tto >= 3 && pc > 75) ||
    (inning >= 7 && currentPitcher.position !== 'SP');

  if (!shouldPull) return currentPitcher;

  // Pull and bring in reliever
  const wantCloser = isSaveSituation && inning >= 9;
  const next = pickReliever(players, teamId, usedIds.size, usedIds, wantCloser);
  if (!next) return currentPitcher; // No one available

  usedIds.add(next.playerId);
  pitchCountRef.value = 0; // Reset for the new pitcher

  void gen; // gen not needed here but keep signature consistent
  void isPitcher; // used conceptually

  return next;
}

// ─── Pitcher decision assignment ──────────────────────────────────────────────

function assignPitcherDecisions(
  homePitcherStats: Map<number, PitcherGameStats>,
  awayPitcherStats: Map<number, PitcherGameStats>,
  homeScore: number,
  awayScore: number,
): void {
  // Win goes to pitcher of record for winning team (last pitcher to lead while they pitched)
  // Simplified: win goes to starter of winning team, save to last reliever if applicable
  const winnerStats = homeScore > awayScore ? homePitcherStats : awayPitcherStats;
  const loserStats  = homeScore > awayScore ? awayPitcherStats : homePitcherStats;

  // Starter gets the W (first pitcher in map)
  const winnerArr = Array.from(winnerStats.values());
  if (winnerArr.length > 0) {
    winnerArr[0]!.decision = 'W';
    // Last reliever of winner gets save if SP didn't finish and margin ≤ 3
  }
  const loserArr = Array.from(loserStats.values());
  if (loserArr.length > 0) {
    loserArr[0]!.decision = 'L';
  }
}

// ─── Empty box score for forfeits ────────────────────────────────────────────

function makeEmptyBoxScore(input: SimulateGameInput): BoxScore {
  return {
    gameId: input.gameId,
    season: input.season,
    date: input.date,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: 0,
    awayScore: 0,
    innings: 9,
    homeBatting: [],
    awayBatting: [],
    homePitching: [],
    awayPitching: [],
  };
}
