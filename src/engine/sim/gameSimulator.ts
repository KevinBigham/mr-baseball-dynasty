import type { RandomGenerator } from 'pure-rand';
import type { Player, PlayerGameStats, PitcherGameStats, ThrowSide } from '../../types/player';
import { BLANK_SPLIT } from '../../types/player';
import type { Team } from '../../types/team';
import type { BoxScore, GameResult, PAOutcome, PlayEvent } from '../../types/game';
import { createPRNG, nextFloat } from '../math/prng';
import { resolvePlateAppearance } from './plateAppearance';
import { applyOutcome, INITIAL_INNING_STATE, type MarkovState } from './markov';
import { attemptSteals } from './stolenBase';
import { checkWildPitch } from './wildPitch';
import { buntProbability, resolveBunt } from './sacrificeBunt';
import { shouldIntentionalWalk } from './intentionalWalk';
import { selectPinchHitter } from './pinchHit';
import { PARK_FACTORS } from '../../data/parkFactors';
import {
  createInitialFSMContext, startGame, shouldUseMannedRunner,
  type GameFSMContext,
} from './fsm';

// ─── Lineup and pitcher selection ────────────────────────────────────────────

function buildLineup(players: Player[], teamId: number, savedOrder?: number[]): Player[] {
  const active = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher,
  );
  const playerMap = new Map(active.map(p => [p.playerId, p]));

  // If a saved batting order exists, use it (with validation)
  if (savedOrder && savedOrder.length === 9) {
    const ordered: Player[] = [];
    for (const id of savedOrder) {
      const p = playerMap.get(id);
      if (p) ordered.push(p);
    }
    // If all 9 players were found and active, use the saved order
    if (ordered.length === 9) return ordered;
  }

  // Fallback: sort by composite offensive rating
  active.sort((a, b) => {
    const aVal = (a.hitterAttributes?.contact ?? 0) + (a.hitterAttributes?.power ?? 0) * 0.8
               + (a.hitterAttributes?.eye ?? 0) * 0.6;
    const bVal = (b.hitterAttributes?.contact ?? 0) + (b.hitterAttributes?.power ?? 0) * 0.8
               + (b.hitterAttributes?.eye ?? 0) * 0.6;
    return bVal - aVal;
  });
  return active.slice(0, 9);
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
  preferredHand?: 'L' | 'R',
): Player | null {
  let relievers = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && (p.position === 'RP' || (wantCloser && p.position === 'CL'))
      && !excludeIds.has(p.playerId),
  );
  if (relievers.length === 0) return null;

  // If we have a hand preference, try to match it
  if (preferredHand) {
    const matchingHand = relievers.filter(p => p.throws === preferredHand);
    if (matchingHand.length > 0) {
      relievers = matchingHand;
    }
  }

  relievers.sort((a, b) => b.overall - a.overall);
  return relievers[bullpenCounter % relievers.length] ?? null;
}

// ─── Blank stat accumulators ──────────────────────────────────────────────────

function blankBatterStats(playerId: number): PlayerGameStats {
  return { playerId, pa: 0, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, hbp: 0, sb: 0, cs: 0 };
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
  pitcherHand?: ThrowSide,
): void {
  const s = stats.get(playerId) ?? blankBatterStats(playerId);
  s.pa++;
  // AB: not counted for BB, HBP, SF, SAC_BUNT
  if (outcome !== 'BB' && outcome !== 'HBP' && outcome !== 'SF' && outcome !== 'SAC_BUNT') s.ab++;
  if (outcome === 'BB')  s.bb++;
  if (outcome === 'HBP') s.hbp++;
  if (outcome === 'K')   s.k++;
  if (outcome === '1B')  { s.h++; }
  if (outcome === '2B')  { s.h++; s.doubles++; }
  if (outcome === '3B')  { s.h++; s.triples++; }
  if (outcome === 'HR')  { s.h++; s.hr++; }
  // 'E' — reached on error: counts as AB (above) but NOT a hit. No RBI credited.
  if (scored) s.r++;
  if (outcome !== 'E') s.rbi += rbi; // No RBI on errors

  // Track platoon splits (vs LHP / vs RHP)
  if (pitcherHand) {
    const splitKey = pitcherHand === 'L' ? 'vsLHP' : 'vsRHP';
    if (!s[splitKey]) s[splitKey] = { ...BLANK_SPLIT };
    const split = s[splitKey]!;
    split.pa++;
    if (outcome !== 'BB' && outcome !== 'HBP' && outcome !== 'SF') split.ab++;
    if (outcome === 'BB') split.bb++;
    if (outcome === 'K') split.k++;
    if (outcome === '1B') split.h++;
    if (outcome === '2B') { split.h++; split.doubles++; }
    if (outcome === '3B') { split.h++; split.triples++; }
    if (outcome === 'HR') { split.h++; split.hr++; }
  }

  stats.set(playerId, s);
}

function accumulatePitcherStat(
  stats: Map<number, PitcherGameStats>,
  playerId: number,
  outcome: PAOutcome,
  runsAllowed: number,
  unearnedRuns: number,
  pitches: number,
): void {
  const s = stats.get(playerId) ?? blankPitcherStats(playerId);
  s.pitchCount += pitches;
  s.r += runsAllowed;
  s.er += runsAllowed - unearnedRuns; // Only count earned runs
  if (outcome === 'K')  s.k++;
  if (outcome === 'BB') s.bb++;
  if (outcome === 'HR') { s.hr++; }
  if (outcome === '1B' || outcome === '2B' || outcome === '3B' || outcome === 'HR') s.h++;
  if (outcome === 'E') s.h++; // Error counts as a hit allowed for pitcher tracking
  // Count outs
  if (outcome === 'K' || outcome === 'GB_OUT' || outcome === 'FB_OUT'
    || outcome === 'LD_OUT' || outcome === 'PU_OUT' || outcome === 'SF'
    || outcome === 'SAC_BUNT') {
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
    case 'E':  return 3;  // Error on a BIP — same as a quick out (the pitch count is the same)
    case 'SAC_BUNT': return 2; // Bunts are typically quick 1-2 pitch affairs
    default: return 3;   // Quick outs (GO, FO, PU) average 3 pitches
  }
}

// ─── Half-inning simulation ───────────────────────────────────────────────────

// Get runners on base as Player objects for steal logic
function getRunnersOnBase(
  runners: number,
  lineup: Player[],
  lineupPos: number,
): [Player | null, Player | null, Player | null] {
  // We track runners by using the last batters who reached base
  // This is a simplification — we return the lineup slot holders as proxies
  return [
    (runners & 0b001) ? lineup[(lineupPos - 1 + 9) % 9] ?? null : null,  // 1st
    (runners & 0b010) ? lineup[(lineupPos - 2 + 9) % 9] ?? null : null,  // 2nd
    (runners & 0b100) ? lineup[(lineupPos - 3 + 9) % 9] ?? null : null,  // 3rd
  ];
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
  allPlayers: Player[],
  fieldingTeamId: number,
  bench: Player[],
  playLog?: PlayEvent[],
): [number, number, RandomGenerator] { // [runs, lineupPosAfter, gen]
  let markov: MarkovState = { ...INITIAL_INNING_STATE };
  if (mannedRunner) {
    markov = { runners: 0b010, outs: 0, runsScored: 0 };
  }

  // Find catcher for the fielding team (for stolen base defense)
  const catcher = allPlayers.find(
    p => p.teamId === fieldingTeamId && p.position === 'C'
      && p.rosterData.rosterStatus === 'MLB_ACTIVE',
  ) ?? null;

  let pos = lineupPos;

  // Error tracking for unearned runs:
  // If an error occurs at 2 outs (would-have-been 3rd out), all subsequent runs are unearned.
  // Otherwise, only runs scoring directly on the error play are unearned.
  let allRunsUnearned = false;

  while (markov.outs < 3) {
    // ── Stolen base attempts (before next PA) ──
    if (markov.runners !== 0) {
      const runnersArr = getRunnersOnBase(markov.runners, lineup, pos);
      const runnersForSteal: Player[] = [
        runnersArr[0] ?? lineup[0]!,
        runnersArr[1] ?? lineup[0]!,
        runnersArr[2] ?? lineup[0]!,
      ];

      let stealResults: import('./stolenBase').StealAttemptResult[];
      [markov, stealResults, gen] = attemptSteals(
        gen, markov, runnersForSteal, pitcher, catcher, markov.outs,
      );

      // Record SB/CS in batter stats
      for (const sr of stealResults) {
        const stat = batterStats.get(sr.runnerId) ?? blankBatterStats(sr.runnerId);
        if (sr.success) {
          stat.sb++;
        } else {
          stat.cs++;
        }
        batterStats.set(sr.runnerId, stat);

        // Add steal event to play log
        if (playLog) {
          playLog.push({
            inning: ctx.inning,
            isTop: ctx.isTop,
            batterId: sr.runnerId,
            pitcherId: pitcher.playerId,
            outs: markov.outs - (sr.success ? 0 : 1), // outs before this play
            runners: markov.runners,
            result: {
              outcome: sr.success ? 'SB' as PAOutcome : 'CS' as PAOutcome,
              runsScored: 0,
              runnersAdvanced: 0,
            },
          });
        }
      }
    }

    if (markov.outs >= 3) break;

    // ── Wild pitch / passed ball check (between PAs) ──
    if (markov.runners !== 0) {
      let wpResult: import('./wildPitch').WildPitchResult | null;
      [markov, wpResult, gen] = checkWildPitch(gen, markov, pitcher, catcher, pitchCountRef.value);

      if (wpResult) {
        // WP/PB runs are unearned for passed balls, earned for wild pitches
        const wpRunsUnearned = wpResult.type === 'PB' ? wpResult.runsScored : 0;
        if (wpResult.runsScored > 0) {
          accumulatePitcherStat(
            pitcherStats, pitcher.playerId,
            wpResult.type as PAOutcome, wpResult.runsScored, wpRunsUnearned, 0,
          );
        }

        if (playLog) {
          playLog.push({
            inning: ctx.inning,
            isTop: ctx.isTop,
            batterId: 0, // No batter involved
            pitcherId: pitcher.playerId,
            outs: markov.outs,
            runners: markov.runners,
            result: {
              outcome: wpResult.type as PAOutcome,
              runsScored: wpResult.runsScored,
              runnersAdvanced: 0,
            },
          });
        }
      }
    }

    if (markov.outs >= 3) break;

    let batter = lineup[pos % 9]!;

    // ── Pinch-hit check ──
    const ph = selectPinchHitter(
      batter, ctx.inning, markov.runners, markov.outs, bench, pitcher.throws,
    );
    if (ph) {
      // Swap pinch-hitter into the lineup slot permanently
      lineup[pos % 9] = ph;
      batter = ph;
      // Remove from bench
      const benchIdx = bench.indexOf(ph);
      if (benchIdx >= 0) bench.splice(benchIdx, 1);
    }

    const onDeckBatter = lineup[(pos + 1) % 9]!;

    // ── Intentional walk check ──
    let isIBB = false;
    if (shouldIntentionalWalk(batter, onDeckBatter, markov.runners, markov.outs, ctx.inning)) {
      isIBB = true;
    }

    // ── Sacrifice bunt check (skip if IBB) ──
    let buntOutcome: PAOutcome | null = null;
    if (!isIBB) {
      const buntProb = buntProbability(batter, markov.runners, markov.outs);
      if (buntProb > 0) {
        let buntRoll: number;
        [buntRoll, gen] = nextFloat(gen);
        if (buntRoll < buntProb) {
          [buntOutcome, gen] = resolveBunt(gen, batter, defenseRating);
          // buntOutcome is null if the bunt failed → fall through to normal PA
        }
      }
    }

    // Record pre-PA state for play log
    const preOuts = markov.outs;
    const preRunners = markov.runners;

    let outcome: PAOutcome;
    if (isIBB) {
      // Intentional walk: automatic BB, no PA resolution needed
      outcome = 'BB';
    } else if (buntOutcome) {
      // Bunt resolved: use the bunt outcome directly
      outcome = buntOutcome;
    } else {
      // Normal PA resolution
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
      outcome = paResult.outcome;
    }

    const pitchesThisPA = isIBB ? 0 : estimatePitches(outcome);
    pitchCountRef.value += pitchesThisPA;

    // Handle error: if error at 2 outs, all subsequent runs become unearned
    if (outcome === 'E' && preOuts === 2) {
      allRunsUnearned = true;
    }

    // Update Markov state
    const runsBefore2 = markov.runsScored;
    [markov, gen] = applyOutcome(gen, markov, outcome, batter.hitterAttributes?.speed ?? 350, 350);
    const runsThisPA = markov.runsScored - runsBefore2;

    // Determine unearned runs:
    // 1) If allRunsUnearned flag is set (error extended the inning), all runs are unearned
    // 2) If this play is an error, runs scoring on this play are unearned
    const unearnedThisPA = allRunsUnearned ? runsThisPA
      : (outcome === 'E' ? runsThisPA : 0);

    // Accumulate stats (with platoon split tracking)
    accumulateBatterStat(batterStats, batter.playerId, outcome, runsThisPA, false, pitcher.throws);
    accumulatePitcherStat(pitcherStats, pitcher.playerId, outcome, runsThisPA, unearnedThisPA, pitchesThisPA);

    // Add to play log
    if (playLog) {
      playLog.push({
        inning: ctx.inning,
        isTop: ctx.isTop,
        batterId: batter.playerId,
        pitcherId: pitcher.playerId,
        outs: preOuts,
        runners: preRunners,
        result: { outcome, runsScored: runsThisPA, runnersAdvanced: 0 },
      });
    }

    pos++;

    // Track times through order
    if (pos % 9 === 0) timesThroughRef.value++;
  }

  return [markov.runsScored, pos % 9, gen];
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
  recordPlayLog?: boolean;
  lineups?: Map<number, number[]>; // teamId → saved batting order (9 player IDs)
}

export function simulateGame(input: SimulateGameInput): GameResult {
  let gen = createPRNG(input.seed);

  const parkFactor = PARK_FACTORS[input.homeTeam.parkFactorId]
    ?? PARK_FACTORS[4]!; // fallback to neutral

  // Build lineups (use saved order if available)
  const homeLineup = buildLineup(input.players, input.homeTeam.teamId, input.lineups?.get(input.homeTeam.teamId));
  const awayLineup = buildLineup(input.players, input.awayTeam.teamId, input.lineups?.get(input.awayTeam.teamId));

  // Build bench (active non-pitcher hitters not in starting lineup)
  const homeLineupIds = new Set(homeLineup.map(p => p.playerId));
  const awayLineupIds = new Set(awayLineup.map(p => p.playerId));
  const homeBench = input.players.filter(
    p => p.teamId === input.homeTeam.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && !p.isPitcher && !homeLineupIds.has(p.playerId),
  );
  const awayBench = input.players.filter(
    p => p.teamId === input.awayTeam.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && !p.isPitcher && !awayLineupIds.has(p.playerId),
  );

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
  const playLog: PlayEvent[] | undefined = input.recordPlayLog ? [] : undefined;
  let lastHomeScoreBeforeBottom = 0;

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
      input.players,
      input.homeTeam.teamId,
      awayBench,
      playLog,
    );
    ctx = { ...ctx, awayScore: ctx.awayScore + awayRuns, inning, outs: 0, runners: 0 };

    // Pitcher management: pull home starter? (home team pitches in top half)
    const homeSave = isSaveSituation(inning, ctx.homeScore, ctx.awayScore);
    homePitcher = managePitcher(
      gen,
      homePitcher,
      homePitchCount,
      homeTimesThrough,
      input.players,
      input.homeTeam.teamId,
      homeUsedPitchers,
      inning,
      homeSave,
      input.homeTeam.bullpenReliefCounter,
      awayLineup,
      awayLineupPos,
    );

    // ── BOTTOM of inning (home bats) ───────────────────────────────────────
    lastHomeScoreBeforeBottom = ctx.homeScore;
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
      input.players,
      input.awayTeam.teamId,
      homeBench,
      playLog,
    );
    ctx = { ...ctx, homeScore: ctx.homeScore + homeRuns, outs: 0, runners: 0 };

    // Pitcher management: pull away starter? (away team pitches in bottom half)
    const awaySave = isSaveSituation(inning, ctx.awayScore, ctx.homeScore);
    awayPitcher = managePitcher(
      gen,
      awayPitcher,
      awayPitchCount,
      awayTimesThrough,
      input.players,
      input.awayTeam.teamId,
      awayUsedPitchers,
      inning,
      awaySave,
      input.awayTeam.bullpenReliefCounter,
      homeLineup,
      homeLineupPos,
    );

    // ── Game over? ─────────────────────────────────────────────────────────
    if (inning >= 9 && ctx.homeScore !== ctx.awayScore) break;
    if (inning >= MAX_INNINGS) break; // Tie after 25 innings: break (shouldn't happen)
  }

  // Assign decisions (W/L/S/H)
  assignPitcherDecisions(homePitcherStats, awayPitcherStats, ctx.homeScore, ctx.awayScore);

  // Mark quality starts, complete games, and shutouts
  const markPitcherAchievements = (
    stats: Map<number, PitcherGameStats>,
    starterId: number,
    usedPitchers: Set<number>,
  ) => {
    const s = stats.get(starterId);
    if (!s) return;
    // Quality start: 6+ IP, 3 or fewer ER
    if (s.outs >= 18 && s.er <= 3) s.qualityStart = true;
    // Complete game: starter was the only pitcher used
    if (usedPitchers.size === 1) {
      s.completeGame = true;
      // Shutout: complete game with 0 runs allowed
      if (s.r === 0) s.shutout = true;
    }
  };
  markPitcherAchievements(homePitcherStats, homeSP.playerId, homeUsedPitchers);
  markPitcherAchievements(awayPitcherStats, awaySP.playerId, awayUsedPitchers);

  const boxScore: BoxScore = {
    gameId: input.gameId,
    season: input.season,
    date: input.date,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    innings: 9,
    homeBatting: Array.from(homeBatterStats.values()),
    awayBatting: Array.from(awayBatterStats.values()),
    homePitching: Array.from(homePitcherStats.values()),
    awayPitching: Array.from(awayPitcherStats.values()),
    playLog,
  };

  // Walk-off: home team wins AND took the lead in the bottom of the final inning
  const isWalkOff = ctx.homeScore > ctx.awayScore
    && lastHomeScoreBeforeBottom <= ctx.awayScore;

  return {
    gameId: input.gameId,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    innings: 9,
    walkOff: isWalkOff || undefined,
    boxScore,
  };
}

// ─── Pitcher management ───────────────────────────────────────────────────────

// Determine the platoon-optimal hand for the next few batters
function getPreferredBullpenHand(
  opposingLineup: Player[],
  lineupPos: number,
): 'L' | 'R' | undefined {
  // Look at next 3 batters — if majority bat from one side, prefer opposite hand
  let leftBats = 0;
  let rightBats = 0;
  for (let i = 0; i < 3; i++) {
    const batter = opposingLineup[(lineupPos + i) % 9];
    if (!batter) continue;
    if (batter.bats === 'L') leftBats++;
    else if (batter.bats === 'R') rightBats++;
    // Switch hitters count as neutral
  }
  if (leftBats >= 2) return 'L';  // Use LHP vs lefty-heavy lineup segment
  if (rightBats >= 2) return 'R'; // Use RHP vs righty-heavy segment
  return undefined; // No strong preference
}

// Detect save situation: leading by 1-3 runs in 9th+ with < 3 innings left to play
function isSaveSituation(
  inning: number,
  teamScore: number,
  opponentScore: number,
): boolean {
  return inning >= 9 && teamScore > opponentScore && (teamScore - opponentScore) <= 3;
}

function managePitcher(
  gen: RandomGenerator,
  currentPitcher: Player,
  pitchCountRef: { value: number },
  timesThroughRef: { value: number },
  players: Player[],
  teamId: number,
  usedIds: Set<number>,
  inning: number,
  saveSituation: boolean,
  bullpenOffset: number,
  opposingLineup?: Player[],
  lineupPos?: number,
): Player {
  const pc = pitchCountRef.value;

  // Stamina-gated inning cap
  const staminaAttr = currentPitcher.pitcherAttributes?.stamina ?? 350;
  const maxSPInnings = staminaAttr < 320 ? 5 : staminaAttr < 470 ? 6 : 7;

  // Pitch limit: secondary gate
  const pitchLimit = Math.round(55 + staminaAttr / 14);

  const shouldPull =
    pc > pitchLimit ||
    (currentPitcher.position === 'SP' && inning >= maxSPInnings) ||
    (currentPitcher.position !== 'SP' && inning >= 8);

  if (!shouldPull) return currentPitcher;

  // Determine optimal reliever hand based on upcoming batters
  const preferredHand = opposingLineup && lineupPos !== undefined
    ? getPreferredBullpenHand(opposingLineup, lineupPos)
    : undefined;

  // Pull and bring in reliever
  const wantCloser = saveSituation && inning >= 9;
  const counter = (bullpenOffset + usedIds.size) % 100;
  const next = pickReliever(players, teamId, counter, usedIds, wantCloser, preferredHand);
  if (!next) return currentPitcher;

  usedIds.add(next.playerId);
  pitchCountRef.value = 0;
  timesThroughRef.value = 1;

  void gen;
  return next;
}

// ─── Pitcher decision assignment ──────────────────────────────────────────────

function assignPitcherDecisions(
  homePitcherStats: Map<number, PitcherGameStats>,
  awayPitcherStats: Map<number, PitcherGameStats>,
  homeScore: number,
  awayScore: number,
): void {
  if (homeScore === awayScore) return; // Tie game — shouldn't happen but be safe

  const winnerStats = homeScore > awayScore ? homePitcherStats : awayPitcherStats;
  const loserStats  = homeScore > awayScore ? awayPitcherStats : homePitcherStats;
  const margin = Math.abs(homeScore - awayScore);

  const winnerArr = Array.from(winnerStats.values());
  const loserArr = Array.from(loserStats.values());

  // Win goes to the starter (first pitcher)
  if (winnerArr.length > 0) {
    winnerArr[0]!.decision = 'W';
  }

  // Loss goes to the starter of the losing team
  if (loserArr.length > 0) {
    loserArr[0]!.decision = 'L';
  }

  // Save: last reliever of winning team gets the save if:
  //   1. They're not the starter (didn't get the W)
  //   2. They finished the game (they're the last pitcher)
  //   3. Lead was ≤ 3 when they entered OR they pitched 3+ innings
  if (winnerArr.length > 1) {
    const lastPitcher = winnerArr[winnerArr.length - 1]!;
    if (margin <= 3 || lastPitcher.outs >= 9) {
      lastPitcher.decision = 'S';
    } else {
      lastPitcher.decision = 'H'; // Hold if not a save situation
    }
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
