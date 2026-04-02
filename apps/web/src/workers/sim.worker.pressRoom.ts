import type { PressRoomEntry, PressRoomSource } from '../shared/types/pressRoom.js';
import type { FullGameState } from './sim.worker.helpers.js';

function parseTimestamp(timestamp: string): number {
  if (timestamp === 'NOW') return Number.MAX_SAFE_INTEGER;
  const match = /^S(\d+)D(\d+)$/.exec(timestamp);
  if (!match) return 0;
  return Number(match[1]) * 1000 + Number(match[2]);
}

function compareSource(left: PressRoomSource, right: PressRoomSource): number {
  if (left === right) return 0;
  return left === 'briefing' ? -1 : 1;
}

export function buildPressRoomFeed(
  state: FullGameState,
  limit: number = 100,
): PressRoomEntry[] {
  const duplicateBriefingIds = new Set(state.news.map((item) => `brief-${item.id}`));

  const briefingEntries: PressRoomEntry[] = state.briefingQueue
    .filter((item) => !duplicateBriefingIds.has(item.id))
    .map((item) => ({
      id: item.id,
      source: 'briefing',
      category: item.category,
      priority: item.priority,
      headline: item.headline,
      body: item.body,
      timestamp: item.timestamp,
      relatedTeamIds: item.relatedTeamIds,
      relatedPlayerIds: item.relatedPlayerIds,
    }));

  const newsEntries: PressRoomEntry[] = state.news.map((item) => ({
    id: item.id,
    source: 'news',
    category: item.category,
    priority: item.priority,
    headline: item.headline,
    body: item.body,
    timestamp: item.timestamp,
    relatedTeamIds: item.relatedTeamIds,
    relatedPlayerIds: item.relatedPlayerIds,
  }));

  return [...briefingEntries, ...newsEntries]
    .sort((left, right) => {
      const timestampDelta = parseTimestamp(right.timestamp) - parseTimestamp(left.timestamp);
      if (timestampDelta !== 0) return timestampDelta;
      if (left.priority !== right.priority) return left.priority - right.priority;
      const sourceDelta = compareSource(left.source, right.source);
      if (sourceDelta !== 0) return sourceDelta;
      return left.id.localeCompare(right.id);
    })
    .slice(0, limit);
}
