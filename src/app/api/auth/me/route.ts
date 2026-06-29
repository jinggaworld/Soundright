import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("session")?.value;
    if (!sessionToken) {
      return unauthorizedResponse("No active session");
    }

    // In production, look up session in Redis/DB
    // For now, return user info based on the session cookie
    // We'd need to store session→userId mapping in DB or Redis
    // For this MVP, we'll extract the wallet address from the x-wallet-address header
    // or return a basic "authenticated" response

    const walletAddress = req.headers.get("x-wallet-address");

    if (!walletAddress) {
      return unauthorizedResponse("Missing wallet address header");
    }

    const user = await prisma.artist.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        createdAt: true,
        songs: {
          select: {
            id: true,
            title: true,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return unauthorizedResponse("User not found");
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        recentSongs: user.songs,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return unauthorizedResponse("Failed to fetch user info");
  }
}
