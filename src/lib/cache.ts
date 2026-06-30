/**
 * In-memory cache for API responses and computed data.
 *
 * @example
 * import { cachedFetch, CACHE_TTL } from "@/lib/cache";
 *
 * const songs = await cachedFetch(
 *   "songs-list",
 *   () => prisma.song.findMany(),
 *   CACHE_TTL.SONG_LIST
 * );
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Get a cached value by key. Returns null if expired or missing. */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/** Store a value in cache with a TTL in milliseconds. */
export function setCache(key: string, data: unknown, ttlMs = 60000): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Remove a specific key from cache. */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/** Remove all cache entries matching a prefix. */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/** Cache TTL constants (in milliseconds) */
export const CACHE_TTL = {
  SONG_LIST: 5 * 60 * 1000,      // 5 minutes
  SONG_DETAIL: 2 * 60 * 1000,    // 2 minutes
  SPOTIFY_TRACK: 10 * 60 * 1000, // 10 minutes
  STATS: 60 * 1000,              // 1 minute
  RECOMMENDATIONS: 3 * 60 * 1000, // 3 minutes
} as const;

/**
 * Cached fetch wrapper - returns cached data if available, otherwise calls the fetcher.
 *
 * @example
 * const tracks = await cachedFetch(
 *   `spotify-track-${trackId}`,
 *   () => getTrackData(trackId),
 *   CACHE_TTL.SPOTIFY_TRACK
 * );
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 60000
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  setCache(key, data, ttlMs);
  return data;
}
