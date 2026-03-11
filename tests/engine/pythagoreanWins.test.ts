import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Tests ──────────────────────────────────────────────────────────────────
// Verify that pythagorean wins calculations use actual games played
// rather than a hardcoded 162-game schedule.

describe('pythagorean wins uses actual games played', () => {
  it('buildStandings uses actual games played', () => {
    const src = readFileSync(
      resolve('src/engine/worker.ts'),
      'utf-8',
    );

    // The old buggy pattern was: pythagenpatWinPct(runsScored, runsAllowed) * 162)
    // Verify no hardcoded * 162) multiplication remains.
    const hardcodedPattern = /pythagenpatWinPct\([^)]+\)\s*\*\s*162\)/;
    expect(src).not.toMatch(hardcodedPattern);

    // buildStandings computes totalGames = ts.wins + ts.losses
    // and passes it as the third arg to pythagoreanWins.
    // Assert: the function receives actual games, not a hardcoded constant.
    expect(src).toMatch(/totalGames\s*=\s*ts\.wins\s*\+\s*ts\.losses/);
    expect(src).toMatch(/pythagoreanWins\(.*totalGames\)/);
  });

  it('aiTeamIntelligence uses actual games', () => {
    const src = readFileSync(
      resolve('src/engine/aiTeamIntelligence.ts'),
      'utf-8',
    );

    // Verify no hardcoded * 162) for pythagenpatWinPct
    const hardcodedPattern = /pythagenpatWinPct\([^)]+\)\s*\*\s*162\b[^|]/;
    expect(src).not.toMatch(hardcodedPattern);

    // Uses actual games played: (wins + losses) || 162 as a fallback
    expect(src).toMatch(/\(team\.seasonRecord\.wins\s*\+\s*team\.seasonRecord\.losses\)\s*\|\|\s*162/);
  });
});
