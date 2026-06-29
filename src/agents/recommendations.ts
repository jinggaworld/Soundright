import { callAI, parseJSONResponse } from "@/lib/ai";
import prisma from "@/lib/db";

export interface SongRecommendation {
  songId: string;
  title: string;
  artistName: string;
  reason: string;
  matchScore: number;
  predictedYield: number;
}

export async function getRecommendations(
  investorAddress: string,
  topN = 5
): Promise<SongRecommendation[]> {
  // Get investor's current holdings
  const holdings = await prisma.tokenHolding.findMany({
    where: { investorAddress },
    include: { song: { include: { artist: true } } },
  });

  const currentHoldings = holdings.map((h) => ({
    title: h.song.title,
    artist: h.song.artist?.name,
    tokens: h.tokenAmount,
    yield: Number(h.song.royaltyRatePerMille) * 0.001 * 100,
  }));

  // Get available songs not yet owned
  const ownedSongIds = holdings.map((h) => h.songId);
  const availableSongs = await prisma.song.findMany({
    where: {
      status: "active",
      id: { notIn: ownedSongIds },
    },
    include: { artist: true },
    take: 20,
  });

  if (availableSongs.length === 0) return [];

  const systemPrompt = `You are a music investment advisor for SoundRight. Recommend songs based on the investor's portfolio and available opportunities. You MUST respond in valid JSON format only.`;

  const userPrompt = `
Investor's current holdings:
${JSON.stringify(currentHoldings, null, 2)}

Available songs to invest in:
${JSON.stringify(
  availableSongs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist?.name,
    pricePerToken: s.pricePerTokenCspr,
    royaltyRate: s.royaltyRatePerMille,
    playCount: Number(s.currentPlayCount),
    tokensAvailable: s.tokensForSale,
  })),
  null,
  2
)}

Recommend the top ${topN} songs with reasoning. Consider:
1. Portfolio diversification
2. Yield potential
3. Play count growth trend
4. Artist popularity

Respond in JSON:
{
  "recommendations": [
    {
      "songId": "string",
      "reason": "string explaining why",
      "matchScore": number (0-100),
      "predictedYield": number (percentage)
    }
  ]
}`;

  const response = await callAI(systemPrompt, userPrompt, 1500);
  const parsed = parseJSONResponse<{ recommendations: Array<{ songId: string; reason: string; matchScore: number; predictedYield: number }> }>(response.content);

  return parsed.recommendations.map((rec) => {
    const song = availableSongs.find((s) => s.id === rec.songId);
    return {
      songId: rec.songId,
      title: song?.title || "Unknown",
      artistName: song?.artist?.name || "Unknown",
      reason: rec.reason,
      matchScore: rec.matchScore,
      predictedYield: rec.predictedYield,
    };
  });
}

export async function getPricingInsight(
  songTitle: string,
  currentPrice: number,
  royaltyRate: number,
  playCount: number
): Promise<{
  suggestedPrice: number;
  reasoning: string;
  confidence: number;
}> {
  const systemPrompt = `You are a pricing advisor for music royalty tokens. Analyze the song metrics and suggest optimal token pricing. You MUST respond in valid JSON format only.`;

  const userPrompt = `
Song: "${songTitle}"
Current token price: ${currentPrice} CSPR
Royalty rate: $${royaltyRate} per 1,000 streams
Current play count: ${playCount.toLocaleString()}

Calculate the fair token price based on:
1. Expected monthly royalty revenue
2. Number of tokens in circulation
3. Market comparables

Respond in JSON:
{
  "suggestedPrice": number (in CSPR),
  "reasoning": "string",
  "confidence": number (0-100)
}`;

  const response = await callAI(systemPrompt, userPrompt, 600);
  return parseJSONResponse(response.content);
}
