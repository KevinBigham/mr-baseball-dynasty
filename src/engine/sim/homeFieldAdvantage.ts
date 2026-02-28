/**
 * Home field advantage.
 *
 * MLB teams win ~54% of home games. The structural advantage of batting
 * last is already modeled. This module adds a small performance modifier
 * for the home team to reflect crowd energy, familiarity with the park,
 * and absence of travel fatigue.
 *
 * Effect: home team gets +5 defense rating and a +0.003 BABIP bump.
 * Away team gets no modifier. This produces realistic ~53-55% home WPct
 * when combined with the batting-last advantage.
 *
 * Deterministic — no PRNG consumption.
 */

export interface HomeFieldModifiers {
  defenseBonus: number;   // Added to home defense rating
  babipBonus: number;     // Added to home team BABIP when batting
}

/**
 * Get home field advantage modifiers.
 * Only the home team receives these bonuses.
 */
export function getHomeFieldAdvantage(): HomeFieldModifiers {
  return {
    defenseBonus: 5,      // +5 on 0-550 scale (small but meaningful)
    babipBonus: 0.003,    // +0.3% BABIP for home batters (crowd energy)
  };
}
