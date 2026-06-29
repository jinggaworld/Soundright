"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SongCard } from "@/components/shared/SongCard";

interface FeaturedSong {
  id: string;
  title: string;
  spotifyTrackId: string | null;
  currentPlayCount: number | null;
  weeklyPlays: number | null;
  pricePerTokenCspr: number | null;
  royaltyRatePerMille: number | null;
  tokensForSale: number | null;
  totalSupply: number | null;
  status: string;
  artist?: { id: string; name: string; walletAddress: string };
}

export function FeaturedSongs() {
  const [songs, setSongs] = useState<FeaturedSong[]>([]);

  useEffect(() => {
    fetch("/api/songs?sortBy=popular&limit=3")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSongs(data.data.songs);
      })
      .catch(() => {});
  }, []);

  if (songs.length === 0) return null;

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-sr-text">Featured Songs</h2>
          <Link
            href="/marketplace"
            className="flex items-center gap-1 text-sm font-bold text-sr-text-secondary hover:text-sr-text"
          >
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
