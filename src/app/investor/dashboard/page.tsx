"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Music, DollarSign, ArrowUpRight, Coins, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletProvider";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

interface Holding {
  song: {
    id: string;
    title: string;
    artist: { name: string } | null;
    totalSupply: number | null;
    distributions: {
      id: string;
      distributedAt: string;
      totalRoyaltyCspr: number;
    }[];
  };
  totalTokens: number;
  totalPaid: number;
  estimatedEarnings: number;
}

interface DashboardData {
  portfolio: {
    totalSongs: number;
    totalTokens: number;
    totalInvested: number;
    totalEarned: number;
  };
  holdings: Holding[];
}

function InvestorDashboardContent() {
  const { address, isConnected } = useWallet();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Array<{ songId: string; title: string; artistName: string; reason: string; matchScore: number; predictedYield: number }>>([]);

  useEffect(() => {
    if (isConnected && address) {
      fetchHoldings();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  async function fetchHoldings() {
    try {
      const [holdingsRes, recsRes] = await Promise.all([
        fetch("/api/tokens/my-holdings", {
          headers: { "x-wallet-address": address! },
        }),
        fetch("/api/ai/recommendations", {
          headers: { "x-wallet-address": address! },
        }),
      ]);
      const holdingsResult = await holdingsRes.json();
      if (holdingsResult.success) setData(holdingsResult.data);

      const recsResult = await recsRes.json();
      if (recsResult.success) setRecommendations(recsResult.data.recommendations);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <InvestorDashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-sr-text">My Portfolio</h1>

        {/* Portfolio Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Invested"
            value={`${(data?.portfolio.totalInvested ?? 0).toFixed(2)} CSPR`}
            color="text-sr-text"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Total Earned"
            value={`${(data?.portfolio.totalEarned ?? 0).toFixed(2)} CSPR`}
            color="text-sr-green"
          />
          <StatCard
            icon={<Music size={20} />}
            label="Songs Owned"
            value={(data?.portfolio.totalSongs ?? 0).toString()}
            color="text-sr-announcement"
          />
          <StatCard
            icon={<Wallet size={20} />}
            label="Total Tokens"
            value={(data?.portfolio.totalTokens ?? 0).toLocaleString()}
            color="text-sr-warning"
          />
        </div>

        {/* Holdings */}
        <h2 className="mb-4 text-xl font-bold text-sr-text">My Holdings</h2>
        <div className="space-y-4">
          {(data?.holdings ?? []).map((holding) => (
            <HoldingCard key={holding.song.id} holding={holding} />
          ))}
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-sr-green" />
              <h2 className="text-xl font-bold text-sr-text">
                Recommended For You
              </h2>
            </div>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.songId} {...rec} />
              ))}
            </div>
          </>
        )}

        {data && data.holdings.length === 0 && (
          <div className="card-sr py-12 text-center">
            <Music size={48} className="mx-auto mb-4 text-sr-text-secondary" />
            <h3 className="text-lg font-bold text-sr-text">No Holdings Yet</h3>
            <p className="mt-2 text-sr-text-secondary">
              Browse the marketplace to buy your first tokens
            </p>
            <Link
              href="/marketplace"
              className="btn-pill mt-4 inline-block bg-sr-green text-black hover:bg-sr-green/80"
            >
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function HoldingCard({ holding, onClaimed }: { holding: Holding; onClaimed?: () => void }) {
  const { song, totalTokens, totalPaid, estimatedEarnings } = holding;
  const totalSupply = song.totalSupply || 1;
  const sharePercentage = ((totalTokens / totalSupply) * 100).toFixed(2);
  const roi =
    totalPaid > 0 ? ((estimatedEarnings / totalPaid) * 100).toFixed(1) : "0";
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch("/api/royalties/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });
      const result = await res.json();
      if (result.success) {
        setClaimSuccess(true);
        onClaimed?.();
      }
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="card-sr">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 flex-shrink-0 rounded-md bg-sr-mid" />
        <div className="flex-1">
          <h3 className="font-bold text-sr-text">{song.title}</h3>
          <p className="text-sm text-sr-text-secondary">
            {song.artist?.name ?? "Unknown Artist"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-sr-text-secondary">
              {totalTokens} tokens ({sharePercentage}%)
            </span>
            <span className="text-sr-text-secondary">
              Paid: {totalPaid.toFixed(2)} CSPR
            </span>
            <span className="text-sr-green">
              Earned: {estimatedEarnings.toFixed(4)} CSPR
            </span>
            <span
              className={`font-bold ${Number(roi) >= 0 ? "text-sr-green" : "text-sr-negative"}`}
            >
              ROI: {roi}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={`/song/${song.id}`}
            className="btn-pill flex items-center gap-1 text-xs"
          >
            View <ArrowUpRight size={12} />
          </Link>
          {estimatedEarnings > 0 && !claimSuccess && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="btn-pill flex items-center gap-1 bg-sr-green/20 text-xs text-sr-green hover:bg-sr-green/30 disabled:opacity-50"
            >
              {claiming ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Coins size={12} />
              )}
              {claiming ? "Claiming..." : "Claim"}
            </button>
          )}
          {claimSuccess && (
            <span className="text-center text-xs text-sr-green">Claimed!</span>
          )}
        </div>
      </div>

      {/* Recent Distributions */}
      {song.distributions.length > 0 && (
        <div className="mt-4 border-t border-sr-border pt-4">
          <h4 className="mb-2 text-xs font-bold text-sr-text-secondary">
            Recent Distributions
          </h4>
          <div className="space-y-1">
            {song.distributions.slice(0, 3).map((dist) => {
              const share = totalTokens / totalSupply;
              const earned = Number(dist.totalRoyaltyCspr) * share;
              return (
                <div key={dist.id} className="flex justify-between text-xs">
                  <span className="text-sr-text-secondary">
                    {new Date(dist.distributedAt).toLocaleDateString()}
                  </span>
                  <span className="text-sr-green">
                    +{earned.toFixed(4)} CSPR
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
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

export default function InvestorDashboard() {
  return (
    <ErrorBoundary>
      <InvestorDashboardContent />
    </ErrorBoundary>
  );
}

function InvestorDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-9 w-48 animate-pulse rounded bg-sr-mid" />
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-sr">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-pulse rounded bg-sr-mid" />
                <div className="flex-1">
                  <div className="mb-1 h-3 w-20 animate-pulse rounded bg-sr-mid" />
                  <div className="h-5 w-24 animate-pulse rounded bg-sr-mid" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-sr-mid" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card-sr mb-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 animate-pulse rounded-md bg-sr-mid" />
              <div className="flex-1">
                <div className="mb-1 h-4 w-40 animate-pulse rounded bg-sr-mid" />
                <div className="mb-2 h-3 w-28 animate-pulse rounded bg-sr-mid" />
                <div className="h-3 w-64 animate-pulse rounded bg-sr-mid" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
