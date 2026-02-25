/**
 * Dirty-check in-memory cache.
 *
 * The worker keeps the authoritative game state. The cache lets the main thread
 * hold hot data (standings, roster, leaderboard) without re-fetching every render.
 *
 * Each entry tracks a "generation" counter. When the worker increments its state
 * version after a simulation, the cache is invalidated on next access.
 */

type CacheEntry<T> = {
  data: T;
  generation: number;
  fetchedAt: number; // Date.now() ms
};

class DirtyCheckCache {
  private entries = new Map<string, CacheEntry<unknown>>();
  private currentGeneration = 0;

  /** Called after every simulation / state change to invalidate stale entries. */
  bumpGeneration(): void {
    this.currentGeneration++;
  }

  get generation(): number {
    return this.currentGeneration;
  }

  /** Returns cached value if still valid for this generation, otherwise null. */
  get<T>(key: string): T | null {
    const entry = this.entries.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.generation !== this.currentGeneration) {
      this.entries.delete(key);
      return null;
    }
    return entry.data;
  }

  /** Stores a value tagged with the current generation. */
  set<T>(key: string, data: T): void {
    this.entries.set(key, {
      data,
      generation: this.currentGeneration,
      fetchedAt: Date.now(),
    });
  }

  /** Evicts a specific key. */
  evict(key: string): void {
    this.entries.delete(key);
  }

  /** Evicts all entries regardless of generation. */
  clear(): void {
    this.entries.clear();
  }

  /** Evicts all entries older than `maxAgeMs` milliseconds. */
  evictOlderThan(maxAgeMs: number): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [key, entry] of this.entries) {
      if (entry.fetchedAt < cutoff) this.entries.delete(key);
    }
  }

  /** Number of cached entries. */
  get size(): number {
    return this.entries.size;
  }
}

// Singleton shared across the main thread
export const appCache = new DirtyCheckCache();

// ─── Cache key helpers ────────────────────────────────────────────────────────

export const cacheKeys = {
  standings: (season: number) => `standings:${season}`,
  roster: (teamId: number) => `roster:${teamId}`,
  leaderboard: (stat: string, season: number) => `leaderboard:${stat}:${season}`,
  playerProfile: (playerId: number) => `player:${playerId}`,
} as const;

// ─── Generic fetch-with-cache helper ─────────────────────────────────────────

/**
 * Reads from cache; on miss, calls `fetcher()`, stores result, and returns it.
 * Automatically uses the current generation for invalidation.
 */
export async function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = appCache.get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  appCache.set(key, fresh);
  return fresh;
}
