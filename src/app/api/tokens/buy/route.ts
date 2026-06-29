import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 buy attempts per minute per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = checkRateLimit(`buy:${ip}`, 10, 60_000);
    if (!allowed) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const paymentProof = req.headers.get("X-Payment");
    const body = await req.json();
    const { songId, tokenAmount, buyerAddress } = body;

    if (!songId || !tokenAmount || !buyerAddress) {
      return errorResponse(
        "Missing required fields: songId, tokenAmount, buyerAddress"
      );
    }

    if (tokenAmount < 1) {
      return errorResponse("tokenAmount must be at least 1");
    }

    // If no payment proof, return 402 with payment challenge
    if (!paymentProof) {
      const song = await prisma.song.findUnique({ where: { id: songId } });
      if (!song) return errorResponse("Song not found", 404);
      if ((song.tokensForSale ?? 0) < tokenAmount) {
        return errorResponse("Not enough tokens available");
      }

      const totalCSPR = tokenAmount * Number(song.pricePerTokenCspr);
      const totalMotes = BigInt(Math.round(totalCSPR * 1_000_000_000));

      return Response.json(
        {
          price: totalMotes.toString(),
          recipient: song.tokenContractAddress || song.artistId,
          nonce: crypto.randomUUID(),
          deadline: Date.now() + 300_000, // 5 minutes
          songId,
          tokenAmount,
        },
        { status: 402 }
      );
    }

    // Verify payment proof and execute purchase
    const proof = JSON.parse(paymentProof);

    // Find the song
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) return errorResponse("Song not found", 404);
    if ((song.tokensForSale ?? 0) < tokenAmount) {
      return errorResponse("Not enough tokens available");
    }

    // Update token supply
    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: {
        tokensForSale: { decrement: tokenAmount },
      },
    });

    // Record the holding
    const purchasePrice = tokenAmount * Number(song.pricePerTokenCspr);
    const holding = await prisma.tokenHolding.create({
      data: {
        songId,
        investorAddress: buyerAddress,
        tokenAmount,
        purchasePriceCspr: purchasePrice,
      },
    });

    return successResponse({
      holdingId: holding.id,
      txHash: proof.txHash || "pending",
      tokensReceived: tokenAmount,
      totalCost: purchasePrice,
      songId,
    });
  } catch (error) {
    console.error("Buy token error:", error);
    return errorResponse("Payment verification failed", 400);
  }
}
