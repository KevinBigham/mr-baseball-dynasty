/**
 * Closer save-situation intensity boost.
 *
 * Real closers pitch with extra adrenaline in save situations,
 * often adding 1-2 MPH to their fastball and showing better stuff.
 * This is reflected as a small K-rate boost.
 *
 * Effect: up to 1.04x K rate for closers in save situations.
 * No PRNG consumption — deterministic from position and game state.
 */

import type { Player } from '../../types/player';

/**
 * Compute K-rate multiplier for closer in save situation.
 *
 * @param pitcher Current pitcher
 * @param isSaveSituation Whether it's a save situation
 * @returns K-rate multiplier (1.0 or up to 1.04)
 */
export function getCloserIntensityKMod(pitcher: Player, isSaveSituation: boolean): number {
  if (!isSaveSituation) return 1.0;
  if (pitcher.position !== 'CL') return 1.0;

  // Closers get up to +4% K rate in save situations
  // Scaled by mental toughness — some closers thrive under pressure
  const mt = pitcher.pitcherAttributes?.mentalToughness ?? 50;
  const boost = 0.02 + (mt / 100) * 0.02; // 0.02–0.04

  return 1.0 + boost;
}
