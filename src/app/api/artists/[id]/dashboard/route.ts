import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, notFoundResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      songs: {
        include: {
          holdings: true,
          distributions: { orderBy: { distributedAt: "desc" }, take: 5 },
          playCountHistory: { orderBy: { recordedAt: "desc" }, take: 12 },
        },
      },
    },
  });

  if (!artist) return notFoundResponse("Artist");

  // Calculate totals
  const totalSongs = artist.songs.length;
  const totalTokensSold = artist.songs.reduce(
    (acc, song) => acc + ((song.totalSupply || 0) - (song.tokensForSale || 0)),
    0
  );
  const totalRoyaltiesEarned = artist.songs.reduce(
    (acc, song) =>
      acc +
      song.distributions.reduce(
        (dAcc, dist) => dAcc + Number(dist.totalRoyaltyCspr),
        0
      ),
    0
  );

  // This week's total plays
  const thisWeekPlays = artist.songs.reduce(
    (acc, song) => acc + (song.weeklyPlays || 0),
    0
  );

  // Next distribution countdown (next Monday 00:00 UTC)
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  nextMonday.setUTCHours(0, 0, 0, 0);
  const daysUntilDistribution = Math.ceil(
    (nextMonday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

    return successResponse({
    artist: {
      id: artist.id,
      name: artist.name,
      walletAddress: artist.walletAddress,
    },
    stats: {
      totalSongs,
      totalTokensSold,
      totalRoyaltiesEarned,
      thisWeekPlays,
      daysUntilDistribution,
    },
    songs: artist.songs.map((song) => ({
      id: song.id,
      title: song.title,
      spotifyTrackId: song.spotifyTrackId,
      currentPlayCount: Number(song.currentPlayCount),
      weeklyPlays: song.weeklyPlays,
      totalSupply: song.totalSupply,
      tokensForSale: song.tokensForSale,
      saleProgress: song.totalSupply
        ? ((song.totalSupply - (song.tokensForSale || 0)) / song.totalSupply) *
          100
        : 0,
      status: song.status,
      weeklyPlaysHistory: song.playCountHistory.map((p) => ({
        plays: Number(p.playCount),
        date: p.recordedAt,
      })),
      recentDistributions: song.distributions.map((d) => ({
        id: d.id,
        periodStart: d.periodStart,
        periodEnd: d.periodEnd,
        totalPlays: d.totalPlays,
        totalRoyaltyCspr: Number(d.totalRoyaltyCspr),
        distributedAt: d.distributedAt,
      })),
    })),
    });
  } catch {
    return errorResponse("Failed to load dashboard", 500);
  }
}
