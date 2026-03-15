/**
 * fakeStats.ts — Generate realistic career history for Year 1 players.
 *
 * Uses player attributes + gaussian noise to produce plausible stat lines.
 * Generates one season per service year (service time from rosterData).
 * Only MLB / AAA / AA players get fake stats (lower minors are too young).
 */

import type { RandomGenerator } from 'pure-rand';
import type { Player, PlayerSeason } from '../../types/player';
import { nextFloat, gaussian } from '../math/prng';

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Clamp a number to [min, max] */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Convert internal 0-550 attribute to 0-1 grade fraction */
function grade(attr: number): number {
  return clamp(attr / 550, 0, 1);
}

/** Gaussian with clamp */
function noisyClamp(
  gen: RandomGenerator,
  mean: number,
  sd: number,
  min: number,
  max: number,
): [number, RandomGenerator] {
  let v: number;
  [v, gen] = gaussian(gen, mean, sd);
  return [clamp(Math.round(v), min, max), gen];
}

/**
 * Age-based performance curve.
 * Returns a multiplier (0.65–1.00) applied to key stat drivers.
 *
 * - Prospect (≤22):   0.75–0.85 (developing)
 * - Ascending (23-26): 0.88–0.97 (rising)
 * - Prime (27-30):     1.00 (peak)
 * - Veteran (31-34):   0.92–0.97 (slight decline)
 * - Declining (35+):   0.70–0.88 (steeper decline)
 */
function ageCurve(age: number): number {
  if (age <= 20) return 0.75;
  if (age <= 22) return 0.75 + (age - 20) * 0.05;   // 0.75, 0.80, 0.85
  if (age <= 26) return 0.88 + (age - 23) * 0.03;    // 0.88, 0.91, 0.94, 0.97
  if (age <= 30) return 1.00;                          // peak
  if (age <= 34) return 1.00 - (age - 30) * 0.02;    // 0.98, 0.96, 0.94, 0.92
  if (age <= 37) return 0.88 - (age - 35) * 0.06;    // 0.88, 0.82, 0.76
  return 0.70;                                         // 38+
}

/**
 * Determine if this season should be an injury-shortened year.
 * Returns a games/IP fraction (1.0 = full season, 0.3-0.6 = injury year).
 * ~15% chance of injury year, ~5% chance of lost season.
 * Low durability increases probability.
 */
function injuryFraction(
  gen: RandomGenerator,
  durability: number,
): [number, RandomGenerator] {
  let roll: number;
  [roll, gen] = nextFloat(gen);
  // Durability grade (0-1) reduces injury chance
  const durGrade = clamp(durability / 550, 0, 1);
  const injuryThreshold = 0.12 + (1 - durGrade) * 0.10; // 12-22% base
  const lostThreshold = 0.03 + (1 - durGrade) * 0.04;   // 3-7% lost season

  if (roll < lostThreshold) {
    // Lost season: 15-35% of games
    let frac: number;
    [frac, gen] = nextFloat(gen);
    return [0.15 + frac * 0.20, gen];
  }
  if (roll < injuryThreshold) {
    // Injury year: 40-70% of games
    let frac: number;
    [frac, gen] = nextFloat(gen);
    return [0.40 + frac * 0.30, gen];
  }
  return [1.0, gen];
}

// ─── AB / IP budgets by level ───────────────────────────────────────────────────

const HITTER_AB: Record<string, { mean: number; sd: number }> = {
  MLB:  { mean: 520, sd: 80 },
  AAA:  { mean: 450, sd: 70 },
  AA:   { mean: 410, sd: 65 },
};

const SP_IP: Record<string, { mean: number; sd: number }> = {
  MLB:  { mean: 175, sd: 25 },
  AAA:  { mean: 140, sd: 20 },
  AA:   { mean: 120, sd: 20 },
};

const RP_IP: Record<string, { mean: number; sd: number }> = {
  MLB:  { mean: 62, sd: 12 },
  AAA:  { mean: 55, sd: 10 },
  AA:   { mean: 50, sd: 10 },
};

// ─── Hitter stat generation ─────────────────────────────────────────────────────

function generateHitterSeason(
  gen: RandomGenerator,
  player: Player,
  season: number,
  ageAtSeason?: number,
): [PlayerSeason, RandomGenerator] {
  const ha = player.hitterAttributes!;
  const level = player.leagueLevel;
  const abCfg = HITTER_AB[level] ?? HITTER_AB.AA;

  // Age curve: scale key attributes for this season's age
  const curve = ageAtSeason != null ? ageCurve(ageAtSeason) : 1.0;
  const contactG = grade(ha.contact) * curve;
  const powerG = grade(ha.power) * curve;
  const eyeG = grade(ha.eye) * curve;
  const speedG = grade(ha.speed) * (ageAtSeason != null && ageAtSeason >= 30
    ? curve * 0.95 : curve); // speed declines faster

  // Injury check
  let healthFrac: number;
  [healthFrac, gen] = injuryFraction(gen, ha.durability);

  let ab: number;
  [ab, gen] = noisyClamp(gen, abCfg.mean * healthFrac, abCfg.sd, 30, 650);

  // AVG derived from contact (grade 0-1 → AVG .200-.320)
  let avgBase: number;
  [avgBase, gen] = gaussian(gen, 0.200 + contactG * 0.120, 0.018);
  const avg = clamp(avgBase, 0.160, 0.340);
  const hits = Math.round(ab * avg);

  // HR derived from power
  const hrRate = powerG * 0.065; // max ~6.5% of AB
  let hrNoise: number;
  [hrNoise, gen] = gaussian(gen, hrRate * ab, 4);
  const hr = clamp(Math.round(hrNoise), 0, 55);

  // Doubles: ~4-8% of AB, contact-influenced
  let dblPct: number;
  [dblPct, gen] = gaussian(gen, 0.045 + contactG * 0.02, 0.008);
  const doubles = clamp(Math.round(ab * clamp(dblPct, 0.02, 0.09)), 0, 55);

  // Triples: rare, speed-influenced
  let triples: number;
  [triples, gen] = noisyClamp(gen, speedG * 8, 2, 0, 15);

  // RBI: HR * 3 + hits * 0.15 + noise
  let rbi: number;
  [rbi, gen] = noisyClamp(gen, hr * 3.2 + hits * 0.15, 10, 0, 160);

  // Runs: correlated with OBP and speed
  let runs: number;
  [runs, gen] = noisyClamp(gen, hits * 0.55 + hr * 0.35 + speedG * 15, 10, 0, 140);

  // BB: eye-driven, ~6-14% of PA (eye improves with age — veterans walk more)
  const eyeBoost = ageAtSeason != null && ageAtSeason >= 30 ? 1.05 : 1.0;
  const pa = ab + Math.round(ab * 0.12); // approximate PA
  let bb: number;
  [bb, gen] = noisyClamp(gen, eyeG * eyeBoost * 0.12 * pa, 8, 2, 120);

  // K: inverse of contact, ~12-28% of PA
  let kRate: number;
  [kRate, gen] = gaussian(gen, 0.28 - contactG * 0.14, 0.025);
  const k = clamp(Math.round(pa * clamp(kRate, 0.08, 0.35)), 0, 220);

  // SB: speed-driven
  let sb: number;
  [sb, gen] = noisyClamp(gen, speedG * 30, 6, 0, 60);

  // CS: ~25-35% of SB attempts
  let csPct: number;
  [csPct, gen] = nextFloat(gen);
  const cs = Math.round(sb * (0.25 + csPct * 0.10));

  // HBP: random small number
  let hbp: number;
  [hbp, gen] = noisyClamp(gen, 5, 3, 0, 20);

  // Games: rough estimate from AB
  const g = clamp(Math.round(ab / 3.5), 10, 162);

  return [{
    playerId: player.playerId,
    teamId: player.teamId,
    season,
    ab,
    hits,
    hr,
    rbi,
    runs,
    ip: 0,
    earnedRuns: 0,
    wins: 0,
    losses: 0,
    kPitching: 0,
    saves: 0,
    // Extended fields for display
    ...({
      g, pa: ab + bb + hbp, r: runs, h: hits,
      doubles, triples, bb, k, sb, cs, hbp,
      w: 0, l: 0, sv: 0, hld: 0, bs: 0,
      gp: 0, gs: 0, outs: 0, ha: 0, ra: 0, er: 0,
      bba: 0, ka: 0, hra: 0, pitchCount: 0,
    }),
  } as PlayerSeason, gen];
}

// ─── Pitcher stat generation ────────────────────────────────────────────────────

function generatePitcherSeason(
  gen: RandomGenerator,
  player: Player,
  season: number,
  ageAtSeason?: number,
): [PlayerSeason, RandomGenerator] {
  const pa = player.pitcherAttributes!;
  const level = player.leagueLevel;
  const isSP = player.position === 'SP';
  const isCL = player.position === 'CL';
  const ipCfg = isSP
    ? (SP_IP[level] ?? SP_IP.AA)
    : (RP_IP[level] ?? RP_IP.AA);

  // Age curve
  const curve = ageAtSeason != null ? ageCurve(ageAtSeason) : 1.0;

  // Injury check
  let healthFrac: number;
  [healthFrac, gen] = injuryFraction(gen, pa.durability);

  let ip: number;
  [ip, gen] = noisyClamp(gen, ipCfg.mean * healthFrac, ipCfg.sd, 8, 240);

  // ERA derived from stuff + command + movement (avg grade → ERA 2.80-5.20)
  // Command improves with age (veterans locate better), stuff declines
  const stuffG = grade(pa.stuff) * curve;
  const commandG = grade(pa.command) * Math.min(curve * 1.05, 1.0); // command ages well
  const movementG = grade(pa.movement) * curve;
  const pitchGrade = (stuffG + commandG + movementG) / 3;
  let era: number;
  [era, gen] = gaussian(gen, 5.20 - pitchGrade * 2.40, 0.45);
  era = clamp(era, 1.80, 7.00);
  const earnedRuns = Math.round(era * ip / 9);

  // K/9: stuff-driven (5.5-12.5)
  let k9: number;
  [k9, gen] = gaussian(gen, 5.5 + grade(pa.stuff) * 7.0, 0.8);
  k9 = clamp(k9, 4.0, 14.0);
  const kPitching = Math.round(k9 * ip / 9);

  // BB/9: command-driven (1.5-5.0)
  let bb9: number;
  [bb9, gen] = gaussian(gen, 5.0 - grade(pa.command) * 3.5, 0.5);
  bb9 = clamp(bb9, 1.0, 6.0);
  const bba = Math.round(bb9 * ip / 9);

  // Hits allowed: WHIP-derived
  let whip: number;
  [whip, gen] = gaussian(gen, 1.60 - pitchGrade * 0.50, 0.10);
  whip = clamp(whip, 0.85, 1.80);
  const ha = Math.round(whip * ip - bba);

  // HR allowed: ~1.0-1.5 per 9 IP
  let hr9: number;
  [hr9, gen] = gaussian(gen, 1.30 - grade(pa.movement) * 0.40, 0.20);
  hr9 = clamp(hr9, 0.4, 2.0);
  const hra = Math.round(hr9 * ip / 9);

  // Wins/Losses (SP-focused)
  let wins: number, losses: number;
  if (isSP) {
    const gs = Math.round(ip / 5.8);
    const winPct = clamp(0.35 + pitchGrade * 0.25, 0.30, 0.70);
    const decisions = Math.round(gs * 0.65);
    wins = Math.round(decisions * winPct);
    losses = decisions - wins;
    [wins, gen] = noisyClamp(gen, wins, 2, 1, 25);
    [losses, gen] = noisyClamp(gen, losses, 2, 1, 20);
  } else {
    [wins, gen] = noisyClamp(gen, 3, 1.5, 0, 8);
    [losses, gen] = noisyClamp(gen, 3, 1.5, 0, 8);
  }

  // Saves (CL only)
  let saves = 0;
  if (isCL) {
    [saves, gen] = noisyClamp(gen, 20 + pitchGrade * 18, 6, 5, 50);
  }

  // Games/starts
  const gp = isSP ? Math.round(ip / 5.8) : Math.round(ip / 1.2);
  const gs = isSP ? gp : 0;
  const outs = Math.round(ip * 3);
  const ra = earnedRuns + Math.round(earnedRuns * 0.12); // unearned ~12% of ER

  // Holds/blown saves for RP
  let hld = 0, bs = 0;
  if (!isSP && !isCL) {
    [hld, gen] = noisyClamp(gen, 8, 4, 0, 30);
    [bs, gen] = noisyClamp(gen, 2, 1.5, 0, 8);
  }
  if (isCL) {
    [bs, gen] = noisyClamp(gen, 4, 2, 0, 12);
  }

  // Pitch count: ~15 per IP for SP, ~14 for RP
  const pitchCount = Math.round(ip * (isSP ? 15.2 : 14.0));

  return [{
    playerId: player.playerId,
    teamId: player.teamId,
    season,
    ab: 0,
    hits: 0,
    hr: 0,
    rbi: 0,
    runs: 0,
    ip,
    earnedRuns,
    wins,
    losses,
    kPitching,
    saves,
    // Extended fields for display
    ...({
      g: gp, pa: 0, r: 0, h: 0,
      doubles: 0, triples: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0,
      w: wins, l: losses, sv: saves, hld, bs,
      gp, gs, outs, ha, ra, er: earnedRuns, bba, ka: kPitching, hra,
      pitchCount,
    }),
  } as PlayerSeason, gen];
}

// ─── Public API ─────────────────────────────────────────────────────────────────

const ELIGIBLE_LEVELS = new Set(['MLB', 'AAA', 'AA']);

/**
 * Generate fake career history for all eligible players.
 *
 * Each player gets one season per service year (serviceTimeDays / 172),
 * with at least 1 season for eligible players. Seasons are labeled with
 * real calendar years counting back from `currentYear` (e.g. 2026, 2025...).
 *
 * Returns:
 *   - careerMap: playerId → PlayerSeason[] (all fake seasons, oldest first)
 *   - latestMap: playerId → PlayerSeason (most recent fake season)
 *   - updated PRNG
 */
export function generateFakeCareerHistory(
  gen: RandomGenerator,
  players: Player[],
  currentYear: number,
): [Map<number, PlayerSeason[]>, Map<number, PlayerSeason>, RandomGenerator] {
  const careerMap = new Map<number, PlayerSeason[]>();
  const latestMap = new Map<number, PlayerSeason>();

  for (const p of players) {
    if (!ELIGIBLE_LEVELS.has(p.leagueLevel)) continue;

    const serviceYears = Math.max(1, Math.floor(p.rosterData.serviceTimeDays / 172));
    const seasons: PlayerSeason[] = [];

    for (let i = 0; i < serviceYears; i++) {
      // Year label: count backwards from (currentYear - 1)
      // e.g. 7 service years → 2025, 2024, 2023, 2022, 2021, 2020, 2019
      const yearLabel = currentYear - 1 - i;
      // Age at that season: current age minus years ago
      const ageAtSeason = p.age - i;
      let stats: PlayerSeason;
      if (p.isPitcher) {
        [stats, gen] = generatePitcherSeason(gen, p, yearLabel, ageAtSeason);
      } else {
        [stats, gen] = generateHitterSeason(gen, p, yearLabel, ageAtSeason);
      }
      seasons.push(stats);
    }

    // Reverse so oldest season is first (chronological order)
    seasons.reverse();
    careerMap.set(p.playerId, seasons);
    latestMap.set(p.playerId, seasons[seasons.length - 1]);
  }

  return [careerMap, latestMap, gen];
}
