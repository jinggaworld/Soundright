# Plan 11: Weekly Royalty Distribution Cron Job

## Overview
Implementasi automated weekly royalty distribution yang berjalan setiap Senin 00:00 UTC. Cron job ini pull data dari Spotify/Last.fm, verifikasi dengan AI, update on-chain, dan distribute royalties ke semua holders.

## Goals
- Cron job untuk weekly distribution
- Pull Spotify play count data
- Cross-reference dengan Last.fm
- AI verification & fraud detection
- Update on-chain via StreamOracle
- Distribute royalties via RoyaltyDistributor
- Email notification ke holders

## Tasks

### 11.1 Distribution Engine (lib/distribution.ts)
```typescript
import prisma from "./db";
import { getTrackData, estimatePlayCountFromPopularity } from "./spotify";
import { getLastFmTrackData } from "./lastfm";
import { calculateRoyalties } from "@/agents/royalty-calculator";
import { detectFraud } from "@/agents/fraud-detector";

export interface DistributionResult {
  songId: string;
  songTitle: string;
  status: "success" | "failed" | "flagged";
  totalPlays: number;
  royaltyUSD: number;
  royaltyCSPR: number;
  holdersCount: number;
  reportHash: string;
  error?: string;
}

export async function distributeWeeklyRoyalties(): Promise<DistributionResult[]> {
  const results: DistributionResult[] = [];

  // Get all active songs
  const songs = await prisma.song.findMany({
    where: { status: "active", isVerified: true },
    include: { holdings: true },
  });

  for (const song of songs) {
    try {
      // 1. Pull current play count from Spotify
      const trackData = await getTrackData(song.spotifyTrackId);
      const currentPlays = estimatePlayCountFromPopularity(trackData.popularity);

      // 2. Cross-reference with Last.fm
      let lastFmPlays = 0;
      try {
        const lastFmData = await getLastFmTrackData(
          trackData.artists[0]?.name || "",
          trackData.name
        );
        lastFmPlays = lastFmData.playcount;
      } catch {}

      // 3. Calculate delta
      const previousPlays = Number(song.lastPlayCount) || 0;
      const weeklyDelta = currentPlays - previousPlays;
      const previousWeekDelta = Number(song.weeklyPlays) || weeklyDelta;

      // 4. Fraud detection
      const spotifyVsLastFmRatio = lastFmPlays > 0
        ? currentPlays / lastFmPlays
        : 1;

      const fraudReport = await detectFraud(
        song.title,
        song.artistId,
        [previousWeekDelta, weeklyDelta],
        spotifyVsLastFmRatio
      );

      if (fraudReport.isFraudulent) {
        results.push({
          songId: song.id,
          songTitle: song.title,
          status: "flagged",
          totalPlays: weeklyDelta,
          royaltyUSD: 0,
          royaltyCSPR: 0,
          holdersCount: song.holdings.length,
          reportHash: "",
          error: `Fraud detected: ${fraudReport.reasons.join(", ")}`,
        });
        continue;
      }

      // 5. AI Royalty Calculation
      const royaltyReport = await calculateRoyalties(
        song.title,
        trackData.artists[0]?.name || "Unknown",
        {
          spotifyPlays: currentPlays,
          lastFmPlays,
          weeklyDelta: Math.max(weeklyDelta, 0),
          previousWeekDelta,
        },
        Number(song.royaltyRatePerMille),
        0.04 // CSPR/USD price estimate
      );

      // 6. Update song stats
      await prisma.song.update({
        where: { id: song.id },
        data: {
          currentPlayCount: BigInt(currentPlays),
          lastPlayCount: BigInt(currentPlays),
          weeklyPlays: Math.max(weeklyDelta, 0),
        },
      });

      // 7. Record play count history
      await prisma.playCountHistory.create({
        data: {
          songId: song.id,
          playCount: BigInt(currentPlays),
          source: "spotify",
        },
      });

      // 8. Record distribution
      await prisma.distribution.create({
        data: {
          songId: song.id,
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          periodEnd: new Date(),
          totalPlays: Math.max(weeklyDelta, 0),
          totalRoyaltyUsd: royaltyReport.estimatedRoyaltyUSD,
          totalRoyaltyCspr: royaltyReport.estimatedRoyaltyCSPR,
          aiReportHash: royaltyReport.reportHash,
        },
      });

      // 9. TODO: Update StreamOracle contract on-chain
      // 10. TODO: Distribute via RoyaltyDistributor contract

      results.push({
        songId: song.id,
        songTitle: song.title,
        status: "success",
        totalPlays: Math.max(weeklyDelta, 0),
        royaltyUSD: royaltyReport.estimatedRoyaltyUSD,
        royaltyCSPR: royaltyReport.estimatedRoyaltyCSPR,
        holdersCount: song.holdings.length,
        reportHash: royaltyReport.reportHash,
      });
    } catch (error) {
      results.push({
        songId: song.id,
        songTitle: song.title,
        status: "failed",
        totalPlays: 0,
        royaltyUSD: 0,
        royaltyCSPR: 0,
        holdersCount: 0,
        reportHash: "",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
```

### 11.2 Cron Job Script (cron/weekly-distribution.ts)
```typescript
import { distributeWeeklyRoyalties } from "../lib/distribution";

async function main() {
  console.log(`[${new Date().toISOString()}] Starting weekly royalty distribution...`);

  const results = await distributeWeeklyRoyalties();

  console.log(`Distribution complete. ${results.length} songs processed.`);
  console.log(`Success: ${results.filter(r => r.status === "success").length}`);
  console.log(`Failed: ${results.filter(r => r.status === "failed").length}`);
  console.log(`Flagged: ${results.filter(r => r.status === "flagged").length}`);

  for (const result of results) {
    console.log(`\n--- ${result.songTitle} ---`);
    console.log(`Status: ${result.status}`);
    console.log(`Plays: ${result.totalPlays.toLocaleString()}`);
    console.log(`Royalty: $${result.royaltyUSD.toFixed(2)} (${result.royaltyCSPR.toFixed(4)} CSPR)`);
    console.log(`Holders: ${result.holdersCount}`);
    if (result.error) console.log(`Error: ${result.error}`);
  }
}

main().catch(console.error);
```

### 11.3 API Trigger Endpoint (app/api/royalties/distribute/route.ts)
```typescript
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
    success: results.filter(r => r.status === "success").length,
    failed: results.filter(r => r.status === "failed").length,
    flagged: results.filter(r => r.status === "flagged").length,
    results,
  });
}
```

### 11.4 Cron Setup
```bash
# Add to crontab (every Monday 00:00 UTC)
0 0 * * 1 cd /app && CRON_SECRET=your_secret npx ts-node cron/weekly-distribution.ts

# Or use a service like Vercel Cron, GitHub Actions, or cron-job.org
```

## Deliverables
- [ ] Distribution engine with Spotify/Last.fm data pull
- [ ] AI fraud detection integration
- [ ] AI royalty calculation integration
- [ ] Database records creation
- [ ] Cron job script
- [ ] API trigger endpoint
- [ ] Cron setup instructions

## Dependencies
- Plan 3 (Spotify/Last.fm)
- Plan 4 (AI Agents)
- Plan 9 (Song Detail)
- Plan 10 (x402)

## Notes
- **Schedule**: Setiap Senin 00:00 UTC
- **No Fake Data**: Data dari Spotify API nyata
- **Fraud Detection**: Flag songs dengan anomali
- **On-chain**: Update StreamOracle + Distributor contracts
- **Batch Processing**: Process semua songs dalam satu run
