import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 claims per minute per wallet
    const body = await req.json();
    const { walletAddress, songId } = body;

    if (!walletAddress) {
      return errorResponse("Missing required field: walletAddress");
    }

    const { allowed } = checkRateLimit(`claim:${walletAddress}`, 5, 60_000);
    if (!allowed) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    // Get holdings for this user
    const holdings = await prisma.tokenHolding.findMany({
      where: {
        investorAddress: walletAddress,
        ...(songId ? { songId } : {}),
      },
    });

    if (holdings.length === 0) {
      return errorResponse("No holdings found");
    }

    // Calculate pending royalties
    let totalPending = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const songRoyalties: any[] = [];

    for (const holding of holdings) {
      const song = await prisma.song.findUnique({
        where: { id: holding.songId },
      });
      if (!song || !song.totalSupply) continue;      // Calculate royalty based on delta plays * royalty rate * share
      const share = holding.tokenAmount / song.totalSupply;
      const currentPlays = song.currentPlayCount ? Number(song.currentPlayCount) : 0;
      const lastPlays = song.lastPlayCount ? Number(song.lastPlayCount) : 0;
      const deltaPlays = Math.max(0, currentPlays - lastPlays);
      const royaltyRate = song.royaltyRatePerMille ? Number(song.royaltyRatePerMille) : 0;
      const estimatedRoyalty = deltaPlays * (royaltyRate / 1000) * share;
      totalPending += estimatedRoyalty;

      songRoyalties.push({
        songId: song.id,
        title: song.title,
        shares: share,
        estimatedRoyalty,
      });
    }

    if (totalPending <= 0) {
      return errorResponse("No pending royalties");
    }

    // TODO: Execute x402 payment to user's wallet via backend
    // For now, record the claim and return estimated amount

    return successResponse({
      pendingAmount: totalPending,
      breakdown: songRoyalties,
      message:
        "Royalties calculated. Actual CSPR transfer will be processed via x402 payment layer.",
      // txHash will be added after x402 integration
    });
  } catch (error) {
    console.error("Claim royalties error:", error);
    return errorResponse("Failed to claim royalties", 500);
  }
}
