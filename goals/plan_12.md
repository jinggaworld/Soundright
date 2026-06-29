# Plan 12: Artist Dashboard

## Overview
Implementasi artist dashboard yang menampilkan total royalties, play count charts, token sale progress, distribution history, dan AI insights.

## Goals
- Artist dashboard page
- Real-time Spotify play count display
- Token sale progress tracking
- Royalty distribution history
- AI insights (trending songs, optimal pricing)
- Distribution countdown timer

## Tasks

### 12.1 Backend Endpoint

#### GET /api/artists/[id]/dashboard
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    include: {
      songs: {
        include: {
          holdings: true,
          distributions: { orderBy: { distributedAt: "desc" }, take: 5 },
          playCountHistory: { orderBy: { recordedAt: "desc" }, take: 12 },
        },
      },
    },
  });

  if (!artist) return notFoundResponse("Artist");

  // Calculate totals
  const totalSongs = artist.songs.length;
  const totalTokensSold = artist.songs.reduce(
    (acc, song) => acc + ((song.totalSupply || 0) - (song.tokensForSale || 0)),
    0
  );
  const totalRoyaltiesEarned = artist.songs.reduce(
    (acc, song) =>
      acc +
      song.distributions.reduce((dAcc, dist) => dAcc + Number(dist.totalRoyaltyCspr), 0),
    0
  );

  // This week's total plays
  const thisWeekPlays = artist.songs.reduce(
    (acc, song) => acc + (song.weeklyPlays || 0),
    0
  );

  // Next distribution countdown (next Monday 00:00 UTC)
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  nextMonday.setUTCHours(0, 0, 0, 0);
  const daysUntilDistribution = Math.ceil(
    (nextMonday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return successResponse({
    artist: {
      id: artist.id,
      name: artist.name,
      walletAddress: artist.walletAddress,
    },
    stats: {
      totalSongs,
      totalTokensSold,
      totalRoyaltiesEarned,
      thisWeekPlays,
      daysUntilDistribution,
    },
    songs: artist.songs.map((song) => ({
      id: song.id,
      title: song.title,
      spotifyTrackId: song.spotifyTrackId,
      currentPlayCount: Number(song.currentPlayCount),
      weeklyPlays: song.weeklyPlays,
      totalSupply: song.totalSupply,
      tokensForSale: song.tokensForSale,
      saleProgress: song.totalSupply
        ? ((song.totalSupply - (song.tokensForSale || 0)) / song.totalSupply) * 100
        : 0,
      status: song.status,
      weeklyPlaysHistory: song.playCountHistory.map((p) => ({
        plays: Number(p.playCount),
        date: p.recordedAt,
      })),
      recentDistributions: song.distributions.map((d) => ({
        id: d.id,
        periodStart: d.periodStart,
        periodEnd: d.periodEnd,
        totalPlays: d.totalPlays,
        totalRoyaltyCspr: Number(d.totalRoyaltyCspr),
        distributedAt: d.distributedAt,
      })),
    })),
  });
}
```

### 12.2 Artist Dashboard Page (app/artist/dashboard/page.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { Music, DollarSign, TrendingUp, Clock, Users } from "lucide-react";
import { PlayCountChart } from "@/components/charts/PlayCountChart";
import { DistributionHistoryTable } from "@/components/shared/DistributionHistoryTable";
import { DistributionCountdown } from "@/components/shared/DistributionCountdown";

export default function ArtistDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    // TODO: Get artist ID from session
    const res = await fetch("/api/artists/current/dashboard");
    const result = await res.json();
    setData(result.data);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-sr-black" />;

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
            label="This Week's Plays"
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
          {data.songs.map((song: any) => (
            <div key={song.id} className="card-sr">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded bg-sr-mid" />
                <div className="flex-1">
                  <h3 className="font-bold text-sr-text">{song.title}</h3>
                  <p className="text-sm text-sr-text-secondary">
                    {song.currentPlayCount.toLocaleString()} plays · {song.weeklyPlays}/wk
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-sr-green">
                    {song.saleProgress.toFixed(0)}% sold
                  </p>
                  <p className="text-xs text-sr-text-secondary">
                    {song.totalSupply - song.tokensForSale}/{song.totalSupply} tokens
                  </p>
                </div>
              </div>

              {/* Weekly Plays Chart */}
              <div className="mt-4">
                <PlayCountChart data={song.weeklyPlaysHistory} height={120} />
              </div>

              {/* Recent Distributions */}
              {song.recentDistributions.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-bold text-sr-text-secondary">
                    Recent Distributions
                  </h4>
                  <DistributionHistoryTable distributions={song.recentDistributions} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card-sr">
      <div className="flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-sr-text-secondary">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
```

### 12.3 Play Count Chart (components/charts/PlayCountChart.tsx)
```typescript
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { plays: number; date: string }[];
  height?: number;
}

export function PlayCountChart({ data, height = 200 }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="date"
          tick={{ fill: "#b3b3b3", fontSize: 12 }}
          axisLine={{ stroke: "#4d4d4d" }}
        />
        <YAxis
          tick={{ fill: "#b3b3b3", fontSize: 12 }}
          axisLine={{ stroke: "#4d4d4d" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#181818",
            border: "1px solid #4d4d4d",
            borderRadius: "8px",
            color: "#ffffff",
          }}
        />
        <Line
          type="monotone"
          dataKey="plays"
          stroke="#1ed760"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Deliverables
- [ ] GET /api/artists/[id]/dashboard endpoint
- [ ] Artist dashboard page with stats cards
- [ ] PlayCountChart component (Recharts)
- [ ] DistributionHistoryTable component
- [ ] DistributionCountdown component
- [ ] Songs list with progress bars

## Dependencies
- Plan 1 (Architecture)
- Plan 7 (Backend API)
- Plan 9 (Song Detail)

## Notes
- **Real Data**: Semua data dari database, bukan fake
- **Charts**: Recharts untuk visualisasi play count
- **Countdown**: Timer ke distribusi berikutnya (Senin 00:00 UTC)
- **Responsive**: Grid responsive dari 1-4 columns
