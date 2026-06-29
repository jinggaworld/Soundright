# Plan 14: Admin Panel

## Overview
Implementasi admin panel untuk content moderation, compliance monitoring, platform statistics, dan system management.

## Goals
- Admin dashboard with platform stats
- Song management (approve, flag, remove)
- AI compliance review queue
- User management
- System health monitoring

## Tasks

### 14.1 Backend Endpoints

#### GET /api/admin/stats
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  // TODO: Verify admin role
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) return unauthorizedResponse();

  const [
    totalArtists,
    totalSongs,
    activeSongs,
    totalHolders,
    totalDistributions,
    totalRoyaltyDistributed,
  ] = await Promise.all([
    prisma.artist.count(),
    prisma.song.count(),
    prisma.song.count({ where: { status: "active" } }),
    prisma.tokenHolding.findMany({
      select: { investorAddress: true },
      distinct: ["investorAddress"],
    }),
    prisma.distribution.count(),
    prisma.distribution.aggregate({
      _sum: { totalRoyaltyCspr: true },
    }),
  ]);

  return successResponse({
    totalArtists,
    totalSongs,
    activeSongs,
    totalHolders: totalHolders.length,
    totalDistributions,
    totalRoyaltyDistributed: Number(totalRoyaltyDistributed._sum.totalRoyaltyCspr || 0),
  });
}
```

#### GET /api/admin/songs
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = status === "all" ? {} : { status };

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      include: { artist: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.song.count({ where }),
  ]);

  return successResponse({
    songs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
```

### 14.2 Admin Dashboard Page (app/admin/page.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Music, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchSongs();
  }, []);

  async function fetchStats() {
    const res = await fetch("/api/admin/stats", {
      headers: { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "" },
    });
    const data = await res.json();
    setStats(data.data);
  }

  async function fetchSongs() {
    const res = await fetch("/api/admin/songs", {
      headers: { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "" },
    });
    const data = await res.json();
    setSongs(data.data.songs);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-sr-black" />;

  return (
    <main className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-sr-text">Admin Panel</h1>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={<Users size={20} />} label="Total Artists" value={stats.totalArtists} />
          <StatCard icon={<Music size={20} />} label="Active Songs" value={stats.activeSongs} />
          <StatCard icon={<Users size={20} />} label="Total Holders" value={stats.totalHolders} />
          <StatCard icon={<BarChart3 size={20} />} label="Distributions" value={stats.totalDistributions} />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Distributed"
            value={`${stats.totalRoyaltyDistributed.toFixed(2)} CSPR`}
            color="text-sr-green"
          />
        </div>

        {/* Songs Management */}
        <h2 className="mb-4 text-xl font-bold text-sr-text">Songs Management</h2>
        <div className="card-sr">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sr-border text-left text-sm text-sr-text-secondary">
                <th className="pb-3">Song</th>
                <th className="pb-3">Artist</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Verified</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <tr key={song.id} className="border-b border-sr-border">
                  <td className="py-3 font-bold text-sr-text">{song.title}</td>
                  <td className="py-3 text-sr-text-secondary">{song.artist?.name}</td>
                  <td className="py-3">
                    <span className={`badge-sr ${
                      song.status === "active" ? "bg-sr-green/20 text-sr-green" : "bg-sr-mid text-sr-text-secondary"
                    }`}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color = "text-sr-text" }: {
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
```

## Deliverables
- [ ] GET /api/admin/stats endpoint
- [ ] GET /api/admin/songs endpoint
- [ ] Admin dashboard page
- [ ] Platform statistics cards
- [ ] Songs management table
- [ ] Status badges and verification indicators

## Dependencies
- Plan 1 (Architecture)
- Plan 7 (Backend API)
- Plan 9 (Song Detail)

## Notes
- **Security**: Admin endpoints harus di-protect dengan admin key
- **No Fake Data**: Semua data dari database
- **Moderation**: Review songs sebelum approve
- **Stats**: Real-time platform statistics
