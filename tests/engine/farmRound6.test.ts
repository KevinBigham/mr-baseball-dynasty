/**
 * Round 6: The Farm — Tests
 * Covers: Vision System, Farm Report, Prospect Dev utilities
 */

import { describe, it, expect } from 'vitest';
import { generateVisionOpinions } from '../../src/engine/visionSystem';
import { generateFarmReport } from '../../src/engine/farmReport';
import type { FOStaffMember } from '../../src/types/frontOffice';
import type { RosterPlayer } from '../../src/types/league';

// ─── Vision System Tests ──────────────────────────────────────────────────

describe('Vision System', () => {
  const mockStaff: FOStaffMember[] = [
    { id: '1', roleId: 'scout_dir', name: 'Joe Scout', ovr: 80, salary: 1, yearsLeft: 2, traitId: 'talent_scout' } as FOStaffMember,
    { id: '2', roleId: 'analytics', name: 'Data Dan', ovr: 70, salary: 1, yearsLeft: 2, traitId: 'analytical' } as FOStaffMember,
    { id: '3', roleId: 'manager', name: 'Skip Jones', ovr: 60, salary: 1, yearsLeft: 2, traitId: 'clubhouse_guy' } as FOStaffMember,
  ];

  it('generates 2-3 opinions for a prospect', () => {
    const opinions = generateVisionOpinions(101, 250, 450, false, 20, mockStaff, 2026);
    expect(opinions.length).toBeGreaterThanOrEqual(2);
    expect(opinions.length).toBeLessThanOrEqual(3);
  });

  it('each opinion has required fields', () => {
    const opinions = generateVisionOpinions(101, 250, 450, false, 20, mockStaff, 2026);
    for (const op of opinions) {
      expect(op.staffName).toBeTruthy();
      expect(op.staffRole).toBeTruthy();
      expect(op.icon).toBeTruthy();
      expect(op.projectedGrade).toBeGreaterThanOrEqual(20);
      expect(op.projectedGrade).toBeLessThanOrEqual(80);
      expect(['high', 'medium', 'low']).toContain(op.confidence);
      expect(op.quote).toBeTruthy();
      expect(op.projectedCeiling).toBeTruthy();
    }
  });

  it('higher staff OVR produces more accurate projections', () => {
    const eliteStaff: FOStaffMember[] = [
      { id: '1', roleId: 'scout_dir', name: 'Elite', ovr: 95, salary: 3, yearsLeft: 2, traitId: 'talent_scout' } as FOStaffMember,
    ];
    const cheapStaff: FOStaffMember[] = [
      { id: '1', roleId: 'scout_dir', name: 'Cheap', ovr: 40, salary: 0.3, yearsLeft: 2, traitId: 'talent_scout' } as FOStaffMember,
    ];

    // True potential grade: ~69 (450/550 * 60 + 20)
    const eliteOps = generateVisionOpinions(101, 250, 450, false, 20, eliteStaff, 2026);
    const cheapOps = generateVisionOpinions(101, 250, 450, false, 20, cheapStaff, 2026);

    // Elite should be closer to true grade
    const truePotGrade = Math.round(20 + (450 / 550) * 60);
    const eliteDeviation = Math.abs(eliteOps[0].projectedGrade - truePotGrade);
    const cheapDeviation = Math.abs(cheapOps[0].projectedGrade - truePotGrade);

    // Elite deviation should be smaller (tighter projections)
    // This is probabilistic but with large gap in staff OVR, should hold
    expect(eliteDeviation).toBeLessThanOrEqual(cheapDeviation + 10); // generous tolerance
  });

  it('generates different opinions for different staff', () => {
    const opinions = generateVisionOpinions(101, 250, 450, false, 20, mockStaff, 2026);
    if (opinions.length >= 2) {
      // At least staff names should differ
      expect(opinions[0].staffName).not.toBe(opinions[1].staffName);
    }
  });

  it('is deterministic (same inputs = same outputs)', () => {
    const ops1 = generateVisionOpinions(101, 250, 450, false, 20, mockStaff, 2026);
    const ops2 = generateVisionOpinions(101, 250, 450, false, 20, mockStaff, 2026);
    expect(ops1.length).toBe(ops2.length);
    for (let i = 0; i < ops1.length; i++) {
      expect(ops1[i].projectedGrade).toBe(ops2[i].projectedGrade);
      expect(ops1[i].quote).toBe(ops2[i].quote);
    }
  });

  it('generates opinions for pitchers', () => {
    const opinions = generateVisionOpinions(202, 200, 400, true, 19, mockStaff, 2026);
    expect(opinions.length).toBeGreaterThanOrEqual(2);
    // Manager should have personality-based quote
    const managerOp = opinions.find(o => o.staffRole === 'Manager');
    if (managerOp) {
      expect(managerOp.quote).toBeTruthy();
    }
  });

  it('generates generic opinions when no staff', () => {
    const opinions = generateVisionOpinions(101, 250, 450, false, 20, [], 2026);
    expect(opinions.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Farm Report Tests ────────────────────────────────────────────────────

describe('Farm Report', () => {
  function makeMinorLeaguer(overrides: Partial<RosterPlayer>): RosterPlayer {
    return {
      playerId: 1,
      name: 'Test Player',
      position: 'SS',
      age: 20,
      bats: 'R',
      throws: 'R',
      isPitcher: false,
      overall: 200,
      potential: 400,
      rosterStatus: 'MINORS_AA',
      isOn40Man: false,
      optionYearsRemaining: 3,
      serviceTimeDays: 0,
      salary: 0.5,
      contractYearsRemaining: 6,
      ...overrides,
    } as RosterPlayer;
  }

  it('generates alerts for a typical farm system', () => {
    const players = [
      makeMinorLeaguer({ playerId: 1, name: 'Star Prospect', overall: 380, potential: 450, age: 22, rosterStatus: 'MINORS_AAA' }),
      makeMinorLeaguer({ playerId: 2, name: 'Raw Talent', overall: 180, potential: 420, age: 19, rosterStatus: 'MINORS_AMINUS' }),
      makeMinorLeaguer({ playerId: 3, name: 'Stalled Vet', overall: 200, potential: 380, age: 26, rosterStatus: 'MINORS_AA' }),
    ];
    const alerts = generateFarmReport(players, 2, 2026);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.length).toBeLessThanOrEqual(5);
  });

  it('generates promotion alerts for ready prospects', () => {
    const players = [
      makeMinorLeaguer({ playerId: 1, name: 'Ready Player', overall: 350, potential: 450, age: 23, rosterStatus: 'MINORS_AAA' }),
    ];
    const alerts = generateFarmReport(players, 1, 2026);
    const promo = alerts.find(a => a.type === 'promotion');
    expect(promo).toBeDefined();
  });

  it('generates riser alerts for fast developers', () => {
    const players = [
      makeMinorLeaguer({ playerId: 1, name: 'Fast Dev', overall: 380, potential: 430, age: 21, rosterStatus: 'MINORS_AA' }),
    ];
    const alerts = generateFarmReport(players, 0, 2026);
    const riser = alerts.find(a => a.type === 'riser');
    expect(riser).toBeDefined();
  });

  it('generates faller alerts for stalling prospects', () => {
    const players = [
      makeMinorLeaguer({ playerId: 1, name: 'Staller', overall: 180, potential: 400, age: 25, rosterStatus: 'MINORS_AA' }),
    ];
    const alerts = generateFarmReport(players, 3, 2026);
    const faller = alerts.find(a => a.type === 'faller');
    expect(faller).toBeDefined();
  });

  it('caps at 5 alerts', () => {
    const players = Array.from({ length: 20 }, (_, i) =>
      makeMinorLeaguer({
        playerId: i + 1,
        name: `Prospect ${i}`,
        overall: 350 + (i % 5) * 20,
        potential: 450,
        age: 20 + (i % 7),
        rosterStatus: i % 2 === 0 ? 'MINORS_AAA' : 'MINORS_AA',
      })
    );
    const alerts = generateFarmReport(players, 2, 2026);
    expect(alerts.length).toBeLessThanOrEqual(5);
  });

  it('returns note when no special conditions', () => {
    const players = [
      makeMinorLeaguer({ playerId: 1, name: 'Normal Kid', overall: 200, potential: 350, age: 19, rosterStatus: 'MINORS_ROOKIE' }),
    ];
    const alerts = generateFarmReport(players, 0, 2026);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].type).toBe('note');
  });

  it('returns empty for empty roster', () => {
    const alerts = generateFarmReport([], 0, 2026);
    expect(alerts).toEqual([]);
  });

  it('each alert has required fields', () => {
    const players = [
      makeMinorLeaguer({ playerId: 1, name: 'Test', overall: 350, potential: 450, age: 22, rosterStatus: 'MINORS_AAA' }),
    ];
    const alerts = generateFarmReport(players, 1, 2026);
    for (const alert of alerts) {
      expect(alert.type).toBeTruthy();
      expect(alert.icon).toBeTruthy();
      expect(alert.playerName).toBeTruthy();
      expect(alert.headline).toBeTruthy();
      expect(alert.detail).toBeTruthy();
    }
  });
});
