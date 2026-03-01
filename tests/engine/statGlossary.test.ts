import { describe, it, expect } from 'vitest';
import { STAT_GLOSSARY } from '../../src/utils/statGlossary';

describe('STAT_GLOSSARY', () => {
  it('exports STAT_GLOSSARY as a non-empty record', () => {
    expect(STAT_GLOSSARY).toBeDefined();
    expect(typeof STAT_GLOSSARY).toBe('object');
    expect(Object.keys(STAT_GLOSSARY).length).toBeGreaterThan(0);
  });

  it('has explanations for key advanced stats (wRCPlus, FIP, xFIP, ISO, BABIP, WAR)', () => {
    const requiredStats = ['wRCPlus', 'FIP', 'xFIP', 'ISO', 'BABIP', 'WAR'];
    for (const stat of requiredStats) {
      expect(STAT_GLOSSARY).toHaveProperty(stat);
      expect(STAT_GLOSSARY[stat].length).toBeGreaterThan(0);
    }
  });

  it('all values are non-empty strings', () => {
    for (const [, value] of Object.entries(STAT_GLOSSARY)) {
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
