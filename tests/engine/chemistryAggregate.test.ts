import { describe, it, expect } from 'vitest';
import {
  aggregateArchetypes,
  aggregateWithProfiles,
  summarizeFlags,
  buildChemistrySnapshot,
  type ArchetypeCounts,
} from '../../src/engine/chemistryAggregate';
import { ARCHETYPES } from '../../src/engine/chemistryContracts';
import type { Player } from '../../src/types/player';

// ─── Test Player Factory ────────────────────────────────────────────────────

function makePlayer(opts: {
  workEthic: number;
  mentalToughness: number;
  age?: number;
  overall?: number;
  position?: string;
  isPitcher?: boolean;
  playerId?: number;
  teamId?: number;
}): Player {
  const isPitcher = opts.isPitcher ?? false;
  const we = opts.workEthic;
  const mt = opts.mentalToughness;

  const hitterAttrs = !isPitcher
    ? {
        contact: 300, power: 280, eye: 260, speed: 240,
        baserunningIQ: 250, fielding: 270, armStrength: 260,
        durability: 300, platoonSensitivity: 0,
        offensiveIQ: 280, defensiveIQ: 270,
        workEthic: we,
        mentalToughness: mt,
      }
    : null;

  const pitcherAttrs = isPitcher
    ? {
        stuff: 350, movement: 320, command: 300, stamina: 280,
        pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 250,
        durability: 300, recoveryRate: 280, platoonTendency: 0,
        pitchTypeMix: { fastball: 0.55, breaking: 0.25, offspeed: 0.20 },
        pitchingIQ: 290,
        workEthic: we,
        mentalToughness: mt,
      }
    : null;

  return {
    playerId: opts.playerId ?? 1,
    teamId: opts.teamId ?? 1,
    name: 'Test Player',
    firstName: 'Test',
    lastName: 'Player',
    age: opts.age ?? 28,
    position: (opts.position ?? 'SS') as Player['position'],
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    leagueLevel: 'MLB',
    isPitcher,
    hitterAttributes: hitterAttrs,
    pitcherAttributes: pitcherAttrs,
    overall: opts.overall ?? 350,
    potential: 450,
    development: { theta: 0, sigma: 0.1, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 2,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 26,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  } as Player;
}

// ─── aggregateArchetypes ────────────────────────────────────────────────────

describe('chemistryAggregate — aggregateArchetypes', () => {
  it('counts archetypes correctly for a mixed roster', () => {
    const players = [
      // Veteran leader: age 32, high work ethic (80), high mental toughness (85)
      makePlayer({ workEthic: 80, mentalToughness: 85, age: 32, playerId: 1 }),
      // Clubhouse disruptor: low work ethic (20), low mental toughness (25)
      makePlayer({ workEthic: 20, mentalToughness: 25, age: 30, playerId: 2 }),
      // Quiet professional: solid ethic (65), solid toughness (70)
      makePlayer({ workEthic: 65, mentalToughness: 70, age: 29, playerId: 3 }),
      // Neutral: middling stats, older
      makePlayer({ workEthic: 45, mentalToughness: 50, age: 27, playerId: 4 }),
    ];

    const result = aggregateArchetypes(players);

    expect(result.total).toBe(4);
    expect(result.counts.veteran_leader).toBe(1);
    expect(result.counts.clubhouse_disruptor).toBe(1);
    expect(result.counts.quiet_professional).toBe(1);
    expect(result.counts.neutral).toBe(1);
  });

  it('computes percentages correctly', () => {
    const players = [
      makePlayer({ workEthic: 65, mentalToughness: 70, age: 29, playerId: 1 }),
      makePlayer({ workEthic: 70, mentalToughness: 65, age: 27, playerId: 2 }),
    ];

    const result = aggregateArchetypes(players);

    // Both should be quiet_professional
    expect(result.counts.quiet_professional).toBe(2);
    expect(result.percentages.quiet_professional).toBeCloseTo(1.0);
    expect(result.dominant).toBe('quiet_professional');
  });

  it('identifies dominant archetype correctly', () => {
    const players = [
      makePlayer({ workEthic: 65, mentalToughness: 70, age: 29, playerId: 1 }),
      makePlayer({ workEthic: 70, mentalToughness: 65, age: 27, playerId: 2 }),
      makePlayer({ workEthic: 80, mentalToughness: 85, age: 33, playerId: 3 }), // vet leader
    ];

    const result = aggregateArchetypes(players);

    expect(result.dominant).toBe('quiet_professional');
    expect(result.counts.quiet_professional).toBe(2);
    expect(result.counts.veteran_leader).toBe(1);
  });

  it('handles empty roster', () => {
    const result = aggregateArchetypes([]);

    expect(result.total).toBe(0);
    for (const a of ARCHETYPES) {
      expect(result.counts[a]).toBe(0);
      expect(result.percentages[a]).toBe(0);
    }
  });

  it('recognizes young_star archetype', () => {
    const players = [
      makePlayer({ workEthic: 55, mentalToughness: 50, age: 23, overall: 450, playerId: 1 }),
    ];

    const result = aggregateArchetypes(players);

    expect(result.counts.young_star).toBe(1);
    expect(result.dominant).toBe('young_star');
  });

  it('recognizes hot_head archetype', () => {
    const players = [
      // Low mental toughness but not low enough work ethic for disruptor
      makePlayer({ workEthic: 50, mentalToughness: 25, age: 28, playerId: 1 }),
    ];

    const result = aggregateArchetypes(players);

    expect(result.counts.hot_head).toBe(1);
    expect(result.dominant).toBe('hot_head');
  });
});

// ─── aggregateWithProfiles ──────────────────────────────────────────────────

describe('chemistryAggregate — aggregateWithProfiles', () => {
  it('returns matching profiles and aggregate counts', () => {
    const players = [
      makePlayer({ workEthic: 80, mentalToughness: 85, age: 32, playerId: 1 }),
      makePlayer({ workEthic: 20, mentalToughness: 25, age: 30, playerId: 2 }),
    ];

    const { profiles, archetypes } = aggregateWithProfiles(players);

    expect(profiles).toHaveLength(2);
    expect(profiles[0].archetype).toBe('veteran_leader');
    expect(profiles[1].archetype).toBe('clubhouse_disruptor');
    expect(archetypes.counts.veteran_leader).toBe(1);
    expect(archetypes.counts.clubhouse_disruptor).toBe(1);
    expect(archetypes.total).toBe(2);
  });
});

// ─── summarizeFlags ─────────────────────────────────────────────────────────

describe('chemistryAggregate — summarizeFlags', () => {
  it('detects leadership and disruption', () => {
    const archetypes: ArchetypeCounts = {
      counts: { veteran_leader: 2, clubhouse_disruptor: 1, quiet_professional: 3, hot_head: 0, young_star: 1, neutral: 5 },
      percentages: { veteran_leader: 0.167, clubhouse_disruptor: 0.083, quiet_professional: 0.25, hot_head: 0, young_star: 0.083, neutral: 0.417 },
      dominant: 'neutral',
      total: 12,
    };

    const flags = summarizeFlags(archetypes);

    expect(flags.hasLeadership).toBe(true);
    expect(flags.hasDisruption).toBe(true);
    expect(flags.leaderCount).toBe(2);
    expect(flags.disruptorCount).toBe(1);
  });

  it('reports no leadership or disruption when absent', () => {
    const archetypes: ArchetypeCounts = {
      counts: { veteran_leader: 0, clubhouse_disruptor: 0, quiet_professional: 5, hot_head: 0, young_star: 0, neutral: 3 },
      percentages: { veteran_leader: 0, clubhouse_disruptor: 0, quiet_professional: 0.625, hot_head: 0, young_star: 0, neutral: 0.375 },
      dominant: 'quiet_professional',
      total: 8,
    };

    const flags = summarizeFlags(archetypes);

    expect(flags.hasLeadership).toBe(false);
    expect(flags.hasDisruption).toBe(false);
    expect(flags.leaderCount).toBe(0);
    expect(flags.disruptorCount).toBe(0);
  });
});

// ─── buildChemistrySnapshot ─────────────────────────────────────────────────

describe('chemistryAggregate — buildChemistrySnapshot', () => {
  it('produces a valid snapshot with correct team/season/version', () => {
    const players = [
      makePlayer({ workEthic: 80, mentalToughness: 85, age: 33, playerId: 1, teamId: 5 }),
      makePlayer({ workEthic: 65, mentalToughness: 70, age: 27, playerId: 2, teamId: 5 }),
    ];

    const snapshot = buildChemistrySnapshot(5, 2026, players);

    expect(snapshot.teamId).toBe(5);
    expect(snapshot.season).toBe(2026);
    expect(snapshot.version).toBe(1);
    expect(snapshot.archetypeCounts.total).toBe(2);
    expect(snapshot.flags.hasLeadership).toBe(true);
    expect(snapshot.flags.hasDisruption).toBe(false);
  });

  it('handles empty roster snapshot', () => {
    const snapshot = buildChemistrySnapshot(10, 2027, []);

    expect(snapshot.teamId).toBe(10);
    expect(snapshot.archetypeCounts.total).toBe(0);
    expect(snapshot.flags.hasLeadership).toBe(false);
    expect(snapshot.flags.hasDisruption).toBe(false);
  });

  it('works with pitchers on the roster', () => {
    const players = [
      makePlayer({ workEthic: 20, mentalToughness: 25, age: 30, isPitcher: true, playerId: 1 }),
      makePlayer({ workEthic: 55, mentalToughness: 50, age: 23, overall: 450, playerId: 2 }),
    ];

    const snapshot = buildChemistrySnapshot(1, 2026, players);

    expect(snapshot.archetypeCounts.counts.clubhouse_disruptor).toBe(1);
    expect(snapshot.archetypeCounts.counts.young_star).toBe(1);
    expect(snapshot.flags.hasDisruption).toBe(true);
  });
});
