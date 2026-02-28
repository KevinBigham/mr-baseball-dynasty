import type { Player } from '../../types/player';

// ─── Defensive Shift Mechanic ────────────────────────────────────────────────
// Teams shift against pull-heavy power hitters.
// The shift modifies ground ball BABIP based on batter tendencies.
//
// Pull tendency is estimated from power + speed:
//   - High power + low speed = pull-heavy (shift effective)
//   - Balanced or speed-focused = spray hitter (shift risky)
//
// Shift effect:
//   - vs pull hitter: reduces GB BABIP by 8-15%
//   - vs spray hitter: increases GB BABIP by 3-6% (gap in shifted defense)

export interface ShiftDecision {
  isShifted: boolean;
  babipModifier: number; // Negative = good for defense, positive = bad
}

/**
 * Compute pull tendency (0–1) from hitter attributes.
 * Higher = more pull-heavy.
 */
function pullTendency(batter: Player): number {
  const h = batter.hitterAttributes;
  if (!h) return 0.5; // neutral

  // Power hitters tend to pull; speedsters tend to spray
  const powerNorm = h.power / 550; // 0–1
  const speedNorm = h.speed / 550;
  const contactNorm = h.contact / 550;

  // Pull tendency: power dominant, speed and contact reduce it
  const raw = powerNorm * 0.55 + (1 - speedNorm) * 0.25 + (1 - contactNorm) * 0.20;
  return Math.max(0.1, Math.min(0.9, raw));
}

/**
 * Decide whether to shift and compute BABIP modifier.
 */
export function computeShiftDecision(
  batter: Player,
  defenseRating: number,
): ShiftDecision {
  const pull = pullTendency(batter);

  // Only shift against pull-heavy hitters (pull > 0.55)
  if (pull < 0.55) {
    return { isShifted: false, babipModifier: 0 };
  }

  // Shift effectiveness scales with pull tendency and defense quality
  const defFactor = (defenseRating - 350) / 200; // 0-1 for avg-elite defense
  const shiftEffectiveness = (pull - 0.55) * 2.5; // 0–0.875 for pull 0.55–0.90

  // BABIP reduction for shifted defense vs pull hitters
  // Range: -0.02 (mild shift) to -0.06 (strong shift vs extreme puller with elite D)
  const babipMod = -(0.02 + shiftEffectiveness * 0.04) * (0.7 + defFactor * 0.3);

  return {
    isShifted: true,
    babipModifier: Math.max(-0.06, babipMod),
  };
}
