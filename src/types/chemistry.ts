/**
 * Team chemistry types.
 * Stub — Sprint 04 branch surgery.
 */

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
