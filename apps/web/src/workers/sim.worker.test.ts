// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOffseasonState, evaluatePlayerTradeValue } from '@mbd/sim-core';

vi.mock('comlink', () => ({
  expose: () => {},
}));

import { api } from './sim.worker';
import { requireState, setState } from './sim.worker.helpers';

describe('sim worker narrative APIs', () => {
  afterEach(() => {
    setState(null);
  });

  it('hydrates briefing, chemistry, and owner state for a new game', () => {
    api.newGame(123, 'nyy');

    const chemistry = api.getTeamChemistry('nyy');
    const owner = api.getOwnerState('nyy');
    const briefing = api.getBriefing(10);

    expect(chemistry?.teamId).toBe('nyy');
    expect(chemistry?.score).toBeGreaterThanOrEqual(0);
    expect(owner?.teamId).toBe('nyy');
    expect(typeof owner?.summary).toBe('string');
    expect(briefing.length).toBeGreaterThan(0);
  });

  it('returns personality profiles and award races after the season starts', () => {
    api.newGame(456, 'nyy');
    api.simDay();
    api.simDay();

    const roster = api.getTeamRoster('nyy');
    const profile = api.getPersonalityProfile(roster[0]!.id);
    const awardRaces = api.getAwardRaces();

    expect(profile?.playerId).toBe(roster[0]!.id);
    expect(typeof profile?.archetype).toBe('string');
    expect(profile?.morale.score).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(awardRaces.mvp)).toBe(true);
    expect(Array.isArray(awardRaces.cyYoung)).toBe(true);
    expect(Array.isArray(awardRaces.roy)).toBe(true);
  });

  it('restores narrative state through snapshot import', () => {
    api.newGame(789, 'nyy');
    api.simDay();
    api.simDay();

    const beforeChemistry = api.getTeamChemistry('nyy');
    const beforeBriefing = api.getBriefing(10);
    const snapshot = api.exportSnapshot();

    api.newGame(999, 'bos');
    api.importSnapshot(snapshot);

    expect(api.getTeamChemistry('nyy')).toEqual(beforeChemistry);
    expect(api.getBriefing(10)).toEqual(beforeBriefing);
  });

  it('adds trade consequences after an accepted user trade', () => {
    api.newGame(321, 'nyy');
    const state = requireState();
    const userPlayers = state.players
      .filter((player) => player.teamId === 'nyy' && player.rosterStatus === 'MLB' && !player.contract.noTradeClause)
      .sort((left, right) => evaluatePlayerTradeValue(right).overall - evaluatePlayerTradeValue(left).overall);
    const partnerPlayers = state.players
      .filter((player) => player.teamId === 'bos' && player.rosterStatus === 'MLB' && !player.contract.noTradeClause)
      .sort((left, right) => evaluatePlayerTradeValue(left).overall - evaluatePlayerTradeValue(right).overall);

    const offered = userPlayers[0]!;
    const requested = partnerPlayers[0]!;
    const baselineAcquiredMorale = state.playerMorale.get(requested.id)?.score ?? 0;
    const baselineOutgoingMorale = state.playerMorale.get(offered.id)?.score ?? 0;
    const beforeOwner = api.getOwnerState('nyy');

    const result = api.proposeTrade([offered.id], [requested.id], 'bos');

    expect(result.decision).toBe('accepted');

    const afterState = requireState();
    const tradeNews = api.getNews(25).find((item) => item.category === 'trade');
    const tradeBriefing = api.getBriefing(25).find((item) => item.category === 'news' && item.relatedPlayerIds.includes(requested.id));
    const afterOwner = api.getOwnerState('nyy');

    expect(tradeNews).toBeTruthy();
    expect(tradeBriefing).toBeTruthy();
    expect(afterState.playerMorale.get(requested.id)?.score).toBeGreaterThan(baselineAcquiredMorale);
    expect(afterState.playerMorale.get(offered.id)?.score).toBeLessThan(baselineOutgoingMorale);
    expect(afterOwner?.summary).not.toBe(beforeOwner?.summary);
  });

  it('adds signing consequences after a successful user offer', () => {
    api.newGame(654, 'nyy');
    const market = api.getFreeAgents(50);
    const target = market[0]!;
    const teammate = requireState().players.find((player) => player.teamId === 'nyy' && player.rosterStatus === 'MLB')!;
    const baselineTeammateMorale = requireState().playerMorale.get(teammate.id)?.score ?? 0;
    const beforeOwner = api.getOwnerState('nyy');

    const result = api.makeContractOffer(target.player.id, 4, Math.ceil(target.marketValue));

    expect(result.accepted).toBe(true);

    const afterState = requireState();
    const signingNews = api.getNews(25).find((item) => item.category === 'signing' && item.relatedPlayerIds.includes(target.player.id));
    const signingBriefing = api.getBriefing(25).find((item) => item.category === 'news' && item.relatedPlayerIds.includes(target.player.id));
    const afterOwner = api.getOwnerState('nyy');
    const signedPlayer = afterState.players.find((player) => player.id === target.player.id);

    expect(signedPlayer?.teamId).toBe('nyy');
    expect(signingNews).toBeTruthy();
    expect(signingBriefing).toBeTruthy();
    expect(afterState.playerMorale.get(target.player.id)?.score).toBeGreaterThan(0);
    expect(afterState.playerMorale.get(teammate.id)?.score).toBeGreaterThan(baselineTeammateMorale);
    expect(afterOwner?.summary).not.toBe(beforeOwner?.summary);
  });

  it('adds postseason consequences before recording season history', () => {
    api.newGame(987, 'nyy');
    const state = requireState();
    state.phase = 'playoffs';
    state.news = [];
    state.briefingQueue = [];
    state.seasonHistory = [];
    state.playoffBracket = {
      seeds: [
        { teamId: 'nyy', seed: 1, wins: 101, losses: 61 },
        { teamId: 'bos', seed: 2, wins: 95, losses: 67 },
      ],
      series: [
        { winnerId: 'nyy', loserId: 'bos', winnerWins: 4, loserWins: 2, games: [], round: 'WORLD_SERIES' },
      ],
      champion: 'nyy',
    };
    const beforeOwner = api.getOwnerState('nyy');

    api.simDay();

    const afterOwner = api.getOwnerState('nyy');
    const briefing = api.getBriefing(25).find((item) => item.category === 'news');
    const history = api.getSeasonHistory();
    const playoffNews = api.getNews(25).find((item) => item.category === 'playoff');

    expect(playoffNews).toBeTruthy();
    expect(briefing).toBeTruthy();
    expect(history[0]?.keyMoments.length).toBeGreaterThan(0);
    expect(afterOwner?.patience).toBeGreaterThan(beforeOwner?.patience ?? 0);
  });

  it('emits retirement consequences before offseason rollover removes players', () => {
    api.newGame(222, 'nyy');
    const state = requireState();
    const userVeterans = state.players
      .filter((player) => player.teamId === 'nyy' && player.rosterStatus === 'MLB');
    for (const veteran of userVeterans) {
      veteran.age = 45;
      veteran.overallRating = 390;
      veteran.personality.leadership = 88;
      if (veteran.pitcherAttributes) {
        veteran.pitcherAttributes.stamina = 40;
      } else {
        veteran.hitterAttributes.durability = 40;
      }
    }

    state.phase = 'offseason';
    state.news = [];
    state.briefingQueue = [];
    state.offseasonState = {
      ...createOffseasonState(state.season),
      completed: true,
    };
    api.simDay();

    const retirementNews = api.getNews(25).find((item) => item.category === 'roster_move');
    const retirementBriefing = api.getBriefing(25).find((item) => item.category === 'news' && item.relatedTeamIds.includes('nyy'));

    expect(retirementNews).toBeTruthy();
    expect(retirementBriefing).toBeTruthy();
  });
});
