import { describe, it, expect } from 'vitest';
import {
  TUTORIAL_STEPS,
  getNextTutorialStep,
  shouldAutoStartTutorial,
} from '../../src/engine/tutorial';

describe('Tutorial System', () => {
  describe('shouldAutoStartTutorial', () => {
    it('returns true for rookie difficulty, first season', () => {
      expect(shouldAutoStartTutorial('rookie', 0)).toBe(true);
    });

    it('returns false for non-rookie difficulty', () => {
      expect(shouldAutoStartTutorial('normal', 0)).toBe(false);
      expect(shouldAutoStartTutorial('hard', 0)).toBe(false);
    });

    it('returns false after first season', () => {
      expect(shouldAutoStartTutorial('rookie', 1)).toBe(false);
      expect(shouldAutoStartTutorial('rookie', 5)).toBe(false);
    });
  });

  describe('getNextTutorialStep', () => {
    it('returns welcome step first for any phase', () => {
      const step = getNextTutorialStep(new Set(), 'preseason');
      expect(step).not.toBeNull();
      expect(step!.id).toBe('welcome');
    });

    it('returns phase-matching steps', () => {
      const completed = new Set(['welcome']);
      const draftStep = getNextTutorialStep(completed, 'draft');
      if (draftStep) {
        expect(['draft', 'any']).toContain(draftStep.phase);
      }
    });

    it('skips completed steps', () => {
      const completed = new Set(['welcome', 'draft_intro']);
      const step = getNextTutorialStep(completed, 'draft');
      if (step) {
        expect(step.id).not.toBe('welcome');
        expect(step.id).not.toBe('draft_intro');
      }
    });

    it('returns null when all steps completed', () => {
      const completed = new Set(TUTORIAL_STEPS.map(s => s.id));
      expect(getNextTutorialStep(completed, 'preseason')).toBeNull();
    });

    it('returns offseason steps during offseason phase', () => {
      const completed = new Set(['welcome']);
      const step = getNextTutorialStep(completed, 'offseason');
      if (step) {
        expect(['offseason', 'any']).toContain(step.phase);
      }
    });
  });

  describe('TUTORIAL_STEPS', () => {
    it('has at least 9 steps', () => {
      expect(TUTORIAL_STEPS.length).toBeGreaterThanOrEqual(9);
    });

    it('all steps have required fields', () => {
      for (const step of TUTORIAL_STEPS) {
        expect(step.id).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.message.length).toBeGreaterThan(10);
        expect(['top', 'bottom', 'center']).toContain(step.position);
      }
    });

    it('has unique IDs', () => {
      const ids = TUTORIAL_STEPS.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('covers multiple phases', () => {
      const phases = new Set(TUTORIAL_STEPS.map(s => s.phase));
      expect(phases.size).toBeGreaterThanOrEqual(4);
      expect(phases.has('draft')).toBe(true);
      expect(phases.has('offseason')).toBe(true);
    });

    it('starts with a welcome step', () => {
      expect(TUTORIAL_STEPS[0].id).toBe('welcome');
      expect(TUTORIAL_STEPS[0].phase).toBe('any');
    });
  });
});
