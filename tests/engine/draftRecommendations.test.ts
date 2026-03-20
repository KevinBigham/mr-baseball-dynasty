import { describe, expect, it } from 'vitest';
import type { DraftBoardEntry } from '../../src/engine/draft';
import type { DraftPick } from '../../src/engine/draft/draftAI';
import {
  getBestValueDraftTarget,
  getHighestPotentialDraftTarget,
  getRecommendedDraftTarget,
} from '../../src/engine/draft/recommendations';

function makeBoardEntry(
  playerId: number,
  overrides: Partial<DraftBoardEntry> = {},
): DraftBoardEntry {
  return {
    playerId,
    name: `Prospect ${playerId}`,
    age: 22,
    position: 'SS',
    bats: 'R',
    throws: 'R',
    isPitcher: false,
    scoutedOvr: 60,
    scoutedPot: 70,
    rank: playerId,
    draftedByTeamId: null,
    ...overrides,
  };
}

describe('draft recommendations', () => {
  it('returns the slipped prospect as best value and the top ceiling prospect as highest potential', () => {
    const available = [
      makeBoardEntry(1, { name: 'Consensus Star', rank: 2, scoutedOvr: 72, scoutedPot: 78 }),
      makeBoardEntry(2, { name: 'Ceiling Bat', rank: 8, scoutedOvr: 64, scoutedPot: 82 }),
      makeBoardEntry(3, { name: 'Floor Arm', position: 'SP', isPitcher: true, rank: 5, scoutedOvr: 68, scoutedPot: 74 }),
    ];

    expect(getBestValueDraftTarget(available, 10)?.name).toBe('Consensus Star');
    expect(getHighestPotentialDraftTarget(available)?.name).toBe('Ceiling Bat');
  });

  it('uses roster-fit logic for the recommended player', () => {
    const available = [
      makeBoardEntry(1, { name: 'Best Overall SS', position: 'SS', rank: 1, scoutedOvr: 74, scoutedPot: 80 }),
      makeBoardEntry(2, { name: 'Needed Catcher', position: 'C', rank: 3, scoutedOvr: 70, scoutedPot: 76 }),
      makeBoardEntry(3, { name: 'Needed Starter', position: 'SP', isPitcher: true, rank: 2, scoutedOvr: 71, scoutedPot: 77 }),
    ];
    const teamPicks: DraftPick[] = [
      {
        round: 1,
        pickNumber: 1,
        teamId: 1,
        teamAbbr: 'T1',
        playerId: 99,
        playerName: 'Existing Shortstop',
        position: 'SS',
        scoutedOvr: 73,
        scoutedPot: 78,
        type: 'startup',
      },
    ];

    expect(getRecommendedDraftTarget(available, teamPicks, 12)?.name).toBe('Needed Starter');
  });
});
