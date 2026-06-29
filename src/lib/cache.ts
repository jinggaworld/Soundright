/**
 * In-memory cache for music data to reduce API calls.
 * In production, replace with Redis.
 */

const cache = new Map<string, { data: unknown; expiresAt: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs = 300000): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 300000
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  setCache(key, data, ttlMs);
  return data;
}

// Cache TTL constants
export const CACHE_TTL = {
  SONG_LIST: 5 * 60 * 1000, // 5 minutes
  SONG_DETAIL: 2 * 60 * 1000, // 2 minutes
  SPOTIFY_TRACK: 10 * 60 * 1000, // 10 minutes
  LASTFM_DATA: 30 * 60 * 1000, // 30 minutes
  STATS: 60 * 1000, // 1 minute
} as const;
