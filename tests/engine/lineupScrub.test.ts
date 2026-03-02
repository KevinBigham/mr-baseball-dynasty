import { describe, it, expect } from 'vitest';

/**
 * Tests for the _scrubLineupRotation logic.
 * Since the function is private in worker.ts, we test the pure logic here.
 */

describe('Lineup/Rotation scrub logic', () => {
  function scrubLineupRotation(
    lineupOrder: number[],
    rotationOrder: number[],
    activePlayerIds: Set<number>,
  ): { lineupOrder: number[]; rotationOrder: number[] } {
    let newLineup = lineupOrder.filter(id => activePlayerIds.has(id));
    const newRotation = rotationOrder.filter(id => activePlayerIds.has(id));
    if (newLineup.length !== 9) newLineup = [];
    return { lineupOrder: newLineup, rotationOrder: newRotation };
  }

  it('removes stale player IDs from lineup and rotation', () => {
    const lineup = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rotation = [10, 11, 12, 13, 14];
    // Player 3 was traded away, player 12 was released
    const activeIds = new Set([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14]);

    const result = scrubLineupRotation(lineup, rotation, activeIds);

    // Lineup had 9 but now has 8, so it resets to empty
    expect(result.lineupOrder).toEqual([]);
    // Rotation filters out player 12
    expect(result.rotationOrder).toEqual([10, 11, 13, 14]);
  });

  it('preserves valid lineup when all 9 players are still active', () => {
    const lineup = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rotation = [10, 11, 12, 13, 14];
    const activeIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

    const result = scrubLineupRotation(lineup, rotation, activeIds);

    expect(result.lineupOrder).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.rotationOrder).toEqual([10, 11, 12, 13, 14]);
  });
});
