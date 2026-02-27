/**
 * Amateur Draft Engine — Mr. Baseball Dynasty
 *
 * Full MLB-style first-year player draft:
 *   - Generates draft-eligible prospects (college + HS + intl)
 *   - Draft order based on inverse standings (worst → best)
 *   - 5 rounds of picks (150 total, 30 per round)
 *   - User picks manually; AI teams pick based on needs + BPA
 *   - Scouting accuracy affects how much info the user sees
 *
 * Inspired by OOTP's draft system and Hardball Dynasty's amateur draft.
 */

import type { RandomGenerator } from 'pure-rand';
import type { Player, Position, HitterAttributes, PitcherAttributes } from '../../types/player';
import { computeHitterOverall, computePitcherOverall, blankHitterAttributes, blankPitcherAttributes, toScoutingScale } from '../player/attributes';
import { POSITIONAL_HITTER_PRIORS, POSITIONAL_PITCHER_PRIORS } from '../../data/positionalPriors';
import { NAME_POOLS, NATIONALITY_WEIGHTS, type Nationality } from '../../data/nameDatabase';
import { nextFloat, nextInt, clampedGaussian, gaussian, weightedPick } from '../math/prng';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type DraftType = 'college' | 'high_school' | 'intl_amateur';

export interface DraftProspect {
  prospectId:   number;
  name:         string;
  age:          number;
  position:     Position;
  isPitcher:    boolean;
  draftType:    DraftType;
  nationality:  Nationality;
  bats:         'L' | 'R' | 'S';
  throws:       'L' | 'R';
  // True attributes (hidden from user based on scouting)
  trueOverall:  number;
  truePotential: number;
  // Scouted values (what the user sees — noisy based on scoutingQuality)
  scoutedOverall:  number;
  scoutedPotential: number;
  scoutedGrade:    number;  // 20-80 display
  // Scouting report blurb
  reportBlurb:  string;
  // Rankings
  overallRank:  number;
  positionRank: number;
  // Internal: full player data ready to be added to roster
  _playerData:  Player;
}

export interface DraftPick {
  round:     number;
  pick:      number;  // Overall pick number (1-150)
  teamId:    number;
  teamName:  string;
  prospectId: number | null;  // null if not yet picked
  playerName: string | null;
}

export interface DraftState {
  season:      number;
  prospects:   DraftProspect[];
  picks:       DraftPick[];
  currentPick: number;  // Index into picks array
  completed:   boolean;
}

// ─── Report blurbs ──────────────────────────────────────────────────────────────

const COLLEGE_HITTER_BLURBS = [
  'Polished college bat with advanced plate discipline. Could move quickly.',
  'Power-hitting corner infielder with plus raw power. Some swing-and-miss concerns.',
  'Athletic middle infielder with solid tools across the board. High floor player.',
  'Switch-hitter with gap power and good instincts on the bases.',
  'Defensive-first backstop with a cannon arm and improving bat.',
  'College outfielder with speed and contact skills. Projects as a table-setter.',
  'Mature hitter with a knack for barreling the ball. Limited upside but safe pick.',
  'Toolsy outfielder who flashes plus speed and arm strength. Hit tool is the question.',
];

const HS_HITTER_BLURBS = [
  'Raw but projectable high school bat. Sky-high ceiling if he puts it together.',
  'Five-tool prep talent with elite speed. Needs refinement at the plate.',
  'Physical prep power hitter. Could be special or could be a long-term project.',
  'Best prep bat in the class. Advanced feel for hitting at a young age.',
  'Athletic shortstop with quick-twitch actions. Bat is ahead of most prep hitters.',
  'Young outfielder with explosive tools. Development timeline is 4-5 years.',
];

const COLLEGE_PITCHER_BLURBS = [
  'Polished college arm with 3+ pitch mix and plus command.',
  'Hard-throwing righty with a wipeout slider. Possible quick mover.',
  'Control artist with a deceptive delivery. Gets weak contact consistently.',
  'Big-bodied workhorse who logs innings. Solid ceiling as mid-rotation arm.',
  'Lefty with a sharp breaking ball. Could be a bullpen weapon or back-end starter.',
];

const HS_PITCHER_BLURBS = [
  'Projectable high school arm with a live fastball that already touches 95.',
  'Lean prep righty with a filthy curveball. Needs to add velocity.',
  'Electric arm speed and a mature changeup for his age. Top of the draft talent.',
  'Tall high school lefty with a high 3/4 arm slot. Huge projection remaining.',
  'Hard-throwing prep arm with effort in his delivery. Reliever risk.',
];

const INTL_BLURBS = [
  'Athletic international signee with quick-twitch tools. Very raw but exciting.',
  'Toolsy young player from Latin America. Needs extensive development time.',
  'International prospect with impressive bat speed. Long-term upside play.',
  'Young arm with electric stuff for his age. Raw but intriguing.',
];

// ─── Prospect generation ────────────────────────────────────────────────────────

let _nextProspectId = 50000;  // High range to avoid collision with roster players

const HITTER_POSITIONS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

function generateDraftProspect(
  gen: RandomGenerator,
  draftType: DraftType,
  scoutingQuality: number,
  season: number,
): [DraftProspect, RandomGenerator] {
  const id = _nextProspectId++;

  // Age based on type
  let age: number;
  if (draftType === 'college') {
    [age, gen] = clampedGaussian(gen, 21.5, 0.8, 20, 23);
    age = Math.round(age);
  } else if (draftType === 'high_school') {
    [age, gen] = clampedGaussian(gen, 18, 0.3, 17, 19);
    age = Math.round(age);
  } else {
    [age, gen] = clampedGaussian(gen, 17, 0.8, 16, 19);
    age = Math.round(age);
  }

  // Nationality
  let nationality: Nationality;
  if (draftType === 'intl_amateur') {
    const intlWeights = [
      { weight: 0.60, value: 'latin' as Nationality },
      { weight: 0.30, value: 'asian' as Nationality },
      { weight: 0.10, value: 'american' as Nationality },
    ];
    [nationality, gen] = weightedPick(gen, intlWeights);
  } else {
    [nationality, gen] = weightedPick(gen, NATIONALITY_WEIGHTS);
  }

  // Name
  const pool = NAME_POOLS[nationality];
  let fi: number, li: number;
  [fi, gen] = nextInt(gen, 0, pool.first.length - 1);
  [li, gen] = nextInt(gen, 0, pool.last.length - 1);
  const name = `${pool.first[fi]} ${pool.last[li]}`;

  // Position
  let isPitcher: boolean;
  let pitcherRoll: number;
  [pitcherRoll, gen] = nextFloat(gen);
  isPitcher = pitcherRoll < 0.40; // 40% pitchers

  let position: Position;
  if (isPitcher) {
    let spRoll: number;
    [spRoll, gen] = nextFloat(gen);
    position = spRoll < 0.75 ? 'SP' : 'RP';
  } else {
    let posIdx: number;
    [posIdx, gen] = nextInt(gen, 0, HITTER_POSITIONS.length - 1);
    position = HITTER_POSITIONS[posIdx];
  }

  // Handedness
  let bats: 'L' | 'R' | 'S';
  let throws: 'L' | 'R';
  let batRoll: number, throwRoll: number;
  [batRoll, gen] = nextFloat(gen);
  bats = batRoll < 0.68 ? 'R' : batRoll < 0.98 ? 'L' : 'S';
  [throwRoll, gen] = nextFloat(gen);
  const lhProb = isPitcher ? 0.30 : 0.10;
  throws = throwRoll < lhProb ? 'L' : 'R';

  // Quality: college players have higher floor, HS/intl have higher ceiling
  const qualityMult = draftType === 'college' ? 0.50
    : draftType === 'high_school' ? 0.38
    : 0.32;
  const sigmaMult = draftType === 'college' ? 50
    : draftType === 'high_school' ? 60
    : 65;
  const youngBonus = Math.max(0, (25 - age) * 10);

  // Generate attributes
  let hitterAttributes: HitterAttributes | null = null;
  let pitcherAttributes: PitcherAttributes | null = null;
  let overall: number;

  if (isPitcher) {
    const pitcherPos = position as 'SP' | 'RP';
    const prior = POSITIONAL_PITCHER_PRIORS[pitcherPos];
    const attrs = blankPitcherAttributes();

    for (const key of ['stuff', 'movement', 'command', 'stamina', 'holdRunners', 'durability', 'recoveryRate'] as const) {
      const priorVal = (prior as unknown as Record<string, number>)[key] ?? 300;
      let val: number;
      [val, gen] = clampedGaussian(gen, priorVal * qualityMult, sigmaMult, 50, 550);
      attrs[key] = val;
    }

    let arsenalRoll: number;
    [arsenalRoll, gen] = nextFloat(gen);
    const arsenalBase = position === 'SP' ? [2, 3, 3, 4] : [2, 2, 3];
    attrs.pitchArsenalCount = arsenalBase[Math.floor(arsenalRoll * arsenalBase.length)];

    let gb: number;
    [gb, gen] = clampedGaussian(gen, prior.gbFbTendency, 15, 25, 75);
    attrs.gbFbTendency = gb;

    let piq: number, we: number, mt: number;
    [piq, gen] = clampedGaussian(gen, prior.command * qualityMult * 0.8, 40, 100, 550);
    [we, gen] = clampedGaussian(gen, 60, 15, 10, 100);
    [mt, gen] = clampedGaussian(gen, 50, 15, 10, 100);
    attrs.pitchingIQ = piq;
    attrs.workEthic = we;
    attrs.mentalToughness = mt;

    let fbPct: number, brkPct: number;
    [fbPct, gen] = nextFloat(gen);
    fbPct = 0.40 + fbPct * 0.25;
    [brkPct, gen] = nextFloat(gen);
    brkPct = 0.20 + brkPct * 0.20;
    attrs.pitchTypeMix = { fastball: fbPct, breaking: brkPct, offspeed: Math.max(0.05, 1 - fbPct - brkPct) };

    pitcherAttributes = attrs;
    overall = computePitcherOverall(attrs, pitcherPos);
  } else {
    const prior = POSITIONAL_HITTER_PRIORS[position];
    const attrs = blankHitterAttributes();

    for (const key of ['contact', 'power', 'eye', 'speed', 'fielding', 'armStrength', 'durability', 'baserunningIQ'] as const) {
      const priorVal = (prior as unknown as Record<string, number>)[key] ?? 300;
      let val: number;
      [val, gen] = clampedGaussian(gen, priorVal * qualityMult, sigmaMult, 50, 550);
      attrs[key] = val;
    }

    let oiq: number, diq: number, we: number, mt: number;
    [oiq, gen] = clampedGaussian(gen, prior.contact * qualityMult * 0.8, 40, 100, 550);
    [diq, gen] = clampedGaussian(gen, prior.fielding * qualityMult * 0.8, 40, 100, 550);
    [we, gen] = clampedGaussian(gen, 60, 15, 10, 100);
    [mt, gen] = clampedGaussian(gen, 50, 15, 10, 100);
    attrs.offensiveIQ = oiq;
    attrs.defensiveIQ = diq;
    attrs.workEthic = we;
    attrs.mentalToughness = mt;

    hitterAttributes = attrs;
    overall = computeHitterOverall(attrs, position);
  }

  // Potential: younger = more upside
  let potential: number;
  [potential, gen] = clampedGaussian(gen, overall + youngBonus + 30, 45, overall - 20, 550);

  // Scouted values: add noise based on scouting quality
  const noiseLevel = (1.0 - scoutingQuality) * 60; // 0.4 quality → ±36 noise, 1.0 → ±0
  let ovrNoise: number, potNoise: number;
  [ovrNoise, gen] = gaussian(gen, 0, noiseLevel);
  [potNoise, gen] = gaussian(gen, 0, noiseLevel * 1.2); // Potential is harder to scout
  const scoutedOverall = Math.max(50, Math.min(550, Math.round(overall + ovrNoise)));
  const scoutedPotential = Math.max(50, Math.min(550, Math.round(potential + potNoise)));

  // Report blurb
  let blurbIdx: number;
  const blurbs = isPitcher
    ? (draftType === 'college' ? COLLEGE_PITCHER_BLURBS : draftType === 'high_school' ? HS_PITCHER_BLURBS : INTL_BLURBS)
    : (draftType === 'college' ? COLLEGE_HITTER_BLURBS : draftType === 'high_school' ? HS_HITTER_BLURBS : INTL_BLURBS);
  [blurbIdx, gen] = nextInt(gen, 0, blurbs.length - 1);

  // Build full player data (ready to add to a team's roster)
  const player: Player = {
    playerId: id,
    teamId: -1,
    name,
    age,
    position,
    bats,
    throws,
    nationality,
    isPitcher,
    hitterAttributes,
    pitcherAttributes,
    overall,
    potential,
    development: {
      theta: 0,
      sigma: draftType === 'college' ? 20 : draftType === 'high_school' ? 30 : 35,
      phase: 'prospect',
    },
    rosterData: {
      rosterStatus: 'DRAFT_ELIGIBLE',
      isOn40Man: false,
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 0,
      serviceTimeCurrentTeamDays: 0,
      rule5Selected: false,
      signedSeason: season,
      signedAge: age,
      contractYearsRemaining: 0,
      salary: 0,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  };

  const prospect: DraftProspect = {
    prospectId: id,
    name,
    age,
    position,
    isPitcher,
    draftType,
    nationality,
    bats,
    throws,
    trueOverall: overall,
    truePotential: potential,
    scoutedOverall,
    scoutedPotential,
    scoutedGrade: toScoutingScale(scoutedOverall),
    reportBlurb: blurbs[blurbIdx],
    overallRank: 0,  // Set after generation
    positionRank: 0,
    _playerData: player,
  };

  return [prospect, gen];
}

// ─── Generate full draft class ──────────────────────────────────────────────────

export function generateDraftClass(
  gen: RandomGenerator,
  scoutingQuality: number,
  season: number,
): [DraftProspect[], RandomGenerator] {
  _nextProspectId = 50000 + (season - 2026) * 200;
  const prospects: DraftProspect[] = [];

  // 150 draft-eligible players (5 rounds × 30 picks, plus extras)
  // College: 55%, HS: 30%, Intl: 15%
  const counts = { college: 90, high_school: 50, intl_amateur: 30 };

  for (const [type, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      let prospect: DraftProspect;
      [prospect, gen] = generateDraftProspect(gen, type as DraftType, scoutingQuality, season);
      prospects.push(prospect);
    }
  }

  // Rank by scouted overall (what the user sees)
  prospects.sort((a, b) => b.scoutedOverall - a.scoutedOverall);
  prospects.forEach((p, i) => { p.overallRank = i + 1; });

  // Position ranks
  const posCount: Record<string, number> = {};
  for (const p of prospects) {
    posCount[p.position] = (posCount[p.position] ?? 0) + 1;
    p.positionRank = posCount[p.position];
  }

  return [prospects, gen];
}

// ─── Build draft order ──────────────────────────────────────────────────────────

export function buildDraftOrder(
  teams: Array<{ teamId: number; name: string; wins: number }>,
  rounds: number,
): DraftPick[] {
  // Inverse standings order (worst record picks first)
  const sorted = [...teams].sort((a, b) => a.wins - b.wins);
  const picks: DraftPick[] = [];

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < sorted.length; i++) {
      picks.push({
        round,
        pick: (round - 1) * sorted.length + i + 1,
        teamId: sorted[i].teamId,
        teamName: sorted[i].name,
        prospectId: null,
        playerName: null,
      });
    }
  }

  return picks;
}

// ─── AI pick logic ──────────────────────────────────────────────────────────────

export function aiSelectPick(
  teamId: number,
  available: DraftProspect[],
  teamPlayers: Player[],
  strategy: 'contender' | 'fringe' | 'rebuilder',
): DraftProspect | null {
  if (available.length === 0) return null;

  // BPA (Best Player Available) with team need modifiers
  const activePositions = teamPlayers
    .filter(p => p.teamId === teamId && (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_')))
    .map(p => p.position);

  const positionCounts: Record<string, number> = {};
  for (const pos of activePositions) {
    positionCounts[pos] = (positionCounts[pos] ?? 0) + 1;
  }

  // Score each available prospect
  let bestScore = -Infinity;
  let bestProspect: DraftProspect | null = null;

  for (const p of available) {
    // Base: scouted value (what the AI "sees" — they have their own scouting noise)
    let score = p.scoutedOverall;

    // Upside bonus: weight potential more for rebuilders
    const upsideWeight = strategy === 'rebuilder' ? 0.5 : strategy === 'fringe' ? 0.3 : 0.15;
    score += (p.scoutedPotential - p.scoutedOverall) * upsideWeight;

    // Need bonus: if team is thin at this position
    const posCount = positionCounts[p.position] ?? 0;
    if (posCount < 5) score += (5 - posCount) * 3;
    if (posCount < 3) score += 5;

    // Contenders prefer college (faster to MLB)
    if (strategy === 'contender' && p.draftType === 'college') score += 5;
    // Rebuilders prefer upside (HS/intl)
    if (strategy === 'rebuilder' && p.draftType !== 'college') score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestProspect = p;
    }
  }

  return bestProspect;
}

// ─── Execute a draft pick ───────────────────────────────────────────────────────

export function executeDraftPick(
  prospect: DraftProspect,
  teamId: number,
  season: number,
): Player {
  const player = { ...prospect._playerData };
  player.teamId = teamId;
  player.rosterData = {
    ...player.rosterData,
    rosterStatus: 'MINORS_ROOKIE',
    isOn40Man: false,
    signedSeason: season,
    signedAge: player.age,
    contractYearsRemaining: 0,
    salary: 0,
  };
  return player;
}
