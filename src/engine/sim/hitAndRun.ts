import type { Player } from '../../types/player';

/**
 * Hit-and-run decision logic.
 *
 * The hit-and-run is called with a runner on 1st and < 2 outs.
 * The runner breaks for 2nd on the pitch. The batter tries to
 * make contact (higher contact rate, lower power). If the batter
 * makes contact, the runner advances an extra base. If the batter
 * strikes out, the runner is caught stealing.
 */

/**
 * Determine if the manager should call a hit-and-run.
 *
 * Conditions:
 * - Runner on 1st only (no runner on 2nd/3rd)
 * - Less than 2 outs
 * - Batter has good contact (320+)
 * - Runner has decent speed (330+)
 * - Not a power hitter (power < 450) — don't sacrifice power
 */
export function shouldHitAndRun(
  batter: Player,
  runners: number,
  outs: number,
): boolean {
  if (outs >= 2) return false;
  // Runner on 1st only, no one on 2nd or 3rd
  if ((runners & 0b001) === 0 || (runners & 0b110) !== 0) return false;

  const h = batter.hitterAttributes;
  if (!h) return false;

  const contact = h.contact;
  const power = h.power;
  const speed = h.speed;

  // Good contact batters, not sluggers, with a fast runner
  if (contact < 380) return false;  // Need strong contact
  if (power >= 420) return false;   // Don't sacrifice any decent power
  if (speed < 380) return false;    // Need real speed on the bases

  // ~3% of eligible PAs — rare but impactful
  return contact >= 420 && power < 380 && speed >= 400;
}

/**
 * Apply hit-and-run modifiers to the PA.
 *
 * Returns modifiers that should be applied to the plate appearance:
 * - Contact bonus: +10% (batter must swing)
 * - Power penalty: -15% (protecting, not driving)
 * - K rate reduction: -20% (putting ball in play is priority)
 *
 * If the batter strikes out during H&R, the runner is caught stealing
 * (handled by the caller).
 */
export interface HitAndRunModifiers {
  contactBonus: number;   // Added to contact attribute (0-550 scale)
  powerPenalty: number;   // Subtracted from power attribute
  kRateReduction: number; // Multiplier on K rate (< 1.0 = fewer Ks)
  extraBaseAdvance: boolean; // Runner advances extra base on contact
}

export function getHitAndRunModifiers(): HitAndRunModifiers {
  return {
    contactBonus: 40,      // ~10% contact boost (on 400 scale)
    powerPenalty: 60,      // ~15% power reduction
    kRateReduction: 0.80,  // 20% fewer strikeouts
    extraBaseAdvance: true, // Runner goes 1st→3rd on singles
  };
}
