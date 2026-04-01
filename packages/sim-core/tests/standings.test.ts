import { describe, it, expect } from 'vitest';
import { StandingsTracker } from '../src/league/standings.js';

describe('StandingsTracker', () => {
  it('starts with 0-0 records', () => {
    const tracker = new StandingsTracker(['nyy', 'bos']);
    const record = tracker.getRecord('nyy');
    expect(record).toBeDefined();
    expect(record!.wins).toBe(0);
    expect(record!.losses).toBe(0);
  });

  it('records a game result', () => {
    const tracker = new StandingsTracker(['nyy', 'bos']);
    tracker.recordGame('nyy', 'bos', 5, 3, true);

    expect(tracker.getRecord('nyy')!.wins).toBe(1);
    expect(tracker.getRecord('bos')!.losses).toBe(1);
  });

  it('tracks win/loss streaks', () => {
    const tracker = new StandingsTracker(['nyy', 'bos']);
    tracker.recordGame('nyy', 'bos', 5, 3, false);
    tracker.recordGame('nyy', 'bos', 4, 2, false);
    tracker.recordGame('nyy', 'bos', 6, 1, false);

    expect(tracker.getRecord('nyy')!.streak).toBe(3); // W3
    expect(tracker.getRecord('bos')!.streak).toBe(-3); // L3
  });

  it('resets streak on loss/win', () => {
    const tracker = new StandingsTracker(['nyy', 'bos']);
    tracker.recordGame('nyy', 'bos', 5, 3, false);
    tracker.recordGame('nyy', 'bos', 4, 2, false);
    tracker.recordGame('bos', 'nyy', 7, 1, false);

    expect(tracker.getRecord('nyy')!.streak).toBe(-1);
    expect(tracker.getRecord('bos')!.streak).toBe(1);
  });

  it('computes games back correctly', () => {
    const tracker = new StandingsTracker(['nyy', 'bos', 'tb']);
    // NYY: 10-5, BOS: 7-8, TB: 5-10
    for (let i = 0; i < 10; i++) tracker.recordGame('nyy', 'bos', 5, 3, true);
    for (let i = 0; i < 5; i++) tracker.recordGame('bos', 'nyy', 4, 2, true);
    for (let i = 0; i < 5; i++) tracker.recordGame('bos', 'tb', 3, 1, true);
    for (let i = 0; i < 5; i++) tracker.recordGame('tb', 'bos', 6, 4, true);

    const standings = tracker.getDivisionStandings('AL_EAST');
    expect(standings.length).toBeGreaterThan(0);

    // Leader should have 0 GB
    expect(standings[0]!.gamesBack).toBe(0);
  });

  it('serializes and deserializes', () => {
    const tracker = new StandingsTracker(['nyy', 'bos']);
    tracker.recordGame('nyy', 'bos', 5, 3, false);
    tracker.recordGame('bos', 'nyy', 4, 2, false);

    const serialized = tracker.serialize();
    const restored = StandingsTracker.deserialize(serialized);

    expect(restored.getRecord('nyy')!.wins).toBe(1);
    expect(restored.getRecord('bos')!.wins).toBe(1);
  });
});
