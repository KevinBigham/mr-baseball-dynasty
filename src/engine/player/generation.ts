import type { RandomGenerator } from 'pure-rand';
import type { Player, Position, BatSide, ThrowSide, HitterAttributes, PitcherAttributes } from '../../types/player';
import { computeHitterOverall, computePitcherOverall, blankHitterAttributes, blankPitcherAttributes } from './attributes';
import { POSITIONAL_HITTER_PRIORS, POSITIONAL_PITCHER_PRIORS } from '../../data/positionalPriors';
import { NAME_POOLS, NATIONALITY_WEIGHTS, type Nationality } from '../../data/nameDatabase';
import { nextFloat, nextInt, nextRange, clampedGaussian, gaussian, weightedPick } from '../math/prng';

let _nextPlayerId = 1;
export function resetPlayerIdCounter(start = 1): void { _nextPlayerId = start; }

// ─── Roster levels ─────────────────────────────────────────────────────────────
// Mirrors WhatIfSports Hardball Dynasty depth: MLB + 5 minors + INTL

type RosterLevel = 'MLB' | 'AAA' | 'AA' | 'APLUS' | 'AMINUS' | 'ROOKIE' | 'INTL';

interface LevelConfig {
  mult:    number;  // Quality multiplier vs MLB baseline
  sigma:   number;  // Development sigma (0-550 scale; higher = more variance)
  sigmaAttr: number; // Attribute generation sigma
  ageMin:  number;
  ageMax:  number;
  ageMean: number;
  ageSd:   number;
  status:  import('../../types/player').RosterStatus;
  on40Man: boolean;
  phase:   string;  // Default development phase
}

const LEVEL_CONFIG: Record<RosterLevel, LevelConfig> = {
  MLB:    { mult: 1.00, sigma: 8,  sigmaAttr: 55, ageMin: 22, ageMax: 40, ageMean: 27.5, ageSd: 3.5, status: 'MLB_ACTIVE',    on40Man: true,  phase: 'prime'  },
  AAA:    { mult: 0.78, sigma: 15, sigmaAttr: 50, ageMin: 20, ageMax: 30, ageMean: 24.0, ageSd: 2.0, status: 'MINORS_AAA',   on40Man: false, phase: 'ascent' },
  AA:     { mult: 0.68, sigma: 20, sigmaAttr: 50, ageMin: 19, ageMax: 27, ageMean: 22.5, ageSd: 1.8, status: 'MINORS_AA',    on40Man: false, phase: 'ascent' },
  APLUS:  { mult: 0.58, sigma: 22, sigmaAttr: 52, ageMin: 18, ageMax: 25, ageMean: 21.5, ageSd: 1.5, status: 'MINORS_APLUS', on40Man: false, phase: 'ascent' },
  AMINUS: { mult: 0.48, sigma: 25, sigmaAttr: 55, ageMin: 18, ageMax: 24, ageMean: 20.5, ageSd: 1.5, status: 'MINORS_AMINUS',on40Man: false, phase: 'prospect'},
  ROOKIE: { mult: 0.40, sigma: 28, sigmaAttr: 60, ageMin: 18, ageMax: 23, ageMean: 20.0, ageSd: 1.2, status: 'MINORS_ROOKIE',on40Man: false, phase: 'prospect'},
  INTL:   { mult: 0.30, sigma: 32, sigmaAttr: 55, ageMin: 16, ageMax: 17, ageMean: 16.5, ageSd: 0.5, status: 'MINORS_INTL', on40Man: false, phase: 'prospect'},
};

// ─── Position pools per level ─────────────────────────────────────────────────
// Based on Hardball Dynasty roster construction patterns

// MLB 26-man: 13 hitters + 13 pitchers
const MLB_HITTERS: Position[] = [
  'C', 'C',
  '1B', '1B',
  '2B', '2B',
  '3B', '3B',
  'SS', 'SS',
  'LF', 'LF', 'LF',
  'CF', 'CF', 'CF',
  'RF', 'RF', 'RF',
  'DH',
];
const MLB_SP_COUNT = 5;
const MLB_RP_COUNT = 7;
const MLB_CL_COUNT = 1;

// AAA: 20 players — 9 hitters + 5 SP + 4 RP + 1 CL + 1 extra RP
const AAA_HITTERS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const AAA_SP = 5; const AAA_RP = 4; const AAA_CL = 1;

// AA: 20 players — 9 hitters + 5 SP + 4 RP + 1 CL + 1 extra RP
const AA_HITTERS: Position[]  = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const AA_SP = 5;  const AA_RP  = 4; const AA_CL  = 1;

// A+: 18 players — 9 hitters + 5 SP + 3 RP + 1 CL
const APLUS_HITTERS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const APLUS_SP = 5; const APLUS_RP = 3; const APLUS_CL = 0; // No dedicated CL at A+

// A-: 16 players — 8 hitters + 4 SP + 3 RP + 1 spot
const AMINUS_HITTERS: Position[] = ['C', 'SS', '2B', '3B', 'CF', 'LF', 'RF', '1B'];
const AMINUS_SP = 4; const AMINUS_RP = 3; const AMINUS_CL = 0;

// Rookie: 14 players — 7 hitters + 4 SP + 3 RP
const ROOKIE_HITTERS: Position[] = ['C', 'SS', '2B', '3B', 'CF', 'LF', 'RF'];
const ROOKIE_SP = 4; const ROOKIE_RP = 3; const ROOKIE_CL = 0;

// INTL (DSL/FCL): 10 players — 7 hitters + 2 SP + 1 RP (ages 16–17)
const INTL_HITTERS: Position[] = ['C', 'SS', '2B', '3B', 'CF', 'LF', 'RF'];
const INTL_SP = 2; const INTL_RP = 1; const INTL_CL = 0;

// ─── Name generation ──────────────────────────────────────────────────────────
function generateName(gen: RandomGenerator, nationality: Nationality): [string, RandomGenerator] {
  const pool = NAME_POOLS[nationality];
  let fi: number, li: number;
  [fi, gen] = nextInt(gen, 0, pool.first.length - 1);
  [li, gen] = nextInt(gen, 0, pool.last.length - 1);
  return [`${pool.first[fi]} ${pool.last[li]}`, gen];
}

// ─── Handedness ───────────────────────────────────────────────────────────────
function generateBatSide(gen: RandomGenerator): [BatSide, RandomGenerator] {
  let roll: number;
  [roll, gen] = nextFloat(gen);
  const side: BatSide = roll < 0.68 ? 'R' : roll < 0.98 ? 'L' : 'S';
  return [side, gen];
}

function generateThrowSide(gen: RandomGenerator, pos: Position): [ThrowSide, RandomGenerator] {
  if (pos === 'C') return ['R', gen];
  const isPitcher = pos === 'SP' || pos === 'RP' || pos === 'CL';
  let roll: number;
  [roll, gen] = nextFloat(gen);
  const lhProb = isPitcher ? 0.30 : 0.10;
  return [roll < lhProb ? 'L' : 'R', gen];
}

// ─── Age generation ────────────────────────────────────────────────────────────
function generateAge(gen: RandomGenerator, cfg: LevelConfig): [number, RandomGenerator] {
  let age: number;
  [age, gen] = clampedGaussian(gen, cfg.ageMean, cfg.ageSd, cfg.ageMin, cfg.ageMax);
  return [Math.round(age), gen];
}

// ─── Hitter attribute generation ─────────────────────────────────────────────
function generateHitterAttributes(
  gen: RandomGenerator,
  pos: Position,
  cfg: LevelConfig,
  age: number,
  teamQualityOffset = 0,
): [HitterAttributes, RandomGenerator] {
  const prior    = POSITIONAL_HITTER_PRIORS[pos];
  const levelMult = cfg.mult;
  const sigma    = cfg.sigmaAttr;

  const attrs = blankHitterAttributes();
  const agePeakDist = Math.abs(age - 28);
  const agePenalty  = agePeakDist > 5 ? (agePeakDist - 5) * 5 : 0;

  for (const key of ['contact', 'power', 'eye', 'speed', 'fielding', 'armStrength', 'durability', 'baserunningIQ'] as const) {
    const priorVal = (prior as unknown as Record<string, number>)[key] ?? 350;
    let val: number;
    [val, gen] = clampedGaussian(
      gen,
      priorVal * levelMult - agePenalty + teamQualityOffset,
      sigma,
      50,
      550,
    );
    attrs[key] = val;
  }

  let platoon: number;
  [platoon, gen] = gaussian(gen, 0, 0.35);
  attrs.platoonSensitivity = Math.max(-1, Math.min(1, platoon));

  let oiq: number, diq: number, we: number, mt: number;
  [oiq, gen] = clampedGaussian(gen, prior.contact * levelMult * 0.9, 40, 100, 550);
  [diq, gen] = clampedGaussian(gen, prior.fielding * levelMult * 0.9, 40, 100, 550);
  [we,  gen] = clampedGaussian(gen, 60, 15, 10, 100);
  [mt,  gen] = clampedGaussian(gen, 55, 15, 10, 100);
  attrs.offensiveIQ   = oiq;
  attrs.defensiveIQ   = diq;
  attrs.workEthic     = we;
  attrs.mentalToughness = mt;

  return [attrs, gen];
}

// ─── Pitcher attribute generation ────────────────────────────────────────────
function generatePitcherAttributes(
  gen: RandomGenerator,
  pos: 'SP' | 'RP' | 'CL',
  cfg: LevelConfig,
  age: number,
  teamQualityOffset = 0,
): [PitcherAttributes, RandomGenerator] {
  const prior    = POSITIONAL_PITCHER_PRIORS[pos];
  const levelMult = cfg.mult;
  const sigma    = cfg.sigmaAttr;

  const attrs = blankPitcherAttributes();
  const agePeakDist = Math.abs(age - 27);
  const agePenalty  = agePeakDist > 5 ? (agePeakDist - 5) * 5 : 0;

  for (const key of ['stuff', 'movement', 'command', 'stamina', 'holdRunners', 'durability', 'recoveryRate'] as const) {
    const priorVal = (prior as unknown as Record<string, number>)[key] ?? 350;
    let val: number;
    [val, gen] = clampedGaussian(gen, priorVal * levelMult - agePenalty + teamQualityOffset, sigma, 50, 550);
    attrs[key] = val;
  }

  let arsenalRoll: number;
  [arsenalRoll, gen] = nextFloat(gen);
  const arsenalBase = pos === 'SP' ? [3, 4, 4, 5, 5] : [2, 2, 3, 3, 4];
  attrs.pitchArsenalCount = arsenalBase[Math.floor(arsenalRoll * arsenalBase.length)];

  let gb: number;
  [gb, gen] = clampedGaussian(gen, prior.gbFbTendency, 15, 25, 75);
  attrs.gbFbTendency = gb;

  let platoon: number;
  [platoon, gen] = gaussian(gen, 0, pos === 'SP' ? 0.30 : 0.25);
  attrs.platoonTendency = Math.max(-1, Math.min(1, platoon));

  let fbPct: number, brkPct: number;
  [fbPct,  gen] = nextRange(gen, 0.40, 0.65);
  [brkPct, gen] = nextRange(gen, 0.20, 0.40);
  const offPct = Math.max(0.05, 1 - fbPct - brkPct);
  attrs.pitchTypeMix = { fastball: fbPct, breaking: brkPct, offspeed: offPct };

  let piq: number, we: number, mt: number;
  [piq, gen] = clampedGaussian(gen, prior.command * levelMult * 0.9, 40, 100, 550);
  [we,  gen] = clampedGaussian(gen, 60, 15, 10, 100);
  [mt,  gen] = clampedGaussian(gen, 55, 15, 10, 100);
  attrs.pitchingIQ      = piq;
  attrs.workEthic       = we;
  attrs.mentalToughness = mt;

  return [attrs, gen];
}

// ─── Roster data init ──────────────────────────────────────────────────────────
function initRosterData(
  cfg: LevelConfig,
  level: RosterLevel,
  age: number,
  season: number,
): import('../../types/player').PlayerRosterData {
  const serviceYears = level === 'MLB' ? Math.max(0, age - 22) : 0;
  const serviceTimeDays = Math.min(serviceYears * 172, 172 * 12);
  return {
    rosterStatus:               cfg.status,
    isOn40Man:                  cfg.on40Man,
    optionYearsRemaining:       level === 'MLB'
      ? Math.max(0, 3 - Math.floor(Math.max(0, age - 22) / 2))
      : 3,
    optionUsedThisSeason:       false,
    minorLeagueDaysThisSeason:  0,
    demotionsThisSeason:        0,
    serviceTimeDays,
    serviceTimeCurrentTeamDays: serviceTimeDays,
    dfaDate:                    undefined,
    rule5Selected:              false,
    rule5OriginalTeamId:        undefined,
    signedSeason:               season - Math.max(0, age - 20),
    signedAge:                  Math.max(16, age - Math.max(0, age - 20)),
    contractYearsRemaining:     level === 'MLB' ? Math.max(1, 3) : 0,
    salary:                     level === 'MLB' ? Math.max(720_000, serviceTimeDays * 2000) : 0,
    arbitrationEligible:        serviceTimeDays >= 3 * 172,
    freeAgentEligible:          serviceTimeDays >= 6 * 172,
    hasTenAndFive:              serviceTimeDays >= 10 * 172,
  };
}

// ─── Generate single player ────────────────────────────────────────────────────
function generatePlayer(
  gen: RandomGenerator,
  teamId: number,
  pos: Position,
  level: RosterLevel,
  season: number,
  teamQualityOffset = 0,
): [Player, RandomGenerator] {
  const id  = _nextPlayerId++;
  const cfg = LEVEL_CONFIG[level];

  // For INTL, bias toward Latin/Asian nationalities
  let nationality: Nationality;
  if (level === 'INTL') {
    const intlWeights = [
      { weight: 0.65, value: 'latin'    as Nationality },
      { weight: 0.25, value: 'asian'    as Nationality },
      { weight: 0.10, value: 'american' as Nationality },
    ];
    [nationality, gen] = weightedPick(gen, intlWeights);
  } else {
    [nationality, gen] = weightedPick(gen, NATIONALITY_WEIGHTS);
  }

  let name: string;
  [name, gen] = generateName(gen, nationality);

  let age: number;
  [age, gen] = generateAge(gen, cfg);

  const isPitcher = pos === 'SP' || pos === 'RP' || pos === 'CL';

  let throws: ThrowSide;
  [throws, gen] = generateThrowSide(gen, pos);

  let bats: BatSide;
  [bats, gen] = generateBatSide(gen);
  if (isPitcher && throws === 'L') {
    let roll: number;
    [roll, gen] = nextFloat(gen);
    bats = roll < 0.85 ? 'L' : bats;
  }

  let hitterAttributes:  HitterAttributes  | null = null;
  let pitcherAttributes: PitcherAttributes | null = null;
  let overall = 0;

  if (isPitcher) {
    const pitcherPos = pos as 'SP' | 'RP' | 'CL';
    [pitcherAttributes, gen] = generatePitcherAttributes(gen, pitcherPos, cfg, age, teamQualityOffset);
    overall = computePitcherOverall(pitcherAttributes, pitcherPos);
  } else {
    [hitterAttributes, gen] = generateHitterAttributes(gen, pos, cfg, age, teamQualityOffset);
    overall = computeHitterOverall(hitterAttributes, pos);
  }

  // Potential: young players have higher upside variance
  const youngBonus = Math.max(0, (25 - age) * 8);
  let potential: number;
  [potential, gen] = clampedGaussian(gen, overall + youngBonus + 20, 35, 0, 550);

  const rosterData = initRosterData(cfg, level, age, season);

  // Phase based on age and level
  const phase = age <= 17 ? 'prospect'
    : age <= 21 ? 'prospect'
    : age <= 26 ? 'ascent'
    : age <= 32 ? 'prime'
    : 'decline';

  const player: Player = {
    playerId:          id,
    teamId,
    name,
    age,
    position:          pos,
    bats,
    throws,
    nationality,
    isPitcher,
    hitterAttributes,
    pitcherAttributes,
    overall,
    potential,
    development: {
      theta:  0,
      sigma:  cfg.sigma, // now on 0-550 scale — σ=8 for vets, σ=32 for INTL
      phase:  phase as import('../../types/player').DevelopmentData['phase'],
    },
    rosterData,
  };

  return [player, gen];
}

// ─── Generate roster for one team ────────────────────────────────────────────
//
// Depth chart (WhatIfSports Hardball Dynasty baseline):
//   MLB:    26 active  (13 hitters + 5 SP + 7 RP + 1 CL)
//   AAA:    20 players ( 9 hitters + 5 SP + 4 RP + 1 CL + 1 RP)
//   AA:     20 players ( 9 hitters + 5 SP + 4 RP + 1 CL + 1 RP)
//   A+:     18 players ( 9 hitters + 5 SP + 3 RP)
//   A-:     16 players ( 8 hitters + 4 SP + 3 RP + 1 bonus)
//   Rookie: 14 players ( 7 hitters + 4 SP + 3 RP)
//   INTL:   10 players ( 7 hitters + 2 SP + 1 RP)
//   TOTAL: ~124 per team × 30 teams ≈ 3,720 players

export function generateTeamRoster(
  gen: RandomGenerator,
  teamId: number,
  season: number,
): [Player[], RandomGenerator] {
  const players: Player[] = [];

  // Team quality offset: SD=35 creates ~5-win spread → Win SD ~8 ✓
  let rawOffset: number;
  [rawOffset, gen] = gaussian(gen, 0, 35);
  const teamQualityOffset = Math.max(-60, Math.min(60, Math.round(rawOffset)));

  // Helper to generate a batch of players at a given level
  const addPlayers = (
    positions: Position[],
    level: RosterLevel,
    offsetScale: number,
  ) => {
    const offset = Math.round(teamQualityOffset * offsetScale);
    for (const pos of positions) {
      let p: Player;
      [p, gen] = generatePlayer(gen, teamId, pos, level, season, offset);
      players.push(p);
    }
  };

  const addPitchers = (
    sp: number, rp: number, cl: number,
    level: RosterLevel,
    offsetScale: number,
  ) => {
    const offset = Math.round(teamQualityOffset * offsetScale);
    for (let i = 0; i < sp; i++) {
      let p: Player;
      [p, gen] = generatePlayer(gen, teamId, 'SP', level, season, offset);
      players.push(p);
    }
    for (let i = 0; i < rp; i++) {
      let p: Player;
      [p, gen] = generatePlayer(gen, teamId, 'RP', level, season, offset);
      players.push(p);
    }
    for (let i = 0; i < cl; i++) {
      let p: Player;
      [p, gen] = generatePlayer(gen, teamId, 'CL', level, season, offset);
      players.push(p);
    }
  };

  // ── MLB (offset scale 1.0) ───────────────────────────────────────────────────
  addPlayers([...MLB_HITTERS], 'MLB', 1.0);
  addPitchers(MLB_SP_COUNT, MLB_RP_COUNT, MLB_CL_COUNT, 'MLB', 1.0);

  // ── AAA (offset scale 0.50) ───────────────────────────────────────────────────
  addPlayers([...AAA_HITTERS], 'AAA', 0.50);
  addPitchers(AAA_SP, AAA_RP, AAA_CL, 'AAA', 0.50);

  // ── AA (offset scale 0.40) ────────────────────────────────────────────────────
  addPlayers([...AA_HITTERS], 'AA', 0.40);
  addPitchers(AA_SP, AA_RP, AA_CL, 'AA', 0.40);

  // ── A+ (offset scale 0.30) ────────────────────────────────────────────────────
  addPlayers([...APLUS_HITTERS], 'APLUS', 0.30);
  addPitchers(APLUS_SP, APLUS_RP, APLUS_CL, 'APLUS', 0.30);

  // ── A- (offset scale 0.20) ────────────────────────────────────────────────────
  addPlayers([...AMINUS_HITTERS], 'AMINUS', 0.20);
  addPitchers(AMINUS_SP, AMINUS_RP, AMINUS_CL, 'AMINUS', 0.20);

  // ── Rookie (offset scale 0.15) ────────────────────────────────────────────────
  addPlayers([...ROOKIE_HITTERS], 'ROOKIE', 0.15);
  addPitchers(ROOKIE_SP, ROOKIE_RP, ROOKIE_CL, 'ROOKIE', 0.15);

  // ── International / DSL (offset scale 0.10) ───────────────────────────────────
  // True INTL prospects — ages 16–17, high variance, raw talent
  addPlayers([...INTL_HITTERS], 'INTL', 0.10);
  addPitchers(INTL_SP, INTL_RP, INTL_CL, 'INTL', 0.10);

  return [players, gen];
}

// ─── Generate all 30 teams ─────────────────────────────────────────────────────
export function generateLeaguePlayers(
  gen: RandomGenerator,
  teams: import('../../types/team').Team[],
  season: number,
): [Player[], RandomGenerator] {
  resetPlayerIdCounter(1);
  const allPlayers: Player[] = [];

  for (const team of teams) {
    let roster: Player[];
    [roster, gen] = generateTeamRoster(gen, team.teamId, season);
    allPlayers.push(...roster);
  }

  return [allPlayers, gen];
}
