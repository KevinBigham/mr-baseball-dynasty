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
import { isStarterAvailable, isRelieverAvailable, recordAppearance, getFatigueModifier, type PitcherRestMap } from './pitcherRest';
import { selectDefensiveSub } from './defensiveSub';
import { shouldHitAndRun, getHitAndRunModifiers } from './hitAndRun';
import { getProtectionModifier } from './lineupProtection';
import { getClutchModifier } from './clutch';
import { shouldInfieldIn } from './infieldIn';
import { simulateCountContext } from './countLeverage';
import {
  initialMomentum, updateMomentum, resetInningMomentum, getMomentumModifier,
  type MomentumState,
} from './momentum';
import { leverageIndex } from './winProbability';
import { getFramingModifier } from './catcherFraming';
import { generateWeather, getWeatherHRModifier, getMonthFromDate } from './weather';
import { getStreakContactModifier } from './hitterStreaks';
import { generateUmpire } from './umpire';
import { getTempoModifier } from './pitchTempo';
import { getHighFastballKMod } from './highFastball';
import { getTeamChemistryModifier, chemistryDefenseAdjustment } from './teamChemistry';
import { getHomeFieldAdvantage } from './homeFieldAdvantage';
import { getRunSupportBBMod } from './runSupport';
import { getSituationalContactMod } from './situationalHitting';
import { getGameCallingMod } from './catcherGameCalling';
import { getCloserIntensityKMod } from './closerIntensity';
import { getArsenalKMod } from './pitchArsenal';
import { getDeceptionBBMod } from './pitcherDeception';
import { getLateGameDefenseBonus } from './lateGameDefense';
import { getPatiencePitchBonus } from './batterPatience';
import { getWorkEthicPitchReduction } from './workEthicEndurance';
import { getLeadRunnerEffectiveSpeed } from './baserunningAdvancement';
import { selectPinchRunner } from './pinchRunner';
import { getOutfieldArmBonus } from './outfieldArms';
import { getExperienceBBMod } from './experienceModifier';

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

function pickStarter(
  players: Player[],
  teamId: number,
  rotationIndex: number,
  gameIndex?: number,
  restMap?: PitcherRestMap,
): Player | null {
  const starters = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && p.position === 'SP',
  );
  if (starters.length === 0) return null;
  starters.sort((a, b) => b.overall - a.overall);

  // If rest tracking is available, find the first rested starter in rotation order
  if (restMap && gameIndex !== undefined) {
    const len = starters.length;
    for (let offset = 0; offset < len; offset++) {
      const candidate = starters[(rotationIndex + offset) % len]!;
      if (isStarterAvailable(candidate, gameIndex, restMap)) {
        return candidate;
      }
    }
    // All starters tired — use the one with most rest (original rotation pick)
  }

  return starters[rotationIndex % starters.length] ?? null;
}

function pickReliever(
  players: Player[],
  teamId: number,
  bullpenCounter: number,
  excludeIds: Set<number>,
  wantCloser: boolean,
  preferredHand?: 'L' | 'R',
  gameIndex?: number,
  restMap?: PitcherRestMap,
): Player | null {
  // In save situations, prefer CL first
  if (wantCloser) {
    const closers = players.filter(
      p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
        && p.position === 'CL' && !excludeIds.has(p.playerId),
    );
    if (closers.length > 0) {
      // Check rest
      if (restMap && gameIndex !== undefined) {
        const restedCloser = closers.find(p => isRelieverAvailable(p, gameIndex, restMap));
        if (restedCloser) return restedCloser;
      } else {
        closers.sort((a, b) => b.overall - a.overall);
        return closers[0] ?? null;
      }
    }
  }

  // Standard reliever selection (RP and CL included if not in a save situation)
  let relievers = players.filter(
    p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
      && (p.position === 'RP' || p.position === 'CL')
      && !excludeIds.has(p.playerId),
  );
  if (relievers.length === 0) return null;

  // In non-save situations, deprioritize closers (save them for later)
  if (!wantCloser) {
    const nonClosers = relievers.filter(p => p.position !== 'CL');
    if (nonClosers.length > 0) relievers = nonClosers;
  }

  // Filter by rest availability if tracking is available
  if (restMap && gameIndex !== undefined) {
    const rested = relievers.filter(p => isRelieverAvailable(p, gameIndex, restMap));
    if (rested.length > 0) relievers = rested;
  }

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
  momentumRef: { value: MomentumState },
  umpireMods: { kMod: number; bbMod: number },
  hitterStreaks?: Map<number, import('./hitterStreaks').HitterStreakState>,
  playLog?: PlayEvent[],
): [number, number, RandomGenerator] { // [runs, lineupPosAfter, gen]
  let markov: MarkovState = { ...INITIAL_INNING_STATE };
  if (mannedRunner) {
    markov = { runners: 0b010, outs: 0, runsScored: 0 };
  }

  // Find catcher for the fielding team (for stolen base defense + framing)
  const catcher = allPlayers.find(
    p => p.teamId === fieldingTeamId && p.position === 'C'
      && p.rosterData.rosterStatus === 'MLB_ACTIVE',
  ) ?? null;

  // Catcher framing: affects K/BB rates for the pitching team
  const framing = getFramingModifier(catcher);

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

    // ── Hit-and-run check (before PA, after bunt/IBB) ──
    const isHitAndRun = !isIBB && !buntOutcome && shouldHitAndRun(batter, markov.runners, markov.outs);
    let hitAndRunBatter = batter;
    if (isHitAndRun && batter.hitterAttributes) {
      // Create a modified batter with H&R adjustments
      const mods = getHitAndRunModifiers();
      hitAndRunBatter = {
        ...batter,
        hitterAttributes: {
          ...batter.hitterAttributes,
          contact: Math.min(550, batter.hitterAttributes.contact + mods.contactBonus),
          power: Math.max(100, batter.hitterAttributes.power - mods.powerPenalty),
        },
      };
    }

    // ── Clutch modifier: mental toughness in high-leverage PAs ──
    const li = leverageIndex(
      ctx.homeScore - ctx.awayScore,
      ctx.inning, ctx.isTop, markov.outs, markov.runners,
    );
    let clutchBatter = hitAndRunBatter;
    const clutchMod = getClutchModifier(batter.hitterAttributes?.mentalToughness ?? 50, li);
    const streakMod = getStreakContactModifier(hitterStreaks?.get(batter.playerId));
    const situationalMod = getSituationalContactMod(batter.hitterAttributes?.offensiveIQ ?? 50, markov.runners);
    const totalContactMod = clutchMod + streakMod + situationalMod;
    if (totalContactMod !== 0 && clutchBatter.hitterAttributes) {
      clutchBatter = {
        ...clutchBatter,
        hitterAttributes: {
          ...clutchBatter.hitterAttributes,
          contact: Math.max(100, Math.min(550, clutchBatter.hitterAttributes.contact + totalContactMod)),
        },
      };
    }

    let outcome: PAOutcome;
    if (isIBB) {
      // Intentional walk: automatic BB, no PA resolution needed
      outcome = 'BB';
    } else if (buntOutcome) {
      // Bunt resolved: use the bunt outcome directly
      outcome = buntOutcome;
    } else {
      // Reliever warm-up penalty: first batter faced by a new pitcher gets
      // a slight penalty (simulated as +15 effective pitches). Real data shows
      // relievers allow ~10-15% higher OPS to their first batter faced.
      const warmUpPenalty = (pitchCountRef.value === 0 && pitcher.position !== 'SP') ? 15 : 0;

      // Apply momentum to pitch count (momentum modifier piggybacks on fatigue curve)
      // Positive momentum (pitcher locked in) → effective fewer pitches thrown
      // Negative momentum (pitcher rattled) → effective more pitches thrown
      const momentumMod = getMomentumModifier(momentumRef.value);
      const workEthicReduction = getWorkEthicPitchReduction(pitcher);
      const effectivePitchCount = Math.max(0, pitchCountRef.value + warmUpPenalty + Math.round(momentumMod * 200) - workEthicReduction);

      // Lineup protection: on-deck batter influences pitcher approach
      const protectionBBMod = getProtectionModifier(onDeckBatter);

      // Infield-in: fielding team's run differential (positive = fielding team leads)
      const fieldingRunDiff = ctx.isTop
        ? ctx.homeScore - ctx.awayScore
        : ctx.awayScore - ctx.homeScore;
      const infieldIn = shouldInfieldIn(markov.runners, markov.outs, fieldingRunDiff, ctx.inning);

      // Count leverage: simulate count context for this PA
      let countMod: import('./countLeverage').CountModifier;
      [countMod, gen] = simulateCountContext(
        gen,
        pitcher.pitcherAttributes?.command ?? 400,
        clutchBatter.hitterAttributes?.eye ?? 400,
      );

      // Normal PA resolution (with clutch + H&R modified batter if applicable)
      const paInput = {
        batter: clutchBatter,
        pitcher,
        runners: markov.runners,
        outs: markov.outs,
        pitchCount: effectivePitchCount,
        timesThrough: timesThroughRef.value,
        parkFactor,
        defenseRating,
        protectionBBMod,
        infieldIn,
        countKMod: countMod.kRateMod * framing.kMod * umpireMods.kMod * getHighFastballKMod(pitcher, batter)
          * getCloserIntensityKMod(pitcher, ctx.inning >= 9 && fieldingRunDiff > 0 && fieldingRunDiff <= 3)
          * getArsenalKMod(pitcher.pitcherAttributes?.pitchArsenalCount ?? 3),
        countBBMod: countMod.bbRateMod * framing.bbMod * umpireMods.bbMod
          * getRunSupportBBMod(
            ctx.isTop ? ctx.homeScore : ctx.awayScore,
            ctx.isTop ? ctx.awayScore : ctx.homeScore,
          )
          * getDeceptionBBMod(pitcher)
          * getExperienceBBMod(pitcher, li),
        tempoBABIPMod: getTempoModifier(pitcher) + getGameCallingMod(catcher),
      };
      let paResult: import('../../types/game').PAResult;
      [paResult, gen] = resolvePlateAppearance(gen, paInput);
      outcome = paResult.outcome;

      // H&R consequence: if batter K's, runner is caught stealing
      if (isHitAndRun && outcome === 'K' && (markov.runners & 0b001)) {
        markov = { ...markov, runners: markov.runners & ~0b001, outs: markov.outs + 1 };
        // Record CS in stats
        const runnerOnFirst = lineup[(pos - 1 + 9) % 9];
        if (runnerOnFirst) {
          const stat = batterStats.get(runnerOnFirst.playerId) ?? blankBatterStats(runnerOnFirst.playerId);
          stat.cs++;
          batterStats.set(runnerOnFirst.playerId, stat);
        }
      }
    }

    const patienceBonus = isIBB ? 0 : getPatiencePitchBonus(batter.hitterAttributes?.eye ?? 400);
    const pitchesThisPA = isIBB ? 0 : estimatePitches(outcome) + Math.round(patienceBonus);
    pitchCountRef.value += pitchesThisPA;

    // Handle error: if error at 2 outs, all subsequent runs become unearned
    if (outcome === 'E' && preOuts === 2) {
      allRunsUnearned = true;
    }

    // Update Markov state — use actual lead runner speed + baserunningIQ
    const runsBefore2 = markov.runsScored;
    const runnersForAdvance = getRunnersOnBase(markov.runners, lineup, pos);
    const leadRunner = runnersForAdvance[2] ?? runnersForAdvance[1] ?? runnersForAdvance[0];
    const leadRunnerSpeed = getLeadRunnerEffectiveSpeed(leadRunner);
    [markov, gen] = applyOutcome(gen, markov, outcome, batter.hitterAttributes?.speed ?? 350, leadRunnerSpeed);

    // H&R extra advance: on a single, runner on 2nd (from 1st) goes to 3rd
    if (isHitAndRun && outcome === '1B' && (markov.runners & 0b010) && !(markov.runners & 0b100)) {
      markov = { ...markov, runners: (markov.runners & ~0b010) | 0b100 };
    }

    const runsThisPA = markov.runsScored - runsBefore2;

    // Determine unearned runs:
    // 1) If allRunsUnearned flag is set (error extended the inning), all runs are unearned
    // 2) If this play is an error, runs scoring on this play are unearned
    const unearnedThisPA = allRunsUnearned ? runsThisPA
      : (outcome === 'E' ? runsThisPA : 0);

    // Accumulate stats (with platoon split tracking)
    accumulateBatterStat(batterStats, batter.playerId, outcome, runsThisPA, false, pitcher.throws);
    accumulatePitcherStat(pitcherStats, pitcher.playerId, outcome, runsThisPA, unearnedThisPA, pitchesThisPA);

    // Update pitcher momentum
    const isOut = outcome === 'K' || outcome === 'GB_OUT' || outcome === 'FB_OUT'
      || outcome === 'LD_OUT' || outcome === 'PU_OUT' || outcome === 'GDP'
      || outcome === 'SF' || outcome === 'SAC_BUNT';
    momentumRef.value = updateMomentum(
      momentumRef.value, isOut, runsThisPA,
      pitcher.pitcherAttributes?.mentalToughness ?? 50,
    );

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

    // ── Pinch-runner check (late innings, close game, slow runner) ──
    if (markov.runners !== 0 && markov.outs < 3) {
      const scoreDiff = ctx.isTop
        ? ctx.awayScore + markov.runsScored - ctx.homeScore
        : ctx.homeScore + markov.runsScored - ctx.awayScore;
      const currentRunners = getRunnersOnBase(markov.runners, lineup, pos);
      const usedInLineup = new Set(lineup.map(p => p.playerId));
      const prDecision = selectPinchRunner(
        currentRunners, bench, ctx.inning, scoreDiff, usedInLineup,
      );
      if (prDecision) {
        // Swap the pinch runner into the lineup slot occupied by the slow runner
        const slotIdx = lineup.findIndex(p => p.playerId === prDecision.runnerPlayerId);
        const replacement = bench.find(p => p.playerId === prDecision.replacementPlayerId);
        if (slotIdx >= 0 && replacement) {
          lineup[slotIdx] = replacement;
          const benchIdx = bench.indexOf(replacement);
          if (benchIdx >= 0) bench.splice(benchIdx, 1);
        }
      }
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
  gameIndex?: number;              // Index in the season schedule (for rest tracking)
  pitcherRestMap?: PitcherRestMap; // Pitcher rest state (mutated after game)
  hitterStreaks?: Map<number, import('./hitterStreaks').HitterStreakState>; // Rolling streak state
  teamWins?: Map<number, number>;   // Current season W for chemistry
  teamLosses?: Map<number, number>; // Current season L for chemistry
}

export function simulateGame(input: SimulateGameInput): GameResult {
  let gen = createPRNG(input.seed);

  const baseParkFactor = PARK_FACTORS[input.homeTeam.parkFactorId]
    ?? PARK_FACTORS[4]!; // fallback to neutral

  // Generate weather (deterministic from seed, no PRNG consumption)
  const month = getMonthFromDate(input.date);
  const weather = generateWeather(input.seed, month, !!baseParkFactor.isDome);
  const weatherHRMod = getWeatherHRModifier(weather);
  const parkFactor = {
    ...baseParkFactor,
    hrFactor: baseParkFactor.hrFactor * weatherHRMod,
  };

  // Generate umpire (deterministic from seed, no PRNG consumption)
  const umpire = generateUmpire(input.seed);

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

  // Pick starters using rotation index (with rest awareness)
  let homeSP = pickStarter(
    input.players, input.homeTeam.teamId, input.homeTeam.rotationIndex,
    input.gameIndex, input.pitcherRestMap,
  );
  let awaySP = pickStarter(
    input.players, input.awayTeam.teamId, input.awayTeam.rotationIndex,
    input.gameIndex, input.pitcherRestMap,
  );

  // Fallback: use a reliever as "spot starter" if no SP
  if (!homeSP) {
    homeSP = pickReliever(
      input.players, input.homeTeam.teamId, 0, new Set(), false,
      undefined, input.gameIndex, input.pitcherRestMap,
    );
  }
  if (!awaySP) {
    awaySP = pickReliever(
      input.players, input.awayTeam.teamId, 0, new Set(), false,
      undefined, input.gameIndex, input.pitcherRestMap,
    );
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

  // Fatigue carry-over: pitchers on short rest start with elevated effective pitch count
  const homeFatigueCarry = input.pitcherRestMap && input.gameIndex != null
    ? Math.round(getFatigueModifier(homeSP, input.gameIndex, input.pitcherRestMap) * 150)
    : 0;
  const awayFatigueCarry = input.pitcherRestMap && input.gameIndex != null
    ? Math.round(getFatigueModifier(awaySP, input.gameIndex, input.pitcherRestMap) * 150)
    : 0;
  const homePitchCount = { value: homeFatigueCarry };
  const awayPitchCount = { value: awayFatigueCarry };
  const homeTimesThrough = { value: 1 };
  const awayTimesThrough = { value: 1 };
  const homeMomentum = { value: initialMomentum() };
  const awayMomentum = { value: initialMomentum() };

  let homeLineupPos = 0;
  let awayLineupPos = 0;

  // Team chemistry: derived from win/loss record, affects defense
  const homeChemMod = getTeamChemistryModifier(
    input.teamWins?.get(input.homeTeam.teamId) ?? 0,
    input.teamLosses?.get(input.homeTeam.teamId) ?? 0,
  );
  const awayChemMod = getTeamChemistryModifier(
    input.teamWins?.get(input.awayTeam.teamId) ?? 0,
    input.teamLosses?.get(input.awayTeam.teamId) ?? 0,
  );

  const homeDefPlayers = input.players
    .filter(p => p.teamId === input.homeTeam.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher)
    .slice(0, 9);
  const homeDefRating = homeDefPlayers
    .reduce((sum, p) => sum + (p.hitterAttributes?.fielding ?? 350), 0) / 9
    + chemistryDefenseAdjustment(homeChemMod)
    + getHomeFieldAdvantage().defenseBonus // Home team defense boost
    + getOutfieldArmBonus(input.players, input.homeTeam.teamId);
  const homeAvgDefIQ = homeDefPlayers
    .reduce((sum, p) => sum + (p.hitterAttributes?.defensiveIQ ?? 400), 0) / Math.max(1, homeDefPlayers.length);

  const awayDefPlayers = input.players
    .filter(p => p.teamId === input.awayTeam.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE' && !p.isPitcher)
    .slice(0, 9);
  const awayDefRating = awayDefPlayers
    .reduce((sum, p) => sum + (p.hitterAttributes?.fielding ?? 350), 0) / 9
    + chemistryDefenseAdjustment(awayChemMod)
    + getOutfieldArmBonus(input.players, input.awayTeam.teamId);
  const awayAvgDefIQ = awayDefPlayers
    .reduce((sum, p) => sum + (p.hitterAttributes?.defensiveIQ ?? 400), 0) / Math.max(1, awayDefPlayers.length);

  const MAX_INNINGS = 25;
  const playLog: PlayEvent[] | undefined = input.recordPlayLog ? [] : undefined;
  let lastHomeScoreBeforeBottom = 0;

  // Line score: runs per inning for each team
  const awayLineScore: number[] = [];
  const homeLineScore: number[] = [];

  // Track relievers' entry leads for blown save detection
  const homeRelieverEntryLeads = new Map<number, number>();
  const awayRelieverEntryLeads = new Map<number, number>();

  for (let inning = 1; inning <= MAX_INNINGS; inning++) {
    // ── TOP of inning (away bats) ──────────────────────────────────────────
    const topManned = shouldUseMannedRunner({ ...ctx, inning, isTop: true });
    const topDefBonus = getLateGameDefenseBonus(inning, ctx.homeScore - ctx.awayScore, homeAvgDefIQ);
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
      homeDefRating + topDefBonus,
      topManned,
      input.players,
      input.homeTeam.teamId,
      awayBench,
      homeMomentum,
      umpire,
      input.hitterStreaks,
      playLog,
    );
    ctx = { ...ctx, awayScore: ctx.awayScore + awayRuns, inning, outs: 0, runners: 0 };
    awayLineScore.push(awayRuns);

    // Reset home pitcher momentum between innings
    homeMomentum.value = resetInningMomentum(homeMomentum.value);

    // Defensive substitution: home team fields during top half
    const homeDefSub = selectDefensiveSub(
      homeLineup, homeBench, inning, ctx.homeScore - ctx.awayScore,
    );
    if (homeDefSub) {
      homeLineup[homeDefSub.lineupSlot] = homeDefSub.replacement;
      const idx = homeBench.indexOf(homeDefSub.replacement);
      if (idx >= 0) homeBench.splice(idx, 1);
    }

    // Pitcher management: pull home starter? (home team pitches in top half)
    const homeSave = isSaveSituation(inning, ctx.homeScore, ctx.awayScore);
    const prevHomePitcher = homePitcher;
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
      homeRelieverEntryLeads,
      ctx.homeScore - ctx.awayScore,
      input.gameIndex,
      input.pitcherRestMap,
    );
    // New pitcher starts with fresh momentum
    if (homePitcher !== prevHomePitcher) {
      homeMomentum.value = initialMomentum();
    }

    // ── Skip bottom half if home already leads in 9th+ ──────────────────
    if (inning >= 9 && ctx.homeScore > ctx.awayScore) break;

    // ── BOTTOM of inning (home bats) ───────────────────────────────────────
    lastHomeScoreBeforeBottom = ctx.homeScore;
    const bottomManned = shouldUseMannedRunner({ ...ctx, inning, isTop: false });
    const botDefBonus = getLateGameDefenseBonus(inning, ctx.awayScore - ctx.homeScore, awayAvgDefIQ);
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
      awayDefRating + botDefBonus,
      bottomManned,
      input.players,
      input.awayTeam.teamId,
      homeBench,
      awayMomentum,
      umpire,
      input.hitterStreaks,
      playLog,
    );
    ctx = { ...ctx, homeScore: ctx.homeScore + homeRuns, outs: 0, runners: 0 };
    homeLineScore.push(homeRuns);

    // Reset away pitcher momentum between innings
    awayMomentum.value = resetInningMomentum(awayMomentum.value);

    // Defensive substitution: away team fields during bottom half
    const awayDefSub = selectDefensiveSub(
      awayLineup, awayBench, inning, ctx.awayScore - ctx.homeScore,
    );
    if (awayDefSub) {
      awayLineup[awayDefSub.lineupSlot] = awayDefSub.replacement;
      const idx = awayBench.indexOf(awayDefSub.replacement);
      if (idx >= 0) awayBench.splice(idx, 1);
    }

    // Pitcher management: pull away starter? (away team pitches in bottom half)
    const awaySave = isSaveSituation(inning, ctx.awayScore, ctx.homeScore);
    const prevAwayPitcher = awayPitcher;
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
      awayRelieverEntryLeads,
      ctx.awayScore - ctx.homeScore,
      input.gameIndex,
      input.pitcherRestMap,
    );
    // New pitcher starts with fresh momentum
    if (awayPitcher !== prevAwayPitcher) {
      awayMomentum.value = initialMomentum();
    }

    // ── Game over? ─────────────────────────────────────────────────────────
    if (inning >= 9 && ctx.homeScore !== ctx.awayScore) {
      ctx = { ...ctx, inning };
      break;
    }
    if (inning >= MAX_INNINGS) {
      ctx = { ...ctx, inning };
      break;
    }
  }

  // Assign decisions (W/L/S/H/BS)
  assignPitcherDecisions(
    homePitcherStats, awayPitcherStats,
    ctx.homeScore, ctx.awayScore,
    homeRelieverEntryLeads, awayRelieverEntryLeads,
  );

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

  const finalInnings = ctx.inning || 9;
  const boxScore: BoxScore = {
    gameId: input.gameId,
    season: input.season,
    date: input.date,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    innings: finalInnings,
    lineScore: { away: awayLineScore, home: homeLineScore },
    homeBatting: Array.from(homeBatterStats.values()),
    awayBatting: Array.from(awayBatterStats.values()),
    homePitching: Array.from(homePitcherStats.values()),
    awayPitching: Array.from(awayPitcherStats.values()),
    playLog,
    weather: { temperature: weather.temperature, windDirection: weather.windDirection, windSpeed: weather.windSpeed },
  };

  // Record pitcher appearances for rest tracking
  if (input.pitcherRestMap && input.gameIndex !== undefined) {
    for (const pg of boxScore.homePitching) {
      const isStart = pg.playerId === homeSP.playerId;
      recordAppearance(input.pitcherRestMap, pg.playerId, input.gameIndex, pg.pitchCount, isStart);
    }
    for (const pg of boxScore.awayPitching) {
      const isStart = pg.playerId === awaySP.playerId;
      recordAppearance(input.pitcherRestMap, pg.playerId, input.gameIndex, pg.pitchCount, isStart);
    }
  }

  // Walk-off: home team wins AND took the lead in the bottom of the final inning
  const isWalkOff = ctx.homeScore > ctx.awayScore
    && lastHomeScoreBeforeBottom <= ctx.awayScore;

  return {
    gameId: input.gameId,
    homeTeamId: input.homeTeam.teamId,
    awayTeamId: input.awayTeam.teamId,
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    innings: finalInnings,
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
  relieverEntryLeads?: Map<number, number>,
  currentLead?: number,
  gameIndex?: number,
  restMap?: PitcherRestMap,
): Player {
  const pc = pitchCountRef.value;

  // Stamina-gated inning cap
  const staminaAttr = currentPitcher.pitcherAttributes?.stamina ?? 350;
  const maxSPInnings = staminaAttr < 320 ? 5 : staminaAttr < 470 ? 6 : 7;

  // Pitch limit: secondary gate
  const pitchLimit = Math.round(55 + staminaAttr / 14);

  // Times through order: only pull on 4th+ TTO (very rare — 27+ batters faced)
  // This prevents "going around again" in games where starters go deep
  const tto = timesThroughRef.value;

  const shouldPull =
    pc > pitchLimit ||
    (currentPitcher.position === 'SP' && inning >= maxSPInnings) ||
    (currentPitcher.position === 'SP' && tto >= 4) ||
    (currentPitcher.position !== 'SP' && inning >= 8);

  if (!shouldPull) return currentPitcher;

  // Determine optimal reliever hand based on upcoming batters
  const preferredHand = opposingLineup && lineupPos !== undefined
    ? getPreferredBullpenHand(opposingLineup, lineupPos)
    : undefined;

  // Pull and bring in reliever (with rest awareness)
  // Use closer in save situations (9th+) or high-leverage 8th-inning spots
  const li = leverageIndex(
    currentLead ?? 0, inning, false, 0, 0,
  );
  const wantCloser = saveSituation && inning >= 9
    || (inning >= 8 && (currentLead ?? 0) > 0 && (currentLead ?? 0) <= 2 && li >= 1.5);
  const counter = (bullpenOffset + usedIds.size) % 100;
  const next = pickReliever(
    players, teamId, counter, usedIds, wantCloser, preferredHand,
    gameIndex, restMap,
  );
  if (!next) return currentPitcher;

  usedIds.add(next.playerId);
  pitchCountRef.value = 0;
  timesThroughRef.value = 1;

  // Track lead at entry for blown save detection
  if (relieverEntryLeads && currentLead !== undefined && saveSituation) {
    relieverEntryLeads.set(next.playerId, currentLead);
  }

  void gen;
  return next;
}

// ─── Pitcher decision assignment ──────────────────────────────────────────────

function assignPitcherDecisions(
  homePitcherStats: Map<number, PitcherGameStats>,
  awayPitcherStats: Map<number, PitcherGameStats>,
  homeScore: number,
  awayScore: number,
  homeRelieverEntryLeads: Map<number, number>,
  awayRelieverEntryLeads: Map<number, number>,
): void {
  if (homeScore === awayScore) return; // Tie game — shouldn't happen but be safe

  const winnerStats = homeScore > awayScore ? homePitcherStats : awayPitcherStats;
  const loserStats  = homeScore > awayScore ? awayPitcherStats : homePitcherStats;
  const loserEntryLeads = homeScore > awayScore ? awayRelieverEntryLeads : homeRelieverEntryLeads;
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

  // Blown save: a reliever on the LOSING team who entered in a save situation
  // (tracked by entryLeads) and allowed enough runs to lose the lead.
  // BS is assigned when: runs allowed >= entry lead (they surrendered the lead).
  for (const [pitcherId, entryLead] of loserEntryLeads) {
    const stats = loserStats.get(pitcherId);
    if (!stats) continue;
    if (stats.r >= entryLead) {
      stats.decision = 'BS';
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
