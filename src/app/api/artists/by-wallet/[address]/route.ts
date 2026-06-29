import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, notFoundResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  try {
    const artist = await prisma.artist.findUnique({
      where: { walletAddress: address },
      select: { id: true, name: true, walletAddress: true },
    });

    if (!artist) return notFoundResponse("Artist");

    return successResponse(artist);
  } catch {
    return errorResponse("Failed to look up artist", 500);
  }
}
