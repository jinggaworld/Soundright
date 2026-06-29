# Plan 4: AI Agent Engine — Royalty Calculator (Groq)

## Overview
Setup AI Royalty Calculator Agent menggunakan Groq API (free tier) sebagai pengganti Anthropic Claude. Groq menggunakan format OpenAI-compatible, sehingga migrasi mudah. Model yang digunakan: `llama-3.3-70b-versatile` atau `qwen-qwq-32b`.

## Goals
- Setup Groq client (OpenAI-compatible)
- Implement Royalty Calculator Agent
- Implement Yield Predictor Agent
- Implement Fraud Detection Agent
- Fallback ke NVIDIA NIM jika Groq rate-limited
- JSON response parsing dengan validation

## Tasks

### 4.1 AI Client Factory (lib/ai.ts)
```typescript
import Groq from "groq-sdk";

// Primary: Groq (FREE TIER)
// Fallback: NVIDIA NIM (FREE for prototyping)

interface AIConfig {
  provider: "groq" | "nvidia";
  apiKey: string;
  baseUrl?: string;
  model: string;
}

const GROQ_CONFIG: AIConfig = {
  provider: "groq",
  apiKey: process.env.GROQ_API_KEY || "",
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
};

const NVIDIA_CONFIG: AIConfig = {
  provider: "nvidia",
  apiKey: process.env.NVIDIA_NIM_API_KEY || "",
  baseUrl: process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
  model: process.env.NVIDIA_NIM_MODEL || "meta/llama-3.3-70b-instruct",
};

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: GROQ_CONFIG.apiKey });
  }
  return groqClient;
}

export interface AIResponse {
  content: string;
  provider: "groq" | "nvidia";
  model: string;
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000
): Promise<AIResponse> {
  // Try Groq first
  try {
    const client = getGroqClient();
    const response = await client.chat.completions.create({
      model: GROQ_CONFIG.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      provider: "groq",
      model: GROQ_CONFIG.model,
    };
  } catch (groqError) {
    console.warn("Groq failed, falling back to NVIDIA NIM:", groqError);
  }

  // Fallback to NVIDIA NIM
  try {
    const response = await fetch(`${NVIDIA_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: NVIDIA_CONFIG.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      provider: "nvidia",
      model: NVIDIA_CONFIG.model,
    };
  } catch (nvidiaError) {
    throw new Error("Both AI providers failed");
  }
}

export function parseJSONResponse<T>(text: string): T {
  // Remove markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error("Failed to parse AI response as JSON");
  }
}
```

### 4.2 Royalty Calculator Agent (agents/royalty-calculator.ts)
```typescript
import { callAI, parseJSONResponse } from "@/lib/ai";
import crypto from "crypto";

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
  const growthRate = streamData.previousWeekDelta > 0
    ? ((streamData.weeklyDelta - streamData.previousWeekDelta) / streamData.previousWeekDelta * 100).toFixed(1)
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
  const parsed = parseJSONResponse<Omit<RoyaltyReport, "reportHash" | "rawReport" | "provider">>(response.content);

  // Generate deterministic hash for on-chain storage
  const reportString = JSON.stringify({ ...parsed, timestamp: Date.now() });
  const reportHash = crypto.createHash("sha256").update(reportString).digest("hex");

  return {
    ...parsed,
    reportHash,
    rawReport: reportString,
    provider: response.provider,
  };
}
```

### 4.3 Yield Predictor Agent (agents/yield-predictor.ts)
```typescript
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
  const parsed = parseJSONResponse<Omit<YieldPrediction, "provider">>(response.content);

  return { ...parsed, provider: response.provider };
}
```

### 4.4 Fraud Detection Agent (agents/fraud-detector.ts)
```typescript
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
  const parsed = parseJSONResponse<Omit<FraudReport, "provider">>(response.content);

  return { ...parsed, provider: response.provider };
}
```

## Deliverables
- [ ] Groq AI client with NVIDIA NIM fallback
- [ ] Royalty Calculator Agent
- [ ] Yield Predictor Agent
- [ ] Fraud Detection Agent
- [ ] JSON response parser with markdown cleanup

## Dependencies
- Plan 1 (Project Architecture)
- Groq Console Account (free API key)
- NVIDIA Developer Account (free NIM API key)

## Notes
- **Groq Free Tier**: 30 RPM, 14,400 RPD untuk Llama 3.1 8B. Rate limit ketat, handle 429 errors.
- **NVIDIA NIM Free**: Rate-limit based, tidak ada fixed credits.
- **Temperature**: 0.3 untuk response yang konsisten dan predictable.
- **Model Selection**: `llama-3.3-70b-versatile` untuk quality, `llama-3.1-8b` untuk speed.
- **No Anthropic**: Tidak menggunakan Claude API dikarenakan berbayar.
