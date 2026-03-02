import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateSeasonNews } from '../../src/engine/narrative';
import type { SeasonResult } from '../../src/types/league';

// ─── Minimal SeasonResult mock ──────────────────────────────────────────────

function makeSeasonResult(season: number): SeasonResult {
  return {
    season,
    teamSeasons: [
      {
        teamId: 1, season, payroll: 80_000_000,
        record: { wins: 90, losses: 72, runsScored: 750, runsAllowed: 680 },
      },
      {
        teamId: 2, season, payroll: 60_000_000,
        record: { wins: 75, losses: 87, runsScored: 650, runsAllowed: 720 },
      },
    ],
    playerSeasons: [],
    boxScores: [],
    leagueBA: 0.255,
    leagueERA: 4.10,
    leagueRPG: 4.5,
    teamWinsSD: 10.0,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('narrative determinism', () => {
  it('same season data produces same headline order', () => {
    const result1 = makeSeasonResult(2025);
    const result2 = makeSeasonResult(2025);

    const news1 = generateSeasonNews(result1, 1);
    const news2 = generateSeasonNews(result2, 1);

    // Headlines and their order should be identical
    const headlines1 = news1.map(n => n.headline);
    const headlines2 = news2.map(n => n.headline);
    expect(headlines1).toEqual(headlines2);

    // Types and order should also match
    const types1 = news1.map(n => n.type);
    const types2 = news2.map(n => n.type);
    expect(types1).toEqual(types2);
  });

  it('different seasons produce different rumor ordering', () => {
    const result2025 = makeSeasonResult(2025);
    const result2026 = makeSeasonResult(2026);

    const news2025 = generateSeasonNews(result2025, 1);
    const news2026 = generateSeasonNews(result2026, 1);

    // Extract only rumor headlines (the part that uses hashStr-based shuffle)
    const rumors2025 = news2025.filter(n => n.type === 'rumor').map(n => n.headline);
    const rumors2026 = news2026.filter(n => n.type === 'rumor').map(n => n.headline);

    // Both should have 3 rumors
    expect(rumors2025).toHaveLength(3);
    expect(rumors2026).toHaveLength(3);

    // At least the rumor subset should differ in order (different season seed)
    // The set of 3 chosen rumors or their order should differ
    expect(rumors2025.join('|')).not.toBe(rumors2026.join('|'));
  });

  it('no Math.random references in narrative.ts', () => {
    const src = readFileSync(
      resolve('src/engine/narrative.ts'),
      'utf-8',
    );
    expect(src).not.toContain('Math.random');
  });
});
