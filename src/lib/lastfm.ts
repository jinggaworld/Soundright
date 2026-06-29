const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

// Simple retry wrapper
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((r) => setTimeout(r, 1000));
    return withRetry(fn, retries - 1);
  }
}

export async function getLastFmTrackData(artist: string, track: string) {
  return withRetry(async () => {
    const params = new URLSearchParams({
      method: "track.getInfo",
      api_key: LASTFM_API_KEY,
      artist,
      track,
      format: "json",
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) throw new Error("Last.fm API failed");
    const data = await response.json();

    if (data.error) {
      return { playcount: 0, listeners: 0, tags: [] as string[] };
    }

    return {
      playcount: parseInt(data.track?.playcount || "0", 10),
      listeners: parseInt(data.track?.listeners || "0", 10),
      tags: (data.track?.toptags?.tag || []).map(
        (t: { name: string }) => t.name
      ),
    };
  });
}

export async function getLastFmArtistData(artist: string) {
  return withRetry(async () => {
    const params = new URLSearchParams({
      method: "artist.getInfo",
      api_key: LASTFM_API_KEY,
      artist,
      format: "json",
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) throw new Error("Last.fm API failed");
    const data = await response.json();

    return {
      playcount: parseInt(data.artist?.stats?.playcount || "0", 10),
      listeners: parseInt(data.artist?.stats?.listeners || "0", 10),
      tags: (data.artist?.tags?.tag || []).map(
        (t: { name: string }) => t.name
      ),
    };
  });
}

export async function getLastFmSimilarArtists(artist: string, limit = 5) {
  return withRetry(async () => {
    const params = new URLSearchParams({
      method: "artist.getsimilar",
      api_key: LASTFM_API_KEY,
      artist,
      limit: limit.toString(),
      format: "json",
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) return [];
    const data = await response.json();

    return (data.similarartists?.artist || []).map(
      (a: { name: string; match: string }) => ({
        name: a.name,
        match: parseFloat(a.match),
      })
    );
  });
}
