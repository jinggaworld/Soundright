import { NextRequest } from "next/server";
import { distributeWeeklyRoyalties } from "@/lib/distribution";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  // Only allow internal cron or admin triggers
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return errorResponse("Unauthorized", 401);
  }

  const results = await distributeWeeklyRoyalties();

  return successResponse({
    processedAt: new Date().toISOString(),
    totalSongs: results.length,
    success: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "failed").length,
    flagged: results.filter((r) => r.status === "flagged").length,
    results,
  });
}
