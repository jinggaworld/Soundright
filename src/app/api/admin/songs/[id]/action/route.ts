import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) return unauthorizedResponse();

  const { id } = await params;
  const { action } = await req.json();

  if (!["approve", "flag", "remove"].includes(action)) {
    return errorResponse("Invalid action. Must be: approve, flag, or remove");
  }

  try {
    const song = await prisma.song.findUnique({ where: { id } });
    if (!song) return notFoundResponse("Song");

    if (action === "remove") {
      await prisma.song.delete({ where: { id } });
      return successResponse({ message: "Song removed", songId: id });
    }

    const updates =
      action === "approve"
        ? { status: "active", isVerified: true }
        : { status: "flagged" };

    const updated = await prisma.song.update({
      where: { id },
      data: updates,
      select: { id: true, title: true, status: true, isVerified: true },
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Failed to update song", 500);
  }
}
