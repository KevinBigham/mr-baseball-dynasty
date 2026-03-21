/**
 * Round 9: The Wire — Tests
 */
import { describe, it, expect } from 'vitest';
import { generateNarrativeEvents } from '../../src/engine/narrativeEvents';

describe('Narrative Events', () => {
  const names = ['Mike Johnson', 'Alex Davis', 'Sam Wilson', 'Chris Brown', 'Pat Garcia'];

  it('generates 1-2 events per segment', () => {
    for (let seg = 0; seg < 5; seg++) {
      const events = generateNarrativeEvents(names, 2026, seg);
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.length).toBeLessThanOrEqual(2);
    }
  });

  it('each event has required fields', () => {
    const events = generateNarrativeEvents(names, 2026, 0);
    for (const e of events) {
      expect(e.headline).toBeTruthy();
      expect(e.detail).toBeTruthy();
      expect(e.options.length).toBeGreaterThanOrEqual(2);
      expect(e.playerName).toBeTruthy();
      expect(e.icon).toBeTruthy();
    }
  });

  it('is deterministic', () => {
    const a = generateNarrativeEvents(names, 2026, 2);
    const b = generateNarrativeEvents(names, 2026, 2);
    expect(a).toEqual(b);
  });

  it('returns empty for empty player list', () => {
    expect(generateNarrativeEvents([], 2026, 0)).toEqual([]);
  });

  it('generates different events for different segments', () => {
    const e0 = generateNarrativeEvents(names, 2026, 0);
    const e1 = generateNarrativeEvents(names, 2026, 1);
    // At least one field should differ (different template or player)
    expect(e0[0].id).not.toBe(e1[0].id);
  });

  it('options have labels and effects', () => {
    const events = generateNarrativeEvents(names, 2026, 3);
    for (const e of events) {
      for (const opt of e.options) {
        expect(opt.label).toBeTruthy();
        expect(opt.effect).toBeTruthy();
      }
    }
  });
});
