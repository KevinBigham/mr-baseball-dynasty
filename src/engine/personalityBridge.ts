/**
 * personalityBridge.ts — Player-to-PersonalityInput Bridge
 *
 * Pure helper that extracts a PersonalityInput from a full Player object.
 * This bridges the gap between the Player type (which owns all player data)
 * and the chemistry derivation layer (which only needs a narrow input).
 *
 * No side effects, no state, no PRNG.
 */

import type { Player } from '../types/player';
import type { PersonalityInput } from '../types/chemistry';

/**
 * Extract a PersonalityInput from a full Player.
 *
 * workEthic and mentalToughness live on either hitterAttributes or
 * pitcherAttributes depending on the player type. If neither attribute
 * block is present (shouldn't happen in practice), defaults to 50.
 */
export function extractPersonalityInput(player: Player): PersonalityInput {
  const attrs = player.isPitcher ? player.pitcherAttributes : player.hitterAttributes;

  return {
    workEthic: attrs?.workEthic ?? 50,
    mentalToughness: attrs?.mentalToughness ?? 50,
    age: player.age,
    overall: player.overall,
    position: player.position,
  };
}

/**
 * Batch extraction for an array of players.
 */
export function extractPersonalityInputs(players: Player[]): PersonalityInput[] {
  return players.map(extractPersonalityInput);
}
