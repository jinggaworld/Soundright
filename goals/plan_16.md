# Plan 16: Landing Page & Hero Section

## Overview
Implementasi landing page yang menarik dengan hero section, how it works, live stats, featured songs, dan why Casper section.

## Goals
- Compelling hero section with CTA
- "How It Works" 3-step animation
- Live platform statistics
- Featured songs carousel
- "Why Casper" section
- Footer with links

## Tasks

### 16.1 Backend Endpoint

#### GET /api/stats
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  const [totalSongs, totalDistributions, totalRoyalty, totalHolders] = await Promise.all([
    prisma.song.count({ where: { status: "active" } }),
    prisma.distribution.count(),
    prisma.distribution.aggregate({ _sum: { totalRoyaltyCspr: true } }),
    prisma.tokenHolding.findMany({
      select: { investorAddress: true },
      distinct: ["investorAddress"],
    }),
  ]);

  return successResponse({
    totalSongs,
    totalDistributions,
    totalRoyaltyDistributed: Number(totalRoyalty._sum.totalRoyaltyCspr || 0),
    totalInvestors: totalHolders.length,
  });
}
```

### 16.2 Landing Page (app/page.tsx)
```typescript
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveStats } from "@/components/landing/LiveStats";
import { FeaturedSongs } from "@/components/landing/FeaturedSongs";
import { WhyCasper } from "@/components/landing/WhyCasper";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sr-black">
      <HeroSection />
      <HowItWorks />
      <LiveStats />
      <FeaturedSongs />
      <WhyCasper />
      <Footer />
    </main>
  );
}
```

### 16.3 Hero Section (components/landing/HeroSection.tsx)
```typescript
import Link from "next/link";
import { ArrowRight, Music, TrendingUp, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sr-green/10 to-transparent" />

      <div className="relative mx-auto max-w-5xl text-center">
        <h1 className="mb-6 text-5xl font-bold text-sr-text md:text-7xl">
          Own a Piece of{" "}
          <span className="text-sr-green">Music</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-sr-text-secondary">
          Tokenize music royalties on Casper Network. Investors buy tokens representing
          % of royalties. AI-powered verification. x402 micropayments. Fully on-chain.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/artist/onboard" className="btn-pill-green flex items-center gap-2">
            I'm an Artist
            <ArrowRight size={16} />
          </Link>
          <Link href="/marketplace" className="btn-pill flex items-center gap-2">
            I'm an Investor
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-sr-text-secondary">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-sr-green" />
            <span>Real Spotify Data</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-sr-green" />
            <span>AI Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-sr-green" />
            <span>On-Chain Transparent</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 16.4 How It Works (components/landing/HowItWorks.tsx)
```typescript
import { Upload, Coins, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: <Upload size={32} />,
    title: "Artist Tokenizes Song",
    description: "Connect Spotify, select a song, define token structure. AI verifies data integrity.",
  },
  {
    icon: <Coins size={32} />,
    title: "Investors Buy Tokens",
    description: "Browse marketplace, buy tokens via x402. Own a % of the song's royalties.",
  },
  {
    icon: <TrendingUp size={32} />,
    title: "Royalties Distributed Weekly",
    description: "AI pulls real Spotify data, calculates royalties, distributes automatically on-chain.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-sr-text">How It Works</h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="card-sr text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sr-green/20 text-sr-green">
                {step.icon}
              </div>
              <div className="mb-2 text-sm font-bold text-sr-green">
                Step {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-bold text-sr-text">{step.title}</h3>
              <p className="text-sm text-sr-text-secondary">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 16.5 Live Stats (components/landing/LiveStats.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { Music, DollarSign, Users, BarChart3 } from "lucide-react";

export function LiveStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data.data));
  }, []);

  if (!stats) return null;

  const items = [
    { icon: <Music size={24} />, label: "Songs Tokenized", value: stats.totalSongs },
    { icon: <DollarSign size={24} />, label: "CSPR Distributed", value: stats.totalRoyaltyDistributed?.toFixed(2) || "0" },
    { icon: <Users size={24} />, label: "Investors", value: stats.totalInvestors },
    { icon: <BarChart3 size={24} />, label: "Distributions", value: stats.totalDistributions },
  ];

  return (
    <section className="bg-sr-surface px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-sr-text">Live Platform Stats</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-2 text-sr-green">{item.icon}</div>
              <p className="text-3xl font-bold text-sr-text">{item.value?.toLocaleString()}</p>
              <p className="text-sm text-sr-text-secondary">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 16.6 Featured Songs (components/landing/FeaturedSongs.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SongCard } from "@/components/shared/SongCard";

export function FeaturedSongs() {
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/songs?sortBy=popular&limit=3")
      .then((res) => res.json())
      .then((data) => setSongs(data.data.songs));
  }, []);

  if (songs.length === 0) return null;

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-sr-text">Featured Songs</h2>
          <Link href="/marketplace" className="flex items-center gap-1 text-sm font-bold text-sr-text-secondary hover:text-sr-text">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} viewMode="grid" />
          ))}
        </div>
      </div>
    </section>
  );
}
```

## Deliverables
- [ ] GET /api/stats endpoint
- [ ] Landing page with all sections
- [ ] HeroSection with CTAs
- [ ] HowItWorks 3-step guide
- [ ] LiveStats with real data
- [ ] FeaturedSongs carousel
- [ ] WhyCasper section
- [ ] Footer

## Dependencies
- Plan 1 (Architecture)
- Plan 7 (Backend API)
- Plan 9 (Song Data)

## Notes
- **Real Data**: Live stats dari database
- **Responsive**: Mobile-first design
- **CTA**: Clear paths for artists and investors
- **Design**: Spotify-inspired dark theme
