/**
 * Clutch hitting modifier.
 *
 * In high-leverage situations (LI > 1.0), a batter's mental toughness
 * affects performance. Players with high mentalToughness (70+) see a
 * small boost to contact/power; players with low mentalToughness (30-)
 * get slightly worse. The effect scales with leverage — the more
 * pressure, the bigger the difference.
 *
 * The modifier feeds into the PA pipeline as a combined contact/power
 * adjustment, keeping total impact in the ±2-3% range on outcomes.
 */

/**
 * Compute a clutch modifier for the current plate appearance.
 *
 * @param mentalToughness Batter's mental toughness (0-100)
 * @param leverageIndex Current LI (0.3 to 2.5+)
 * @returns A modifier to apply to batter contact (additive, on 0-550 scale)
 */
export function getClutchModifier(
  mentalToughness: number,
  leverageIndex: number,
): number {
  // Only activate in above-average leverage (LI > 1.0)
  if (leverageIndex <= 1.0) return 0;

  // Scale: mentalToughness 50 = neutral, 100 = max positive, 0 = max negative
  const toughnessDelta = (mentalToughness - 50) / 50; // -1.0 to 1.0

  // Leverage excess above average, capped at 1.5 to prevent extreme values
  const leverageExcess = Math.min(1.5, leverageIndex - 1.0);

  // Contact boost: up to ±15 points on the 0-550 scale (~3% at extremes)
  return Math.round(toughnessDelta * leverageExcess * 10);
}
