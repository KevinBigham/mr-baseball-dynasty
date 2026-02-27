/**
 * International Signing Period — Mr. Baseball Dynasty
 *
 * J2 (July 2) international amateur signing period:
 *   - Each team has a bonus pool (~$5M-$6M base)
 *   - International amateur players available for signing
 *   - Scouting quality affects prospect evaluation
 *   - AI teams compete for top international talent
 *
 * Inspired by OOTP's international free agent system.
 */

import type { RandomGenerator } from 'pure-rand';
import type { Player, Position } from '../../types/player';
import type { Team } from '../../types/team';
import { computeHitterOverall, computePitcherOverall, blankHitterAttributes, blankPitcherAttributes, toScoutingScale } from '../player/attributes';
import { POSITIONAL_HITTER_PRIORS, POSITIONAL_PITCHER_PRIORS } from '../../data/positionalPriors';
import { NAME_POOLS } from '../../data/nameDatabase';
import { nextFloat, nextInt, clampedGaussian, gaussian } from '../math/prng';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface IntlProspect {
  prospectId:     number;
  name:           string;
  age:            number;
  position:       Position;
  isPitcher:      boolean;
  nationality:    'latin' | 'asian';
  bats:           'L' | 'R' | 'S';
  throws:         'L' | 'R';
  scoutedOverall: number;
  scoutedPotential: number;
  scoutGrade:     number;
  signingBonus:   number;     // Cost to sign
  reportBlurb:    string;
  _playerData:    Player;
}

export interface IntlSigningResult {
  signings: Array<{
    prospectId:  number;
    playerName:  string;
    teamId:      number;
    teamName:    string;
    bonus:       number;
  }>;
  unsigned: number[];
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const BASE_BONUS_POOL = 5_500_000;  // $5.5M per team
const INTL_BLURBS = [
  'Electric tools from the Dominican Republic. Raw but projectable body.',
  'Toolsy Venezuelan shortstop with quick hands and plus arm.',
  'Cuban defector with advanced feel for hitting. Could move quickly.',
  'Japanese prep pitcher with a polished repertoire for his age.',
  'Athletic outfielder from Panama with explosive bat speed.',
  'Korean lefty with a deceptive delivery and sharp breaking ball.',
  'Dominican power hitter with plus raw power. Swing needs refinement.',
  'Venezuelan pitching prospect with a live arm and projectable frame.',
  'Colombian middle infielder with excellent defensive instincts.',
  'Nicaraguan catcher with a cannon arm and leadership qualities.',
];

let _nextIntlId = 70000;

const HITTER_POSITIONS: Position[] = ['C', 'SS', '2B', '3B', 'CF', 'LF', 'RF'];

// ─── Generate international prospect ────────────────────────────────────────────

function generateIntlProspect(
  gen: RandomGenerator,
  scoutingQuality: number,
  season: number,
): [IntlProspect, RandomGenerator] {
  const id = _nextIntlId++;

  // Age: 16-17 (J2 signings)
  let age: number;
  [age, gen] = clampedGaussian(gen, 16.5, 0.5, 16, 17);
  age = Math.round(age);

  // Nationality: 70% Latin, 30% Asian
  let natRoll: number;
  [natRoll, gen] = nextFloat(gen);
  const nationality: 'latin' | 'asian' = natRoll < 0.70 ? 'latin' : 'asian';

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
  isPitcher = pitcherRoll < 0.35;

  let position: Position;
  if (isPitcher) {
    position = 'SP'; // Most intl pitching signees project as SP
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
  bats = batRoll < 0.65 ? 'R' : batRoll < 0.97 ? 'L' : 'S';
  [throwRoll, gen] = nextFloat(gen);
  throws = throwRoll < (isPitcher ? 0.28 : 0.08) ? 'L' : 'R';

  // Quality: raw but high ceiling
  const qualityMult = 0.30;
  const sigma = 65;
  const youngBonus = Math.max(0, (25 - age) * 12);

  let hitterAttributes = null;
  let pitcherAttributes = null;
  let overall: number;

  if (isPitcher) {
    const prior = POSITIONAL_PITCHER_PRIORS['SP'];
    const attrs = blankPitcherAttributes();
    for (const key of ['stuff', 'movement', 'command', 'stamina', 'holdRunners', 'durability', 'recoveryRate'] as const) {
      const priorVal = (prior as unknown as Record<string, number>)[key] ?? 300;
      let val: number;
      [val, gen] = clampedGaussian(gen, priorVal * qualityMult, sigma, 50, 550);
      attrs[key] = val;
    }
    let arsenalRoll: number;
    [arsenalRoll, gen] = nextFloat(gen);
    attrs.pitchArsenalCount = [2, 2, 3][Math.floor(arsenalRoll * 3)];
    let piq: number, we: number, mt: number;
    [piq, gen] = clampedGaussian(gen, 200, 40, 100, 550);
    [we, gen] = clampedGaussian(gen, 55, 15, 10, 100);
    [mt, gen] = clampedGaussian(gen, 45, 15, 10, 100);
    attrs.pitchingIQ = piq;
    attrs.workEthic = we;
    attrs.mentalToughness = mt;
    pitcherAttributes = attrs;
    overall = computePitcherOverall(attrs, 'SP');
  } else {
    const prior = POSITIONAL_HITTER_PRIORS[position];
    const attrs = blankHitterAttributes();
    for (const key of ['contact', 'power', 'eye', 'speed', 'fielding', 'armStrength', 'durability', 'baserunningIQ'] as const) {
      const priorVal = (prior as unknown as Record<string, number>)[key] ?? 300;
      let val: number;
      [val, gen] = clampedGaussian(gen, priorVal * qualityMult, sigma, 50, 550);
      attrs[key] = val;
    }
    let oiq: number, diq: number, we: number, mt: number;
    [oiq, gen] = clampedGaussian(gen, 180, 40, 100, 550);
    [diq, gen] = clampedGaussian(gen, 180, 40, 100, 550);
    [we, gen] = clampedGaussian(gen, 55, 15, 10, 100);
    [mt, gen] = clampedGaussian(gen, 45, 15, 10, 100);
    attrs.offensiveIQ = oiq;
    attrs.defensiveIQ = diq;
    attrs.workEthic = we;
    attrs.mentalToughness = mt;
    hitterAttributes = attrs;
    overall = computeHitterOverall(attrs, position);
  }

  let potential: number;
  [potential, gen] = clampedGaussian(gen, overall + youngBonus + 40, 50, overall, 550);

  // Scouting noise
  const noise = (1.0 - scoutingQuality) * 60;
  let ovrN: number, potN: number;
  [ovrN, gen] = gaussian(gen, 0, noise);
  [potN, gen] = gaussian(gen, 0, noise * 1.3);
  const scoutedOverall = Math.max(50, Math.min(550, Math.round(overall + ovrN)));
  const scoutedPotential = Math.max(50, Math.min(550, Math.round(potential + potN)));

  // Signing bonus: scales with talent
  const grade = toScoutingScale(scoutedOverall);
  const potGrade = toScoutingScale(scoutedPotential);
  const bonusBase = grade >= 50 ? 2_000_000 : grade >= 40 ? 500_000 : 100_000;
  const potBonus = potGrade >= 60 ? 1_500_000 : potGrade >= 50 ? 500_000 : 0;
  let bonusNoise: number;
  [bonusNoise, gen] = nextFloat(gen);
  const signingBonus = Math.round((bonusBase + potBonus) * (0.8 + bonusNoise * 0.4));

  // Report
  let blurbIdx: number;
  [blurbIdx, gen] = nextInt(gen, 0, INTL_BLURBS.length - 1);

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
    development: { theta: 0, sigma: 35, phase: 'prospect' },
    rosterData: {
      rosterStatus: 'MINORS_INTL',
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

  return [{
    prospectId: id,
    name,
    age,
    position,
    isPitcher,
    nationality,
    bats,
    throws,
    scoutedOverall,
    scoutedPotential,
    scoutGrade: toScoutingScale(scoutedOverall),
    signingBonus,
    reportBlurb: INTL_BLURBS[blurbIdx],
    _playerData: player,
  }, gen];
}

// ─── Generate international class ───────────────────────────────────────────────

export function generateIntlClass(
  gen: RandomGenerator,
  scoutingQuality: number,
  season: number,
): [IntlProspect[], RandomGenerator] {
  _nextIntlId = 70000 + (season - 2026) * 100;
  const prospects: IntlProspect[] = [];

  for (let i = 0; i < 60; i++) {
    let p: IntlProspect;
    [p, gen] = generateIntlProspect(gen, scoutingQuality, season);
    prospects.push(p);
  }

  prospects.sort((a, b) => b.scoutedOverall - a.scoutedOverall);
  return [prospects, gen];
}

// ─── AI signing ─────────────────────────────────────────────────────────────────

export function runAIIntlSigning(
  prospects: IntlProspect[],
  players: Player[],
  teams: Team[],
  userTeamId: number,
): IntlSigningResult {
  const signings: IntlSigningResult['signings'] = [];
  const unsigned: number[] = [];
  const teamBonusPools = new Map<number, number>();

  for (const team of teams) {
    teamBonusPools.set(team.teamId, BASE_BONUS_POOL);
  }

  for (const prospect of prospects) {
    let bestTeam: Team | null = null;
    let bestScore = -Infinity;

    for (const team of teams) {
      if (team.teamId === userTeamId) continue;
      const remaining = teamBonusPools.get(team.teamId) ?? 0;
      if (remaining < prospect.signingBonus) continue;

      // Score: talent + scouting affinity + strategy fit
      let score = prospect.scoutedOverall;
      score += team.scoutingQuality * 20;
      if (team.strategy === 'rebuilder') score += 10;
      if (prospect.scoutGrade >= 50) score += 15;

      if (score > bestScore) {
        bestScore = score;
        bestTeam = team;
      }
    }

    if (bestTeam) {
      const player = { ...prospect._playerData };
      player.teamId = bestTeam.teamId;
      player.rosterData.rosterStatus = 'MINORS_INTL';
      player.rosterData.signedSeason = players.length > 0 ? players[0].rosterData.signedSeason : 2026;
      players.push(player);

      teamBonusPools.set(bestTeam.teamId, (teamBonusPools.get(bestTeam.teamId) ?? 0) - prospect.signingBonus);

      signings.push({
        prospectId: prospect.prospectId,
        playerName: prospect.name,
        teamId: bestTeam.teamId,
        teamName: bestTeam.name,
        bonus: prospect.signingBonus,
      });
    } else {
      unsigned.push(prospect.prospectId);
    }
  }

  return { signings, unsigned };
}
