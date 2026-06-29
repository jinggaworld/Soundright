import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { validateRequiredFields } from "@/lib/middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 connect attempts per minute per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = checkRateLimit(`connect:${ip}`, 10, 60_000);
    if (!allowed) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();

    const missing = validateRequiredFields(body, [
      "address",
      "signature",
      "message",
    ]);
    if (missing) {
      return errorResponse(missing);
    }

    const { address, signature, message } = body as {
      address: string;
      signature: string;
      message: string;
    };

    // Basic validation: address should be a hex string of expected length
    if (!/^0[1-9a-fA-F]{63,65}$/.test(address)) {
      return errorResponse("Invalid wallet address format");
    }

    if (!signature || signature.length < 10) {
      return errorResponse("Invalid signature");
    }

    // Verify the message contains expected content
    // CSPR.click signs a message that includes the wallet address and a timestamp
    if (!message.includes(address)) {
      return errorResponse("Signature message does not match wallet address");
    }

    // Reject messages older than 5 minutes (replay protection)
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    if (timestampMatch) {
      const msgTime = parseInt(timestampMatch[1], 10);
      if (Math.abs(Date.now() - msgTime) > 5 * 60 * 1000) {
        return errorResponse("Signature message has expired. Please sign again.");
      }
    }

    // Find or create user (artist)
    let user = await prisma.artist.findUnique({
      where: { walletAddress: address },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.artist.create({
        data: {
          name: `Artist ${address.slice(0, 8)}`,
          email: `${address.slice(0, 8)}@soundright.app`,
          walletAddress: address,
        },
      });
    }

    // Generate session token
    const sessionToken = crypto
      .createHash("sha256")
      .update(`${address}-${Date.now()}-${process.env.SESSION_SECRET ?? "dev-secret"}`)
      .digest("hex");

    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
      },
      isNewUser,
      sessionToken,
    });

    // Set session cookie
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth connect error:", error);
    return errorResponse("Authentication failed", 500);
  }
}
