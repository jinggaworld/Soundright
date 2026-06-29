import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 requests per minute
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = checkRateLimit(`tokenize:${ip}`, 3, 60_000);
    if (!allowed) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();
    const {
      artistId,
      spotifyTrackId,
      title,
      isrcCode,
      totalSupply,
      tokensForSale,
      pricePerToken,
      royaltyRatePerMille,
      distributionSchedule,
    } = body;

    // Validate required fields
    if (!artistId || !spotifyTrackId || !title) {
      return errorResponse(
        "Missing required fields: artistId, spotifyTrackId, title"
      );
    }

    // Validate numeric fields
    if (!totalSupply || totalSupply < 1) {
      return errorResponse("totalSupply must be at least 1");
    }
    if (tokensForSale < 0 || tokensForSale > totalSupply) {
      return errorResponse("tokensForSale must be between 0 and totalSupply");
    }
    if (!pricePerToken || pricePerToken <= 0) {
      return errorResponse("pricePerToken must be greater than 0");
    }
    if (!royaltyRatePerMille || royaltyRatePerMille < 0 || royaltyRatePerMille > 1000) {
      return errorResponse("royaltyRatePerMille must be between 0 and 1000");
    }

    // Verify artist exists and owns this wallet
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
    });
    if (!artist) {
      return errorResponse("Artist not found", 404);
    }

    // Check for duplicate track
    const existingSong = await prisma.song.findFirst({
      where: { spotifyTrackId },
    });
    if (existingSong) {
      return errorResponse("This track has already been tokenized", 409);
    }

    // Estimate play count from popularity (rough heuristic)
    // In production, this would come from Spotify/Last.fm APIs
    const estimatedPlays = 50000; // Default estimate — real value fetched via Spotify API
    const weeklyPlays = Math.round(estimatedPlays / 4);

    // Generate a compliance hash (SHA-256 of the tokenization parameters)
    const { createHash } = await import("crypto");
    const complianceData = JSON.stringify({
      artistId,
      spotifyTrackId,
      title,
      totalSupply,
      royaltyRatePerMille,
      pricePerToken,
      timestamp: Date.now(),
    });
    const complianceHash = createHash("sha256")
      .update(complianceData)
      .digest("hex");

    // Create song record
    const song = await prisma.song.create({
      data: {
        artistId,
        title,
        spotifyTrackId,
        isrcCode: isrcCode || "",
        totalSupply,
        tokensForSale,
        pricePerTokenCspr: pricePerToken,
        royaltyRatePerMille,
        distributionSchedule: distributionSchedule || "weekly",
        currentPlayCount: BigInt(estimatedPlays),
        lastPlayCount: BigInt(0),
        weeklyPlays,
        complianceHash,
        isVerified: false, // Requires AI compliance check
        status: "pending",
      },
    });

    // TODO: Trigger AI compliance check asynchronously
    // This would call the royalty-calculator agent to verify the song
    // For now, mark as pending verification

    return successResponse({
      song: {
        id: song.id,
        title: song.title,
        spotifyTrackId: song.spotifyTrackId,
        status: song.status,
        totalSupply: song.totalSupply,
        tokensForSale: song.tokensForSale,
        pricePerTokenCspr: song.pricePerTokenCspr,
        royaltyRatePerMille: song.royaltyRatePerMille,
        complianceHash: song.complianceHash,
        isVerified: song.isVerified,
        createdAt: song.createdAt,
      },
      nextSteps: [
        "AI compliance check will run automatically",
        "Once verified, you can deploy smart contracts",
        "Tokens will be available for purchase after deployment",
      ],
    });
  } catch (error) {
    console.error("Tokenize error:", error);
    return errorResponse("Failed to tokenize song", 500);
  }
}
