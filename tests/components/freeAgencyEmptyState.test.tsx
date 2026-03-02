import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('FreeAgencyPanel', () => {
  const source = readFileSync(
    resolve('src/components/offseason/FreeAgencyPanel.tsx'), 'utf-8',
  );

  it('shows empty state when no free agents match filters', () => {
    expect(source).toContain('No free agents match your filters.');
  });

  it('modal has overflow-y-auto for small screens', () => {
    expect(source).toContain('max-h-[90vh] overflow-y-auto');
  });

  it('modal has horizontal padding for mobile', () => {
    // The outer wrapper should have px-4 so modal doesn't touch screen edges
    expect(source).toContain('z-50 px-4');
  });
});
