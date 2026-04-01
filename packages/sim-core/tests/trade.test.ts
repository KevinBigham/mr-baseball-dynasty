import { describe, it, expect } from 'vitest';
import {
  GameRNG,
  generatePlayer,
  generateTeamRoster,
  evaluatePlayerTradeValue,
  comparePackages,
  assignGMPersonality,
  evaluateTradeProposal,
  executeTrade,
  generateTradeId,
} from '../src/index.js';
import type { TradeProposal, GeneratedPlayer } from '../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlayer(seed: number, teamId: string = 'NYY'): GeneratedPlayer {
  const rng = new GameRNG(seed);
  return generatePlayer(rng, 'SS', teamId, 'MLB');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('evaluatePlayerTradeValue', () => {
  it('returns value with all dimensions', () => {
    const player = makePlayer(42);
    const value = evaluatePlayerTradeValue(player);
    expect(value.playerId).toBe(player.id);
    expect(typeof value.overall).toBe('number');
    expect(value.overall).toBeGreaterThanOrEqual(0);
    expect(value.overall).toBeLessThanOrEqual(100);
    expect(value.dimensions.currentAbility).toBeGreaterThanOrEqual(0);
    expect(value.dimensions.futureValue).toBeGreaterThanOrEqual(0);
    expect(value.dimensions.contractValue).toBeGreaterThanOrEqual(0);
    expect(value.dimensions.positionalScarcity).toBeGreaterThanOrEqual(0);
    expect(value.dimensions.durability).toBeGreaterThanOrEqual(0);
  });

  it('returns higher value for better players', () => {
    const player1 = makePlayer(42);
    const player2 = makePlayer(43);
    const lowRated = { ...player1, overallRating: 100 };
    const highRated = {
      ...player2,
      age: 26,
      hitterAttributes: {
        contact: 400, power: 400, eye: 400, speed: 350, defense: 350, durability: 400,
      },
    };
    const lowValue = evaluatePlayerTradeValue(lowRated);
    const highValue = evaluatePlayerTradeValue(highRated);
    expect(highValue.overall).toBeGreaterThan(lowValue.overall);
  });
});

describe('comparePackages', () => {
  it('returns fairness score between -100 and 100', () => {
    const player1 = makePlayer(42, 'NYY');
    const player2 = makePlayer(43, 'BOS');
    const result = comparePackages([player1], [player2]);
    expect(result.fairness).toBeGreaterThanOrEqual(-100);
    expect(result.fairness).toBeLessThanOrEqual(100);
    expect(typeof result.offerValue).toBe('number');
    expect(typeof result.requestValue).toBe('number');
  });
});

describe('assignGMPersonality', () => {
  it('returns a valid GM personality', () => {
    const rng = new GameRNG(42);
    const personality = assignGMPersonality(rng, 'NYY');
    const validPersonalities = ['aggressive', 'conservative', 'analytical', 'prospect_hugger', 'win_now'];
    expect(validPersonalities).toContain(personality);
  });
});

describe('evaluateTradeProposal', () => {
  it('returns a valid decision', () => {
    const rng1 = new GameRNG(42);
    const nyyRoster = generateTeamRoster(rng1, 'NYY');
    const rng2 = new GameRNG(99);
    const bosRoster = generateTeamRoster(rng2, 'BOS');

    const nyyMLB = nyyRoster.filter((p) => p.rosterStatus === 'MLB');
    const bosMLB = bosRoster.filter((p) => p.rosterStatus === 'MLB');

    const proposal: TradeProposal = {
      id: 'test-trade-1',
      fromTeamId: 'NYY',
      toTeamId: 'BOS',
      playersOffered: [nyyMLB[0]!.id],
      playersRequested: [bosMLB[0]!.id],
      status: 'proposed',
      reason: 'Test trade',
    };

    const rng3 = new GameRNG(200);
    const result = evaluateTradeProposal(
      rng3, proposal, nyyMLB, bosMLB, 'analytical', false,
    );
    expect(['accepted', 'rejected', 'countered']).toContain(result.decision);
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

describe('executeTrade', () => {
  it('moves players between teams', () => {
    const player1 = makePlayer(42, 'NYY');
    const player2 = makePlayer(43, 'BOS');
    const allPlayers = [player1, player2];

    const proposal: TradeProposal = {
      id: 'test-trade-2',
      fromTeamId: 'NYY',
      toTeamId: 'BOS',
      playersOffered: [player1.id],
      playersRequested: [player2.id],
      status: 'accepted',
      reason: 'Executed trade',
    };

    const result = executeTrade(proposal, allPlayers);
    expect(result.executed).toBe(true);
    expect(result.playersMoved.length).toBe(2);
    // player1 should now be on BOS
    expect(allPlayers.find((p) => p.id === player1.id)!.teamId).toBe('BOS');
    // player2 should now be on NYY
    expect(allPlayers.find((p) => p.id === player2.id)!.teamId).toBe('NYY');
  });
});

describe('generateTradeId', () => {
  it('returns unique strings', () => {
    const rng = new GameRNG(42);
    const id1 = generateTradeId(rng);
    const id2 = generateTradeId(rng);
    expect(typeof id1).toBe('string');
    expect(id1.startsWith('trade-')).toBe(true);
    expect(id1).not.toBe(id2);
  });
});
