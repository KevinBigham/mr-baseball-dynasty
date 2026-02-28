import type { Player } from '../../types/player';

// ─── Intentional Walk decision logic ─────────────────────────────────────────
// The defending team may choose to intentionally walk a dangerous batter to:
//  1. Face a weaker next hitter
//  2. Set up a double play (put runner on 1st)
//  3. Avoid a power hitter in a high-leverage spot

/**
 * Returns true if the defense should intentionally walk this batter.
 */
export function shouldIntentionalWalk(
  batter: Player,
  onDeckBatter: Player,
  runners: number,
  outs: number,
  inning: number,
): boolean {
  // Never IBB with 2 outs (just pitch to them)
  if (outs >= 2) return false;

  // First base must be open
  if (runners & 0b001) return false;

  // Never IBB to load the bases (runner on 2nd+3rd → loading bases is rarely wise)
  if ((runners & 0b110) === 0b110) return false;

  // Need at least one runner in scoring position to justify IBB
  const runnerInScoringPos = (runners & 0b110) !== 0;
  if (!runnerInScoringPos && inning < 9) return false;

  // Compute offensive threat differential
  const batterH = batter.hitterAttributes;
  const onDeckH = onDeckBatter.hitterAttributes;
  if (!batterH || !onDeckH) return false;

  const batterThreat = batterH.contact * 0.3 + batterH.power * 0.5 + batterH.eye * 0.2;
  const onDeckThreat = onDeckH.contact * 0.3 + onDeckH.power * 0.5 + onDeckH.eye * 0.2;
  const differential = batterThreat - onDeckThreat;

  // Late innings (7+): lower threshold for IBB
  if (inning >= 7) {
    // IBB if current batter is significantly better (60+ differential on 0-550 scale)
    return differential >= 60;
  }

  // Mid-game (5-6): only IBB elite power hitters
  if (inning >= 5) {
    return differential >= 100 && batterH.power >= 450;
  }

  // Early innings: almost never IBB
  return false;
}
