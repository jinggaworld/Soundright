import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { enhanceSearch } from "@/lib/ai-search";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== "string") {
    return errorResponse("Query is required");
  }

  try {
    const songs = await prisma.song.findMany({
      where: { status: "active" },
      include: { artist: { select: { id: true, name: true, walletAddress: true } } },
      take: 20,
    });

    const normalized = songs.map((s) => ({
      ...s,
      royaltyRatePerMille: s.royaltyRatePerMille ? Number(s.royaltyRatePerMille) : null,
      pricePerTokenCspr: s.pricePerTokenCspr ? Number(s.pricePerTokenCspr) : null,
      currentPlayCount: s.currentPlayCount ? Number(s.currentPlayCount) : null,
    }));

    const result = await enhanceSearch(query, normalized);

    // Return full song objects instead of just IDs for better performance
    const matchedSongs = normalized.filter((s) =>
      result.matchingSongIds.includes(s.id)
    );

    return successResponse({
      ...result,
      songs: matchedSongs,
    });
  } catch {
    return errorResponse("Search failed", 500);
  }
}
