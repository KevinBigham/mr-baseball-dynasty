/**
 * Umpire strike zone variation.
 *
 * Each game gets a deterministic "umpire" derived from the game seed.
 * Umpire tendencies affect K and BB rates:
 *
 *   - Tight zone (pitcher's ump): more walks, fewer strikeouts
 *   - Wide zone (hitter's ump):  fewer walks, more strikeouts
 *   - Neutral: no modifier
 *
 * Uses a deterministic hash (no PRNG consumption) to preserve the game's
 * random number chain.
 *
 * Modifier range: ±4% on K and BB rates (opposite directions).
 * Real MLB umpire variation is roughly ±3-5% on called-strike rate.
 */

/** Hash function for deterministic umpire assignment. */
function umpireHash(seed: number): number {
  let h = seed ^ 0x5A3C_69D1;
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return (h ^ (h >>> 16)) >>> 0;
}

export interface UmpireModifiers {
  /** K rate multiplier (> 1 = more Ks, < 1 = fewer Ks) */
  kMod: number;
  /** BB rate multiplier (> 1 = more BBs, < 1 = fewer BBs) */
  bbMod: number;
  /** Zone tendency label for display */
  zoneTendency: 'tight' | 'wide' | 'neutral';
}

/**
 * Generate deterministic umpire modifiers for a game.
 *
 * @param gameSeed The game's unique seed
 * @returns K/BB rate modifiers and zone tendency label
 */
export function generateUmpire(gameSeed: number): UmpireModifiers {
  const h = umpireHash(gameSeed);
  // Normalize to 0-1
  const zoneVal = (h % 1000) / 1000;

  // 30% tight zone, 30% wide zone, 40% neutral
  if (zoneVal < 0.30) {
    // Tight zone: pitcher's ump — more walks, fewer strikeouts
    const intensity = 0.02 + (zoneVal / 0.30) * 0.02; // 0.02–0.04
    return {
      kMod: 1 - intensity,   // 0.96–0.98
      bbMod: 1 + intensity,  // 1.02–1.04
      zoneTendency: 'tight',
    };
  } else if (zoneVal >= 0.70) {
    // Wide zone: hitter's ump — fewer walks, more strikeouts
    const intensity = 0.02 + ((zoneVal - 0.70) / 0.30) * 0.02; // 0.02–0.04
    return {
      kMod: 1 + intensity,   // 1.02–1.04
      bbMod: 1 - intensity,  // 0.96–0.98
      zoneTendency: 'wide',
    };
  }

  return { kMod: 1, bbMod: 1, zoneTendency: 'neutral' };
}
