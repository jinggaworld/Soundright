import { successResponse, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const [totalSongs, totalDistributions, totalRoyalty, totalHolders] =
      await Promise.all([
        prisma.song.count({ where: { status: "active" } }),
        prisma.distribution.count(),
        prisma.distribution.aggregate({
          _sum: { totalRoyaltyCspr: true },
        }),
        prisma.tokenHolding.findMany({
          select: { investorAddress: true },
          distinct: ["investorAddress"],
        }),
      ]);

    return successResponse({
      totalSongs,
      totalDistributions,
      totalRoyaltyDistributed: Number(
        totalRoyalty._sum.totalRoyaltyCspr || 0
      ),
      totalInvestors: totalHolders.length,
    });
  } catch {
    return errorResponse("Failed to load stats", 500);
  }
}
