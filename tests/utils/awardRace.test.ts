import { describe, expect, it } from 'vitest';
import {
  createEmptyAwardRaceData,
  normalizeAwardRaceData,
} from '../../src/types/awardRace';

describe('award race normalization', () => {
  it('converts legacy season-awards payloads into empty race buckets', () => {
    const legacyPayload = {
      season: 2026,
      alMVP: { awardName: 'AL MVP', playerId: 1, playerName: 'Slugger', teamId: 4, statLine: '.310 / 42 HR' },
      nlMVP: { awardName: 'NL MVP', playerId: 2, playerName: 'Ace', teamId: 18, statLine: '.301 / 37 HR' },
      alCyYoung: { awardName: 'AL Cy Young', playerId: 3, playerName: 'Starter', teamId: 7, statLine: '18-6, 2.91 ERA' },
      nlCyYoung: { awardName: 'NL Cy Young', playerId: 4, playerName: 'Closer', teamId: 22, statLine: '39 SV, 2.12 ERA' },
      alROY: null,
      nlROY: null,
    };

    expect(normalizeAwardRaceData(legacyPayload)).toEqual(createEmptyAwardRaceData());
  });

  it('preserves available award-race buckets and fills missing ones with empties', () => {
    const partialPayload = {
      mvp: {
        al: [{ playerId: 11, name: 'MVP Bat', teamAbbr: 'BOS', teamId: 3, position: 'RF', age: 27, isPitcher: false, score: 91, stats: { ops: 0.942, hr: 39, avg: 0.309 } }],
        nl: [],
      },
    };

    expect(normalizeAwardRaceData(partialPayload)).toEqual({
      mvp: partialPayload.mvp,
      cyYoung: { al: [], nl: [] },
      roy: { al: [], nl: [] },
    });
  });
});
