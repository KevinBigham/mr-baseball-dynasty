/**
 * internationalSigning.ts — International Free Agent signing period.
 *
 * Generates a class of 16-17 year old international prospects.
 * Each team has a bonus pool (~$5M). User scouts and bids on
 * available INTL prospects, competing against AI teams.
 */

import type { RandomGenerator } from 'pure-rand';
import type { Player, Position } from '../types/player';
import { nextFloat, nextInt, clampedGaussian, weightedPick } from './math/prng';
import { blankHitterAttributes, blankPitcherAttributes, computeHitterOverall, computePitcherOverall } from './player/attributes';
import { NAME_POOLS } from '../data/nameDatabase';

// ─── Configuration ──────────────────────────────────────────────────────────

const INTL_CLASS_SIZE = 60;     // Total international prospects per cycle
const MIN_SIGNING_BONUS = 50_000;
const MAX_SIGNING_BONUS = 3_000_000;

// Position distribution for international market (SS/OF/SP heavy)
const INTL_POSITIONS: Array<{ weight: number; value: Position }> = [
  { weight: 20, value: 'SS' },
  { weight: 15, value: 'CF' },
  { weight: 12, value: 'RF' },
  { weight: 10, value: 'LF' },
  { weight: 8,  value: '2B' },
  { weight: 8,  value: '3B' },
  { weight: 5,  value: 'C' },
  { weight: 3,  value: '1B' },
  { weight: 12, value: 'SP' },
  { weight: 5,  value: 'RP' },
  { weight: 2,  value: 'DH' },
];

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IntlProspect {
  playerId: number;
  name: string;
  position: Position;
  age: number;
  country: string;
  isPitcher: boolean;
  scoutedOverall: number;    // Foggy OVR (20-80 scouting scale)
  scoutedPotential: number;  // Foggy POT (20-80 scouting scale)
  signingBonus: number;      // Market-rate bonus
  signed: boolean;
  signedByTeamId: number;    // -1 if unsigned
}

export interface IntlSigningState {
  prospects: IntlProspect[];
  bonusPool: number;          // User's remaining pool
  bonusPoolUsed: number;      // User's spent amount
  aiSignings: Array<{
    prospectName: string;
    teamId: number;
    teamAbbr: string;
    bonus: number;
  }>;
}

// ─── Country distribution ──────────────────────────────────────────────────

const COUNTRIES: Array<{ weight: number; value: string }> = [
  { weight: 30, value: 'Dominican Republic' },
  { weight: 20, value: 'Venezuela' },
  { weight: 10, value: 'Cuba' },
  { weight: 8,  value: 'Mexico' },
  { weight: 5,  value: 'Colombia' },
  { weight: 5,  value: 'Panama' },
  { weight: 4,  value: 'Japan' },
  { weight: 4,  value: 'South Korea' },
  { weight: 3,  value: 'Taiwan' },
  { weight: 3,  value: 'Curacao' },
  { weight: 2,  value: 'Puerto Rico' },
  { weight: 2,  value: 'Nicaragua' },
  { weight: 2,  value: 'Brazil' },
  { weight: 2,  value: 'Bahamas' },
];

// ─── Generate INTL prospect class ──────────────────────────────────────────

export function generateIntlClass(
  gen: RandomGenerator,
  existingMaxId: number,
  season: number,
): [IntlProspect[], Player[], RandomGenerator] {
  const prospects: IntlProspect[] = [];
  const players: Player[] = [];

  for (let i = 0; i < INTL_CLASS_SIZE; i++) {
    const playerId = existingMaxId + 1 + i;

    // Position
    let position: Position;
    [position, gen] = weightedPick(gen, INTL_POSITIONS);

    // Country
    let country: string;
    [country, gen] = weightedPick(gen, COUNTRIES);

    // Age: 16 or 17
    let age: number;
    [age, gen] = nextInt(gen, 16, 17);

    // Name from latin pool
    const pool = NAME_POOLS.latin;
    let firstIdx: number, lastIdx: number;
    [firstIdx, gen] = nextInt(gen, 0, pool.first.length - 1);
    [lastIdx, gen] = nextInt(gen, 0, pool.last.length - 1);
    const name = `${pool.first[firstIdx]} ${pool.last[lastIdx]}`;

    const isPitcher = position === 'SP' || position === 'RP' || position === 'CL';

    // Generate attributes (low current, high upside variance)
    let hitterAttributes = null;
    let pitcherAttributes = null;
    let overall: number;
    let potential: number;

    if (isPitcher) {
      const pa = blankPitcherAttributes();
      let v: number;
      [v, gen] = clampedGaussian(gen, 130, 50, 60, 260);  pa.stuff = v;
      [v, gen] = clampedGaussian(gen, 120, 45, 50, 240);  pa.movement = v;
      [v, gen] = clampedGaussian(gen, 100, 40, 40, 200);  pa.command = v;
      [v, gen] = clampedGaussian(gen, 160, 30, 100, 250); pa.stamina = v;
      [v, gen] = clampedGaussian(gen, 50, 25, 10, 90);    pa.workEthic = v;
      [v, gen] = clampedGaussian(gen, 40, 20, 10, 80);    pa.mentalToughness = v;
      [v, gen] = clampedGaussian(gen, 100, 40, 40, 200);  pa.holdRunners = v;
      [v, gen] = clampedGaussian(gen, 120, 30, 70, 200);  pa.durability = v;
      [v, gen] = clampedGaussian(gen, 120, 30, 70, 200);  pa.recoveryRate = v;
      [v, gen] = nextInt(gen, 2, 3);                       pa.pitchArsenalCount = v;
      [v, gen] = nextInt(gen, 30, 70);                     pa.gbFbTendency = v;
      let pt: number;
      [pt, gen] = nextFloat(gen);
      pa.platoonTendency = pt * 0.8 - 0.4;
      pa.pitchTypeMix = { fastball: 0.55, breaking: 0.25, offspeed: 0.20 };
      [v, gen] = clampedGaussian(gen, 80, 30, 30, 160);   pa.pitchingIQ = v;

      pitcherAttributes = pa;
      overall = computePitcherOverall(pa, position as 'SP' | 'RP' | 'CL');

      // Potential: 80-200 pts above current OVR
      let potDelta: number;
      [potDelta, gen] = clampedGaussian(gen, 140, 50, 80, 250);
      potential = Math.min(550, overall + potDelta);
    } else {
      const ha = blankHitterAttributes();
      let v: number;
      [v, gen] = clampedGaussian(gen, 130, 50, 60, 260);  ha.contact = v;
      [v, gen] = clampedGaussian(gen, 110, 55, 40, 260);  ha.power = v;
      [v, gen] = clampedGaussian(gen, 100, 40, 40, 200);  ha.eye = v;
      [v, gen] = clampedGaussian(gen, 180, 50, 80, 320);  ha.speed = v;
      [v, gen] = clampedGaussian(gen, 140, 45, 60, 260);  ha.fielding = v;
      [v, gen] = clampedGaussian(gen, 130, 40, 60, 240);  ha.armStrength = v;
      [v, gen] = clampedGaussian(gen, 60, 25, 10, 100);   ha.workEthic = v;
      [v, gen] = clampedGaussian(gen, 40, 20, 10, 80);    ha.mentalToughness = v;
      [v, gen] = clampedGaussian(gen, 120, 40, 50, 220);  ha.baserunningIQ = v;
      [v, gen] = clampedGaussian(gen, 160, 30, 100, 250); ha.durability = v;
      [v, gen] = clampedGaussian(gen, 80, 30, 30, 160);   ha.offensiveIQ = v;
      [v, gen] = clampedGaussian(gen, 80, 30, 30, 160);   ha.defensiveIQ = v;
      let pt: number;
      [pt, gen] = nextFloat(gen);
      ha.platoonSensitivity = pt * 1.6 - 0.8;

      hitterAttributes = ha;
      overall = computeHitterOverall(ha, position);

      let potDelta: number;
      [potDelta, gen] = clampedGaussian(gen, 140, 50, 80, 250);
      potential = Math.min(550, overall + potDelta);
    }

    // Scouted values (with fog of war — ±5 on 20-80 scale)
    const toScout = (v: number) => Math.round(20 + (Math.max(0, Math.min(550, v)) / 550) * 60);
    let fog1: number, fog2: number;
    [fog1, gen] = clampedGaussian(gen, 0, 3, -5, 5);
    [fog2, gen] = clampedGaussian(gen, 0, 4, -7, 7);
    const scoutedOverall = Math.max(20, Math.min(80, toScout(overall) + fog1));
    const scoutedPotential = Math.max(20, Math.min(80, toScout(potential) + fog2));

    // Signing bonus: correlated with scouted potential
    let bonusBase: number;
    if (scoutedPotential >= 65) bonusBase = 2_000_000;
    else if (scoutedPotential >= 55) bonusBase = 800_000;
    else if (scoutedPotential >= 45) bonusBase = 300_000;
    else bonusBase = 100_000;

    let bonusMult: number;
    [bonusMult, gen] = nextFloat(gen);
    const signingBonus = Math.min(MAX_SIGNING_BONUS,
      Math.max(MIN_SIGNING_BONUS,
        Math.round(bonusBase * (0.7 + bonusMult * 0.6) / 10_000) * 10_000
      )
    );

    // Build the Player object
    const player: Player = {
      playerId,
      teamId: -1,
      name,
      firstName: pool.first[firstIdx],
      lastName: pool.last[lastIdx],
      age,
      position,
      bats: isPitcher ? 'R' : (['L', 'R', 'S'] as const)[Math.floor((firstIdx % 10) / 4)],
      throws: isPitcher ? (['L', 'R'] as const)[lastIdx % 3 === 0 ? 0 : 1] : 'R',
      leagueLevel: 'Rookie',
      nationality: 'latin',
      isPitcher,
      hitterAttributes,
      pitcherAttributes,
      overall,
      potential,
      development: {
        theta: 0.5,
        sigma: 0.35,
        phase: 'prospect',
      },
      rosterData: {
        rosterStatus: 'FREE_AGENT',
        isOn40Man: false,
        optionYearsRemaining: 3,
        optionUsedThisSeason: false,
        minorLeagueDaysThisSeason: 0,
        demotionsThisSeason: 0,
        serviceTimeDays: 0,
        serviceTimeCurrentTeamDays: 0,
        signedSeason: season,
        signedAge: age,
        contractYearsRemaining: 6,
        salary: 50_000,
        arbitrationEligible: false,
        freeAgentEligible: false,
        hasTenAndFive: false,
        rule5Selected: false,
      },
    };

    players.push(player);
    prospects.push({
      playerId,
      name,
      position,
      age,
      country,
      isPitcher,
      scoutedOverall,
      scoutedPotential,
      signingBonus,
      signed: false,
      signedByTeamId: -1,
    });
  }

  return [prospects, players, gen];
}

// ─── Sign an international prospect ────────────────────────────────────────

export function signIntlProspect(
  player: Player,
  teamId: number,
  bonus: number,
): { ok: boolean; error?: string } {
  if (player.teamId !== -1) {
    return { ok: false, error: 'Prospect already signed.' };
  }
  player.teamId = teamId;
  player.rosterData.rosterStatus = 'MINORS_INTL';
  player.rosterData.isOn40Man = false;
  player.rosterData.contractYearsRemaining = 6;
  player.rosterData.salary = bonus;
  return { ok: true };
}

// ─── AI signing of remaining INTL prospects ────────────────────────────────

export function processAIIntlSignings(
  prospects: IntlProspect[],
  players: Player[],
  teams: Array<{ teamId: number; abbreviation: string }>,
  userTeamId: number,
  gen: RandomGenerator,
): [IntlSigningState['aiSignings'], RandomGenerator] {
  const aiSignings: IntlSigningState['aiSignings'] = [];
  const aiTeams = teams.filter(t => t.teamId !== userTeamId);
  const unsigned = prospects.filter(p => !p.signed);

  // Each AI team picks 1-3 prospects based on availability
  for (const team of aiTeams) {
    let picksRemaining: number;
    [picksRemaining, gen] = nextInt(gen, 1, 3);

    const available = unsigned.filter(p => !p.signed);
    if (available.length === 0) break;

    // Sort by scouted potential (best first)
    available.sort((a, b) => b.scoutedPotential - a.scoutedPotential);

    for (let i = 0; i < Math.min(picksRemaining, available.length); i++) {
      const prospect = available[i];
      const player = players.find(p => p.playerId === prospect.playerId);
      if (!player || player.teamId !== -1) continue;

      player.teamId = team.teamId;
      player.rosterData.rosterStatus = 'MINORS_INTL';
      player.rosterData.salary = prospect.signingBonus;
      prospect.signed = true;
      prospect.signedByTeamId = team.teamId;

      aiSignings.push({
        prospectName: prospect.name,
        teamId: team.teamId,
        teamAbbr: team.abbreviation,
        bonus: prospect.signingBonus,
      });
    }
  }

  return [aiSignings, gen];
}
