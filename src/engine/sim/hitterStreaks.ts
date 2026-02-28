import type { PlayerGameStats } from '../../types/player';

/**
 * Hitter hot/cold streak tracking.
 *
 * Maintains a rolling window of recent game performance per hitter.
 * Hot hitters get a small contact boost, cold hitters a small penalty.
 * Purely deterministic — no PRNG consumption.
 *
 * Window: last 7 games played (not calendar games — only games with ≥1 AB).
 * Hot:  BA ≥ .370 over window → +12 contact (on 0-550 scale)
 * Cold: BA ≤ .130 over window → -12 contact
 * Neutral: no modifier
 *
 * Requires ≥ 15 AB in the window to activate (avoids small-sample noise).
 */

const WINDOW_SIZE = 7;        // Rolling game window
const MIN_AB = 15;            // Minimum AB to qualify
const HOT_THRESHOLD = 0.370;  // BA threshold for hot streak
const COLD_THRESHOLD = 0.130; // BA threshold for cold streak
const CONTACT_MOD = 12;       // ±12 on 0-550 scale (~2 scouting grades)

/** Per-game batting line stored in the rolling buffer. */
interface GameLine {
  ab: number;
  h: number;
}

/** Rolling streak state for one hitter. */
export interface HitterStreakState {
  /** Circular buffer of recent games (max WINDOW_SIZE). */
  games: GameLine[];
  /** Total AB across the window. */
  totalAB: number;
  /** Total hits across the window. */
  totalH: number;
}

/** Create a fresh (empty) streak state. */
export function emptyStreak(): HitterStreakState {
  return { games: [], totalAB: 0, totalH: 0 };
}

/**
 * Update a hitter's streak after a game.
 * Only records games where the player had at least 1 AB.
 */
export function updateStreak(
  state: HitterStreakState,
  gs: PlayerGameStats,
): HitterStreakState {
  if (gs.ab === 0) return state; // Didn't play or only walked — skip

  const line: GameLine = { ab: gs.ab, h: gs.h };
  const games = [...state.games, line];
  let totalAB = state.totalAB + line.ab;
  let totalH = state.totalH + line.h;

  // Evict oldest game if over window size
  while (games.length > WINDOW_SIZE) {
    const evicted = games.shift()!;
    totalAB -= evicted.ab;
    totalH -= evicted.h;
  }

  return { games, totalAB, totalH };
}

/**
 * Compute the contact modifier for a hitter based on their streak state.
 * Returns a value to add to contact (positive = hot, negative = cold, 0 = neutral).
 */
export function getStreakContactModifier(state: HitterStreakState | undefined): number {
  if (!state || state.totalAB < MIN_AB) return 0;

  const ba = state.totalH / state.totalAB;

  if (ba >= HOT_THRESHOLD) return CONTACT_MOD;
  if (ba <= COLD_THRESHOLD) return -CONTACT_MOD;
  return 0;
}

/**
 * Batch-update all hitter streaks from a game's batting stats.
 */
export function updateAllStreaks(
  streaks: Map<number, HitterStreakState>,
  gameStats: PlayerGameStats[],
): void {
  for (const gs of gameStats) {
    const current = streaks.get(gs.playerId) ?? emptyStreak();
    streaks.set(gs.playerId, updateStreak(current, gs));
  }
}
