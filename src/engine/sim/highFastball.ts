import type { Player } from '../../types/player';

/**
 * High-fastball swing-and-miss mechanic.
 *
 * Pitchers with elite stuff and heavy fastball usage generate more
 * swing-and-miss, especially against free-swinging batters (low eye).
 *
 * The effect is a K rate multiplier:
 *   - High stuff + high FB% vs low eye batter: up to +6% K rate
 *   - Average matchup: no effect
 *   - Low stuff or disciplined batter: no effect (never helps the hitter)
 *
 * No PRNG consumption — derived from pitcher/batter attributes.
 */

/**
 * Compute K rate multiplier for high-fastball swing-and-miss.
 *
 * @param pitcher Current pitcher
 * @param batter Current batter
 * @returns K rate multiplier (≥ 1.0, never reduces Ks)
 */
export function getHighFastballKMod(pitcher: Player, batter: Player): number {
  const p = pitcher.pitcherAttributes;
  const h = batter.hitterAttributes;
  if (!p || !h) return 1.0;

  // Only activates for power pitchers (stuff > 420) with significant FB usage
  if (p.stuff < 420) return 1.0;

  const fbPct = p.pitchTypeMix?.fastball ?? 0.55;
  if (fbPct < 0.45) return 1.0; // Not a fastball-heavy pitcher

  // Stuff advantage over league average
  const stuffEdge = (p.stuff - 420) / 130; // 0 at 420, 1.0 at 550

  // Batter discipline: low eye = more chase, high eye = lays off
  const chaseFactor = Math.max(0, (420 - h.eye) / 170); // 0 if eye ≥ 420, 1.0 at eye=250

  // Fastball dominance: more FB usage amplifies effect
  const fbFactor = (fbPct - 0.45) / 0.25; // 0 at 45%, 1.0 at 70%+

  // Combined effect: all three factors must align for meaningful boost
  const effect = stuffEdge * chaseFactor * Math.min(1, fbFactor) * 0.06;

  return 1.0 + Math.min(0.06, effect); // Cap at +6% K rate
}
