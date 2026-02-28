/**
 * Situational hitting — offensive IQ modifier.
 *
 * Smart hitters (high offensiveIQ) make better decisions with
 * runners in scoring position: moving runners over, hitting behind
 * runners, and taking productive at-bats. This translates to a
 * small contact boost with RISP.
 *
 * Effect: up to +1 contact with RISP for elite offensive IQ.
 * No PRNG consumption — derived from attributes and game state.
 */

/**
 * Compute contact modifier based on offensive IQ and runner situation.
 *
 * @param offensiveIQ Hitter's offensiveIQ attribute (0-100)
 * @param runners Runner bitmask (bit 0 = 1st, bit 1 = 2nd, bit 2 = 3rd)
 * @returns Contact modifier (0 or +1)
 */
export function getSituationalContactMod(offensiveIQ: number, runners: number): number {
  // Only applies with runners in scoring position (2nd or 3rd)
  const risp = (runners & 0b110) !== 0;
  if (!risp) return 0;

  // Only elite IQ batters (75+) get a +1 contact bonus with RISP
  return offensiveIQ >= 75 ? 1 : 0;
}
