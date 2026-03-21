/**
 * Round 1 — Trade execution tests.
 * Tests player movement, roster limits, state consistency.
 */
import { describe, it, expect } from 'vitest';
import {
  executeTrade,
  evaluateProposedTrade,
  evaluatePlayer,
} from '../../src/engine/trading';
import type { Player } from '../../src/types/player';

// ─── Factories ──────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> & { playerId: number; teamId: number }): Player {
  return {
    name: `Player ${overrides.playerId}`,
    firstName: 'Test',
    lastName: `Player${overrides.playerId}`,
    age: 27,
    position: '1B',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    leagueLevel: 'MLB',
    isPitcher: false,
    hitterAttributes: null,
    pitcherAttributes: null,
    overall: 300,
    potential: 350,
    development: {
      meanReversion: 0, volatility: 0.1, peak: 28, declineRate: 0.02,
      lastDelta: 0, peakReached: false,
    } as any,
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 172,
      serviceTimeCurrentTeamDays: 172,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 26,
      contractYearsRemaining: 3,
      salary: 5000000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  } as Player;
}

function makeRoster(): Player[] {
  const players: Player[] = [];
  // Team 1: 25 MLB active players + 5 minor leaguers on 40-man = 30 on 40-man
  for (let i = 1; i <= 25; i++) {
    players.push(makePlayer({
      playerId: i,
      teamId: 1,
    }));
  }
  for (let i = 26; i <= 30; i++) {
    players.push(makePlayer({
      playerId: i,
      teamId: 1,
      rosterData: {
        ...makePlayer({ playerId: i, teamId: 1 }).rosterData,
        rosterStatus: 'MINORS_AAA',
      },
    }));
  }

  // Team 2: similar
  for (let i = 101; i <= 125; i++) {
    players.push(makePlayer({
      playerId: i,
      teamId: 2,
    }));
  }
  for (let i = 126; i <= 130; i++) {
    players.push(makePlayer({
      playerId: i,
      teamId: 2,
      rosterData: {
        ...makePlayer({ playerId: i, teamId: 2 }).rosterData,
        rosterStatus: 'MINORS_AAA',
      },
    }));
  }

  return players;
}

// ─── executeTrade ───────────────────────────────────────────────────────────

describe('executeTrade — player movement', () => {
  it('swaps player team assignments', () => {
    const players = makeRoster();
    const result = executeTrade(players, 1, 2, [1, 2], [101, 102]);
    expect(result.ok).toBe(true);

    // Players 1, 2 should now be on team 2
    expect(players.find(p => p.playerId === 1)!.teamId).toBe(2);
    expect(players.find(p => p.playerId === 2)!.teamId).toBe(2);

    // Players 101, 102 should now be on team 1
    expect(players.find(p => p.playerId === 101)!.teamId).toBe(1);
    expect(players.find(p => p.playerId === 102)!.teamId).toBe(1);
  });

  it('incoming players are added to 40-man roster', () => {
    const players = makeRoster();
    // Set an incoming player as not on 40-man
    const p101 = players.find(p => p.playerId === 101)!;
    p101.rosterData.isOn40Man = false;

    executeTrade(players, 1, 2, [1], [101]);

    // After trade, incoming player should be on 40-man
    expect(p101.rosterData.isOn40Man).toBe(true);
  });

  it('fails if player is not on expected team', () => {
    const players = makeRoster();
    // Try to trade player 101 (team 2) as if they're on team 1
    const result = executeTrade(players, 1, 2, [101], [1]);
    expect(result.ok).toBe(false);
  });

  it('fails if player does not exist', () => {
    const players = makeRoster();
    const result = executeTrade(players, 1, 2, [999], [101]);
    expect(result.ok).toBe(false);
  });

  it('handles 1-for-1 trades', () => {
    const players = makeRoster();
    const result = executeTrade(players, 1, 2, [1], [101]);
    expect(result.ok).toBe(true);
    expect(players.find(p => p.playerId === 1)!.teamId).toBe(2);
    expect(players.find(p => p.playerId === 101)!.teamId).toBe(1);
  });

  it('handles multi-player trades (3-for-2)', () => {
    const players = makeRoster();
    const result = executeTrade(players, 1, 2, [1, 2, 3], [101, 102]);
    expect(result.ok).toBe(true);
    expect(players.filter(p => p.teamId === 1 && p.playerId <= 25).length).toBe(22); // lost 3
    expect(players.filter(p => p.teamId === 1 && p.playerId >= 101 && p.playerId <= 102).length).toBe(2); // gained 2
  });
});

// ─── evaluateProposedTrade ──────────────────────────────────────────────────

describe('evaluateProposedTrade — fairness', () => {
  it('approves a fair trade (similar value)', () => {
    const players = makeRoster();
    const result = evaluateProposedTrade(players, [1], [101]);
    expect(result.fair).toBe(true);
    expect(result.userValue).toBeGreaterThan(0);
    expect(result.partnerValue).toBeGreaterThan(0);
  });

  it('rejects a heavily lopsided trade', () => {
    const players = makeRoster();
    // Give player 1 a very high overall
    players.find(p => p.playerId === 1)!.overall = 500;
    // Give player 101 a very low overall
    players.find(p => p.playerId === 101)!.overall = 100;

    const result = evaluateProposedTrade(players, [101], [1]);
    // User is offering low value for high value → not fair for the partner
    expect(result.userValue).toBeLessThan(result.partnerValue * 0.85);
    expect(result.fair).toBe(false);
  });

  it('tradeValueBonus shifts the fairness threshold', () => {
    const players = makeRoster();
    players.find(p => p.playerId === 1)!.overall = 280;
    players.find(p => p.playerId === 101)!.overall = 320;

    // Without bonus, might be rejected
    const strict = evaluateProposedTrade(players, [1], [101], 0);
    // With max bonus, should be more lenient
    const lenient = evaluateProposedTrade(players, [1], [101], 9);

    // Lenient should be at least as likely to be fair
    if (!strict.fair) {
      expect(lenient.fair).toBe(true);
    }
  });
});

// ─── evaluatePlayer ─────────────────────────────────────────────────────────

describe('evaluatePlayer — trade value', () => {
  it('returns positive value for all players', () => {
    const player = makePlayer({ playerId: 1, teamId: 1 });
    expect(evaluatePlayer(player)).toBeGreaterThan(0);
  });

  it('young players with high potential have higher value', () => {
    const young = makePlayer({ playerId: 1, teamId: 1, age: 23, potential: 450, overall: 250 });
    const old = makePlayer({ playerId: 2, teamId: 1, age: 35, potential: 300, overall: 300 });
    expect(evaluatePlayer(young)).toBeGreaterThan(evaluatePlayer(old));
  });

  it('higher overall = higher trade value', () => {
    const good = makePlayer({ playerId: 1, teamId: 1, overall: 400 });
    const avg = makePlayer({ playerId: 2, teamId: 1, overall: 250 });
    expect(evaluatePlayer(good)).toBeGreaterThan(evaluatePlayer(avg));
  });
});
