import Groq from "groq-sdk";

// Primary: Groq (FREE TIER - OpenAI compatible)
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
  baseUrl:
    process.env.NVIDIA_NIM_BASE_URL ||
    "https://integrate.api.nvidia.com/v1",
  model:
    process.env.NVIDIA_NIM_MODEL || "meta/llama-3.3-70b-instruct",
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
  if (GROQ_CONFIG.apiKey) {
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
    } catch (groqError: unknown) {
      const status = (groqError as { status?: number }).status;
      if (status === 429) {
        console.warn("Groq rate limited (429), falling back to NVIDIA NIM");
      } else {
        console.warn("Groq failed, falling back to NVIDIA NIM:", groqError);
      }
    }
  }

  // Fallback to NVIDIA NIM
  if (NVIDIA_CONFIG.apiKey) {
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
      console.error("NVIDIA NIM failed:", nvidiaError);
    }
  }

  throw new Error("No AI provider configured. Set GROQ_API_KEY or NVIDIA_NIM_API_KEY.");
}

export function parseJSONResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error("Failed to parse AI response as JSON");
  }
}
