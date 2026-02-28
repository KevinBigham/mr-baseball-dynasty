/**
 * Experience-based modifiers for rookies and veterans.
 *
 * Rookie pitchers face a "nervousness" penalty in high-leverage
 * situations — their lack of experience leads to slightly more
 * walks. Veterans with 6+ years of service time get a small
 * command bonus from their experience reading hitters.
 *
 * Effects:
 * - Rookies (<172 service days): up to +2% BB rate in high-LI spots
 * - Veterans (1032+ service days / 6+ years): up to -1% BB rate
 * No PRNG consumption — deterministic from service time + leverage.
 */

import type { Player } from '../../types/player';

/** One full MLB season in service days */
const ROOKIE_THRESHOLD = 172;

/** 6 full seasons = established veteran */
const VETERAN_THRESHOLD = 172 * 6;

/**
 * Compute BB rate modifier from pitcher experience level.
 *
 * @param pitcher The pitcher
 * @param leverageIndex Current leverage index (1.0 = average)
 * @returns BB rate multiplier (0.99 to 1.02)
 */
export function getExperienceBBMod(pitcher: Player, leverageIndex: number): number {
  const serviceDays = pitcher.rosterData?.serviceTimeDays ?? 500;

  // Rookies: nervousness in high-leverage spots
  if (serviceDays < ROOKIE_THRESHOLD) {
    // Only applies in above-average leverage (LI > 1.2)
    if (leverageIndex <= 1.2) return 1.0;

    // Scale by how much of a rookie they are (fewer days = more nervous)
    const rookieScale = 1.0 - serviceDays / ROOKIE_THRESHOLD; // 1.0 for 0 days, 0 for full season
    const liScale = Math.min(1, (leverageIndex - 1.2) / 1.0); // 0 to 1 based on leverage

    // Up to +2% BB rate for complete rookie in max leverage
    return 1.0 + rookieScale * liScale * 0.02;
  }

  // Veterans: experience reading hitters reduces walks
  if (serviceDays >= VETERAN_THRESHOLD) {
    const vetScale = Math.min(1, (serviceDays - VETERAN_THRESHOLD) / (172 * 4)); // 0 to 1 over next 4 years
    // Up to -1% BB rate for long-tenured veterans
    return 1.0 - vetScale * 0.01;
  }

  return 1.0;
}
