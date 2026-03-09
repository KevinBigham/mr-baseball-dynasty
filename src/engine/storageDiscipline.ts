/**
 * Storage discipline — featured game selection.
 * Stub — Sprint 04 branch surgery.
 */

import type { GameResult } from '../types/game';

export function selectFeaturedGames(gameResults: GameResult[]): Set<number> {
  const featured = new Set<number>();
  for (const game of gameResults) {
    const diff = Math.abs(game.homeScore - game.awayScore);
    if (diff <= 1 || game.innings > 9 || game.homeScore + game.awayScore >= 15) {
      featured.add(game.gameId);
    }
    if (featured.size >= 100) break;
  }
  return featured;
}
