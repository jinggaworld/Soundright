# Plan 9: Marketplace & Song Detail Pages

## Overview
Implementasi halaman marketplace untuk browse semua lagu yang sudah tokenized, dan halaman detail lagu dengan tab Overview, Analytics, Holders, Compliance, dan Contract.

## Goals
- Marketplace page dengan grid/list view
- Search & filter functionality
- Song detail page dengan 5 tabs
- Real Spotify data display
- Charts dan analytics
- Token purchase widget

## Tasks

### 9.1 Backend Endpoints

#### GET /api/songs
```typescript
// List all tokenized songs with filters
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const status = searchParams.get("status") || "active";

  const where: any = { status };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { artist: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const orderBy: any = (() => {
    switch (sortBy) {
      case "yield": return { royaltyRatePerMille: "desc" };
      case "popular": return { currentPlayCount: "desc" };
      case "newest": return { createdAt: "desc" };
      case "price_asc": return { pricePerTokenCspr: "asc" };
      default: return { createdAt: "desc" };
    }
  })();

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      include: { artist: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.song.count({ where }),
  ]);

  return successResponse({
    songs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

#### GET /api/songs/[id]
```typescript
// Get song detail with all related data
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const song = await prisma.song.findUnique({
    where: { id: params.id },
    include: {
      artist: true,
      holdings: true,
      distributions: { orderBy: { distributedAt: "desc" }, take: 10 },
      playCountHistory: { orderBy: { recordedAt: "desc" }, take: 12 },
    },
  });

  if (!song) return notFoundResponse("Song");

  // Calculate metrics
  const totalHolders = new Set(song.holdings.map((h) => h.investorAddress)).size;
  const totalTokensSold = song.totalSupply! - (song.tokensForSale || 0);
  const saleProgress = (totalTokensSold / song.totalSupply!) * 100;

  // Get last 12 weeks of play counts for chart
  const weeklyPlays = song.playCountHistory.map((p) => ({
    plays: Number(p.playCount),
    source: p.source,
    date: p.recordedAt,
  }));

  return successResponse({
    ...song,
    totalHolders,
    totalTokensSold,
    saleProgress,
    weeklyPlays,
    currentPlayCount: Number(song.currentPlayCount),
  });
}
```

### 9.2 Marketplace Page (app/marketplace/page.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { Search, Grid, List, ChevronDown } from "lucide-react";

export default function MarketplacePage() {
  const [songs, setSongs] = useState([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSongs();
  }, [search, sortBy]);

  async function fetchSongs() {
    setLoading(true);
    const res = await fetch(
      `/api/songs?search=${search}&sortBy=${sortBy}&status=active`
    );
    const data = await res.json();
    setSongs(data.data.songs);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-sr-black">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <h1 className="mb-8 text-3xl font-bold text-sr-text">Marketplace</h1>

        {/* Search & Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sr-text-secondary" />
            <input
              type="text"
              placeholder="Search songs or artists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-sr pl-12"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-pill bg-sr-mid px-4 py-3 text-sr-text"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="yield">Highest Yield</option>
            <option value="price_asc">Lowest Price</option>
          </select>

          <div className="flex rounded-full bg-sr-mid">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 ${viewMode === "grid" ? "text-sr-green" : "text-sr-text-secondary"}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 ${viewMode === "list" ? "text-sr-green" : "text-sr-text-secondary"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Song Grid */}
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "flex flex-col gap-4"
        }>
          {songs.map((song: any) => (
            <SongCard key={song.id} song={song} viewMode={viewMode} />
          ))}
        </div>
      </div>
    </main>
  );
}
```

### 9.3 Song Card Component (components/shared/SongCard.tsx)
```typescript
import Link from "next/link";
import { Play, TrendingUp } from "lucide-react";

interface Props {
  song: any;
  viewMode: "grid" | "list";
}

export function SongCard({ song, viewMode }: Props) {
  const saleProgress = song.totalSupply
    ? ((song.totalSupply - song.tokensForSale) / song.totalSupply) * 100
    : 0;

  if (viewMode === "list") {
    return (
      <Link href={`/song/${song.id}`} className="card-sr flex items-center gap-4">
        <img
          src={song.albumArt || "/default-album.png"}
          alt={song.title}
          className="h-16 w-16 rounded-md object-cover"
        />
        <div className="flex-1">
          <h3 className="font-bold text-sr-text">{song.title}</h3>
          <p className="text-sm text-sr-text-secondary">{song.artist?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-sr-green">
            {song.pricePerTokenCspr} CSPR
          </p>
          <p className="text-xs text-sr-text-secondary">
            {song.weeklyPlays?.toLocaleString()} plays/wk
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/song/${song.id}`} className="card-sr group">
      <div className="relative mb-3">
        <img
          src={song.albumArt || "/default-album.png"}
          alt={song.title}
          className="aspect-square w-full rounded-md object-cover"
        />
        <button className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-sr-green text-black opacity-0 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
          <Play size={20} fill="currentColor" />
        </button>
      </div>
      <h3 className="truncate font-bold text-sr-text">{song.title}</h3>
      <p className="truncate text-sm text-sr-text-secondary">{song.artist?.name}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-sr-text-secondary">
          {song.currentPlayCount?.toLocaleString()} plays
        </span>
        <span className="flex items-center gap-1 text-sr-green">
          <TrendingUp size={12} />
          {((song.royaltyRatePerMille || 0) * 0.001 * 100).toFixed(1)}% yield
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-sr-mid">
        <div
          className="h-full bg-sr-green"
          style={{ width: `${saleProgress}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-sr-text-secondary">
        {song.tokensForSale} tokens available · {song.pricePerTokenCspr} CSPR
      </p>
    </Link>
  );
}
```

### 9.4 Song Detail Page (app/song/[id]/page.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { OverviewTab } from "@/components/song/tabs/OverviewTab";
import { AnalyticsTab } from "@/components/song/tabs/AnalyticsTab";
import { HoldersTab } from "@/components/song/tabs/HoldersTab";
import { ComplianceTab } from "@/components/song/tabs/ComplianceTab";
import { ContractTab } from "@/components/song/tabs/ContractTab";

const TABS = ["Overview", "Analytics", "Holders", "Compliance", "Contract"];

export default function SongDetailPage() {
  const params = useParams();
  const [song, setSong] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    fetchSong();
  }, [params.id]);

  async function fetchSong() {
    const res = await fetch(`/api/songs/${params.id}`);
    const data = await res.json();
    setSong(data.data);
  }

  if (!song) return <div className="min-h-screen bg-sr-black" />;

  return (
    <main className="min-h-screen bg-sr-black">
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-b from-sr-surface to-sr-black">
        <div className="mx-auto flex items-end gap-6 px-4 pb-6">
          <img
            src={song.albumArt || "/default-album.png"}
            alt={song.title}
            className="h-48 w-48 rounded-md shadow-heavy"
          />
          <div>
            <p className="text-sm text-sr-text-secondary">Song</p>
            <h1 className="text-5xl font-bold text-sr-text">{song.title}</h1>
            <p className="mt-2 text-lg text-sr-text-secondary">{song.artist?.name}</p>
            <p className="mt-1 text-sm text-sr-text-secondary">
              {song.currentPlayCount?.toLocaleString()} plays · {song.totalHolders} holders
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-4 border-b border-sr-border py-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold transition-colors ${
                activeTab === tab
                  ? "text-sr-text border-b-2 border-sr-green pb-4 -mb-4"
                  : "text-sr-text-secondary hover:text-sr-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === "Overview" && <OverviewTab song={song} />}
          {activeTab === "Analytics" && <AnalyticsTab song={song} />}
          {activeTab === "Holders" && <HoldersTab song={song} />}
          {activeTab === "Compliance" && <ComplianceTab song={song} />}
          {activeTab === "Contract" && <ContractTab song={song} />}
        </div>
      </div>
    </main>
  );
}
```

## Deliverables
- [ ] GET /api/songs (list with filters)
- [ ] GET /api/songs/[id] (detail with all relations)
- [ ] Marketplace page with grid/list view
- [ ] SongCard component
- [ ] Song detail page with 5 tabs
- [ ] Search & filter functionality
- [ ] Real Spotify data display

## Dependencies
- Plan 1 (Architecture)
- Plan 3 (Spotify/Last.fm)
- Plan 7 (Backend API)

## Notes
- **Real Data**: Semua data dari Spotify API, bukan fake
- **Charts**: Recharts untuk visualisasi play count
- **Responsive**: Grid responsive dari 1-4 columns
- **Hover States**: Play button muncul saat hover
