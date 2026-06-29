"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Music,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Shield,
  Check,
  Flag,
  Trash2,
  Loader2,
  Activity,
  Database,
  Clock,
} from "lucide-react";

interface AdminStats {
  totalArtists: number;
  totalSongs: number;
  activeSongs: number;
  totalHolders: number;
  totalDistributions: number;
  totalRoyaltyDistributed: number;
}

interface Song {
  id: string;
  title: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  artist: { name: string } | null;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [apiLatency, setApiLatency] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchSongs();
  }, []);

  async function fetchStats() {
    try {
      const start = Date.now();
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "" },
      });
      setApiLatency(`${Date.now() - start}ms`);
      const result = await res.json();
      if (result.success) setStats(result.data);
    } catch {
      setApiLatency("error");
    }
  }

  async function handleSongAction(songId: string, action: "approve" | "flag" | "remove") {
    if (action === "remove" && !confirm("Are you sure you want to remove this song?")) return;
    setActionLoading(songId + action);
    try {
      const res = await fetch(`/api/admin/songs/${songId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
        },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (result.success) {
        if (action === "remove") {
          setSongs((prev) => prev.filter((s) => s.id !== songId));
        } else {
          setSongs((prev) =>
            prev.map((s) =>
              s.id === songId
                ? { ...s, status: result.data.status, isVerified: result.data.isVerified }
                : s
            )
          );
        }
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function fetchSongs() {
    try {
      const res = await fetch("/api/admin/songs", {
        headers: { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "" },
      });
      const result = await res.json();
      if (result.success) setSongs(result.data.songs);
    } catch {
      // Songs fetch failed silently
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sr-black px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-9 w-32 animate-pulse rounded bg-sr-mid" />
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
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
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <Shield size={28} className="text-sr-green" />
          <h1 className="text-3xl font-bold text-sr-text">Admin Panel</h1>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<Users size={20} />}
            label="Total Artists"
            value={stats?.totalArtists ?? 0}
          />
          <StatCard
            icon={<Music size={20} />}
            label="Active Songs"
            value={stats?.activeSongs ?? 0}
          />
          <StatCard
            icon={<Users size={20} />}
            label="Total Holders"
            value={stats?.totalHolders ?? 0}
          />
          <StatCard
            icon={<BarChart3 size={20} />}
            label="Distributions"
            value={stats?.totalDistributions ?? 0}
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Distributed"
            value={`${(stats?.totalRoyaltyDistributed ?? 0).toFixed(2)} CSPR`}
            color="text-sr-green"
          />
        </div>

        {/* System Health */}
        <h2 className="mb-4 text-xl font-bold text-sr-text">System Health</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card-sr">
            <div className="flex items-center gap-3">
              <Database size={20} className={stats ? "text-sr-green" : "text-red-400"} />
              <div>
                <p className="text-sm text-sr-text-secondary">Database</p>
                <p className={`font-bold ${stats ? "text-sr-green" : "text-red-400"}`}>
                  {stats ? "healthy" : "checking..."}
                </p>
              </div>
            </div>
          </div>
          <div className="card-sr">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-sr-green" />
              <div>
                <p className="text-sm text-sr-text-secondary">API Latency</p>
                <p className="font-bold text-sr-text">
                  {apiLatency ?? "..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Songs Management */}
        <h2 className="mb-4 text-xl font-bold text-sr-text">Songs Management</h2>
        <div className="card-sr overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sr-border text-left text-sm text-sr-text-secondary">
                <th className="pb-3">Song</th>
                <th className="pb-3">Artist</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Verified</th>
                <th className="pb-3">Created</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <tr key={song.id} className="border-b border-sr-border/50">
                  <td className="py-3 font-bold text-sr-text">{song.title}</td>
                  <td className="py-3 text-sr-text-secondary">
                    {song.artist?.name ?? "—"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        song.status === "active"
                          ? "bg-sr-green/20 text-sr-green"
                          : song.status === "pending"
                            ? "bg-sr-warning/20 text-sr-warning"
                            : "bg-sr-mid text-sr-text-secondary"
                      }`}
                    >
                      {song.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {song.isVerified ? (
                      <CheckCircle size={16} className="text-sr-green" />
                    ) : (
                      <AlertTriangle size={16} className="text-sr-warning" />
                    )}
                  </td>
                  <td className="py-3 text-sm text-sr-text-secondary">
                    {new Date(song.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      {song.status !== "active" && (
                        <button
                          onClick={() => handleSongAction(song.id, "approve")}
                          disabled={!!actionLoading}
                          className="rounded p-1 text-sr-green hover:bg-sr-green/10 disabled:opacity-50"
                          title="Approve"
                        >
                          {actionLoading === song.id + "approve" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                      )}
                      {song.status !== "flagged" && (
                        <button
                          onClick={() => handleSongAction(song.id, "flag")}
                          disabled={!!actionLoading}
                          className="rounded p-1 text-sr-warning hover:bg-sr-warning/10 disabled:opacity-50"
                          title="Flag"
                        >
                          {actionLoading === song.id + "flag" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Flag size={14} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleSongAction(song.id, "remove")}
                        disabled={!!actionLoading}
                        className="rounded p-1 text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                        title="Remove"
                      >
                        {actionLoading === song.id + "remove" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {songs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sr-text-secondary"
                  >
                    No songs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color = "text-sr-text",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="card-sr">
      <div className="flex items-center gap-3">
        <div className="text-sr-text-secondary">{icon}</div>
        <div>
          <p className="text-sm text-sr-text-secondary">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
