# Plan 13: Investor Dashboard

## Overview
Implementasi investor dashboard yang menampilkan portfolio, holdings per song, royalty history, pending claims, dan AI-recommended songs.

## Goals
- Investor dashboard page
- Portfolio overview (total value, holdings, earnings)
- Per-song holding cards
- Royalty claim functionality
- Transaction history
- AI-recommended songs

## Tasks

### 13.1 Backend Endpoints

#### GET /api/tokens/my-holdings
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const walletAddress = req.headers.get("x-wallet-address");
  if (!walletAddress) return unauthorizedResponse();

  const holdings = await prisma.tokenHolding.findMany({
    where: { investorAddress: walletAddress },
    include: {
      song: {
        include: {
          artist: true,
          distributions: { orderBy: { distributedAt: "desc" }, take: 5 },
        },
      },
    },
  });

  // Group holdings by song
  const groupedHoldings = holdings.reduce((acc: any, holding) => {
    const songId = holding.songId;
    if (!acc[songId]) {
      acc[songId] = {
        song: holding.song,
        totalTokens: 0,
        totalPaid: 0,
        estimatedEarnings: 0,
      };
    }
    acc[songId].totalTokens += holding.tokenAmount;
    acc[songId].totalPaid += Number(holding.purchasePriceCspr);
    return acc;
  }, {});

  // Calculate estimated earnings per song
  for (const songId of Object.keys(groupedHoldings)) {
    const { song, totalTokens } = groupedHoldings[songId];
    const share = totalTokens / (song.totalSupply || 1);

    // Sum earnings from distributions
    const totalEarnings = song.distributions.reduce(
      (acc: number, dist: any) => acc + Number(dist.totalRoyaltyCspr) * share,
      0
    );
    groupedHoldings[songId].estimatedEarnings = totalEarnings;
  }

  // Portfolio summary
  const portfolio = {
    totalSongs: Object.keys(groupedHoldings).length,
    totalTokens: Object.values(groupedHoldings).reduce(
      (acc: number, h: any) => acc + h.totalTokens, 0
    ),
    totalInvested: Object.values(groupedHoldings).reduce(
      (acc: number, h: any) => acc + h.totalPaid, 0
    ),
    totalEarned: Object.values(groupedHoldings).reduce(
      (acc: number, h: any) => acc + h.estimatedEarnings, 0
    ),
  };

  return successResponse({
    portfolio,
    holdings: Object.values(groupedHoldings),
  });
}
```

### 13.2 Investor Dashboard Page (app/investor/dashboard/page.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Music, DollarSign, ArrowUpRight } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { CasperExplorerLink } from "@/components/shared/CasperExplorerLink";

export default function InvestorDashboard() {
  const { address, isConnected } = useWallet();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchHoldings();
    }
  }, [isConnected, address]);

  async function fetchHoldings() {
    const res = await fetch("/api/tokens/my-holdings", {
      headers: { "x-wallet-address": address! },
    });
    const result = await res.json();
    setData(result.data);
    setLoading(false);
  }

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sr-black">
        <div className="text-center">
          <Wallet size={48} className="mx-auto mb-4 text-sr-text-secondary" />
          <h2 className="text-xl font-bold text-sr-text">Connect Your Wallet</h2>
          <p className="mt-2 text-sr-text-secondary">
            Connect your CSPR wallet to view your portfolio
          </p>
        </div>
      </main>
    );
  }

  if (loading) return <div className="min-h-screen bg-sr-black" />;

  return (
    <main className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-sr-text">My Portfolio</h1>

        {/* Portfolio Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Invested"
            value={`${data.portfolio.totalInvested.toFixed(2)} CSPR`}
            color="text-sr-text"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Total Earned"
            value={`${data.portfolio.totalEarned.toFixed(2)} CSPR`}
            color="text-sr-green"
          />
          <StatCard
            icon={<Music size={20} />}
            label="Songs Owned"
            value={data.portfolio.totalSongs.toString()}
            color="text-sr-announcement"
          />
          <StatCard
            icon={<Wallet size={20} />}
            label="Total Tokens"
            value={data.portfolio.totalTokens.toLocaleString()}
            color="text-sr-warning"
          />
        </div>

        {/* Holdings */}
        <h2 className="mb-4 text-xl font-bold text-sr-text">My Holdings</h2>
        <div className="space-y-4">
          {data.holdings.map((holding: any) => (
            <HoldingCard key={holding.song.id} holding={holding} />
          ))}
        </div>

        {data.holdings.length === 0 && (
          <div className="card-sr py-12 text-center">
            <Music size={48} className="mx-auto mb-4 text-sr-text-secondary" />
            <h3 className="text-lg font-bold text-sr-text">No Holdings Yet</h3>
            <p className="mt-2 text-sr-text-secondary">
              Browse the marketplace to buy your first tokens
            </p>
            <a href="/marketplace" className="btn-pill-green mt-4 inline-block">
              Browse Marketplace
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

function HoldingCard({ holding }: { holding: any }) {
  const { song, totalTokens, totalPaid, estimatedEarnings } = holding;
  const sharePercentage = ((totalTokens / (song.totalSupply || 1)) * 100).toFixed(2);
  const roi = totalPaid > 0 ? ((estimatedEarnings / totalPaid) * 100).toFixed(1) : "0";

  return (
    <div className="card-sr">
      <div className="flex items-start gap-4">
        <img
          src={song.albumArt || "/default-album.png"}
          alt={song.title}
          className="h-20 w-20 rounded-md object-cover"
        />
        <div className="flex-1">
          <h3 className="font-bold text-sr-text">{song.title}</h3>
          <p className="text-sm text-sr-text-secondary">{song.artist?.name}</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-sr-text-secondary">
              {totalTokens} tokens ({sharePercentage}%)
            </span>
            <span className="text-sr-text-secondary">
              Paid: {totalPaid.toFixed(2)} CSPR
            </span>
            <span className="text-sr-green">
              Earned: {estimatedEarnings.toFixed(4)} CSPR
            </span>
            <span className={`font-bold ${Number(roi) >= 0 ? "text-sr-green" : "text-sr-negative"}`}>
              ROI: {roi}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={`/song/${song.id}`}
            className="btn-pill flex items-center gap-1 text-xs"
          >
            View <ArrowUpRight size={12} />
          </a>
        </div>
      </div>

      {/* Recent Distributions */}
      {song.distributions.length > 0 && (
        <div className="mt-4 border-t border-sr-border pt-4">
          <h4 className="mb-2 text-xs font-bold text-sr-text-secondary">
            Recent Distributions
          </h4>
          <div className="space-y-1">
            {song.distributions.slice(0, 3).map((dist: any) => (
              <div key={dist.id} className="flex justify-between text-xs">
                <span className="text-sr-text-secondary">
                  {new Date(dist.distributedAt).toLocaleDateString()}
                </span>
                <span className="text-sr-green">
                  +{(Number(dist.totalRoyaltyCspr) * (totalTokens / (song.totalSupply || 1))).toFixed(4)} CSPR
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
        <div className={color}>{icon}</div>
        <div>
          <p className="text-sm text-sr-text-secondary">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
```

## Deliverables
- [ ] GET /api/tokens/my-holdings endpoint
- [ ] Investor dashboard page
- [ ] Portfolio summary cards
- [ ] HoldingCard component with ROI
- [ ] Distribution history per song
- [ ] Empty state with marketplace link

## Dependencies
- Plan 1 (Architecture)
- Plan 2 (Casper Integration)
- Plan 7 (Backend API)
- Plan 9 (Song Detail)

## Notes
- **Real Data**: Semua data dari database, bukan fake
- **ROI**: Return on Investment dihitung dari earnings vs paid
- **Share Calculation**: `tokens / totalSupply * 100`
- **Responsive**: Grid responsive dari 1-4 columns
