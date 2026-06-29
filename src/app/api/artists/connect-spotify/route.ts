import { NextRequest } from "next/server";
import { getArtistProfile, getArtistTopTracks } from "@/lib/spotify";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/db";

/**
 * Extract Spotify Artist ID from a URL or raw ID string.
 * Accepts:
 *   - https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb
 *   - spotify:artist:4Z8W4fKeB5YxbusRsdQVPb
 *   - 4Z8W4fKeB5YxbusRsdQVPb (raw ID)
 */
function parseSpotifyArtistId(input: string): string | null {
  if (!input) return null;

  // Raw ID: 22 alphanumeric chars
  if (/^[0-9A-Za-z]{22}$/.test(input.trim())) {
    return input.trim();
  }

  // URL format
  const urlMatch = input.match(
    /open\.spotify\.com\/artist\/([0-9A-Za-z]{22})/
  );
  if (urlMatch) return urlMatch[1];

  // URI format
  const uriMatch = input.match(/spotify:artist:([0-9A-Za-z]{22})/);
  if (uriMatch) return uriMatch[1];

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 requests per minute
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = checkRateLimit(`spotify-connect:${ip}`, 5, 60_000);
    if (!allowed) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();
    const { spotifyArtistUrl, walletAddress } = body;

    if (!spotifyArtistUrl || !walletAddress) {
      return errorResponse(
        "Missing required fields: spotifyArtistUrl, walletAddress"
      );
    }

    // Parse and validate Spotify Artist ID
    const artistId = parseSpotifyArtistId(spotifyArtistUrl);
    if (!artistId) {
      return errorResponse(
        "Invalid Spotify Artist URL or ID. Expected format: https://open.spotify.com/artist/{id}"
      );
    }

    // Fetch Spotify profile and top tracks
    const [profile, topTracks] = await Promise.all([
      getArtistProfile(artistId),
      getArtistTopTracks(artistId),
    ]);

    // Upsert artist record
    const artist = await prisma.artist.upsert({
      where: { walletAddress },
      update: {
        name: profile.name,
        spotifyArtistId: artistId,
        spotifyProfile: JSON.parse(JSON.stringify(profile)),
        country: profile.country,
      },
      create: {
        name: profile.name,
        email: `${artistId}@soundright.app`,
        walletAddress,
        spotifyArtistId: artistId,
        spotifyProfile: JSON.parse(JSON.stringify(profile)),
        country: profile.country,
      },
    });

    // Format top tracks for response
    const tracks = topTracks.tracks.map((t: Record<string, unknown>) => {
      const album = t.album as Record<string, unknown> | undefined;
      const images = album?.images as Array<Record<string, unknown>> | undefined;
      return {
        id: t.id as string,
        name: t.name as string,
        albumArt: images?.[0]?.url as string | null ?? null,
        popularity: t.popularity as number,
        estimatedPlays: Math.pow((t.popularity as number) || 0, 2) * 1000,
      };
    });

    return successResponse({
      artist: {
        id: artist.id,
        name: artist.name,
        walletAddress: artist.walletAddress,
        spotifyArtistId: artist.spotifyArtistId,
      },
      profile: {
        name: profile.name,
        followers: (profile.followers as Record<string, unknown>)?.total,
        genres: profile.genres,
        image: profile.images?.[0]?.url,
      },
      topTracks: tracks,
    });
  } catch (error) {
    console.error("Connect Spotify error:", error);
    return errorResponse("Failed to connect Spotify account", 500);
  }
}
