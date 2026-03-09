/**
 * Event log system.
 * Stub — Sprint 04 branch surgery.
 */

import type { GameEvent } from '../../types/events';

export interface EventLogEntry {
  kind: string;
  [key: string]: unknown;
}

export interface EventLog {
  getSeason(season: number): GameEvent[];
  pruneOldSeasons(minSeason: number): void;
  serialize(): unknown[];
  deserialize(data: unknown[]): void;
  clear(): void;
}

export function getEventLog(): EventLog {
  const store = new Map<number, GameEvent[]>();
  let nextId = 1;

  // @ts-expect-error Sprint 04 stub — contract alignment pending
  function _push(season: number, gameDay: number, entry: EventLogEntry): void {
    const arr = store.get(season) ?? [];
    arr.push({
      eventId: nextId++,
      season,
      gameDay,
      kind: entry.kind,
      teamIds: extractTeamIds(entry),
      detail: entry as Record<string, unknown>,
    });
    store.set(season, arr);
  }

  return {
    getSeason: (season: number) => store.get(season) ?? [],
    pruneOldSeasons: (minSeason: number) => {
      for (const key of store.keys()) {
        if (key < minSeason) store.delete(key);
      }
    },
    serialize: () => [],
    deserialize: () => { store.clear(); },
    clear: () => { store.clear(); },
  };
}

function extractTeamIds(entry: EventLogEntry): number[] {
  const ids: number[] = [];
  if (typeof entry.teamId === 'number') ids.push(entry.teamId);
  if (typeof entry.homeTeamId === 'number') ids.push(entry.homeTeamId);
  if (typeof entry.awayTeamId === 'number') ids.push(entry.awayTeamId);
  if (typeof entry.fromTeamId === 'number') ids.push(entry.fromTeamId);
  if (typeof entry.toTeamId === 'number') ids.push(entry.toTeamId);
  if (typeof entry.winnerTeamId === 'number') ids.push(entry.winnerTeamId);
  if (typeof entry.loserTeamId === 'number') ids.push(entry.loserTeamId);
  return ids;
}

export function logGameResult(log: EventLog, season: number, gameDay: string | number, entry: EventLogEntry): void {
  (log as unknown as { getSeason: (s: number) => GameEvent[] });
  const eventLog = log as EventLog & { _push?: typeof push };
  void eventLog;
  // Use internal push mechanism
  const arr = log.getSeason(season);
  arr.push({
    eventId: Date.now(),
    season,
    gameDay: typeof gameDay === 'string' ? 0 : gameDay,
    kind: entry.kind,
    teamIds: extractTeamIds(entry),
    detail: entry as Record<string, unknown>,
  });
}

function push(_log: EventLog, _season: number, _gameDay: number, _entry: EventLogEntry): void {
  // stub
}

export function logPlayoffSeries(_log: EventLog, _season: number, entry: EventLogEntry): void {
  void entry;
}

export function logAward(_log: EventLog, _season: number, entry: EventLogEntry): void {
  void entry;
}

export function logTransaction(_log: EventLog, _season: number, _gameDay: number, entry: EventLogEntry): void {
  void entry;
}

export function logDraftPick(_log: EventLog, _season: number, entry: EventLogEntry): void {
  void entry;
}

export function logTrade(_log: EventLog, _season: number, _gameDay: number, entry: EventLogEntry): void {
  void entry;
}
