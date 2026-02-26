import type { RandomGenerator } from 'pure-rand';
import type { Player, Position, BatSide, ThrowSide, HitterAttributes, PitcherAttributes } from '../../types/player';
import { computeHitterOverall, computePitcherOverall, blankHitterAttributes, blankPitcherAttributes } from './attributes';
import { POSITIONAL_HITTER_PRIORS, POSITIONAL_PITCHER_PRIORS } from '../../data/positionalPriors';
import { NAME_POOLS, NATIONALITY_WEIGHTS, type Nationality } from '../../data/nameDatabase';
import { nextFloat, nextInt, nextRange, clampedGaussian, gaussian, weightedPick } from '../math/prng';

let _nextPlayerId = 1;
export function resetPlayerIdCounter(start = 1): void { _nextPlayerId = start; }

// ─── Position distribution per roster level ───────────────────────────────────

// MLB 26-man: 13 pitchers (5 SP + 7 RP + 1 CL), 13 position players
const MLB_POSITION_POOL: Position[] = [
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

const SP_COUNT = 5;
const RP_COUNT = 7;
const CL_COUNT = 1;

// AAA: 15 players (7 pitchers, 8 hitters)
const AAA_POSITION_POOL: Position[] = [
  'C', '1B', '2B', '3B', 'SS', 'CF', 'RF', 'LF',
];

// Rookie: 10 players (4 pitchers, 6 hitters)
const ROOKIE_POSITION_POOL: Position[] = [
  'C', 'SS', 'CF', '3B', 'LF', 'RF',
];

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
  // ~68% R, ~30% L, ~2% S
  const side: BatSide = roll < 0.68 ? 'R' : roll < 0.98 ? 'L' : 'S';
  return [side, gen];
}

function generateThrowSide(gen: RandomGenerator, pos: Position, forceRight = false): [ThrowSide, RandomGenerator] {
  if (forceRight || pos === 'C') return ['R', gen]; // Catchers throw right
  // For pitchers: ~30% LHP; for fielders: ~28% LH throwers
  const isPitcher = pos === 'SP' || pos === 'RP' || pos === 'CL';
  let roll: number;
  [roll, gen] = nextFloat(gen);
  const lhProb = isPitcher ? 0.30 : 0.10;
  return [roll < lhProb ? 'L' : 'R', gen];
}

// ─── Age distribution by roster level ────────────────────────────────────────
function generateAge(gen: RandomGenerator, level: 'MLB' | 'AAA' | 'ROOKIE'): [number, RandomGenerator] {
  let age: number;
  switch (level) {
    case 'MLB':
      [age, gen] = clampedGaussian(gen, 27.5, 3.5, 22, 40);
      break;
    case 'AAA':
      [age, gen] = clampedGaussian(gen, 24.0, 2.0, 20, 30);
      break;
    case 'ROOKIE':
      [age, gen] = clampedGaussian(gen, 20.5, 1.5, 18, 24);
      break;
  }
  return [age, gen];
}

// ─── Hitter attribute generation ─────────────────────────────────────────────
function generateHitterAttributes(
  gen: RandomGenerator,
  pos: Position,
  level: 'MLB' | 'AAA' | 'ROOKIE',
  age: number,
  teamQualityOffset = 0,
): [HitterAttributes, RandomGenerator] {
  const prior = POSITIONAL_HITTER_PRIORS[pos];
  // Level multiplier: MLB ~1.0, AAA ~0.78, Rookie ~0.60
  const levelMult = level === 'MLB' ? 1.0 : level === 'AAA' ? 0.78 : 0.60;
  // Sigma scales with level. teamQualityOffset creates between-team talent spread (Win SD lever).
  // MLB sigma=55: within-team player spread; team-level quality controlled by teamQualityOffset
  const sigmaMult = level === 'MLB' ? 55 : level === 'AAA' ? 50 : 60;

  const attrs = blankHitterAttributes();

  // Apply age modifiers to priors (peak window produces best attributes)
  const agePeakDist = Math.abs(age - 28); // Distance from average peak
  const agePenalty = agePeakDist > 5 ? (agePeakDist - 5) * 5 : 0;

  for (const key of ['contact', 'power', 'eye', 'speed', 'fielding', 'armStrength', 'durability', 'baserunningIQ'] as const) {
    const priorVal = (prior as unknown as Record<string, number>)[key] ?? 350;
    let val: number;
    [val, gen] = clampedGaussian(
      gen,
      priorVal * levelMult - agePenalty + teamQualityOffset,
      sigmaMult,
      100,
      550,
    );
    attrs[key] = val;
  }

  // Platoon sensitivity: gaussian around 0
  let platoon: number;
  [platoon, gen] = gaussian(gen, 0, 0.35);
  attrs.platoonSensitivity = Math.max(-1, Math.min(1, platoon));

  // Hidden attributes (0–550 for IQ, 0–100 for work/mental)
  let oiq: number, diq: number, we: number, mt: number;
  [oiq, gen] = clampedGaussian(gen, prior.contact * levelMult * 0.9, 40, 150, 550);
  [diq, gen] = clampedGaussian(gen, prior.fielding * levelMult * 0.9, 40, 150, 550);
  [we,  gen] = clampedGaussian(gen, 60, 15, 10, 100);
  [mt,  gen] = clampedGaussian(gen, 55, 15, 10, 100);
  attrs.offensiveIQ = oiq;
  attrs.defensiveIQ = diq;
  attrs.workEthic = we;
  attrs.mentalToughness = mt;

  return [attrs, gen];
}

// ─── Pitcher attribute generation ────────────────────────────────────────────
function generatePitcherAttributes(
  gen: RandomGenerator,
  pos: 'SP' | 'RP' | 'CL',
  level: 'MLB' | 'AAA' | 'ROOKIE',
  age: number,
  teamQualityOffset = 0,
): [PitcherAttributes, RandomGenerator] {
  const prior = POSITIONAL_PITCHER_PRIORS[pos];
  const levelMult = level === 'MLB' ? 1.0 : level === 'AAA' ? 0.78 : 0.60;
  // Pitcher sigma=50: within-team spread; between-team quality controlled by teamQualityOffset
  const sigmaMult = level === 'MLB' ? 50 : level === 'AAA' ? 45 : 55;

  const attrs = blankPitcherAttributes();
  const agePeakDist = Math.abs(age - 27);
  const agePenalty = agePeakDist > 5 ? (agePeakDist - 5) * 5 : 0;

  for (const key of ['stuff', 'movement', 'command', 'stamina', 'holdRunners', 'durability', 'recoveryRate'] as const) {
    const priorVal = (prior as unknown as Record<string, number>)[key] ?? 350;
    let val: number;
    [val, gen] = clampedGaussian(gen, priorVal * levelMult - agePenalty + teamQualityOffset, sigmaMult, 100, 550);
    attrs[key] = val;
  }

  // Pitch arsenal: SPs have more pitches
  let arsenalRoll: number;
  [arsenalRoll, gen] = nextFloat(gen);
  const arsenalBase = pos === 'SP' ? [3, 4, 4, 5, 5] : [2, 2, 3, 3, 4];
  attrs.pitchArsenalCount = arsenalBase[Math.floor(arsenalRoll * arsenalBase.length)];

  // GB/FB tendency: gaussian around position prior
  let gb: number;
  [gb, gen] = clampedGaussian(gen, prior.gbFbTendency, 15, 25, 75);
  attrs.gbFbTendency = gb;

  // Platoon tendency: SP have more meaningful platoon splits
  let platoon: number;
  [platoon, gen] = gaussian(gen, 0, pos === 'SP' ? 0.30 : 0.25);
  attrs.platoonTendency = Math.max(-1, Math.min(1, platoon));

  // Pitch type mix: varies by arsenal count
  let fbPct: number, brkPct: number;
  [fbPct, gen] = nextRange(gen, 0.40, 0.65);
  [brkPct, gen] = nextRange(gen, 0.20, 0.40);
  const offPct = Math.max(0.05, 1 - fbPct - brkPct);
  attrs.pitchTypeMix = { fastball: fbPct, breaking: brkPct, offspeed: offPct };

  // Hidden
  let piq: number, we: number, mt: number;
  [piq, gen] = clampedGaussian(gen, prior.command * levelMult * 0.9, 40, 150, 550);
  [we,  gen] = clampedGaussian(gen, 60, 15, 10, 100);
  [mt,  gen] = clampedGaussian(gen, 55, 15, 10, 100);
  attrs.pitchingIQ = piq;
  attrs.workEthic = we;
  attrs.mentalToughness = mt;

  return [attrs, gen];
}

// ─── Service time defaults by level/age ──────────────────────────────────────
function initRosterData(level: 'MLB' | 'AAA' | 'ROOKIE', age: number, season: number): import('../../types/player').PlayerRosterData {
  // Estimate service time from age for initial MLB players
  const serviceYears = level === 'MLB' ? Math.max(0, age - 22) : 0;
  const serviceTimeDays = Math.min(serviceYears * 172, 172 * 12);
  return {
    rosterStatus: level === 'MLB' ? 'MLB_ACTIVE' : level === 'AAA' ? 'MINORS_AAA' : 'MINORS_ROOKIE',
    isOn40Man: level === 'MLB',
    optionYearsRemaining: level === 'ROOKIE' ? 3 : level === 'AAA' ? 3 : Math.max(0, 3 - Math.floor(Math.max(0, age - 22) / 2)),
    optionUsedThisSeason: false,
    minorLeagueDaysThisSeason: 0,
    demotionsThisSeason: 0,
    serviceTimeDays,
    serviceTimeCurrentTeamDays: serviceTimeDays,
    rule5Selected: false,
    signedSeason: season - Math.max(0, age - 20),
    signedAge: Math.max(18, age - Math.max(0, age - 20)),
    contractYearsRemaining: level === 'MLB' ? Math.max(1, 3) : 0,
    salary: level === 'MLB' ? Math.max(720_000, serviceTimeDays * 2000) : 0,
    arbitrationEligible: serviceTimeDays >= 3 * 172,
    freeAgentEligible: serviceTimeDays >= 6 * 172,
    hasTenAndFive: serviceTimeDays >= 10 * 172,
  };
}

// ─── Generate single player ───────────────────────────────────────────────────
function generatePlayer(
  gen: RandomGenerator,
  teamId: number,
  pos: Position,
  level: 'MLB' | 'AAA' | 'ROOKIE',
  season: number,
  teamQualityOffset = 0,
): [Player, RandomGenerator] {
  const id = _nextPlayerId++;

  let nationality: Nationality;
  [nationality, gen] = weightedPick(gen, NATIONALITY_WEIGHTS);

  let name: string;
  [name, gen] = generateName(gen, nationality);

  let age: number;
  [age, gen] = generateAge(gen, level);

  const isPitcher = pos === 'SP' || pos === 'RP' || pos === 'CL';

  let throws: ThrowSide;
  [throws, gen] = generateThrowSide(gen, pos);

  let bats: BatSide;
  [bats, gen] = generateBatSide(gen);
  // Pitchers who throw left almost always bat left
  if (isPitcher && throws === 'L') {
    let roll: number;
    [roll, gen] = nextFloat(gen);
    bats = roll < 0.85 ? 'L' : bats;
  }

  let hitterAttributes: HitterAttributes | null = null;
  let pitcherAttributes: PitcherAttributes | null = null;
  let overall = 0;

  if (isPitcher) {
    const pitcherPos = pos as 'SP' | 'RP' | 'CL';
    [pitcherAttributes, gen] = generatePitcherAttributes(gen, pitcherPos, level, age, teamQualityOffset);
    overall = computePitcherOverall(pitcherAttributes, pitcherPos);
  } else {
    [hitterAttributes, gen] = generateHitterAttributes(gen, pos, level, age, teamQualityOffset);
    overall = computeHitterOverall(hitterAttributes, pos);
  }

  // Potential: peak projection (hidden from user in fog-of-war)
  // Young players have higher potential variance
  const youngBonus = Math.max(0, (25 - age) * 8);
  let potential: number;
  [potential, gen] = clampedGaussian(gen, overall + youngBonus + 20, 35, 0, 550);

  const rosterData = initRosterData(level, age, season);

  const player: Player = {
    playerId: id,
    teamId,
    name,
    age,
    position: pos,
    bats,
    throws,
    nationality,
    isPitcher,
    hitterAttributes,
    pitcherAttributes,
    overall,
    potential,
    development: {
      theta: level === 'ROOKIE' ? 0.04 : level === 'AAA' ? 0.025 : 0.01,
      sigma: level === 'ROOKIE' ? 0.08 : level === 'AAA' ? 0.06 : 0.04,
      phase: age < 23 ? 'prospect' : age < 27 ? 'ascent' : age < 32 ? 'prime' : 'decline',
    },
    rosterData,
  };

  return [player, gen];
}

// ─── Generate roster for one team ────────────────────────────────────────────
export function generateTeamRoster(
  gen: RandomGenerator,
  teamId: number,
  season: number,
): [Player[], RandomGenerator] {
  const players: Player[] = [];

  // Team quality offset — shifts all player attribute means up or down.
  // SD=35 → talent spread ~5 wins between good/bad teams → Win SD ~8 ✓
  // Clamped at ±60 to prevent absurd outlier rosters.
  let rawOffset: number;
  [rawOffset, gen] = gaussian(gen, 0, 35);
  const teamQualityOffset = Math.max(-60, Math.min(60, Math.round(rawOffset)));

  // MLB 26-man: position players
  const posPool = [...MLB_POSITION_POOL];
  for (const pos of posPool) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, pos, 'MLB', season, teamQualityOffset);
    players.push(player);
  }

  // ML pitchers: 5 SP + 7 RP + 1 CL
  for (let i = 0; i < SP_COUNT; i++) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, 'SP', 'MLB', season, teamQualityOffset);
    players.push(player);
  }
  for (let i = 0; i < RP_COUNT; i++) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, 'RP', 'MLB', season, teamQualityOffset);
    players.push(player);
  }
  for (let i = 0; i < CL_COUNT; i++) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, 'CL', 'MLB', season, teamQualityOffset);
    players.push(player);
  }

  // AAA: 15 players (8 hitters + 4 SP + 3 RP) — half the MLB offset for minors
  const aaaQualOffset = Math.round(teamQualityOffset * 0.5);
  const aaaPool = [...AAA_POSITION_POOL];
  for (const pos of aaaPool) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, pos, 'AAA', season, aaaQualOffset);
    players.push(player);
  }
  for (let i = 0; i < 4; i++) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, 'SP', 'AAA', season, aaaQualOffset);
    players.push(player);
  }
  for (let i = 0; i < 3; i++) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, 'RP', 'AAA', season, aaaQualOffset);
    players.push(player);
  }

  // Rookie: 10 players (6 hitters + 3 SP + 1 RP) — smaller offset for prospects
  const rookieQualOffset = Math.round(teamQualityOffset * 0.25);
  const rookiePool = [...ROOKIE_POSITION_POOL];
  for (const pos of rookiePool) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, pos, 'ROOKIE', season, rookieQualOffset);
    players.push(player);
  }
  for (let i = 0; i < 3; i++) {
    let player: Player;
    [player, gen] = generatePlayer(gen, teamId, 'SP', 'ROOKIE', season, rookieQualOffset);
    players.push(player);
  }
  let rpPlayer: Player;
  [rpPlayer, gen] = generatePlayer(gen, teamId, 'RP', 'ROOKIE', season, rookieQualOffset);
  players.push(rpPlayer);

  return [players, gen];
}

// ─── Generate all 30 teams' rosters ──────────────────────────────────────────
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
