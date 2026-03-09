/**
 * Game event types for the event log system.
 * Stub — Sprint 04 branch surgery.
 */

export interface GameEvent {
  eventId: number;
  season: number;
  gameDay: number;
  kind: string;
  teamIds: number[];
  detail: Record<string, unknown>;
}
