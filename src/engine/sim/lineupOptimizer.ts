import type { Player } from '../../types/player';

/**
 * Batting order optimization.
 *
 * Generates an optimal lineup following modern baseball principles:
 *
 * 1. Leadoff: Best OBP + speed — gets on base, steals bases
 * 2. #2: High contact + OBP — moves runners, sees pitches
 * 3. #3: Best overall hitter — highest composite rating
 * 4. Cleanup: Power + RBI — drives in runs
 * 5. #5: Secondary power threat
 * 6. #6: Contact-oriented gap hitter
 * 7. #7-8: Fill spots (worst hitters)
 * 9. #9: Second leadoff — speed for turning the lineup over
 *
 * Used as a suggestion tool for user team management (not in-game simulation,
 * which uses a stable composite sort to preserve the PRNG chain).
 */

interface ScoredPlayer {
  player: Player;
  obpScore: number;   // OBP proxy: contact + eye
  powerScore: number;  // Power proxy
  speedScore: number;  // Speed + baserunning
  composite: number;   // Overall offensive value
}

function scorePlayer(p: Player): ScoredPlayer {
  const h = p.hitterAttributes;
  if (!h) {
    return { player: p, obpScore: 0, powerScore: 0, speedScore: 0, composite: 0 };
  }
  const obpScore = h.contact * 0.5 + h.eye * 0.5;
  const powerScore = h.power;
  const speedScore = h.speed * 0.7 + h.baserunningIQ * 0.3;
  const composite = h.contact * 0.3 + h.power * 0.3 + h.eye * 0.25 + h.speed * 0.15;
  return { player: p, obpScore, powerScore, speedScore, composite };
}

/**
 * Generate an optimized batting order from a pool of players.
 *
 * @param players Active hitters for the team (unordered)
 * @returns Ordered lineup of up to 9 players
 */
export function optimizeLineup(players: Player[]): Player[] {
  if (players.length <= 1) return players.slice(0, 9);

  const scored = players.map(scorePlayer);
  const available = new Set(scored);
  const lineup: Player[] = [];

  function pickBest(
    metric: (s: ScoredPlayer) => number,
    remaining: Set<ScoredPlayer>,
  ): ScoredPlayer | null {
    let best: ScoredPlayer | null = null;
    let bestVal = -Infinity;
    for (const s of remaining) {
      const val = metric(s);
      if (val > bestVal) {
        bestVal = val;
        best = s;
      }
    }
    if (best) remaining.delete(best);
    return best;
  }

  // Slot 1 — Leadoff: OBP + speed
  const leadoff = pickBest(s => s.obpScore * 0.6 + s.speedScore * 0.4, available);
  if (leadoff) lineup.push(leadoff.player);

  // Slot 3 — #3 hitter: best composite (pick before #2 to protect the best hitter)
  const three = pickBest(s => s.composite, available);

  // Slot 2 — #2: contact + OBP (good table setter)
  const two = pickBest(s => s.obpScore * 0.7 + s.composite * 0.3, available);
  if (two) lineup.push(two.player);
  if (three) lineup.push(three.player);

  // Slot 4 — Cleanup: power
  const cleanup = pickBest(s => s.powerScore * 0.7 + s.composite * 0.3, available);
  if (cleanup) lineup.push(cleanup.player);

  // Slot 5 — Secondary power
  const five = pickBest(s => s.powerScore * 0.5 + s.composite * 0.5, available);
  if (five) lineup.push(five.player);

  // Slot 6 — Contact gap hitter
  const six = pickBest(s => s.obpScore * 0.5 + s.composite * 0.5, available);
  if (six) lineup.push(six.player);

  // Slot 9 — Second leadoff: speed for lineup turnover
  const nine = pickBest(s => s.speedScore * 0.5 + s.obpScore * 0.5, available);

  // Slots 7-8: fill with remaining (weakest hitters)
  const remaining = Array.from(available).sort((a, b) => b.composite - a.composite);
  for (const r of remaining.slice(0, 2)) {
    lineup.push(r.player);
  }

  // Slot 9
  if (nine) lineup.push(nine.player);

  return lineup.slice(0, 9);
}
