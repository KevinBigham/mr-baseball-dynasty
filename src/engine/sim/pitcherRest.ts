import type { Player } from '../../types/player';

/**
 * Pitcher rest tracking between games.
 *
 * Tracks each pitcher's last appearance (game index) and pitch count,
 * then determines availability and fatigue modifiers for future games.
 */

export interface PitcherRestEntry {
  lastGameIndex: number;  // Index in the season schedule
  pitchCount: number;     // Pitches thrown in that appearance
  wasStart: boolean;      // Was it a start (vs relief)?
}

export type PitcherRestMap = Map<number, PitcherRestEntry>;

// ─── Rest requirements ──────────────────────────────────────────────────────

/** Minimum games between starts (standard 5-man rotation = 4 rest games) */
const MIN_STARTER_REST_GAMES = 4;

/** Relievers need 1 game rest after 30+ pitch outing */
const RELIEVER_HIGH_PITCH_THRESHOLD = 30;

/** Relievers need 1 game rest after back-to-back appearances */
const MAX_CONSECUTIVE_RELIEF_GAMES = 2;

// ─── Availability checks ────────────────────────────────────────────────────

/**
 * Check if a starting pitcher is available to start this game.
 * Starters need at least MIN_STARTER_REST_GAMES between starts.
 */
export function isStarterAvailable(
  pitcher: Player,
  currentGameIndex: number,
  restMap: PitcherRestMap,
): boolean {
  const entry = restMap.get(pitcher.playerId);
  if (!entry) return true; // Never pitched yet this season

  const gamesSinceLastAppearance = currentGameIndex - entry.lastGameIndex;

  if (entry.wasStart) {
    // Standard rest: 4 games between starts
    // High recovery rate pitchers can come back 1 game sooner
    const recoveryRate = pitcher.pitcherAttributes?.recoveryRate ?? 350;
    const restBonus = recoveryRate >= 470 ? 1 : 0;
    return gamesSinceLastAppearance >= (MIN_STARTER_REST_GAMES - restBonus);
  }

  // If they relieved, they need 2 games before starting
  return gamesSinceLastAppearance >= 2;
}

/**
 * Check if a reliever is available for this game.
 * Relievers are unavailable if they:
 * - Pitched 30+ pitches and it's the very next game
 * - Pitched 3 consecutive games (need a day off)
 */
export function isRelieverAvailable(
  pitcher: Player,
  currentGameIndex: number,
  restMap: PitcherRestMap,
): boolean {
  const entry = restMap.get(pitcher.playerId);
  if (!entry) return true;

  const gamesSince = currentGameIndex - entry.lastGameIndex;

  // Always available after 2+ games of rest
  if (gamesSince >= 2) return true;

  // Pitched yesterday — check if high-pitch outing
  if (gamesSince === 1) {
    if (entry.pitchCount >= RELIEVER_HIGH_PITCH_THRESHOLD) {
      // High recovery rate can still go
      const recoveryRate = pitcher.pitcherAttributes?.recoveryRate ?? 350;
      return recoveryRate >= 470;
    }
    return true; // Low-pitch outing, available next day
  }

  // Same game index (shouldn't happen, but be safe)
  return false;
}

// ─── Fatigue modifier ───────────────────────────────────────────────────────

/**
 * Returns a fatigue modifier (0.0 to 1.0 penalty) based on rest.
 * 0.0 = fully rested, higher = more fatigued.
 * Applied to stuff/command during the game.
 */
export function getFatigueModifier(
  pitcher: Player,
  currentGameIndex: number,
  restMap: PitcherRestMap,
): number {
  const entry = restMap.get(pitcher.playerId);
  if (!entry) return 0; // Fully rested

  const gamesSince = currentGameIndex - entry.lastGameIndex;
  const recoveryRate = pitcher.pitcherAttributes?.recoveryRate ?? 350;
  const recoveryFactor = recoveryRate / 550; // 0-1, higher = faster recovery

  if (entry.wasStart) {
    // Starters on short rest (3 games instead of 4)
    if (gamesSince === 3) return 0.08 - recoveryFactor * 0.04; // ~4-8% penalty
    if (gamesSince <= 2) return 0.15 - recoveryFactor * 0.06;  // Major penalty
    return 0; // Normal rest
  }

  // Relievers
  if (gamesSince === 0) return 0.10; // Same game (shouldn't happen in practice)
  if (gamesSince === 1 && entry.pitchCount >= RELIEVER_HIGH_PITCH_THRESHOLD) {
    return 0.06 - recoveryFactor * 0.03; // Tired from heavy outing yesterday
  }
  return 0;
}

// ─── Recording appearances ──────────────────────────────────────────────────

/**
 * Record a pitcher's appearance after a game.
 */
export function recordAppearance(
  restMap: PitcherRestMap,
  playerId: number,
  gameIndex: number,
  pitchCount: number,
  wasStart: boolean,
): void {
  restMap.set(playerId, { lastGameIndex: gameIndex, pitchCount, wasStart });
}
