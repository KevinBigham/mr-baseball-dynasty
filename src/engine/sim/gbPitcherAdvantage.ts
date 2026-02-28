/**
 * Ground ball pitcher advantage.
 *
 * Extreme ground ball pitchers (GB tendency > 55%) benefit from
 * a slightly lower BABIP because ground balls are more routine
 * outs than line drives. This provides a small BABIP reduction
 * for heavy GB pitchers.
 *
 * Effect: up to -0.005 BABIP for extreme GB pitchers.
 * No PRNG consumption — deterministic from pitcher attributes.
 */

/**
 * Compute BABIP modifier for ground ball pitchers.
 *
 * @param gbTendency Pitcher's gbFbTendency (0-100, higher = more GB)
 * @returns BABIP modifier (0 to -0.005)
 */
export function getGBPitcherBABIPMod(gbTendency: number): number {
  // Only extreme GB pitchers (> 55 tendency) get this bonus
  if (gbTendency <= 55) return 0;

  // Scale: 0 at 55, up to -0.005 at 100
  return -Math.min(0.005, (gbTendency - 55) / 45 * 0.005);
}
