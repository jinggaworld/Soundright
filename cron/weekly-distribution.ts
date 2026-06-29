import { distributeWeeklyRoyalties, type DistributionResult } from "../src/lib/distribution";

async function main() {
  console.log(`[${new Date().toISOString()}] Starting weekly royalty distribution...`);

  const results = await distributeWeeklyRoyalties();

  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const flaggedCount = results.filter((r) => r.status === "flagged").length;

  console.log(`\nDistribution complete. ${results.length} songs processed.`);
  console.log(`Success: ${successCount} | Failed: ${failedCount} | Flagged: ${flaggedCount}`);

  for (const result of results as DistributionResult[]) {
    console.log(`\n--- ${result.songTitle} ---`);
    console.log(`Status: ${result.status}`);
    console.log(`Plays: ${result.totalPlays.toLocaleString()}`);
    console.log(`Royalty: $${result.royaltyUSD.toFixed(2)} (${result.royaltyCSPR.toFixed(4)} CSPR)`);
    console.log(`Holders: ${result.holdersCount}`);
    if (result.error) console.log(`Error: ${result.error}`);
  }
}

main().catch(console.error);
