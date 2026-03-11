/**
 * chemistryAggregate.ts — Roster-Level Chemistry Aggregation
 *
 * Pure helpers that take a roster of Players and produce:
 *   - archetype counts and percentages
 *   - dominant archetype
 *   - leadership / disruption summary flags
 *   - a minimal team chemistry snapshot skeleton
 *
 * No gameplay modifiers. No sim hooks. No side effects.
 */

import type { Player } from '../types/player';
import type { PersonalityProfile } from '../types/chemistry';
import { ARCHETYPES, CHEMISTRY_VERSION, type Archetype } from './chemistryContracts';
import { extractPersonalityInput } from './personalityBridge';
import { derivePersonality } from './personalityModel';

// ─── Aggregation output types ───────────────────────────────────────────────

export interface ArchetypeCounts {
  /** Count per archetype */
  counts: Record<Archetype, number>;
  /** Percentage (0–1) per archetype */
  percentages: Record<Archetype, number>;
  /** The most common archetype (ties broken by ARCHETYPES order) */
  dominant: Archetype;
  /** Total players aggregated */
  total: number;
}

export interface ChemistrySummaryFlags {
  /** At least one veteran_leader on the roster */
  hasLeadership: boolean;
  /** At least one clubhouse_disruptor on the roster */
  hasDisruption: boolean;
  /** Count of veteran leaders */
  leaderCount: number;
  /** Count of clubhouse disruptors */
  disruptorCount: number;
}

export interface TeamChemistrySnapshot {
  teamId: number;
  season: number;
  archetypeCounts: ArchetypeCounts;
  flags: ChemistrySummaryFlags;
  /** Chemistry version that produced this snapshot */
  version: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a zero-initialized counts record. */
function emptyCounts(): Record<Archetype, number> {
  const counts = {} as Record<Archetype, number>;
  for (const a of ARCHETYPES) {
    counts[a] = 0;
  }
  return counts;
}

// ─── Core aggregation ───────────────────────────────────────────────────────

/**
 * Derive personality profiles for a roster and tally archetype distribution.
 */
export function aggregateArchetypes(players: Player[]): ArchetypeCounts {
  const counts = emptyCounts();
  const total = players.length;

  for (const player of players) {
    const input = extractPersonalityInput(player);
    const profile = derivePersonality(input);
    counts[profile.archetype]++;
  }

  // Percentages
  const percentages = {} as Record<Archetype, number>;
  for (const a of ARCHETYPES) {
    percentages[a] = total > 0 ? counts[a] / total : 0;
  }

  // Dominant: highest count, ties broken by ARCHETYPES declaration order
  let dominant: Archetype = 'neutral';
  let maxCount = -1;
  for (const a of ARCHETYPES) {
    if (counts[a] > maxCount) {
      maxCount = counts[a];
      dominant = a;
    }
  }

  return { counts, percentages, dominant, total };
}

/**
 * Derive per-player profiles and return them alongside the aggregation.
 * Useful when callers need both individual profiles and the team summary.
 */
export function aggregateWithProfiles(players: Player[]): {
  profiles: PersonalityProfile[];
  archetypes: ArchetypeCounts;
} {
  const counts = emptyCounts();
  const profiles: PersonalityProfile[] = [];

  for (const player of players) {
    const input = extractPersonalityInput(player);
    const profile = derivePersonality(input);
    profiles.push(profile);
    counts[profile.archetype]++;
  }

  const total = players.length;
  const percentages = {} as Record<Archetype, number>;
  for (const a of ARCHETYPES) {
    percentages[a] = total > 0 ? counts[a] / total : 0;
  }

  let dominant: Archetype = 'neutral';
  let maxCount = -1;
  for (const a of ARCHETYPES) {
    if (counts[a] > maxCount) {
      maxCount = counts[a];
      dominant = a;
    }
  }

  return {
    profiles,
    archetypes: { counts, percentages, dominant, total },
  };
}

/**
 * Compute leadership and disruption summary flags from archetype counts.
 */
export function summarizeFlags(archetypes: ArchetypeCounts): ChemistrySummaryFlags {
  return {
    hasLeadership: archetypes.counts.veteran_leader > 0,
    hasDisruption: archetypes.counts.clubhouse_disruptor > 0,
    leaderCount: archetypes.counts.veteran_leader,
    disruptorCount: archetypes.counts.clubhouse_disruptor,
  };
}

// ─── Snapshot skeleton ──────────────────────────────────────────────────────

/**
 * Build a minimal team chemistry snapshot from a roster of players.
 *
 * No gameplay modifiers. No sim hooks. This is a read-only data structure
 * that captures the current chemistry state for a team at a point in time.
 */
export function buildChemistrySnapshot(
  teamId: number,
  season: number,
  players: Player[],
): TeamChemistrySnapshot {
  const archetypeCounts = aggregateArchetypes(players);
  const flags = summarizeFlags(archetypeCounts);

  return {
    teamId,
    season,
    archetypeCounts,
    flags,
    version: CHEMISTRY_VERSION,
  };
}
