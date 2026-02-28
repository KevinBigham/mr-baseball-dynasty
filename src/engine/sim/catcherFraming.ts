import type { Player } from '../../types/player';

/**
 * Catcher framing effect.
 *
 * Elite catchers can gain ~20 runs over a season through pitch framing
 * — getting borderline pitches called as strikes. This translates to
 * a small but meaningful modifier on K and BB rates.
 *
 * Real MLB framing leaders add ~15-20 strike calls per season above
 * average. We model this as a ±2-3% K/BB rate modifier.
 *
 * Uses the catcher's defensiveIQ attribute (0-550 scale, 400 = average):
 * - High defensiveIQ (500+): more strikes called → higher K, lower BB
 * - Low defensiveIQ (300-): fewer strikes → lower K, higher BB
 */

export interface FramingModifier {
  kMod: number;   // Multiplied on K rate (> 1 = more Ks)
  bbMod: number;  // Multiplied on BB rate (< 1 = fewer walks)
}

/**
 * Get the framing modifier for the current catcher.
 * Returns neutral (1.0/1.0) if no catcher or no attributes.
 */
export function getFramingModifier(catcher: Player | null): FramingModifier {
  if (!catcher || !catcher.hitterAttributes) {
    return { kMod: 1.0, bbMod: 1.0 };
  }

  // Framing correlates with defensiveIQ and fielding
  const defIQ = catcher.hitterAttributes.defensiveIQ;
  const fielding = catcher.hitterAttributes.fielding;

  // Blend: 70% defensiveIQ, 30% fielding (framing is mostly about feel)
  const framingSkill = defIQ * 0.7 + fielding * 0.3;
  const avgSkill = 400;

  // Delta from average, normalized
  const delta = (framingSkill - avgSkill) / avgSkill; // roughly -0.3 to +0.3

  // K rate modifier: good framing → more Ks (multiplier > 1)
  // BB rate modifier: good framing → fewer walks (multiplier < 1)
  // Cap at ±3% effect
  const kMod = Math.max(0.97, Math.min(1.03, 1.0 + delta * 0.10));
  const bbMod = Math.max(0.97, Math.min(1.03, 1.0 - delta * 0.10));

  return { kMod, bbMod };
}
