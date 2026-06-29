import { callAI, parseJSONResponse } from "./ai";

interface AvailableSong {
  id: string;
  title: string;
  artist?: { name: string } | null;
  royaltyRatePerMille?: number | null;
  pricePerTokenCspr?: number | null;
  currentPlayCount?: bigint | null;
  status: string;
}

export async function enhanceSearch(
  query: string,
  availableSongs: AvailableSong[]
): Promise<{
  interpretedQuery: string;
  filters: {
    minYield: number | null;
    maxPrice: number | null;
    minPlayCount: number | null;
    sortBy: string;
  };
  matchingSongIds: string[];
}> {
  const systemPrompt = `You are a search interpreter for a music royalty marketplace. Parse natural language queries into structured filters. You MUST respond in valid JSON format only.`;

  const userPrompt = `
User search query: "${query}"

Available songs:
${JSON.stringify(
  availableSongs.slice(0, 10).map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist?.name,
    yield: Number(s.royaltyRatePerMille || 0) * 0.001 * 100,
    price: s.pricePerTokenCspr,
    playCount: Number(s.currentPlayCount || 0),
    status: s.status,
  })),
  null,
  2
)}

Interpret the query and return matching songs.
Respond in JSON:
{
  "interpretedQuery": "string explaining what user wants",
  "filters": {
    "minYield": number | null,
    "maxPrice": number | null,
    "minPlayCount": number | null,
    "sortBy": "yield" | "popular" | "newest" | "price"
  },
  "matchingSongIds": ["array of matching song IDs"]
}`;

  const response = await callAI(systemPrompt, userPrompt, 1000);
  return parseJSONResponse(response.content);
}
