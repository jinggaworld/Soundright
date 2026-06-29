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

  // Get all active, verified songs with holdings
  const songs = await prisma.song.findMany({
    where: { status: "active", isVerified: true },
    include: { holdings: true },
  });

  for (const song of songs) {
    try {
      // 1. Pull current play count from Spotify
      const trackData = await getTrackData(song.spotifyTrackId);
      const currentPlays = estimatePlayCountFromPopularity(trackData.popularity || 0);

      // 2. Cross-reference with Last.fm
      const artistName = trackData.artists?.[0]?.name || "Unknown";
      const songTitle = trackData.name || song.title;
      let lastFmPlays = 0;
      try {
        const lastFmData = await getLastFmTrackData(artistName, songTitle);
        lastFmPlays = lastFmData.playcount;
      } catch {
        // Last.fm failure is non-fatal
      }

      // 3. Calculate delta (new plays this week)
      const previousPlays = Number(song.lastPlayCount) || 0;
      const weeklyDelta = Math.max(currentPlays - previousPlays, 0);
      const previousWeekDelta = Number(song.weeklyPlays) || weeklyDelta;

      // 4. AI Fraud detection
      const spotifyVsLastFmRatio =
        lastFmPlays > 0 ? currentPlays / lastFmPlays : 1;

      const fraudReport = await detectFraud(
        song.title,
        artistName,
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
      const royaltyRate = Number(song.royaltyRatePerMille) || 0;
      const royaltyReport = await calculateRoyalties(
        song.title,
        artistName,
        {
          spotifyPlays: currentPlays,
          lastFmPlays,
          weeklyDelta,
          previousWeekDelta,
        },
        royaltyRate,
        0.04 // CSPR/USD price estimate
      );

      // 6. Update song stats
      await prisma.song.update({
        where: { id: song.id },
        data: {
          currentPlayCount: BigInt(currentPlays),
          lastPlayCount: BigInt(currentPlays),
          weeklyPlays: weeklyDelta,
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
          totalPlays: weeklyDelta,
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
        totalPlays: weeklyDelta,
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
