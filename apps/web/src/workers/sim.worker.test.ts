// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('comlink', () => ({
  expose: () => {},
}));

import { api } from './sim.worker';
import { setState } from './sim.worker.helpers';

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
});
