import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

describe('Accessibility attributes', () => {
  // ── SortHeader keyboard accessibility ─────────────────────────────────────
  describe('RosterView SortHeader', () => {
    const rosterSource = readFileSync(
      resolve('src/components/roster/RosterView.tsx'), 'utf-8',
    );
    const sortHeaderSource = readFileSync(
      resolve('src/components/shared/SortHeader.tsx'), 'utf-8',
    );

    it('uses the shared SortHeader component in RosterView', () => {
      expect(rosterSource).toContain("import { SortHeader } from '../shared/SortHeader';");
      expect(rosterSource).toContain('<SortHeader label="PLAYER"');
    });

    it('has scope="col" on th elements', () => {
      expect(sortHeaderSource).toContain('scope="col"');
    });

    it('has tabIndex={0} for keyboard focus', () => {
      expect(sortHeaderSource).toContain('tabIndex={0}');
    });

    it('has role="button" for ARIA semantics', () => {
      expect(sortHeaderSource).toContain('role="button"');
    });

    it('has onKeyDown handler for Enter/Space activation', () => {
      expect(sortHeaderSource).toContain('onKeyDown=');
      expect(sortHeaderSource).toContain("e.key === 'Enter'");
      expect(sortHeaderSource).toContain("e.key === ' '");
    });

    it('has aria-sort attribute', () => {
      expect(sortHeaderSource).toContain('aria-sort=');
    });

    it('has aria-label for sort description', () => {
      expect(sortHeaderSource).toContain('aria-label={`Sort by');
    });
  });

  // ── Table captions ──────────────────────────────────────────────────────────
  describe('RosterView table captions', () => {
    const source = readFileSync(
      resolve('src/components/roster/RosterView.tsx'), 'utf-8',
    );

    it('has Position Players caption', () => {
      expect(source).toContain('<caption className="sr-only">Position Players</caption>');
    });

    it('has Pitchers caption', () => {
      expect(source).toContain('<caption className="sr-only">Pitchers</caption>');
    });
  });

  // ── FreeAgencyPanel range input ARIA ──────────────────────────────────────
  describe('FreeAgencyPanel range inputs', () => {
    const source = readFileSync(
      resolve('src/components/offseason/FreeAgencyPanel.tsx'), 'utf-8',
    );

    it('years range has aria-label', () => {
      expect(source).toContain('aria-label="Contract length in years"');
    });

    it('salary range has aria-label', () => {
      expect(source).toContain('aria-label="Annual salary"');
    });
  });

  // ── Expandable panels keyboard accessibility ─────────────────────────────
  describe('Expandable panel keyboard accessibility', () => {
    const panels = [
      { name: 'AwardRacePanel', path: 'src/components/dashboard/AwardRacePanel.tsx' },
      { name: 'MomentsPanel', path: 'src/components/dashboard/MomentsPanel.tsx' },
      { name: 'RivalryPanel', path: 'src/components/dashboard/RivalryPanel.tsx' },
      { name: 'FranchisePanel', path: 'src/components/dashboard/FranchisePanel.tsx' },
      { name: 'LegacyTimeline', path: 'src/components/dashboard/LegacyTimeline.tsx' },
    ];

    for (const panel of panels) {
      it(`${panel.name} has keyboard support (tabIndex, role, onKeyDown, aria-expanded)`, () => {
        const source = readFileSync(resolve(panel.path), 'utf-8');
        expect(source).toContain('tabIndex={0}');
        expect(source).toContain('role="button"');
        expect(source).toContain('onKeyDown=');
        expect(source).toContain('aria-expanded=');
      });
    }
  });

  // ── WCAG color contrast ────────────────────────────────────────────────────
  describe('WCAG color contrast', () => {
    it('no text-gray-600 in component files (replaced with text-gray-500 for AA compliance)', () => {
      const componentsDir = resolve('src/components');
      const files = getAllTsxFiles(componentsDir);
      const violations: string[] = [];
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        if (content.includes('text-gray-600')) {
          violations.push(file.replace(componentsDir + '/', ''));
        }
      }
      expect(violations).toEqual([]);
    });
  });
});

function getAllTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsxFiles(full));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}
