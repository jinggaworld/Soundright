# Plan 3: Spotify & Last.fm Integration Layer

## Overview
Setup integrasi dengan Spotify Web API dan Last.fm API untuk mengambil data musik nyata (bukan fake data). Semua data yang ditampilkan di platform adalah data aktual dari kedua platform ini.

## Goals
- Setup Spotify Web API client (Client Credentials flow)
- Setup Last.fm API client (tanpa OAuth)
- Buat unified music data service
- Cache strategy untuk mengurangi API calls
- Error handling & retry logic

## Tasks

### 3.1 Spotify API Client (lib/spotify.ts)
```typescript
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

let spotifyTokenCache: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (spotifyTokenCache && Date.now() < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) throw new Error("Spotify auth failed");
  const data = await response.json();

  spotifyTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000, // refresh 1 min before expiry
  };

  return spotifyTokenCache.token;
}

export async function getTrackData(trackId: string) {
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Track not found: ${trackId}`);
  return response.json();
}

export async function getArtistProfile(artistId: string) {
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Artist not found: ${artistId}`);
  return response.json();
}

export async function getArtistTopTracks(artistId: string) {
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw new Error(`Top tracks not found for: ${artistId}`);
  return response.json();
}

export async function searchTracks(query: string, limit = 20) {
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

export async function getAudioFeatures(trackId: string) {
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null; // Some tracks don't have audio features
  return response.json();
}

// Parse Spotify Artist ID from URL or raw ID
export function parseSpotifyArtistId(input: string): string | null {
  // Handle: spotify:artist:4Z8W4fKeB5YxbusRsdQVPb
  const colonMatch = input.match(/spotify:artist:([a-zA-Z0-9]+)/);
  if (colonMatch) return colonMatch[1];

  // Handle: https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb
  const urlMatch = input.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Raw ID (alphanumeric, 22 chars)
  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  return null;
}

export function parseSpotifyTrackId(input: string): string | null {
  const colonMatch = input.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (colonMatch) return colonMatch[1];

  const urlMatch = input.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;

  return null;
}

// Estimate play count dari popularity score (workaround karena Spotify API tidak expose play count)
export function estimatePlayCountFromPopularity(popularity: number): number {
  return Math.round(popularity * popularity * 1000);
}
```

### 3.2 Last.fm API Client (lib/lastfm.ts)
```typescript
const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

export async function getLastFmTrackData(artist: string, track: string) {
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
    return { playcount: 0, listeners: 0, tags: [] };
  }

  return {
    playcount: parseInt(data.track?.playcount || "0", 10),
    listeners: parseInt(data.track?.listeners || "0", 10),
    tags: (data.track?.toptags?.tag || []).map((t: any) => t.name),
  };
}

export async function getLastFmArtistData(artist: string) {
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
    tags: (data.artist?.tags?.tag || []).map((t: any) => t.name),
  };
}

export async function getLastFmSimilarArtists(artist: string, limit = 5) {
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

  return (data.similarartists?.artist || []).map((a: any) => ({
    name: a.name,
    match: parseFloat(a.match),
  }));
}
```

### 3.3 Unified Music Data Service (lib/music-data.ts)
```typescript
import { getTrackData, getArtistProfile, getArtistTopTracks, estimatePlayCountFromPopularity } from "./spotify";
import { getLastFmTrackData } from "./lastfm";

export interface UnifiedTrackData {
  title: string;
  artistName: string;
  artistId: string;
  trackId: string;
  albumArt: string;
  albumName: string;
  durationMs: number;
  popularity: number;
  estimatedSpotifyPlays: number;
  lastFmPlays: number;
  combinedPlayCount: number;
  genres: string[];
  releaseDate: string;
}

export async function getUnifiedTrackData(trackId: string): Promise<UnifiedTrackData> {
  const track = await getTrackData(trackId);
  const artistId = track.artists[0]?.id;
  const artistProfile = artistId ? await getArtistProfile(artistId) : null;

  // Get Last.fm data for cross-reference
  let lastFmPlays = 0;
  try {
    const lastFmData = await getLastFmTrackData(
      track.artists[0]?.name || "",
      track.name
    );
    lastFmPlays = lastFmData.playcount;
  } catch {
    // Last.fm data not available, continue without it
  }

  const estimatedPlays = estimatePlayCountFromPopularity(track.popularity);

  return {
    title: track.name,
    artistName: track.artists[0]?.name || "Unknown",
    artistId,
    trackId,
    albumArt: track.album.images[0]?.url || "",
    albumName: track.album.name,
    durationMs: track.duration_ms,
    popularity: track.popularity,
    estimatedSpotifyPlays: estimatedPlays,
    lastFmPlays,
    combinedPlayCount: estimatedPlays + lastFmPlays,
    genres: artistProfile?.genres || [],
    releaseDate: track.album.release_date || "",
  };
}

export async function getArtistSongs(artistId: string) {
  const topTracks = await getArtistTopTracks(artistId);
  return (topTracks.tracks || []).map((track: any) => ({
    trackId: track.id,
    title: track.name,
    albumArt: track.album.images[0]?.url || "",
    popularity: track.popularity,
    estimatedPlays: estimatePlayCountFromPopularity(track.popularity),
  }));
}
```

## Deliverables
- [ ] Spotify API client with token caching
- [ ] Last.fm API client
- [ ] Unified music data service
- [ ] Spotify/Last.fm ID parsers
- [ ] Play count estimation from popularity

## Dependencies
- Plan 1 (Project Architecture)
- Spotify Developer Account (free)
- Last.fm Account (free)

## Notes
- **Spotify Play Count**: Tidak tersedia via API publik. Gunakan popularity score sebagai proxy.
- **Last.fm Play Count**: Lebih akurat, tersedia gratis.
- **Combined Play Count**: `estimatedSpotifyPlays + lastFmPlays` untuk data lebih komprehensif.
- **Caching**: Spotify token di-cache untuk mengurangi auth calls.
