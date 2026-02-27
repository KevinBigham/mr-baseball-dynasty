import type { RandomGenerator } from 'pure-rand';
import type { Player, HitterAttributes, PitcherAttributes } from '../../types/player';
import type { PAOutcome, PAResult } from '../../types/game';
import { nextFloat } from '../math/prng';
import { log5MultiOutcome, weightedRates, PITCHER_WEIGHTS, squashModifier, sampleOutcome } from '../math/log5';
import { LEAGUE_RATES } from '../../data/positionalPriors';
import type { ParkFactor } from '../../data/parkFactors';

// ─── Inputs to a single plate appearance ──────────────────────────────────────
export interface PAInput {
  batter: Player;
  pitcher: Player;
  runners: number;      // bitmask
  outs: number;
  pitchCount: number;   // pitcher's pitch count this game
  timesThrough: number; // 1, 2, or 3+ (for TTO penalty)
  parkFactor: ParkFactor;
  defenseRating: number; // 0–550 team defense quality
}

// ─── Modifier computation ─────────────────────────────────────────────────────

function computeTTO(attrs: PitcherAttributes, timesThrough: number): number {
  const rawTTO = [0, 0.026, 0.066][Math.min(timesThrough - 1, 2)] ?? 0;
  const arsenalFactor = 0.80 - attrs.pitchArsenalCount * 0.10;
  return rawTTO * arsenalFactor;
}

function computeFatigue(attrs: PitcherAttributes, pitchCount: number): number {
  const inningsEquiv = pitchCount / 15;
  const veloLoss = inningsEquiv * 0.28;
  const fbStress = 1.0 + (attrs.pitchTypeMix.fastball - 0.50) * 0.3;
  const adjustedVeloLoss = veloLoss * fbStress;

  if (adjustedVeloLoss < 1.0) return adjustedVeloLoss * 0.03;
  if (adjustedVeloLoss < 2.0) return 0.03 + (adjustedVeloLoss - 1.0) * 0.06;
  return 0.09 + (adjustedVeloLoss - 2.0) * 0.10;
}

function computePlatoon(batter: Player, pitcher: Player): number {
  const batS = batter.hitterAttributes?.platoonSensitivity ?? 0;
  const pitchT = pitcher.pitcherAttributes?.platoonTendency ?? 0;
  const isAdvantage = batter.bats !== pitcher.throws && batter.bats !== 'S';
  const baseEffect = isAdvantage ? 0.025 : -0.025;
  // Apply both batter sensitivity and pitcher tendency
  return baseEffect * Math.abs(batS) + pitchT * 0.01;
}

// Combine modifiers multiplicatively, then squash
function combinedModifier(fatigue: number, tto: number, platoon: number): number {
  const raw = (1 + fatigue) * (1 + tto) * (1 + platoon) - 1;
  return squashModifier(raw, 0.40);
}

// ─── Convert attributes to rates for Log5 ────────────────────────────────────

function hitterToRates(h: HitterAttributes): {
  kRate: number; bbRate: number; hrRate: number; hbpRate: number; babip: number;
  gbPercent: number; fbPercent: number;
} {
  // Scale 0–550 attributes to rates. League average (400) → league rate.
  const contactFactor = h.contact / 400;
  const powerFactor   = h.power   / 400;
  const eyeFactor     = h.eye     / 400;

  return {
    kRate:     Math.max(0.05, LEAGUE_RATES.kRate    * (2 - contactFactor)),
    bbRate:    Math.max(0.03, LEAGUE_RATES.bbRate   * eyeFactor),
    // exponent=1.8: balanced HR sensitivity — enough 40HR seasons (gate ≥ 2) while
    // controlling ERA tail; at avg power (400) = league rate, at 500 = +48% vs +56% with 2.0
    hrRate:    Math.max(0.005, LEAGUE_RATES.hrRate  * Math.pow(powerFactor, 1.8)),
    hbpRate:   LEAGUE_RATES.hbpRate, // not player-specific yet
    babip:     Math.max(0.22, Math.min(0.38, LEAGUE_RATES.babip * (0.85 + 0.15 * contactFactor))),
    gbPercent: Math.max(0.30, Math.min(0.65, 0.45 - (h.power - 400) * 0.0002)),
    fbPercent: Math.max(0.25, Math.min(0.55, 0.35 + (h.power - 400) * 0.0002)),
  };
}

function pitcherToRates(p: PitcherAttributes): {
  kRate: number; bbRate: number; hrRate: number; hbpRate: number;
  gbPercent: number;
} {
  const stuffFactor   = p.stuff   / 400;
  const commandFactor = p.command / 400;

  return {
    // exponent=1.3: elite stuff generates 200+K seasons (gate ≥ 15); avg pitchers unchanged
    // since 1.0^1.3=1.0; at stuffFactor=1.30→kRate≈0.316, producing realistic K distributions
    kRate:     Math.min(0.38, Math.max(0.08, LEAGUE_RATES.pitcherKRate * Math.pow(stuffFactor, 1.3))),
    bbRate:    Math.max(0.03, LEAGUE_RATES.pitcherBBRate * (2 - commandFactor)),
    hrRate:    Math.max(0.01, LEAGUE_RATES.pitcherHRRate * (2 - stuffFactor) * (2 - commandFactor)),
    hbpRate:   LEAGUE_RATES.hbpRate * (2 - commandFactor * 0.5),
    gbPercent: p.gbFbTendency / 100,
  };
}

// ─── STAGE 1: Non-contact gate ────────────────────────────────────────────────
// Outcomes: BB | HBP | K | HR | BallInPlay

function stage1(
  gen: RandomGenerator,
  hRates: ReturnType<typeof hitterToRates>,
  pRates: ReturnType<typeof pitcherToRates>,
  modifier: number,
  parkFactor: ParkFactor,
): [string, RandomGenerator] {
  // Apply asymmetric pitcher/batter weights
  const kBlend   = weightedRates(hRates.kRate,   pRates.kRate,   LEAGUE_RATES.kRate,         PITCHER_WEIGHTS.strikeout);
  const bbBlend  = weightedRates(hRates.bbRate,  pRates.bbRate,  LEAGUE_RATES.bbRate,         PITCHER_WEIGHTS.walk);
  const hrBlend  = weightedRates(hRates.hrRate,  pRates.hrRate,  LEAGUE_RATES.hrRate,         PITCHER_WEIGHTS.homeRun);
  const hbpBlend = weightedRates(hRates.hbpRate, pRates.hbpRate, LEAGUE_RATES.hbpRate,        PITCHER_WEIGHTS.hitByPitch);

  // Park factor adjusts HR rate
  const hrParkAdj = LEAGUE_RATES.hrRate * parkFactor.hrFactor;

  const probs = log5MultiOutcome([
    { name: 'K',   batterRate: kBlend.effectiveBatter,   pitcherRate: kBlend.effectivePitcher,   leagueRate: LEAGUE_RATES.kRate },
    { name: 'BB',  batterRate: bbBlend.effectiveBatter,  pitcherRate: bbBlend.effectivePitcher,  leagueRate: LEAGUE_RATES.bbRate },
    { name: 'HBP', batterRate: hbpBlend.effectiveBatter, pitcherRate: hbpBlend.effectivePitcher, leagueRate: LEAGUE_RATES.hbpRate },
    { name: 'HR',  batterRate: hrBlend.effectiveBatter,  pitcherRate: hrBlend.effectivePitcher,  leagueRate: hrParkAdj },
    { name: 'BIP', batterRate: 1 - hRates.kRate - hRates.bbRate - hRates.hrRate - hRates.hbpRate,
                   pitcherRate: 1 - pRates.kRate - pRates.bbRate - pRates.hrRate - pRates.hbpRate,
                   leagueRate: 1 - LEAGUE_RATES.kRate - LEAGUE_RATES.bbRate - LEAGUE_RATES.hrRate - LEAGUE_RATES.hbpRate },
  ]);

  // Apply combined modifier to pitcher-dominated outcomes
  const adjustedProbs = { ...probs };
  if (modifier !== 0) {
    // Modifier hurts pitcher (positive = pitcher worse)
    adjustedProbs['K']   = Math.max(0.001, probs['K']!   * (1 - modifier));
    adjustedProbs['BB']  = Math.min(0.30,  probs['BB']!  * (1 + modifier));
    adjustedProbs['HR']  = Math.min(0.15,  probs['HR']!  * (1 + modifier * 0.7));
    // Re-normalize BIP
    const nonBip = adjustedProbs['K']! + adjustedProbs['BB']! + adjustedProbs['HBP']! + adjustedProbs['HR']!;
    adjustedProbs['BIP'] = Math.max(0.01, 1 - nonBip);
  }

  let roll: number;
  [roll, gen] = nextFloat(gen);
  const result = sampleOutcome(roll, Object.entries(adjustedProbs).map(([name, prob]) => ({ name, prob })));
  return [result, gen];
}

// ─── STAGE 2: Batted ball type ────────────────────────────────────────────────
// Outcomes: GB | FB | LD | PU

function stage2(
  gen: RandomGenerator,
  hRates: ReturnType<typeof hitterToRates>,
  pRates: ReturnType<typeof pitcherToRates>,
): [string, RandomGenerator] {
  // GB/FB interaction: if pitcher is GB-heavy and batter is FB-heavy, more groundouts
  const pitcherGB = pRates.gbPercent;
  const batterFB  = hRates.fbPercent;
  const gbFbDelta = Math.abs(pitcherGB - batterFB);
  const interactionMod = gbFbDelta * 0.003;

  // Blend pitcher and batter GB tendencies
  const blendedGB = (pitcherGB * 0.55 + hRates.gbPercent * 0.45);
  const baseLD = 0.20;

  let gbProb = blendedGB;
  let fbProb = 1 - blendedGB - baseLD - 0.08; // 0.08 = PU rate

  // Apply interaction modifier
  if (pitcherGB > 0.50 && batterFB > 0.40) {
    gbProb *= (1 + interactionMod);
    fbProb *= (1 - interactionMod);
  }

  const outcomes = [
    { name: 'GB', prob: Math.max(0.25, gbProb) },
    { name: 'FB', prob: Math.max(0.20, fbProb) },
    { name: 'LD', prob: baseLD },
    { name: 'PU', prob: 0.08 },
  ];

  let roll: number;
  [roll, gen] = nextFloat(gen);
  return [sampleOutcome(roll, outcomes), gen];
}

// ─── STAGE 3: Hit/out resolution ──────────────────────────────────────────────
// Returns the final PAOutcome given batted ball type

function stage3(
  gen: RandomGenerator,
  battedBall: string,
  hRates: ReturnType<typeof hitterToRates>,
  defenseRating: number,
  parkFactor: ParkFactor,
  runners: number,
  outs: number,
): [PAOutcome, RandomGenerator] {
  // Defense modifier: average (400) = neutral; better defense lowers BABIP
  const defMod = (defenseRating - 400) / 550 * 0.03;
  const parkBabipMod = parkFactor.babipFactor - 1.0;

  const effectiveBabip = Math.max(0.15, Math.min(0.45,
    hRates.babip - defMod + parkBabipMod,
  ));

  let roll: number;
  [roll, gen] = nextFloat(gen);

  switch (battedBall) {
    case 'LD': {
      // Line drives: high BABIP (~0.68)
      const ldBabip = 0.68 + parkBabipMod;
      if (roll < ldBabip) {
        // Hit — determine type
        let hitRoll: number;
        [hitRoll, gen] = nextFloat(gen);
        const xbhBonus = parkFactor.doubleFactor - 1.0;
        // LDs: ~75% singles, ~22% doubles, ~3% triples
        if (hitRoll < 0.03 + parkFactor.tripleFactor * 0.01) return ['3B', gen];
        if (hitRoll < 0.25 + xbhBonus * 0.2)                 return ['2B', gen];
        return ['1B', gen];
      }
      return ['LD_OUT', gen];
    }

    case 'GB': {
      if (roll < effectiveBabip * 0.85) { // GBs have slightly lower BABIP than average
        return ['1B', gen];
      }
      // Out — possible GDP?
      const runnerOn1st = (runners & 0b001) !== 0;
      if (runnerOn1st && outs < 2) {
        let dpRoll: number;
        [dpRoll, gen] = nextFloat(gen);
        if (dpRoll < 0.42) return ['GDP', gen]; // ~42% of GB with runner on 1st + <2 outs = DP
      }
      return ['GB_OUT', gen];
    }

    case 'FB': {
      if (roll < effectiveBabip * 0.75) { // FBs have lower BABIP
        // Hit — mostly extra base hits
        let hitRoll: number;
        [hitRoll, gen] = nextFloat(gen);
        const xbhBonus = parkFactor.doubleFactor - 1.0;
        if (hitRoll < 0.05 + parkFactor.tripleFactor * 0.015) return ['3B', gen];
        if (hitRoll < 0.45 + xbhBonus * 0.25)                 return ['2B', gen];
        return ['1B', gen];
      }
      // Out — possible sac fly?
      const runnerOn3rd = (runners & 0b100) !== 0;
      if (runnerOn3rd && outs < 2) {
        let sfRoll: number;
        [sfRoll, gen] = nextFloat(gen);
        if (sfRoll < 0.18) return ['SF', gen];
      }
      return ['FB_OUT', gen];
    }

    case 'PU': {
      // Popup: almost always out, very rarely hit
      if (roll < 0.02) return ['1B', gen];
      return ['PU_OUT', gen];
    }

    default:
      return ['GB_OUT', gen];
  }
}

// ─── Main plate appearance resolver ──────────────────────────────────────────
export function resolvePlateAppearance(
  gen: RandomGenerator,
  input: PAInput,
): [PAResult, RandomGenerator] {
  const h = input.batter.hitterAttributes;
  const p = input.pitcher.pitcherAttributes;

  if (!h || !p) {
    // Fallback for pitcher batting (NL scenarios)
    const fallbackResult: PAResult = { outcome: 'K', runsScored: 0, runnersAdvanced: 0 };
    return [fallbackResult, gen];
  }

  const hRates = hitterToRates(h);
  const pRates = pitcherToRates(p);

  // Compute combined modifier (fatigue + TTO + platoon)
  const fatigue = computeFatigue(p, input.pitchCount);
  const tto     = computeTTO(p, input.timesThrough);
  const platoon  = computePlatoon(input.batter, input.pitcher);
  const modifier = combinedModifier(fatigue, tto, platoon);

  // Stage 1: Non-contact gate
  let stage1Result: string;
  [stage1Result, gen] = stage1(gen, hRates, pRates, modifier, input.parkFactor);

  if (stage1Result !== 'BIP') {
    const outcome = stage1Result as PAOutcome;
    return [{ outcome, runsScored: 0, runnersAdvanced: 0 }, gen];
  }

  // Stage 2: Batted ball type
  let battedBall: string;
  [battedBall, gen] = stage2(gen, hRates, pRates);

  // Stage 3: Hit/out resolution
  let finalOutcome: PAOutcome;
  [finalOutcome, gen] = stage3(
    gen,
    battedBall,
    hRates,
    input.defenseRating,
    input.parkFactor,
    input.runners,
    input.outs,
  );

  return [{ outcome: finalOutcome, runsScored: 0, runnersAdvanced: 0 }, gen];
}
