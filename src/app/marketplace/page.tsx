"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { SongCard } from "@/components/shared/SongCard";

interface SongData {
  id: string;
  title: string;
  spotifyTrackId: string | null;
  pricePerTokenCspr: number | null;
  tokensForSale: number | null;
  totalSupply: number | null;
  royaltyRatePerMille: number | null;
  currentPlayCount: number | null;
  weeklyPlays: number | null;
  status: string;
  artist?: { id: string; name: string; walletAddress: string };
}

export default function MarketplacePage() {
  const [songs, setSongs] = useState<SongData[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        sortBy,
        status: "active",
        page: String(page),
        limit: "20",
      });
      const res = await fetch(`/api/songs?${params}`);
      const data = await res.json();
      if (data.success) {
        setSongs(data.data.songs);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch songs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, page]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  return (
    <main className="min-h-screen bg-sr-black">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-sr-text">Marketplace</h1>
          <p className="mt-2 text-sr-text-secondary">
            Discover and invest in tokenized music royalties
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sr-text-secondary"
            />
            <input
              type="text"
              placeholder="Search songs or artists..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-sr w-full pl-12"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full bg-sr-mid px-4 py-3 text-sm text-sr-text"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="yield">Highest Yield</option>
            <option value="price_asc">Lowest Price</option>
            <option value="price_desc">Highest Price</option>
          </select>

          <div className="flex rounded-full bg-sr-mid">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 transition-colors ${viewMode === "grid" ? "text-sr-green" : "text-sr-text-secondary"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 transition-colors ${viewMode === "list" ? "text-sr-green" : "text-sr-text-secondary"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sr-green border-t-transparent" />
          </div>
        )}

        {/* Empty State */}
        {!loading && songs.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-sr-text-secondary">
              No songs found. Try a different search or check back later.
            </p>
          </div>
        )}

        {/* Song Grid / List */}
        {!loading && songs.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col gap-4"
            }
          >
            {songs.map((song) => (
              <SongCard key={song.id} song={song} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-pill border border-sr-border px-4 py-2 text-sm text-sr-text-secondary disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="px-4 text-sm text-sr-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-pill border border-sr-border px-4 py-2 text-sm text-sr-text-secondary disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
