"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { OverviewTab } from "@/components/song/tabs/OverviewTab";
import { AnalyticsTab } from "@/components/song/tabs/AnalyticsTab";
import { HoldersTab } from "@/components/song/tabs/HoldersTab";
import { ComplianceTab } from "@/components/song/tabs/ComplianceTab";
import { ContractTab } from "@/components/song/tabs/ContractTab";

const TABS = ["Overview", "Analytics", "Holders", "Compliance", "Contract"] as const;
type TabName = (typeof TABS)[number];

export default function SongDetailPage() {
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>("Overview");

  useEffect(() => {
    async function fetchSong() {
      try {
        const res = await fetch(`/api/songs/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setSong(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch song:", err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchSong();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sr-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sr-green border-t-transparent" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sr-black">
        <p className="text-sr-text-secondary">Song not found</p>
      </div>
    );
  }

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
            <p className="mt-2 text-lg text-sr-text-secondary">
              {song.artist?.name}
            </p>
            <p className="mt-1 text-sm text-sr-text-secondary">
              {song.currentPlayCount?.toLocaleString() ?? "—"} plays ·{" "}
              {song.totalHolders ?? 0} holders
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-4 border-b border-sr-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-4 pt-4 text-sm font-bold transition-colors ${
                activeTab === tab
                  ? "border-sr-green text-sr-text"
                  : "border-transparent text-sr-text-secondary hover:text-sr-text"
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
