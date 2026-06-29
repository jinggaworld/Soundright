import { NextRequest } from "next/server";
import { getRecommendations } from "@/agents/recommendations";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const walletAddress = req.headers.get("x-wallet-address");
  if (!walletAddress) return unauthorizedResponse();

  try {
    const recommendations = await getRecommendations(walletAddress, 5);
    return successResponse({ recommendations });
  } catch {
    return errorResponse("Failed to generate recommendations", 500);
  }
}
