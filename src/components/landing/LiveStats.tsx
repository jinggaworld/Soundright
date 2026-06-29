"use client";

import { useState, useEffect } from "react";
import { Music, DollarSign, Users, BarChart3 } from "lucide-react";

interface Stats {
  totalSongs: number;
  totalRoyaltyDistributed: number;
  totalInvestors: number;
  totalDistributions: number;
}

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const items = [
    {
      icon: <Music size={24} />,
      label: "Songs Tokenized",
      value: stats.totalSongs,
    },
    {
      icon: <DollarSign size={24} />,
      label: "CSPR Distributed",
      value: stats.totalRoyaltyDistributed.toFixed(2),
    },
    {
      icon: <Users size={24} />,
      label: "Investors",
      value: stats.totalInvestors,
    },
    {
      icon: <BarChart3 size={24} />,
      label: "Distributions",
      value: stats.totalDistributions,
    },
  ];

  return (
    <section className="bg-sr-surface px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-sr-text">
          Live Platform Stats
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-2 text-sr-green">{item.icon}</div>
              <p className="text-3xl font-bold text-sr-text">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </p>
              <p className="text-sm text-sr-text-secondary">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
