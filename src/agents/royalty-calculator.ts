import crypto from "crypto";
import { callAI, parseJSONResponse } from "@/lib/ai";

interface StreamData {
  spotifyPlays: number;
  lastFmPlays: number;
  weeklyDelta: number;
  previousWeekDelta: number;
}

export interface RoyaltyReport {
  isValid: boolean;
  anomalyDetected: boolean;
  anomalyReason: string | null;
  approvedPlays: number;
  estimatedRoyaltyUSD: number;
  estimatedRoyaltyCSPR: number;
  confidenceScore: number;
  summary: string;
  reportHash: string;
  rawReport: string;
  provider: string;
}

const SYSTEM_PROMPT = `You are a music royalty verification agent for SoundRight, a blockchain-based royalty tokenization platform on Casper Network.

Your role is to analyze streaming data and determine if it's legitimate. You must:
1. Detect anomalies (stream farming, bot plays, suspicious spikes >500% week-over-week)
2. Cross-reference Spotify vs Last.fm consistency (should be within 30% of each other)
3. Calculate approved royalty amount
4. Generate a confidence score (0-100)

You MUST respond in valid JSON format only. No other text.`;

export async function calculateRoyalties(
  songTitle: string,
  artistName: string,
  streamData: StreamData,
  royaltyRatePerThousand: number,
  csprPriceUSD: number
): Promise<RoyaltyReport> {
  const growthRate =
    streamData.previousWeekDelta > 0
      ? (
          ((streamData.weeklyDelta - streamData.previousWeekDelta) /
            streamData.previousWeekDelta) *
          100
        ).toFixed(1)
      : "N/A";

  const userPrompt = `
Analyze the following streaming data and determine if it's legitimate:

Song: "${songTitle}" by ${artistName}
Spotify plays this week: ${streamData.spotifyPlays.toLocaleString()}
Last.fm plays this week: ${streamData.lastFmPlays.toLocaleString()}
Weekly delta (new plays): ${streamData.weeklyDelta.toLocaleString()}
Previous week delta: ${streamData.previousWeekDelta.toLocaleString()}
Growth rate: ${growthRate}%

Royalty rate: $${royaltyRatePerThousand} per 1,000 streams
Current CSPR price: $${csprPriceUSD}

Respond in this exact JSON format:
{
  "isValid": boolean,
  "anomalyDetected": boolean,
  "anomalyReason": "string or null",
  "approvedPlays": number,
  "estimatedRoyaltyUSD": number,
  "estimatedRoyaltyCSPR": number,
  "confidenceScore": number,
  "summary": "2-3 sentence explanation"
}`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt, 1000);
  const parsed = parseJSONResponse<
    Omit<RoyaltyReport, "reportHash" | "rawReport" | "provider">
  >(response.content);

  const reportString = JSON.stringify({ ...parsed, timestamp: Date.now() });
  const reportHash = crypto
    .createHash("sha256")
    .update(reportString)
    .digest("hex");

  return {
    ...parsed,
    reportHash,
    rawReport: reportString,
    provider: response.provider,
  };
}
