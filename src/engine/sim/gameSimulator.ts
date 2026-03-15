import type { RandomGenerator } from 'pure-rand';
import type { Player, PlayerGameStats, PitcherGameStats } from '../../types/player';
import type { Team } from '../../types/team';
import type { BoxScore, GameResult, PAOutcome } from '../../types/game';
import { createPRNG } from '../math/prng';
import { resolvePlateAppearance } from './plateAppearance';
import { applyOutcome, INITIAL_INNING_STATE, type MarkovState } from './markov';
import { PARK_FACTORS } from '../../data/parkFactors';
import {
  createInitialFSMContext, startGame, shouldUseMannedRunner,
  type GameFSMContext,
} from './fsm';

// ─── Lineup and pitcher selection ────────────────────────────────────────────

function buildLineup(players: Player[], teamId: number, customOrder?: number[]): Player[] {
  const hitters = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher,
  );

  // If a custom batting order is provided, use it (validating players are still active)
  if (customOrder && customOrder.length === 9) {
    const hitterMap = new Map(hitters.map(h => [h.playerId, h]));
    const ordered: Player[] = [];
    for (const id of customOrder) {
      const h = hitterMap.get(id);
      if (h) ordered.push(h);
    }
    // If all 9 are valid, use the custom order; otherwise fall back to attribute sort
    if (ordered.length === 9) return ordered;
  }

  // Sort by composite offensive rating (contact + power + eye)
  hitters.sort((a, b) => {
    const aVal = (a.hitterAttributes?.contact ?? 0) + (a.hitterAttributes?.power ?? 0) * 0.8
               + (a.hitterAttributes?.eye ?? 0) * 0.6;
    const bVal = (b.hitterAttributes?.contact ?? 0) + (b.hitterAttributes?.power ?? 0) * 0.8
               + (b.hitterAttributes?.eye ?? 0) * 0.6;
    return bVal - aVal;
  });
  // Return top 9
  return hitters.slice(0, 9);
}

function pickStarter(players: Player[], teamId: number, rotationIndex: number, customRotation?: number[]): Player | null {
  const starters = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && p.position === 'SP',
  );
  if (starters.length === 0) return null;

  // If a custom rotation order is provided, cycle through it
  if (customRotation && customRotation.length > 0) {
    const starterMap = new Map(starters.map(s => [s.playerId, s]));
    // Filter to only valid active SPs
    const validIds = customRotation.filter(id => starterMap.has(id));
    if (validIds.length > 0) {
      const pickId = validIds[rotationIndex % validIds.length];
      return starterMap.get(pickId) ?? null;
    }
  }

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
  return { playerId, pa: 0, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0 };
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
  if (outcome === 'HBP') s.hbp++;
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
  // Calibrated to ~15 pitches/inning average (real MLB benchmark)
  switch (outcome) {
    case 'K':  return 4;  // Real MLB avg K is ~4-5 pitches, not 6
    case 'BB': return 4;  // Walks average ~4.5 pitches, bias down for speed
    case 'HR': return 4;
    case '1B': return 4;
    case '2B': case '3B': return 4;
    case 'GDP': return 3;
    default: return 3;   // Quick outs (GO, FO, PU) average 3 pitches
  }
}

// ─── Half-inning simulation ───────────────────────────────────────────────────

function simulateHalfInning(
  gen: RandomGenerator,
  _ctx: GameFSMContext,
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
  // Track which batter is on each base (by playerId) so we can credit runs scored
  // baseRunners[0]=1st, baseRunners[1]=2nd, baseRunners[2]=3rd
  const baseRunners: (number | null)[] = [null, null, null];

  if (mannedRunner) {
    // Start with runner on 2nd (Manfred runner)
    markov = { runners: 0b010, outs: 0, runsScored: 0 };
    // Manfred runner is the last batter in the lineup order (approximate)
    const mannedIdx = (lineupPos + 8) % 9;
    baseRunners[1] = lineup[mannedIdx]!.playerId;
  }

  let pos = lineupPos;

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

    // Snapshot runners before the PA for run-scoring credit
    const runnersBefore = [baseRunners[0], baseRunners[1], baseRunners[2]];
    const markovBefore = markov.runners;

    // Update Markov state
    const runsBefore2 = markov.runsScored;
    [markov, gen] = applyOutcome(gen, markov, outcome, batter.hitterAttributes?.speed ?? 350, 350);
    const runsThisPA = markov.runsScored - runsBefore2;

    // Credit runs scored to specific batters using runner tracking
    // Figure out which runners scored by comparing base occupancy before/after
    if (runsThisPA > 0) {
      if (outcome === 'HR') {
        // HR: batter + all base runners score
        for (let b = 0; b < 3; b++) {
          if ((markovBefore & (1 << b)) && runnersBefore[b] != null) {
            markRunScored(batterStats, runnersBefore[b]!);
          }
        }
        markRunScored(batterStats, batter.playerId);
      } else {
        // For other outcomes: runners who were on base but are no longer score
        let credited = 0;
        for (let b = 2; b >= 0; b--) {
          if (credited >= runsThisPA) break;
          if ((markovBefore & (1 << b)) && !(markov.runners & (1 << b)) && runnersBefore[b] != null) {
            // This runner was on base and no longer is — check if they advanced past home
            // Runners cleared from bases who aren't on a higher base scored
            const runnerId = runnersBefore[b]!;
            const stillOnBase = (b < 2 && baseRunners[b + 1] === runnerId) ||
                                (markov.runners & (1 << b));
            if (!stillOnBase) {
              markRunScored(batterStats, runnerId);
              credited++;
            }
          }
        }
        // If we haven't credited all runs, credit remaining to highest base runners
        for (let b = 2; b >= 0 && credited < runsThisPA; b--) {
          if ((markovBefore & (1 << b)) && runnersBefore[b] != null) {
            const runnerId = runnersBefore[b]!;
            // Check we haven't already credited this runner
            const alreadyCredited = credited > 0; // simplified check
            if (!alreadyCredited) {
              markRunScored(batterStats, runnerId);
              credited++;
            }
          }
        }
      }
    }

    // Update base runner tracking to match new Markov state
    updateBaseRunners(baseRunners, markovBefore, markov.runners, batter.playerId, outcome);

    // Accumulate stats (RBI credited to batter, runs scored handled above)
    accumulateBatterStat(batterStats, batter.playerId, outcome, runsThisPA, false);
    accumulatePitcherStat(pitcherStats, pitcher.playerId, outcome, runsThisPA, pitchesThisPA);

    pos++;

    // Track times through order
    if (pos % 9 === 0) timesThroughRef.value++;
  }

  return [markov.runsScored, pos % 9, gen];
}

/** Mark a batter as having scored a run */
function markRunScored(
  stats: Map<number, PlayerGameStats>,
  playerId: number,
): void {
  const s = stats.get(playerId);
  if (s) s.r++;
}

/** Update the base runner tracking array after a PA outcome */
function updateBaseRunners(
  baseRunners: (number | null)[],
  runnersBefore: number,
  runnersAfter: number,
  batterId: number,
  outcome: PAOutcome,
): void {
  const prev = [baseRunners[0], baseRunners[1], baseRunners[2]];

  // Clear all bases first
  baseRunners[0] = null;
  baseRunners[1] = null;
  baseRunners[2] = null;

  switch (outcome) {
    case 'HR':
      // All bases cleared, batter scores (no one on base)
      break;
    case '3B':
      baseRunners[2] = batterId;
      break;
    case '2B':
      baseRunners[1] = batterId;
      // Runner from 1st may be on 3rd
      if ((runnersBefore & 0b001) && (runnersAfter & 0b100)) {
        baseRunners[2] = prev[0];
      }
      break;
    case '1B':
      baseRunners[0] = batterId;
      // Runner from 2nd may be on 3rd
      if ((runnersBefore & 0b010) && (runnersAfter & 0b100)) {
        baseRunners[2] = prev[1];
      } else if ((runnersBefore & 0b010) && !(runnersAfter & 0b010)) {
        // Runner from 2nd scored (not on 2nd or 3rd anymore)
      }
      // Runner from 1st may be on 2nd or 3rd
      if ((runnersBefore & 0b001) && (runnersAfter & 0b100) && !baseRunners[2]) {
        baseRunners[2] = prev[0];
      } else if ((runnersBefore & 0b001) && (runnersAfter & 0b010)) {
        baseRunners[1] = prev[0];
      }
      break;
    case 'BB':
    case 'HBP':
      baseRunners[0] = batterId;
      // Force plays push runners up
      if (runnersBefore & 0b001) baseRunners[1] = prev[0];
      if ((runnersBefore & 0b011) === 0b011) baseRunners[2] = prev[1];
      // If bases were loaded, runner from 3rd scored
      if ((runnersBefore & 0b010) && !(runnersBefore & 0b001) && (runnersAfter & 0b010)) {
        baseRunners[1] = prev[1]; // stays on 2nd (no force)
      }
      if ((runnersBefore & 0b100) && !((runnersBefore & 0b011) === 0b011)) {
        baseRunners[2] = prev[2]; // stays on 3rd (no force)
      }
      break;
    case 'GDP':
      // Runner on 1st out, others may advance
      if ((runnersBefore & 0b010) && (runnersAfter & 0b100)) {
        baseRunners[2] = prev[1];
      }
      break;
    case 'SF':
      // Runner from 3rd scores, others stay
      if ((runnersBefore & 0b001) && (runnersAfter & 0b001)) baseRunners[0] = prev[0];
      if ((runnersBefore & 0b010) && (runnersAfter & 0b010)) baseRunners[1] = prev[1];
      break;
    default:
      // Outs: runners stay where they are
      if (runnersAfter & 0b001) baseRunners[0] = prev[0];
      if (runnersAfter & 0b010) baseRunners[1] = prev[1];
      if (runnersAfter & 0b100) baseRunners[2] = prev[2];
      break;
  }
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
  /** Optional user-set batting order (9 player IDs) — used when the matching team is batting */
  userLineupOrder?: number[];
  /** Optional user-set rotation order (up to 5 SP player IDs) — used when the matching team is pitching */
  userRotationOrder?: number[];
  /** The user's team ID — needed to know which team gets the custom orders */
  userTeamId?: number;
}

export function simulateGame(input: SimulateGameInput): GameResult {
  let gen = createPRNG(input.seed);

  const parkFactor = PARK_FACTORS[input.homeTeam.parkFactorId]
    ?? PARK_FACTORS[4]!; // fallback to neutral

  // Build lineups — apply user custom order only for the user's team
  const homeIsUser = input.userTeamId !== undefined && input.homeTeam.teamId === input.userTeamId;
  const awayIsUser = input.userTeamId !== undefined && input.awayTeam.teamId === input.userTeamId;
  const homeLineup = buildLineup(input.players, input.homeTeam.teamId, homeIsUser ? input.userLineupOrder : undefined);
  const awayLineup = buildLineup(input.players, input.awayTeam.teamId, awayIsUser ? input.userLineupOrder : undefined);

  // Pick starters using rotation index — apply user custom rotation only for the user's team
  let homeSP = pickStarter(input.players, input.homeTeam.teamId, input.homeTeam.rotationIndex, homeIsUser ? input.userRotationOrder : undefined);
  let awaySP = pickStarter(input.players, input.awayTeam.teamId, input.awayTeam.rotationIndex, awayIsUser ? input.userRotationOrder : undefined);

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
  let finalInning = 9;

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

    // Pitcher management: pull home starter? (save situation: home leads by ≤3 in 9th+)
    const homeLeadForSave = ctx.homeScore > ctx.awayScore && (ctx.homeScore - ctx.awayScore) <= 3;
    homePitcher = managePitcher(
      gen,
      homePitcher,
      homePitchCount,
      homeTimesThrough,
      input.players,
      input.homeTeam.teamId,
      homeUsedPitchers,
      inning,
      homeLeadForSave && inning >= 8,
      input.homeTeam.bullpenReliefCounter,
    );

    // ── BOTTOM of inning (home bats) ───────────────────────────────────────
    // Walk-off check: if home team leads after top of 9th+, skip bottom half
    if (inning >= 9 && ctx.homeScore > ctx.awayScore) {
      finalInning = inning;
      break;
    }

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

    // Pitcher management: pull away starter? (save situation: away leads by ≤3 in 9th+)
    const awayLeadForSave = ctx.awayScore > ctx.homeScore && (ctx.awayScore - ctx.homeScore) <= 3;
    awayPitcher = managePitcher(
      gen,
      awayPitcher,
      awayPitchCount,
      awayTimesThrough,
      input.players,
      input.awayTeam.teamId,
      awayUsedPitchers,
      inning,
      awayLeadForSave && inning >= 8,
      input.awayTeam.bullpenReliefCounter,
    );

    // ── Game over? ─────────────────────────────────────────────────────────
    finalInning = inning;
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
    innings: finalInning,
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
    innings: finalInning,
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
  bullpenOffset: number,       // Season-level offset to rotate through relievers across games
): Player {
  const isPitcher = (p: Player) => p.isPitcher;
  const pc = pitchCountRef.value;
  void timesThroughRef; // used elsewhere; ref checked at call site

  // Stamina-gated inning cap — prevents low-K/efficient pitchers from gaming pitch limits:
  //   stamina < 380: max 5 innings (SP goes ~165 IP)
  //   stamina 380-449: max 6 innings (SP goes ~198 IP, just under 200)
  //   stamina ≥ 450: max 7 innings (SP can reach 200+ IP) — ~7% of SPs
  const staminaAttr = currentPitcher.pitcherAttributes?.stamina ?? 350;
  // Bottom ~11% of SPs (stamina<320) capped at 5 innings; middle tier at 6; only
  // true top-end stamina arms get a 7th inning leash so 200 IP workhorses stay rare.
  const maxSPInnings = staminaAttr < 320 ? 5 : staminaAttr < 485 ? 6 : 7;

  // Pitch limit: secondary gate (still needed for high-stamina pitchers)
  // stamina=450→87, stamina=500→91, stamina=550→94
  const pitchLimit = Math.round(55 + staminaAttr / 14);

  const shouldPull =
    pc > pitchLimit ||
    (currentPitcher.position === 'SP' && inning >= maxSPInnings) ||
    (currentPitcher.position !== 'SP' && inning >= 8); // Hard cap for relievers at 7

  if (!shouldPull) return currentPitcher;

  // Pull and bring in reliever — use bullpenOffset to cycle through the bullpen across games
  const wantCloser = isSaveSituation && inning >= 9;
  const counter = (bullpenOffset + usedIds.size) % 100;
  const next = pickReliever(players, teamId, counter, usedIds, wantCloser);
  if (!next) return currentPitcher; // No one available

  usedIds.add(next.playerId);
  pitchCountRef.value = 0; // Reset for the new pitcher
  timesThroughRef.value = 1; // Reset TTO for the new pitcher

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
  const winnerStats = homeScore > awayScore ? homePitcherStats : awayPitcherStats;
  const loserStats  = homeScore > awayScore ? awayPitcherStats : homePitcherStats;
  const margin = Math.abs(homeScore - awayScore);

  // Starter gets the W (first pitcher in the winning team's map)
  const winnerArr = Array.from(winnerStats.values());
  if (winnerArr.length > 0) {
    winnerArr[0]!.decision = 'W';

    // Save: last reliever of winning team gets a save if:
    //   - SP didn't finish the game (there are relievers)
    //   - Final margin ≤ 3 runs OR reliever pitched 3+ innings
    if (winnerArr.length > 1) {
      const closer = winnerArr[winnerArr.length - 1]!;
      const closerIP = closer.outs / 3;
      if (margin <= 3 || closerIP >= 3) {
        closer.decision = 'S';
      }
    }
  }

  // Loss goes to starter of losing team
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
