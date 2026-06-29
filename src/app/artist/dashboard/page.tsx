"use client";

import { useState, useEffect } from "react";
import { Music, DollarSign, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { PlayCountChart } from "@/components/charts/PlayCountChart";
import { DistributionHistoryTable } from "@/components/shared/DistributionHistoryTable";
import { DistributionCountdown } from "@/components/shared/DistributionCountdown";

interface SongData {
  id: string;
  title: string;
  spotifyTrackId: string;
  currentPlayCount: number;
  weeklyPlays: number;
  totalSupply: number | null;
  tokensForSale: number | null;
  saleProgress: number;
  status: string;
  weeklyPlaysHistory: { plays: number; date: string }[];
  recentDistributions: {
    id: string;
    periodStart: string;
    periodEnd: string;
    totalPlays: number;
    totalRoyaltyCspr: number;
    distributedAt: string;
  }[];
}

interface DashboardData {
  artist: { id: string; name: string; walletAddress: string };
  stats: {
    totalSongs: number;
    totalTokensSold: number;
    totalRoyaltiesEarned: number;
    thisWeekPlays: number;
    daysUntilDistribution: number;
  };
  songs: SongData[];
}

export default function ArtistDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      // TODO: Get artist ID from session/wallet
      const artistId = localStorage.getItem("artistId");
      if (!artistId) {
        setError("No artist account found. Please connect your wallet first.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/artists/${artistId}/dashboard`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load dashboard");
      }
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sr-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sr-green border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sr-black">
        <p className="text-sr-text-secondary">{error || "No data available"}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-sr-text">
          Welcome back, {data.artist.name}
        </h1>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Royalties"
            value={`${data.stats.totalRoyaltiesEarned.toFixed(2)} CSPR`}
            color="text-sr-green"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="This Week&apos;s Plays"
            value={data.stats.thisWeekPlays.toLocaleString()}
            color="text-sr-announcement"
          />
          <StatCard
            icon={<Music size={20} />}
            label="Songs Tokenized"
            value={data.stats.totalSongs.toString()}
            color="text-sr-text"
          />
          <StatCard
            icon={<Users size={20} />}
            label="Tokens Sold"
            value={data.stats.totalTokensSold.toLocaleString()}
            color="text-sr-warning"
          />
        </div>

        {/* Distribution Countdown */}
        <div className="mb-8">
          <DistributionCountdown days={data.stats.daysUntilDistribution} />
        </div>

        {/* Songs List */}
        <h2 className="mb-4 text-xl font-bold text-sr-text">My Songs</h2>
        <div className="space-y-4">
          {data.songs.map((song) => (
            <Link
              key={song.id}
              href={`/song/${song.id}`}
              className="card-sr block transition-colors hover:border-sr-green/30"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 flex-shrink-0 rounded bg-sr-mid" />
                <div className="flex-1">
                  <h3 className="font-bold text-sr-text">{song.title}</h3>
                  <p className="text-sm text-sr-text-secondary">
                    {song.currentPlayCount.toLocaleString()} plays ·{" "}
                    {song.weeklyPlays ?? 0}/wk
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-sr-green">
                    {song.saleProgress.toFixed(0)}% sold
                  </p>
                  <p className="text-xs text-sr-text-secondary">
                    {(song.totalSupply ?? 0) - (song.tokensForSale ?? 0)}/
                    {song.totalSupply ?? 0} tokens
                  </p>
                </div>
              </div>

              {/* Weekly Plays Chart */}
              {song.weeklyPlaysHistory.length > 0 && (
                <div className="mt-4">
                  <PlayCountChart
                    data={song.weeklyPlaysHistory}
                    height={120}
                  />
                </div>
              )}

              {/* Recent Distributions */}
              {song.recentDistributions.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-bold text-sr-text-secondary">
                    Recent Distributions
                  </h4>
                  <DistributionHistoryTable
                    distributions={song.recentDistributions}
                  />
                </div>
              )}
            </Link>
          ))}

          {data.songs.length === 0 && (
            <div className="card-sr text-center">
              <p className="mb-4 text-sr-text-secondary">
                You haven&apos;t tokenized any songs yet
              </p>
              <Link
                href="/artist/onboard"
                className="btn-pill inline-block bg-sr-green text-black hover:bg-sr-green/80"
              >
                Tokenize Your First Song
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card-sr">
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div>
          <p className="text-sm text-sr-text-secondary">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
