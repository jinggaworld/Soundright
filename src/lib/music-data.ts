import {
  getTrackData,
  getArtistProfile,
  getArtistTopTracks,
  estimatePlayCountFromPopularity,
} from "./spotify";
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

export async function getUnifiedTrackData(
  trackId: string
): Promise<UnifiedTrackData> {
  const track = await getTrackData(trackId);
  const artistId = track.artists[0]?.id;
  const artistProfile = artistId ? await getArtistProfile(artistId) : null;

  let lastFmPlays = 0;
  try {
    const lastFmData = await getLastFmTrackData(
      track.artists[0]?.name || "",
      track.name
    );
    lastFmPlays = lastFmData.playcount;
  } catch {
    // Last.fm data not available
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
  return (topTracks.tracks || []).map(
    (track: {
      id: string;
      name: string;
      album: { images: { url: string }[] };
      popularity: number;
    }) => ({
      trackId: track.id,
      title: track.name,
      albumArt: track.album.images[0]?.url || "",
      popularity: track.popularity,
      estimatedPlays: estimatePlayCountFromPopularity(track.popularity),
    })
  );
}
