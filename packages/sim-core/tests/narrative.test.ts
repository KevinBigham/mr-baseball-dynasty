import { describe, it, expect } from 'vitest';
import {
  GameRNG,
  generatePlayer,
  generateNews,
  generateNewsId,
  checkMilestones,
  getUnreadNews,
  markAsRead,
  deduplicateNews,
} from '../src/index.js';
import type { NewsItem, GameEvent, GeneratedPlayer } from '../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlayer(seed: number): GeneratedPlayer {
  const rng = new GameRNG(seed);
  return generatePlayer(rng, 'SS', 'NYY', 'MLB');
}

function makeGameResultEvent(player: GeneratedPlayer): GameEvent {
  return {
    type: 'game_result',
    data: {
      winningTeamId: 'NYY',
      losingTeamId: 'BOS',
      winningTeamName: 'Yankees',
      losingTeamName: 'Red Sox',
      starPlayerId: player.id,
      hits: 3,
      ab: 4,
      hr: 1,
    },
    season: 1,
    day: 45,
  };
}

function makeSampleNews(count: number): NewsItem[] {
  const rng = new GameRNG(42);
  const items: NewsItem[] = [];
  const categories: Array<NewsItem['category']> = ['injury', 'trade', 'signing', 'milestone', 'performance'];
  const priorities: Array<NewsItem['priority']> = [1, 2, 3, 4, 5];
  for (let i = 0; i < count; i++) {
    items.push({
      id: generateNewsId(rng),
      headline: `Headline ${i}`,
      body: `Body ${i}`,
      priority: priorities[i % priorities.length]!,
      category: categories[i % categories.length]!,
      timestamp: `S1D${i}`,
      relatedPlayerIds: [`player-${i}`],
      relatedTeamIds: ['NYY'],
      read: i % 3 === 0, // Every third item is read
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateNews', () => {
  it('creates news items from game_result event', () => {
    const player = makePlayer(42);
    const event = makeGameResultEvent(player);
    const rng = new GameRNG(99);
    const news = generateNews(rng, event, [player], 1, 45);
    expect(news.length).toBeGreaterThan(0);
    for (const item of news) {
      expect(item.headline.length).toBeGreaterThan(0);
      expect(item.body.length).toBeGreaterThan(0);
      expect(item.id).toBeTruthy();
    }
  });

  it('all news items have valid priority (1-5) and category', () => {
    const player = makePlayer(42);
    const events: GameEvent[] = [
      makeGameResultEvent(player),
      {
        type: 'injury',
        data: { playerId: player.id, teamId: 'NYY', teamName: 'Yankees', injury: 'hamstring strain', ilDays: 15 },
        season: 1,
        day: 50,
      },
      {
        type: 'trade',
        data: { player1Id: player.id, team1Id: 'NYY', team1Name: 'Yankees', team2Id: 'BOS', team2Name: 'Red Sox' },
        season: 1,
        day: 55,
      },
    ];
    const rng = new GameRNG(200);
    for (const event of events) {
      const news = generateNews(rng, event, [player], event.season, event.day);
      for (const item of news) {
        expect(item.priority).toBeGreaterThanOrEqual(1);
        expect(item.priority).toBeLessThanOrEqual(5);
        expect(item.category).toBeTruthy();
      }
    }
  });
});

describe('generateNewsId', () => {
  it('returns unique strings', () => {
    const rng = new GameRNG(42);
    const id1 = generateNewsId(rng);
    const id2 = generateNewsId(rng);
    expect(typeof id1).toBe('string');
    expect(id1.startsWith('news_')).toBe(true);
    expect(id1.length).toBeGreaterThan(5);
    expect(id1).not.toBe(id2);
  });
});

describe('checkMilestones', () => {
  it('detects home run milestones', () => {
    const player = makePlayer(42);
    const stats = new Map<string, { hr: number; hits: number }>();
    stats.set(player.id, { hr: 500, hits: 2000 });
    const moments = checkMilestones(stats, [player], 5, 100);
    const hrMoments = moments.filter((m) => m.type === 'milestone_hr');
    expect(hrMoments.length).toBeGreaterThan(0);
    expect(hrMoments[0]!.headline).toContain('500');
    expect(hrMoments[0]!.historical).toBe(true);
  });

  it('detects hit milestones', () => {
    const player = makePlayer(42);
    const stats = new Map<string, { hr: number; hits: number }>();
    stats.set(player.id, { hr: 50, hits: 3000 });
    const moments = checkMilestones(stats, [player], 10, 50);
    const hitMoments = moments.filter((m) => m.type === 'milestone_hit');
    expect(hitMoments.length).toBeGreaterThan(0);
    expect(hitMoments[0]!.historical).toBe(true);
  });

  it('returns empty for non-milestone stats', () => {
    const player = makePlayer(42);
    const stats = new Map<string, { hr: number; hits: number }>();
    stats.set(player.id, { hr: 47, hits: 150 });
    const moments = checkMilestones(stats, [player], 1, 30);
    expect(moments.length).toBe(0);
  });
});

describe('getUnreadNews', () => {
  it('filters correctly and sorts by priority', () => {
    const news = makeSampleNews(10);
    const unread = getUnreadNews(news);
    // Should not contain read items
    for (const item of unread) {
      expect(item.read).toBe(false);
    }
    // Should be sorted by priority (ascending = highest priority first)
    for (let i = 1; i < unread.length; i++) {
      expect(unread[i - 1]!.priority).toBeLessThanOrEqual(unread[i]!.priority);
    }
  });
});

describe('markAsRead', () => {
  it('updates read status for the specified item', () => {
    const news = makeSampleNews(5);
    const unreadItem = news.find((n) => !n.read)!;
    expect(unreadItem).toBeTruthy();
    const updated = markAsRead(news, unreadItem.id);
    const found = updated.find((n) => n.id === unreadItem.id)!;
    expect(found.read).toBe(true);
    // Should not mutate original
    expect(news.find((n) => n.id === unreadItem.id)!.read).toBe(false);
  });
});

describe('deduplicateNews', () => {
  it('removes duplicates with same category, timestamp, and players', () => {
    const rng = new GameRNG(42);
    const items: NewsItem[] = [
      {
        id: generateNewsId(rng),
        headline: 'First headline',
        body: 'Body 1',
        priority: 2,
        category: 'injury',
        timestamp: 'S1D10',
        relatedPlayerIds: ['p1'],
        relatedTeamIds: ['NYY'],
        read: false,
      },
      {
        id: generateNewsId(rng),
        headline: 'Duplicate headline',
        body: 'Body 2',
        priority: 4,
        category: 'injury',
        timestamp: 'S1D10',
        relatedPlayerIds: ['p1'],
        relatedTeamIds: ['NYY'],
        read: false,
      },
      {
        id: generateNewsId(rng),
        headline: 'Different event',
        body: 'Body 3',
        priority: 3,
        category: 'trade',
        timestamp: 'S1D10',
        relatedPlayerIds: ['p2'],
        relatedTeamIds: ['BOS'],
        read: false,
      },
    ];
    const deduped = deduplicateNews(items);
    // The two injury items with same timestamp and player should be deduped to one
    const injuryItems = deduped.filter((n) => n.category === 'injury');
    expect(injuryItems.length).toBe(1);
    // Should keep the higher priority one (priority 2 < 4, so priority 2 is "higher")
    expect(injuryItems[0]!.priority).toBe(2);
    // Trade item should remain
    expect(deduped.filter((n) => n.category === 'trade').length).toBe(1);
  });
});
