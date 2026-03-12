import { describe, it, expect } from 'vitest';
import { classifyAllTeams } from '../../src/engine/ai/gmStrategy';
import type { TeamSeason } from '../../src/types/team';
import type { Player } from '../../src/types/player';

function makeSeason(teamId: number, wins: number, losses: number): TeamSeason {
  return { teamId, season: 2026, wins, losses, runsScored: 0, runsAllowed: 0, divisionRank: 1, playoffResult: null };
}

function makePlayer(id: number, teamId: number, age: number, potential: number, status: string): Player {
  return {
    playerId: id, teamId, name: `P${id}`, age, position: 'SS', overall: 300, potential,
    isPitcher: false, rosterData: { rosterStatus: status },
  } as Player;
}

describe('classifyAllTeams — basic win%', () => {
  it('high win% → contender', () => {
    const map = new Map([[1, makeSeason(1, 95, 67)]]);
    expect(classifyAllTeams(map).get(1)).toBe('contender');
  });

  it('low win% → rebuilder', () => {
    const map = new Map([[1, makeSeason(1, 55, 107)]]);
    expect(classifyAllTeams(map).get(1)).toBe('rebuilder');
  });

  it('middle win% → fringe', () => {
    const map = new Map([[1, makeSeason(1, 78, 84)]]);
    expect(classifyAllTeams(map).get(1)).toBe('fringe');
  });
});

describe('classifyAllTeams — enhanced with roster data', () => {
  it('young competitive team with strong farm → contender', () => {
    const map = new Map([[1, makeSeason(1, 80, 82)]]);
    const players = [
      // Young MLB roster
      ...Array.from({ length: 10 }, (_, i) => makePlayer(i + 1, 1, 24, 400, 'MLB_ACTIVE')),
      // Strong farm
      ...Array.from({ length: 10 }, (_, i) => makePlayer(100 + i, 1, 20, 420, 'MINORS_AA')),
    ];
    expect(classifyAllTeams(map, players).get(1)).toBe('contender');
  });

  it('old mediocre team with weak farm → rebuilder', () => {
    const map = new Map([[1, makeSeason(1, 70, 92)]]);
    const players = [
      // Old MLB roster
      ...Array.from({ length: 10 }, (_, i) => makePlayer(i + 1, 1, 33, 300, 'MLB_ACTIVE')),
      // Weak farm
      ...Array.from({ length: 3 }, (_, i) => makePlayer(100 + i, 1, 20, 250, 'MINORS_AA')),
    ];
    expect(classifyAllTeams(map, players).get(1)).toBe('rebuilder');
  });
});
