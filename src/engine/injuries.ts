/**
 * injuries.ts — Injury engine: durability-gated, age-adjusted, position-aware.
 *
 * Called as post-processing after the season simulator completes.
 * We iterate game-by-game through the schedule, check each active MLB player
 * for injury events, and track IL stints / recovery.
 */

import type { Player, InjuryRecord, InjurySeverity, RosterStatus } from '../types/player';

// ─── Injury type tables ──────────────────────────────────────────────────────

interface InjuryType {
  name: string;
  severity: InjurySeverity;
  ilDays: number;
  positionBias: 'any' | 'pitcher' | 'hitter';
  weight: number;  // relative frequency
}

const INJURY_TYPES: InjuryType[] = [
  // Minor (10-day IL)
  { name: 'Hamstring tightness',      severity: 'minor', ilDays: 10, positionBias: 'any',     weight: 15 },
  { name: 'Lower back stiffness',     severity: 'minor', ilDays: 10, positionBias: 'any',     weight: 12 },
  { name: 'Oblique strain',           severity: 'minor', ilDays: 15, positionBias: 'hitter',  weight: 10 },
  { name: 'Groin tightness',          severity: 'minor', ilDays: 12, positionBias: 'any',     weight: 8  },
  { name: 'Calf strain',              severity: 'minor', ilDays: 10, positionBias: 'any',     weight: 8  },
  { name: 'Finger blister',           severity: 'minor', ilDays: 10, positionBias: 'pitcher', weight: 6  },
  { name: 'Wrist inflammation',       severity: 'minor', ilDays: 12, positionBias: 'hitter',  weight: 5  },
  // Moderate (60-day IL)
  { name: 'Shoulder inflammation',    severity: 'moderate', ilDays: 45, positionBias: 'pitcher', weight: 8  },
  { name: 'Elbow inflammation',       severity: 'moderate', ilDays: 50, positionBias: 'pitcher', weight: 7  },
  { name: 'Knee sprain',              severity: 'moderate', ilDays: 40, positionBias: 'any',     weight: 5  },
  { name: 'Hamstring strain (Grade 2)',severity: 'moderate', ilDays: 35, positionBias: 'any',     weight: 5  },
  { name: 'Oblique tear',             severity: 'moderate', ilDays: 45, positionBias: 'hitter',  weight: 4  },
  { name: 'Concussion',               severity: 'moderate', ilDays: 30, positionBias: 'any',     weight: 3  },
  // Severe (season-ending)
  { name: 'UCL tear',                 severity: 'severe', ilDays: 180, positionBias: 'pitcher', weight: 3 },
  { name: 'ACL tear',                 severity: 'severe', ilDays: 200, positionBias: 'any',     weight: 2 },
  { name: 'Labrum tear',              severity: 'severe', ilDays: 150, positionBias: 'pitcher', weight: 2 },
  { name: 'Achilles rupture',         severity: 'severe', ilDays: 220, positionBias: 'any',     weight: 1 },
  { name: 'Broken bone (hand/wrist)', severity: 'severe', ilDays: 90,  positionBias: 'hitter',  weight: 2 },
];

// ─── Core probability ────────────────────────────────────────────────────────

function getDurability(player: Player): number {
  if (player.isPitcher && player.pitcherAttributes) return player.pitcherAttributes.durability;
  if (!player.isPitcher && player.hitterAttributes) return player.hitterAttributes.durability;
  return 275; // default mid-range
}

/**
 * Per-game injury probability for a single player.
 * Returns 0–1 (typically 0.001–0.005 range).
 */
export function injuryProbability(player: Player): number {
  const durability = getDurability(player);
  const durabilityFactor = 1.0 - (durability / 550) * 0.7;
  const ageFactor = player.age > 30 ? 1.0 + (player.age - 30) * 0.05 : 1.0;
  const pitcherFactor = player.isPitcher ? 1.3 : 1.0;
  const baseRate = 0.002;
  return baseRate * durabilityFactor * ageFactor * pitcherFactor;
}

// ─── Deterministic injury selection ──────────────────────────────────────────

function selectInjuryType(player: Player, seed: number): InjuryType {
  const eligible = INJURY_TYPES.filter(t =>
    t.positionBias === 'any' ||
    (t.positionBias === 'pitcher' && player.isPitcher) ||
    (t.positionBias === 'hitter' && !player.isPitcher)
  );
  const totalWeight = eligible.reduce((s, t) => s + t.weight, 0);
  let roll = (seed % totalWeight);
  for (const t of eligible) {
    roll -= t.weight;
    if (roll < 0) return t;
  }
  return eligible[eligible.length - 1];
}

function generateDescription(player: Player, injuryType: InjuryType): string {
  return `${player.name} placed on the ${injuryType.severity === 'minor' ? '10-day' : injuryType.severity === 'moderate' ? '60-day' : 'season-ending'} IL with ${injuryType.name.toLowerCase()}.`;
}

// ─── Injury event ────────────────────────────────────────────────────────────

export interface InjuryEvent {
  playerId: number;
  playerName: string;
  teamId: number;
  injury: InjuryRecord;
}

// ─── Season injury simulation (post-processing) ─────────────────────────────

/**
 * Process injuries for an entire season. Called after the main sim completes.
 * Uses a deterministic seed-based approach (playerId + gameNumber) so injuries
 * are reproducible for the same save state.
 *
 * @param players — all players in the league
 * @param totalGames — total scheduled games (typically 2430)
 * @param baseSeed — PRNG seed for this season
 * @param season — current season year
 * @returns list of injury events that occurred
 */
export function processSeasonInjuries(
  players: Player[],
  totalGames: number,
  baseSeed: number,
  season: number,
): InjuryEvent[] {
  const events: InjuryEvent[] = [];

  // Only check MLB active players (not minors, not already on IL)
  const mlbPlayers = players.filter(p =>
    p.rosterData.rosterStatus === 'MLB_ACTIVE' && p.teamId >= 1
  );

  // Simulate day-by-day (162 game days, ~15 games per day)
  const gameDays = 162;
  const gamesPerDay = Math.ceil(totalGames / gameDays);

  for (let day = 0; day < gameDays; day++) {
    const gameNum = day * gamesPerDay;

    // Tick recovery for injured players
    for (const p of players) {
      const injury = p.rosterData.currentInjury;
      if (injury && injury.recoveryDaysRemaining > 0) {
        injury.recoveryDaysRemaining--;
        if (injury.recoveryDaysRemaining <= 0) {
          // Auto-return from IL
          if (p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60') {
            p.rosterData.rosterStatus = 'MLB_ACTIVE';
          }
          p.rosterData.currentInjury = undefined;
        }
      }
    }

    // Check for new injuries among active players
    for (const p of mlbPlayers) {
      // Skip if already injured
      if (p.rosterData.currentInjury) continue;
      if (p.rosterData.rosterStatus !== 'MLB_ACTIVE') continue;

      const prob = injuryProbability(p);
      // Deterministic "roll" using player ID and game day as seed
      const roll = ((p.playerId * 7919 + day * 31 + baseSeed) % 10000) / 10000;

      if (roll < prob) {
        const typeSeed = Math.abs(p.playerId * 3571 + day * 13 + baseSeed);
        const injuryType = selectInjuryType(p, typeSeed);

        const ilStatus: RosterStatus = injuryType.severity === 'minor' ? 'MLB_IL_10' : 'MLB_IL_60';

        const record: InjuryRecord = {
          type: injuryType.name,
          description: generateDescription(p, injuryType),
          severity: injuryType.severity,
          ilDays: injuryType.ilDays,
          recoveryDaysRemaining: injuryType.ilDays,
          gameInjured: gameNum,
          season,
        };

        p.rosterData.rosterStatus = ilStatus;
        p.rosterData.currentInjury = record;

        events.push({
          playerId: p.playerId,
          playerName: p.name,
          teamId: p.teamId,
          injury: record,
        });
      }
    }
  }

  return events;
}
