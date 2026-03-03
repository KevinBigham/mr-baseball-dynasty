import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Tests ──────────────────────────────────────────────────────────────────
// Verify that pythagorean wins calculations use actual games played
// rather than a hardcoded 162-game schedule.

describe('pythagorean wins uses actual games played', () => {
  it('_buildStandings uses actual games played', () => {
    const src = readFileSync(
      resolve('src/engine/worker.ts'),
      'utf-8',
    );

    // The old pattern was: pythagenpatWinPct(runsScored, runsAllowed) * 162)
    // The new pattern uses: (wins + losses) || 162
    // Verify the hardcoded * 162) pattern for pythagenpatWinPct no longer exists.
    const hardcodedPattern = /pythagenpatWinPct\([^)]+\)\s*\*\s*162\)/;
    expect(src).not.toMatch(hardcodedPattern);

    // Verify the _buildStandings function uses actual games played
    // by checking for the (wins + losses) || 162 pattern
    expect(src).toContain('(t.seasonRecord.wins + t.seasonRecord.losses) || 162');
  });

  it('aiTeamIntelligence uses actual games', () => {
    const src = readFileSync(
      resolve('src/engine/aiTeamIntelligence.ts'),
      'utf-8',
    );

    // Verify no hardcoded * 162) for pythagenpatWinPct
    const hardcodedPattern = /pythagenpatWinPct\([^)]+\)\s*\*\s*162\)/;
    expect(src).not.toMatch(hardcodedPattern);

    // Verify it uses actual games played via (wins + losses) || 162
    expect(src).toContain('(team.seasonRecord.wins + team.seasonRecord.losses) || 162');
  });
});
