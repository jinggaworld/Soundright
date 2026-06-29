import { callAI, parseJSONResponse } from "@/lib/ai";

export interface YieldPrediction {
  predictedPlaysNextMonth: number;
  predictedRoyaltyUSD: number;
  trend: "growing" | "stable" | "declining";
  confidence: number;
  reasoning: string;
  provider: string;
}

const SYSTEM_PROMPT = `You are a music analytics AI for SoundRight. You predict streaming performance based on historical data. You MUST respond in valid JSON format only.`;

export async function predictYield(
  songTitle: string,
  historicalPlays: number[],
  royaltyRatePerThousand: number
): Promise<YieldPrediction> {
  const userPrompt = `
Predict next month's streaming performance for this song:

Song: "${songTitle}"
Weekly plays (last 12 weeks, oldest to newest): ${historicalPlays.join(", ")}
Royalty rate: $${royaltyRatePerThousand} per 1,000 streams

Predict next 4 weeks total plays and estimated royalty.
Respond in JSON:
{
  "predictedPlaysNextMonth": number,
  "predictedRoyaltyUSD": number,
  "trend": "growing|stable|declining",
  "confidence": number,
  "reasoning": "string explaining your prediction"
}`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt, 800);
  const parsed = parseJSONResponse<
    Omit<YieldPrediction, "provider">
  >(response.content);

  return { ...parsed, provider: response.provider };
}
