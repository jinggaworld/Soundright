import { callAI, parseJSONResponse } from "@/lib/ai";

export interface FraudReport {
  isFraudulent: boolean;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  recommendedAction: "approve" | "flag_for_review" | "reject";
  provider: string;
}

const SYSTEM_PROMPT = `You are a fraud detection agent for SoundRight. Analyze streaming patterns and detect potential stream farming or manipulation. You MUST respond in valid JSON format only.`;

export async function detectFraud(
  songTitle: string,
  artistName: string,
  weeklyPlays: number[],
  spotifyVsLastFmRatio: number
): Promise<FraudReport> {
  const userPrompt = `
Analyze these streaming patterns for potential fraud:

Song: "${songTitle}" by ${artistName}
Weekly play counts (last 8 weeks): ${weeklyPlays.join(", ")}
Spotify/Last.fm ratio: ${spotifyVsLastFmRatio.toFixed(2)} (1.0 = perfect match)

Look for:
1. Unusual spikes (>500% increase in a single week)
2. Consistent unnatural patterns (bot-like behavior)
3. Spotify vs Last.fm discrepancy (>30% difference)
4. Declining trend that suddenly reverses

Respond in JSON:
{
  "isFraudulent": boolean,
  "riskLevel": "low|medium|high",
  "reasons": ["array of reasons"],
  "recommendedAction": "approve|flag_for_review|reject"
}`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt, 600);
  const parsed = parseJSONResponse<Omit<FraudReport, "provider">>(
    response.content
  );

  return { ...parsed, provider: response.provider };
}
