import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { paginateQuery } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const status = searchParams.get("status") || "active";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Build order by
    const orderBy: Record<string, string> = (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order: any = {};
      switch (sortBy) {
        case "yield":
          order.royaltyRatePerMille = "desc";
          break;
        case "popular":
          order.currentPlayCount = "desc";
          break;
        case "price_asc":
          order.pricePerTokenCspr = "asc";
          break;
        case "price_desc":
          order.pricePerTokenCspr = "desc";
          break;
        default:
          order.createdAt = "desc";
      }
      return order;
    })();

    const { skip, take } = paginateQuery(page, limit);

    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where,
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.song.count({ where }),
    ]);

    // Serialize BigInt fields
    const serialized = songs.map((song) => ({
      ...song,
      currentPlayCount: song.currentPlayCount
        ? Number(song.currentPlayCount)
        : null,
      lastPlayCount: song.lastPlayCount ? Number(song.lastPlayCount) : null,
      albumArt: song.spotifyTrackId
        ? `https://i.scdn.co/image/ab67616d00001e02`
        : null,
    }));

    return successResponse({
      songs: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List songs error:", error);
    return errorResponse("Failed to fetch songs", 500);
  }
}
