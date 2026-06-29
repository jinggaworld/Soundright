import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const walletAddress = req.headers.get("x-wallet-address");
  if (!walletAddress) return unauthorizedResponse();

  try {
    const holdings = await prisma.tokenHolding.findMany({
      where: { investorAddress: walletAddress },
      include: {
        song: {
          include: {
            artist: true,
            distributions: { orderBy: { distributedAt: "desc" }, take: 5 },
          },
        },
      },
    });

    // Group holdings by song
    const grouped: Record<
      string,
      {
        song: (typeof holdings)[number]["song"];
        totalTokens: number;
        totalPaid: number;
        estimatedEarnings: number;
      }
    > = {};

    for (const holding of holdings) {
      const songId = holding.songId;
      if (!grouped[songId]) {
        grouped[songId] = {
          song: holding.song,
          totalTokens: 0,
          totalPaid: 0,
          estimatedEarnings: 0,
        };
      }
      grouped[songId].totalTokens += holding.tokenAmount;
      grouped[songId].totalPaid += Number(holding.purchasePriceCspr);
    }

    // Calculate estimated earnings per song
    for (const songId of Object.keys(grouped)) {
      const { song, totalTokens } = grouped[songId];
      const share = totalTokens / (song.totalSupply || 1);

      const totalEarnings = song.distributions.reduce(
        (acc: number, dist) => acc + Number(dist.totalRoyaltyCspr) * share,
        0
      );
      grouped[songId].estimatedEarnings = totalEarnings;
    }

    const holdingsList = Object.values(grouped);

    // Portfolio summary
    const portfolio = {
      totalSongs: holdingsList.length,
      totalTokens: holdingsList.reduce((acc, h) => acc + h.totalTokens, 0),
      totalInvested: holdingsList.reduce((acc, h) => acc + h.totalPaid, 0),
      totalEarned: holdingsList.reduce(
        (acc, h) => acc + h.estimatedEarnings,
        0
      ),
    };

    return successResponse({ portfolio, holdings: holdingsList });
  } catch {
    return errorResponse("Failed to load holdings", 500);
  }
}
