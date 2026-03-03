import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Tests ──────────────────────────────────────────────────────────────────
// Read the source file and verify the HFA logic patterns directly.

const src = readFileSync(
  resolve('src/engine/sim/playoffSimulator.ts'),
  'utf-8',
);

describe('playoff seeding HFA logic', () => {
  it('ALCS uses seed for HFA', () => {
    expect(src).toContain('alcsHigher.seed <= alcsLower.seed');
  });

  it('NLCS uses seed for HFA', () => {
    expect(src).toContain('nlcsHigher.seed <= nlcsLower.seed');
  });

  it('World Series uses wins for HFA', () => {
    expect(src).toContain('alChamp.wins >= nlChamp.wins');
  });
});
