import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = status === "all" ? {} : { status };

  try {
    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where,
        include: { artist: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.song.count({ where }),
    ]);

    return successResponse({
      songs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return errorResponse("Failed to load songs", 500);
  }
}
