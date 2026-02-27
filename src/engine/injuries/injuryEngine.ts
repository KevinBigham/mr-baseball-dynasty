/**
 * Injury System — Mr. Baseball Dynasty
 *
 * Simulates realistic baseball injuries during the season:
 *   - Per-game injury probability based on player durability
 *   - Injury types: day-to-day, 10-day IL, 60-day IL
 *   - Position-specific injury patterns (pitchers vs hitters)
 *   - Recovery timelines with uncertainty
 *   - Injury-prone trait tracking
 *
 * Inspired by OOTP's injury system.
 */

import type { Player } from '../../types/player';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type InjurySeverity = 'day_to_day' | 'il_10' | 'il_60' | 'season_ending';

export interface Injury {
  playerId:     number;
  playerName:   string;
  teamId:       number;
  type:         string;          // "Hamstring strain", "UCL sprain", etc.
  severity:     InjurySeverity;
  gamesOut:     number;          // Total games to miss
  gamesRemaining: number;        // Countdown
  gameOccurred: number;          // Game number when injury happened
  isPitcher:    boolean;
}

export interface InjuryReport {
  activeInjuries: Injury[];
  seasonInjuries: Injury[];     // All injuries this season (including recovered)
  injuryCount:    number;
}

// ─── Injury types ───────────────────────────────────────────────────────────────

const HITTER_INJURIES = [
  { type: 'Hamstring strain',      weight: 15, minGames: 3,  maxGames: 30,  sevDist: [0.3, 0.5, 0.15, 0.05] },
  { type: 'Oblique strain',        weight: 12, minGames: 7,  maxGames: 35,  sevDist: [0.2, 0.6, 0.15, 0.05] },
  { type: 'Back spasms',           weight: 10, minGames: 1,  maxGames: 15,  sevDist: [0.5, 0.4, 0.08, 0.02] },
  { type: 'Knee soreness',         weight: 8,  minGames: 3,  maxGames: 45,  sevDist: [0.3, 0.4, 0.2,  0.1]  },
  { type: 'Wrist contusion',       weight: 7,  minGames: 1,  maxGames: 20,  sevDist: [0.4, 0.5, 0.08, 0.02] },
  { type: 'Ankle sprain',          weight: 7,  minGames: 5,  maxGames: 30,  sevDist: [0.2, 0.5, 0.2,  0.1]  },
  { type: 'Quad strain',           weight: 6,  minGames: 5,  maxGames: 25,  sevDist: [0.25, 0.55, 0.15, 0.05] },
  { type: 'Shoulder inflammation', weight: 5,  minGames: 10, maxGames: 40,  sevDist: [0.1, 0.5, 0.3,  0.1]  },
  { type: 'Calf strain',           weight: 5,  minGames: 3,  maxGames: 25,  sevDist: [0.3, 0.5, 0.15, 0.05] },
  { type: 'Concussion',            weight: 3,  minGames: 7,  maxGames: 21,  sevDist: [0.1, 0.7, 0.15, 0.05] },
  { type: 'Broken hand',           weight: 3,  minGames: 20, maxGames: 60,  sevDist: [0.0, 0.3, 0.5,  0.2]  },
  { type: 'Torn ACL',              weight: 2,  minGames: 100,maxGames: 162, sevDist: [0.0, 0.0, 0.1,  0.9]  },
];

const PITCHER_INJURIES = [
  { type: 'Forearm tightness',     weight: 15, minGames: 3,  maxGames: 20,  sevDist: [0.3, 0.5, 0.15, 0.05] },
  { type: 'Shoulder inflammation', weight: 12, minGames: 10, maxGames: 50,  sevDist: [0.1, 0.5, 0.3,  0.1]  },
  { type: 'Lat strain',            weight: 10, minGames: 15, maxGames: 45,  sevDist: [0.05, 0.4, 0.4, 0.15] },
  { type: 'Elbow inflammation',    weight: 10, minGames: 5,  maxGames: 30,  sevDist: [0.15, 0.5, 0.25, 0.1] },
  { type: 'Blister',               weight: 8,  minGames: 1,  maxGames: 10,  sevDist: [0.6, 0.35, 0.05, 0.0] },
  { type: 'Back spasms',           weight: 7,  minGames: 3,  maxGames: 20,  sevDist: [0.4, 0.45, 0.1,  0.05] },
  { type: 'Oblique strain',        weight: 7,  minGames: 10, maxGames: 35,  sevDist: [0.1, 0.5, 0.3,  0.1]  },
  { type: 'UCL sprain',            weight: 6,  minGames: 15, maxGames: 50,  sevDist: [0.05, 0.3, 0.4, 0.25] },
  { type: 'Tommy John (UCL tear)', weight: 4,  minGames: 120,maxGames: 162, sevDist: [0.0, 0.0, 0.05, 0.95] },
  { type: 'Rotator cuff tear',     weight: 3,  minGames: 100,maxGames: 162, sevDist: [0.0, 0.0, 0.1,  0.9]  },
  { type: 'Hamstring strain',      weight: 5,  minGames: 5,  maxGames: 25,  sevDist: [0.25, 0.5, 0.2,  0.05] },
];

// ─── Injury simulation ─────────────────────────────────────────────────────────

const BASE_INJURY_RATE_PER_GAME = 0.0015; // ~0.15% per player per game (~4 injuries per team per season)

function getInjuryProbability(player: Player): number {
  // Base rate adjusted by durability
  const durability = player.isPitcher
    ? (player.pitcherAttributes?.durability ?? 275)
    : (player.hitterAttributes?.durability ?? 275);

  // Durability 550 → 0.5x rate, durability 100 → 2x rate
  const durabilityFactor = Math.max(0.3, Math.min(2.5, 1.5 - (durability / 550)));

  // Age factor: older players get hurt more
  const ageFactor = player.age > 33 ? 1.5
    : player.age > 30 ? 1.2
    : player.age < 25 ? 0.8
    : 1.0;

  // Pitchers get hurt slightly more
  const positionFactor = player.isPitcher ? 1.15 : 1.0;

  return BASE_INJURY_RATE_PER_GAME * durabilityFactor * ageFactor * positionFactor;
}

function rollInjury(player: Player, gameNumber: number, rand: () => number, coachReduction = 0): Injury | null {
  const baseProb = getInjuryProbability(player);
  const prob = baseProb * (1 - coachReduction); // Coaching staff reduces injury rate
  if (rand() >= prob) return null;

  // Select injury type
  const injuries = player.isPitcher ? PITCHER_INJURIES : HITTER_INJURIES;
  const totalWeight = injuries.reduce((s, inj) => s + inj.weight, 0);
  let roll = rand() * totalWeight;
  let selectedInjury = injuries[0];
  for (const inj of injuries) {
    roll -= inj.weight;
    if (roll <= 0) { selectedInjury = inj; break; }
  }

  // Determine severity
  const sevRoll = rand();
  let severity: InjurySeverity;
  const [dtd, il10, il60, se] = selectedInjury.sevDist;
  if (sevRoll < dtd) severity = 'day_to_day';
  else if (sevRoll < dtd + il10) severity = 'il_10';
  else if (sevRoll < dtd + il10 + il60) severity = 'il_60';
  else severity = 'season_ending';
  void se;

  // Games out
  let gamesOut: number;
  if (severity === 'day_to_day') {
    gamesOut = Math.max(1, Math.min(3, Math.round(1 + rand() * 2)));
  } else if (severity === 'il_10') {
    gamesOut = Math.max(10, Math.round(selectedInjury.minGames + rand() * (Math.min(30, selectedInjury.maxGames) - selectedInjury.minGames)));
  } else if (severity === 'il_60') {
    gamesOut = Math.max(60, Math.round(selectedInjury.minGames + rand() * (selectedInjury.maxGames - selectedInjury.minGames)));
  } else {
    gamesOut = Math.max(100, Math.round(selectedInjury.maxGames * (0.8 + rand() * 0.2)));
  }

  return {
    playerId: player.playerId,
    playerName: player.name,
    teamId: player.teamId,
    type: selectedInjury.type,
    severity,
    gamesOut,
    gamesRemaining: gamesOut,
    gameOccurred: gameNumber,
    isPitcher: player.isPitcher,
  };
}

// ─── Season-level injury processing ─────────────────────────────────────────────

export function processSeasonInjuries(
  players: Player[],
  totalGames: number,
  seedFunc: (gameNum: number, playerIdx: number) => number,
  teamInjuryReduction?: Map<number, number>,  // teamId → reduction factor (0-0.15) from coaching
): InjuryReport {
  const activeInjuries: Injury[] = [];
  const seasonInjuries: Injury[] = [];

  // Only process MLB_ACTIVE players
  const eligible = players.filter(p =>
    p.rosterData.rosterStatus === 'MLB_ACTIVE' &&
    p.teamId > 0
  );

  // Simple seeded PRNG per evaluation
  function makeRand(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s = Math.imul(s + 0x9e3779b9, s + 0x9e3779b9) >>> 0;
      s = Math.imul(s ^ (s >>> 15), 0x85ebca6b) >>> 0;
      s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0;
      s = (s ^ (s >>> 16)) >>> 0;
      return s / 0x100000000;
    };
  }

  // Track which players are injured (can't get re-injured while on IL)
  const injuredUntil = new Map<number, number>(); // playerId → game number when healthy

  for (let gameNum = 1; gameNum <= totalGames; gameNum++) {
    // Recover players
    for (const [pid, untilGame] of injuredUntil) {
      if (gameNum >= untilGame) {
        injuredUntil.delete(pid);
        // Restore player status
        const player = eligible.find(p => p.playerId === pid);
        if (player && (player.rosterData.rosterStatus === 'MLB_IL_10' || player.rosterData.rosterStatus === 'MLB_IL_60')) {
          player.rosterData.rosterStatus = 'MLB_ACTIVE';
        }
      }
    }

    // Check for new injuries
    for (let i = 0; i < eligible.length; i++) {
      const player = eligible[i];
      if (player.rosterData.rosterStatus !== 'MLB_ACTIVE') continue;
      if (injuredUntil.has(player.playerId)) continue;

      const seed = seedFunc(gameNum, i);
      const rand = makeRand(seed);

      // Apply coaching staff injury reduction before rolling
      const coachReduction = teamInjuryReduction?.get(player.teamId) ?? 0;
      const injury = rollInjury(player, gameNum, rand, coachReduction);

      if (injury) {
        seasonInjuries.push(injury);

        // Apply roster status change
        if (injury.severity === 'il_10' || injury.severity === 'day_to_day') {
          player.rosterData.rosterStatus = 'MLB_IL_10';
        } else {
          player.rosterData.rosterStatus = 'MLB_IL_60';
        }

        injuredUntil.set(player.playerId, gameNum + injury.gamesOut);

        // If still injured at end of season, mark active
        if (gameNum + injury.gamesOut > totalGames) {
          activeInjuries.push(injury);
        }
      }
    }
  }

  // Restore all remaining injured players to active at end of season
  for (const player of eligible) {
    if (player.rosterData.rosterStatus === 'MLB_IL_10' || player.rosterData.rosterStatus === 'MLB_IL_60') {
      player.rosterData.rosterStatus = 'MLB_ACTIVE';
    }
  }

  return {
    activeInjuries,
    seasonInjuries,
    injuryCount: seasonInjuries.length,
  };
}
