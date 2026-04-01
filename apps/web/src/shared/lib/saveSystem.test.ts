// @vitest-environment node

import { describe, expect, it } from 'vitest';
import type { GameSnapshot } from '@mbd/contracts';
import {
  buildSaveRecord,
  normalizeLoadedSaveRecord,
} from './saveSystem';

function createSnapshot(): GameSnapshot {
  return {
    schemaVersion: 3,
    rng: { seed: 7, callCount: 14 },
    season: 3,
    day: 97,
    phase: 'regular',
    userTeamId: 'nyy',
    players: [],
    schedule: [],
    seasonState: {
      season: 3,
      currentDay: 97,
      standings: [],
      playerSeasonStats: [],
      gameLog: [],
      completed: false,
    },
    playoffBracket: null,
    injuries: [],
    serviceTime: [],
    scoutingStaffs: [],
    gmPersonalities: [],
    offseasonState: null,
    draftClass: null,
    freeAgencyMarket: null,
    news: [],
    rosterStates: [],
    narrative: {
      playerMorale: [],
      teamChemistry: [],
      ownerState: [],
      briefingQueue: [],
      storyFlags: [],
      rivalries: [],
      awardHistory: [],
      seasonHistory: [
        {
          season: 2,
          championTeamId: 'nyy',
          runnerUpTeamId: 'lad',
          worldSeriesRecord: '4-2',
          summary: 'New York finished the job.',
          awards: [],
          keyMoments: ['Won the World Series in six games.'],
          statLeaders: {
            hr: [],
            rbi: [],
            avg: [],
            era: [],
            k: [],
            w: [],
          },
          notableRetirements: [],
          blockbusterTrades: [],
          userSeason: null,
        },
      ],
    },
  };
}

describe('saveSystem helpers', () => {
  it('builds a v3 save record from a canonical snapshot', () => {
    const snapshot = createSnapshot();

    const record = buildSaveRecord(2, 'Dynasty Slot', snapshot);

    expect(record.slotNumber).toBe(2);
    expect(record.name).toBe('Dynasty Slot');
    expect(record.season).toBe(3);
    expect(record.day).toBe(97);
    expect(record.phase).toBe('regular');
    expect(record.schemaVersion).toBe(3);
    expect(record.hasSnapshot).toBe(true);
    expect(record.snapshot?.rng.callCount).toBe(14);
    expect(record.snapshot?.schemaVersion).toBe(3);
    expect(record.snapshot?.narrative.seasonHistory[0]?.worldSeriesRecord).toBe('4-2');
    expect(record.legacyState).toBeNull();
  });

  it('normalizes legacy records into metadata-only entries without deleting them', () => {
    const normalized = normalizeLoadedSaveRecord({
      id: 'save-slot-4',
      slotNumber: 4,
      name: 'Old Save',
      season: 1,
      day: 1,
      phase: 'preseason',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
      gameState: '{"old":true}',
    });

    expect(normalized.schemaVersion).toBe(1);
    expect(normalized.hasSnapshot).toBe(false);
    expect(normalized.snapshot).toBeNull();
    expect(normalized.legacyState).toBe('{"old":true}');
  });

  it('migrates v2 snapshots to v3 on load', () => {
    const normalized = normalizeLoadedSaveRecord({
      id: 'save-slot-3',
      slotNumber: 3,
      name: 'Migrated Save',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
      snapshot: {
        schemaVersion: 2,
        rng: { seed: 9, callCount: 5 },
        season: 5,
        day: 12,
        phase: 'offseason',
        userTeamId: 'nyy',
        players: [],
        schedule: [],
        seasonState: {
          season: 5,
          currentDay: 12,
          standings: [],
          playerSeasonStats: [
            ['pitcher-1', {
              pa: 0,
              ab: 0,
              hits: 0,
              doubles: 0,
              triples: 0,
              hr: 0,
              rbi: 0,
              bb: 0,
              k: 0,
              runs: 0,
              ip: 27,
              earnedRuns: 6,
              strikeouts: 11,
              walks: 2,
              hitsAllowed: 9,
            }],
          ],
          gameLog: [],
          completed: false,
        },
        playoffBracket: null,
        injuries: [],
        serviceTime: [],
        scoutingStaffs: [],
        gmPersonalities: [],
        offseasonState: null,
        draftClass: null,
        freeAgencyMarket: null,
        news: [],
        rosterStates: [],
        narrative: {
          playerMorale: [],
          teamChemistry: [],
          ownerState: [],
          briefingQueue: [],
          storyFlags: [],
          rivalries: [],
          awardHistory: [
            {
              season: 4,
              award: 'MVP',
              playerId: 'player-1',
              teamId: 'nyy',
              summary: 'Carried the lineup.',
            },
          ],
          seasonHistory: [
            {
              season: 4,
              championTeamId: 'nyy',
              summary: 'Won it all.',
              awards: [],
              keyMoments: ['Wrapped up the title.'],
            },
          ],
        },
      },
      // normalizeLoadedSaveRecord accepts persisted payloads before parsing them.
      // This fixture intentionally uses the legacy v2 shape.
    } as any);

    expect(normalized.schemaVersion).toBe(3);
    expect(normalized.snapshot?.schemaVersion).toBe(3);
    expect(normalized.snapshot?.seasonState.playerSeasonStats[0]?.[1].wins).toBe(0);
    expect(normalized.snapshot?.seasonState.playerSeasonStats[0]?.[1].losses).toBe(0);
    expect(normalized.snapshot?.narrative.awardHistory[0]?.league).toBe('MLB');
    expect(normalized.snapshot?.narrative.seasonHistory[0]?.runnerUpTeamId).toBeNull();
    expect(normalized.snapshot?.narrative.seasonHistory[0]?.statLeaders.w).toEqual([]);
  });
});
