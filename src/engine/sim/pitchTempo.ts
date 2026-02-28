import type { Player } from '../../types/player';

/**
 * Pitch tempo / game pace effect.
 *
 * Quick-working pitchers (high command + pitchingIQ) keep the defense
 * sharp and prevent batters from settling in. Slow-tempo pitchers
 * allow hitters more time to adjust.
 *
 * Effect: modifies BABIP slightly (quick tempo = lower BABIP, slow = higher).
 * Range: ±1.5% BABIP modifier (very subtle, adds to realism).
 *
 * No PRNG consumption — purely derived from pitcher attributes.
 */

/**
 * Compute a BABIP modifier based on pitcher tempo.
 *
 * @param pitcher The current pitcher
 * @returns BABIP modifier (negative = defense-friendly, positive = hitter-friendly)
 */
export function getTempoModifier(pitcher: Player): number {
  const p = pitcher.pitcherAttributes;
  if (!p) return 0;

  // Tempo composite: 50% command (control = efficiency) + 50% pitchingIQ (approach)
  const tempoRating = p.command * 0.50 + (p.pitchingIQ ?? 400) * 0.50;

  // Deviation from average (400): very subtle effect (±0.5% BABIP)
  const deviation = (tempoRating - 400) / 150;
  return -deviation * 0.005; // Negative = lower BABIP for quick workers
}
