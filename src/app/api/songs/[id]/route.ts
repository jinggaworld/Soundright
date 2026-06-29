import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            spotifyArtistId: true,
            spotifyProfile: true,
          },
        },
        holdings: {
          select: {
            id: true,
            investorAddress: true,
            tokenAmount: true,
            purchasePriceCspr: true,
            purchasedAt: true,
          },
        },
        distributions: {
          orderBy: { distributedAt: "desc" },
          take: 12,
        },
        playCountHistory: {
          orderBy: { recordedAt: "desc" },
          take: 52,
        },
      },
    });

    if (!song) return notFoundResponse("Song");

    // Calculate metrics
    const uniqueHolders = new Set(
      song.holdings.map((h) => h.investorAddress)
    ).size;
    const totalTokensSold = song.holdings.reduce(
      (sum, h) => sum + h.tokenAmount,
      0
    );
    const saleProgress =
      song.totalSupply && song.totalSupply > 0
        ? (totalTokensSold / song.totalSupply) * 100
        : 0;

    // Format play count history for charts
    const weeklyPlays = song.playCountHistory.map((p) => ({
      plays: Number(p.playCount),
      source: p.source,
      date: p.recordedAt,
    }));

    // Format distributions
    const distributionHistory = song.distributions.map((d) => ({
      id: d.id,
      periodStart: d.periodStart,
      periodEnd: d.periodEnd,
      totalPlays: d.totalPlays,
      totalRoyaltyCspr: Number(d.totalRoyaltyCspr),
      totalRoyaltyUsd: Number(d.totalRoyaltyUsd),
      distributedAt: d.distributedAt,
    }));

    return successResponse({
      ...song,
      currentPlayCount: song.currentPlayCount
        ? Number(song.currentPlayCount)
        : null,
      lastPlayCount: song.lastPlayCount ? Number(song.lastPlayCount) : null,
      albumArt: `https://i.scdn.co/image/ab67616d00001e02`,
      totalHolders: uniqueHolders,
      totalTokensSold,
      saleProgress,
      weeklyPlays,
      distributionHistory,
    });
  } catch (error) {
    console.error("Get song error:", error);
    return notFoundResponse("Song");
  }
}
