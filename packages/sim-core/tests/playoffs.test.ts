import { describe, expect, it } from 'vitest';
import { buildPlayoffPreview, type PlayoffSeed } from '../src/index.js';

describe('buildPlayoffPreview', () => {
  it('builds deterministic wildcard pairings and later-round placeholders', () => {
    const seeds: PlayoffSeed[] = Array.from({ length: 12 }, (_, index) => ({
      teamId: `team-${index + 1}`,
      seed: index + 1,
      wins: 100 - index,
      losses: 62 + index,
    }));

    const preview = buildPlayoffPreview(seeds);

    expect(preview).toHaveLength(11);
    expect(preview[0]).toEqual({
      id: 'wc-1',
      round: 'WILD_CARD',
      bestOf: 5,
      home: { teamId: 'team-5', seed: 5, placeholder: null },
      away: { teamId: 'team-12', seed: 12, placeholder: null },
    });
    expect(preview[3]).toEqual({
      id: 'wc-4',
      round: 'WILD_CARD',
      bestOf: 5,
      home: { teamId: 'team-8', seed: 8, placeholder: null },
      away: { teamId: 'team-9', seed: 9, placeholder: null },
    });
    expect(preview[4]?.away.placeholder).toBe('Winner of 8 vs 9');
    expect(preview[10]).toEqual({
      id: 'ws-1',
      round: 'WORLD_SERIES',
      bestOf: 7,
      home: { teamId: null, seed: null, placeholder: 'Winner of CS 1' },
      away: { teamId: null, seed: null, placeholder: 'Winner of CS 2' },
    });
  });
});
