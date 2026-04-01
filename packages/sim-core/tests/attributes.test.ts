import { describe, it, expect } from 'vitest';
import {
  toDisplayRating,
  toInternalRating,
  toLetterGrade,
  hitterOverall,
  pitcherOverall,
  clampRating,
  RATING_MIN,
  RATING_MAX,
  DISPLAY_MIN,
  DISPLAY_MAX,
} from '../src/player/attributes.js';

describe('toDisplayRating', () => {
  it('maps 0 internal to 20 display', () => {
    expect(toDisplayRating(0)).toBe(20);
  });

  it('maps 550 internal to 80 display', () => {
    expect(toDisplayRating(550)).toBe(80);
  });

  it('maps 275 internal to 50 display', () => {
    expect(toDisplayRating(275)).toBe(50);
  });

  it('clamps below zero', () => {
    expect(toDisplayRating(-10)).toBe(20);
  });

  it('clamps above 550', () => {
    expect(toDisplayRating(600)).toBe(80);
  });
});

describe('toInternalRating', () => {
  it('maps 20 display to 0 internal', () => {
    expect(toInternalRating(20)).toBe(0);
  });

  it('maps 80 display to 550 internal', () => {
    expect(toInternalRating(80)).toBe(550);
  });

  it('round-trips through display and back', () => {
    const internal = 275;
    const display = toDisplayRating(internal);
    const back = toInternalRating(display);
    expect(Math.abs(back - internal)).toBeLessThanOrEqual(10);
  });
});

describe('toLetterGrade', () => {
  it('returns A for 440+', () => {
    expect(toLetterGrade(440)).toBe('A');
    expect(toLetterGrade(550)).toBe('A');
  });

  it('returns B for 330-439', () => {
    expect(toLetterGrade(330)).toBe('B');
    expect(toLetterGrade(439)).toBe('B');
  });

  it('returns C for 220-329', () => {
    expect(toLetterGrade(220)).toBe('C');
  });

  it('returns D for 110-219', () => {
    expect(toLetterGrade(110)).toBe('D');
  });

  it('returns F for 0-109', () => {
    expect(toLetterGrade(0)).toBe('F');
    expect(toLetterGrade(109)).toBe('F');
  });
});

describe('hitterOverall', () => {
  it('computes weighted sum', () => {
    const attrs = { contact: 300, power: 300, eye: 300, speed: 300, defense: 300, durability: 300 };
    expect(hitterOverall(attrs)).toBe(300);
  });

  it('weights contact highest', () => {
    const high = { contact: 550, power: 275, eye: 275, speed: 275, defense: 275, durability: 275 };
    const low = { contact: 0, power: 275, eye: 275, speed: 275, defense: 275, durability: 275 };
    expect(hitterOverall(high)).toBeGreaterThan(hitterOverall(low));
  });
});

describe('pitcherOverall', () => {
  it('computes weighted sum', () => {
    const attrs = { stuff: 300, control: 300, stamina: 300, velocity: 300, movement: 300 };
    expect(pitcherOverall(attrs)).toBe(300);
  });
});

describe('clampRating', () => {
  it('clamps below to RATING_MIN', () => {
    expect(clampRating(-50)).toBe(RATING_MIN);
  });

  it('clamps above to RATING_MAX', () => {
    expect(clampRating(600)).toBe(RATING_MAX);
  });

  it('rounds to integer', () => {
    expect(clampRating(275.7)).toBe(276);
  });
});
