import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) return unauthorizedResponse();

  try {
    const [totalArtists, totalSongs, activeSongs, totalDistributions, totalRoyaltyDistributed] =
      await Promise.all([
        prisma.artist.count(),
        prisma.song.count(),
        prisma.song.count({ where: { status: "active" } }),
        prisma.distribution.count(),
        prisma.distribution.aggregate({ _sum: { totalRoyaltyCspr: true } }),
      ]);

    const uniqueHolders = await prisma.tokenHolding.findMany({
      select: { investorAddress: true },
      distinct: ["investorAddress"],
    });

    return successResponse({
      totalArtists,
      totalSongs,
      activeSongs,
      totalHolders: uniqueHolders.length,
      totalDistributions,
      totalRoyaltyDistributed: Number(totalRoyaltyDistributed._sum.totalRoyaltyCspr || 0),
    });
  } catch {
    return errorResponse("Failed to load admin stats", 500);
  }
}
