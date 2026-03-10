/**
 * chemistry.ts — Chemistry v1 Shared Types
 *
 * Team-level chemistry state (pre-existing stubs) plus lightweight
 * personality-derivation types added in Slice 1A.
 */

import type { Archetype, PositionGroup, ReasonCode } from '../engine/chemistryContracts';

// ─── Pre-existing team-level stubs (Sprint 04) ──────────────────────────────

export interface TeamChemistryState {
  teamId: number;
  cohesion: number;
  morale: number;
  lastUpdatedSeason: number;
}

export interface ClubhouseEvent {
  eventId: number;
  teamId: number;
  season: number;
  kind: string;
  description: string;
}

// ─── Personality derivation result (Slice 1A) ────────────────────────────────

/**
 * The output of derivePersonality(). Fully deterministic — same inputs always
 * produce the same result.
 */
export interface PersonalityProfile {
  /** Primary archetype label */
  archetype: Archetype;
  /** Human-readable reason for classification */
  reasonCode: ReasonCode;
  /** Position group used during derivation */
  positionGroup: PositionGroup;
  /** Chemistry version that produced this profile */
  version: number;
}

// ─── Input shape for derivation ──────────────────────────────────────────────

/**
 * Minimal input required to derive a personality profile.
 * Kept narrow so the derivation function doesn't depend on the full Player type.
 */
export interface PersonalityInput {
  workEthic: number;        // 0–100
  mentalToughness: number;  // 0–100
  age: number;
  overall: number;          // 0–550 internal scale
  position: string;         // Position literal (e.g. 'SS', 'SP')
}
