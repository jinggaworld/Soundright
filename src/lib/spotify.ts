import "@/lib/server-init";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";

let tokenCache: { token: string; expiresAt: number } | null = null;

const FETCH_TIMEOUT_MS = 15_000;

// Simple retry wrapper
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((r) => setTimeout(r, 2000));
    return withRetry(fn, retries - 1);
  }
}

async function getSpotifyToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Spotify auth failed");
    const data = await response.json();
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - 60000,
    };
    return tokenCache.token;
  } finally {
    clearTimeout(timer);
  }
}

export async function getTrackData(trackId: string) {
  return withRetry(async () => {
    const token = await getSpotifyToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Track not found: ${trackId}`);
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function getArtistProfile(artistId: string) {
  return withRetry(async () => {
    const token = await getSpotifyToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Artist not found: ${artistId}`);
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function getArtistTopTracks(artistId: string) {
  return withRetry(async () => {
    const token = await getSpotifyToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Top tracks not found: ${artistId}`);
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function searchTracks(query: string, limit = 20) {
  return withRetry(async () => {
    const token = await getSpotifyToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=US`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function getAudioFeatures(trackId: string) {
  return withRetry(async () => {
    const token = await getSpotifyToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/audio-features/${trackId}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!response.ok) return null;
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  });
}

export function parseSpotifyArtistId(input: string): string | null {
  const colonMatch = input.match(/spotify:artist:([a-zA-Z0-9]+)/);
  if (colonMatch) return colonMatch[1];

  const urlMatch = input.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?artist\/([a-zA-Z0-9]+)/
  );
  if (urlMatch) return urlMatch[1];

  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  return null;
}

export function parseSpotifyTrackId(input: string): string | null {
  const colonMatch = input.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (colonMatch) return colonMatch[1];

  const urlMatch = input.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  return null;
}

export function estimatePlayCountFromPopularity(popularity: number): number {
  return Math.round(popularity * popularity * 1000);
}
