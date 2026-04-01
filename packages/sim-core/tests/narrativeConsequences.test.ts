import { describe, expect, it } from 'vitest';
import * as simCore from '../src/index.js';
import type { GeneratedPlayer, PlayoffBracket } from '../src/index.js';

function makePlayer(
  seed: number,
  teamId: string,
  position: Parameters<typeof simCore.generatePlayer>[1] = 'SS',
): GeneratedPlayer {
  const rng = new simCore.GameRNG(seed);
  return simCore.generatePlayer(rng, position, teamId, 'MLB');
}

function withOverrides(
  player: GeneratedPlayer,
  overrides: Partial<GeneratedPlayer>,
): GeneratedPlayer {
  return {
    ...player,
    ...overrides,
    personality: {
      ...player.personality,
      ...(overrides.personality ?? {}),
    },
    contract: {
      ...player.contract,
      ...(overrides.contract ?? {}),
    },
    hitterAttributes: {
      ...player.hitterAttributes,
      ...(overrides.hitterAttributes ?? {}),
    },
    pitcherAttributes: overrides.pitcherAttributes === undefined
      ? player.pitcherAttributes
      : overrides.pitcherAttributes,
  };
}

describe('narrative consequences', () => {
  it('applies owner decision deltas with clamping and a replacement summary', () => {
    const applyOwnerDecisionDelta = (
      simCore as unknown as {
        applyOwnerDecisionDelta?: (
          owner: ReturnType<typeof simCore.createOwnerState>,
          delta: number,
          summary: string,
        ) => ReturnType<typeof simCore.createOwnerState>;
      }
    ).applyOwnerDecisionDelta;

    expect(typeof applyOwnerDecisionDelta).toBe('function');

    const owner = simCore.createOwnerState('nyy', 210_000_000);
    const updated = applyOwnerDecisionDelta!(owner, 60, 'Ownership loved the move.');

    expect(updated.patience).toBe(100);
    expect(updated.confidence).toBe(100);
    expect(updated.summary).toBe('Ownership loved the move.');
    expect(updated.hotSeat).toBe(false);
  });

  it('builds trade consequences for an accepted user-team deal', () => {
    const buildTradeConsequenceBundle = (
      simCore as unknown as {
        buildTradeConsequenceBundle?: (context: unknown) => {
          newsItems: Array<{ category: string }>;
          briefingItems: Array<{ category: string }>;
          playerMoraleEvents: Array<{ playerId: string; event: { impact: number } }>;
          ownerDecisionDelta: { delta: number; summary: string } | null;
          storyFlags: string[];
          seasonHistoryMoments: string[];
        };
      }
    ).buildTradeConsequenceBundle;

    expect(typeof buildTradeConsequenceBundle).toBe('function');

    const acquired = withOverrides(makePlayer(1, 'bos', 'CF'), {
      teamId: 'nyy',
      firstName: 'Victor',
      lastName: 'Valez',
    });
    const tradedAway = withOverrides(makePlayer(2, 'nyy', 'RF'), {
      teamId: 'bos',
      firstName: 'Martin',
      lastName: 'Cole',
    });
    const remaining = withOverrides(makePlayer(3, 'nyy', 'SS'), {
      firstName: 'Luis',
      lastName: 'Ramos',
    });

    const bundle = buildTradeConsequenceBundle!({
      rng: new simCore.GameRNG(9),
      season: 3,
      day: 88,
      userTeamId: 'nyy',
      partnerTeamId: 'bos',
      acquiredPlayers: [acquired],
      tradedAwayPlayers: [tradedAway],
      remainingUserPlayers: [remaining],
      userFairness: 44,
      payrollAfterTrade: 222,
      payrollTarget: 210,
    });

    expect(bundle.newsItems).toHaveLength(1);
    expect(bundle.newsItems[0]?.category).toBe('trade');
    expect(bundle.briefingItems).toHaveLength(1);
    expect(bundle.briefingItems[0]?.category).toBe('news');
    expect(bundle.playerMoraleEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ playerId: acquired.id, event: expect.objectContaining({ impact: 6 }) }),
        expect.objectContaining({ playerId: tradedAway.id, event: expect.objectContaining({ impact: -10 }) }),
        expect.objectContaining({ playerId: remaining.id, event: expect.objectContaining({ impact: 4 }) }),
      ]),
    );
    expect(bundle.ownerDecisionDelta?.delta).toBe(4);
    expect(bundle.ownerDecisionDelta?.summary).toContain('trade');
  });

  it('builds signing consequences for a user-team free-agent deal', () => {
    const buildSigningConsequenceBundle = (
      simCore as unknown as {
        buildSigningConsequenceBundle?: (context: unknown) => {
          newsItems: Array<{ category: string }>;
          briefingItems: Array<{ category: string }>;
          playerMoraleEvents: Array<{ playerId: string; event: { impact: number } }>;
          ownerDecisionDelta: { delta: number; summary: string } | null;
        };
      }
    ).buildSigningConsequenceBundle;

    expect(typeof buildSigningConsequenceBundle).toBe('function');

    const signedPlayer = withOverrides(makePlayer(4, 'fa', 'SP'), {
      teamId: 'nyy',
      firstName: 'Diego',
      lastName: 'Mendez',
    });
    const teammate = withOverrides(makePlayer(5, 'nyy', '1B'), {
      firstName: 'Evan',
      lastName: 'Parker',
    });

    const bundle = buildSigningConsequenceBundle!({
      rng: new simCore.GameRNG(12),
      season: 4,
      day: 12,
      userTeamId: 'nyy',
      player: signedPlayer,
      annualSalary: 18,
      years: 4,
      marketValue: 18,
      payrollAfterSigning: 205,
      payrollTarget: 210,
      remainingUserPlayers: [teammate],
    });

    expect(bundle.newsItems).toHaveLength(1);
    expect(bundle.newsItems[0]?.category).toBe('signing');
    expect(bundle.briefingItems).toHaveLength(1);
    expect(bundle.playerMoraleEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ playerId: signedPlayer.id, event: expect.objectContaining({ impact: 10 }) }),
        expect.objectContaining({ playerId: teammate.id, event: expect.objectContaining({ impact: 3 }) }),
      ]),
    );
    expect(bundle.ownerDecisionDelta?.delta).toBe(8);
  });

  it('builds postseason consequences from the completed playoff bracket', () => {
    const buildPostseasonConsequenceBundle = (
      simCore as unknown as {
        buildPostseasonConsequenceBundle?: (context: unknown) => {
          newsItems: Array<{ category: string }>;
          briefingItems: Array<{ category: string }>;
          playerMoraleEvents: Array<{ playerId: string; event: { impact: number } }>;
          ownerDecisionDelta: { delta: number; summary: string } | null;
          seasonHistoryMoments: string[];
        };
      }
    ).buildPostseasonConsequenceBundle;

    expect(typeof buildPostseasonConsequenceBundle).toBe('function');

    const roster = [
      withOverrides(makePlayer(6, 'nyy', 'SS'), { firstName: 'Alex', lastName: 'Stone' }),
      withOverrides(makePlayer(7, 'nyy', 'CF'), { firstName: 'Jalen', lastName: 'Frost' }),
    ];
    const bracket: PlayoffBracket = {
      seeds: [
        { teamId: 'nyy', seed: 1, wins: 101, losses: 61 },
        { teamId: 'bos', seed: 2, wins: 96, losses: 66 },
      ],
      series: [
        { winnerId: 'nyy', loserId: 'bos', winnerWins: 4, loserWins: 2, games: [], round: 'WORLD_SERIES' },
      ],
      champion: 'nyy',
    };

    const bundle = buildPostseasonConsequenceBundle!({
      rng: new simCore.GameRNG(22),
      season: 5,
      userTeamId: 'nyy',
      playoffBracket: bracket,
      userOutcome: 'champion',
      standings: [
        { teamId: 'nyy', wins: 101, losses: 61 },
        { teamId: 'bos', wins: 96, losses: 66 },
        { teamId: 'tb', wins: 79, losses: 83 },
      ],
      userPlayers: roster,
    });

    expect(bundle.newsItems.length).toBeGreaterThan(0);
    expect(bundle.newsItems[0]?.category).toBe('playoff');
    expect(bundle.briefingItems).toHaveLength(1);
    expect(bundle.playerMoraleEvents).toHaveLength(roster.length);
    expect(bundle.playerMoraleEvents.every((entry) => entry.event.impact === 8)).toBe(true);
    expect(bundle.ownerDecisionDelta?.delta).toBe(15);
    expect(bundle.seasonHistoryMoments.length).toBeGreaterThan(0);
  });

  it('builds retirement consequences for notable MLB veterans', () => {
    const buildRetirementConsequenceBundle = (
      simCore as unknown as {
        buildRetirementConsequenceBundle?: (context: unknown) => {
          newsItems: Array<{ category: string }>;
          briefingItems: Array<{ category: string }>;
          playerMoraleEvents: Array<{ playerId: string; event: { impact: number } }>;
          ownerDecisionDelta: { delta: number; summary: string } | null;
          seasonHistoryMoments: string[];
        };
      }
    ).buildRetirementConsequenceBundle;

    expect(typeof buildRetirementConsequenceBundle).toBe('function');

    const userRetiree = withOverrides(makePlayer(8, 'nyy', 'C'), {
      firstName: 'Marcus',
      lastName: 'Dean',
      age: 40,
      overallRating: 365,
      personality: {
        leadership: 88,
      },
    });
    const leagueRetiree = withOverrides(makePlayer(9, 'bos', 'SP'), {
      firstName: 'Tomas',
      lastName: 'Ruiz',
      age: 41,
      personality: {
        leadership: 77,
      },
    });
    const teammate = withOverrides(makePlayer(10, 'nyy', '2B'), {
      firstName: 'Sam',
      lastName: 'Hale',
    });

    const bundle = buildRetirementConsequenceBundle!({
      rng: new simCore.GameRNG(41),
      season: 6,
      day: 1,
      userTeamId: 'nyy',
      retiredPlayers: [userRetiree, leagueRetiree],
      remainingUserPlayers: [teammate],
    });

    expect(bundle.newsItems).toHaveLength(2);
    expect(bundle.newsItems.every((item) => item.category === 'roster_move')).toBe(true);
    expect(bundle.briefingItems).toHaveLength(1);
    expect(bundle.playerMoraleEvents).toEqual([
      expect.objectContaining({ playerId: teammate.id, event: expect.objectContaining({ impact: -4 }) }),
    ]);
    expect(bundle.ownerDecisionDelta?.delta).toBe(-2);
    expect(bundle.seasonHistoryMoments[0]).toContain(userRetiree.lastName);
  });
});
