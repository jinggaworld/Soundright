"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  song: any;
}

export function AnalyticsTab({ song }: Props) {
  const playData = (song.weeklyPlays ?? [])
    .slice()
    .reverse()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any, i: number) => ({
      week: `W${i + 1}`,
      plays: p.plays,
      source: p.source,
    }));

  const distData = (song.distributionHistory ?? [])
    .slice()
    .reverse()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((d: any) => ({
      period: new Date(d.periodStart).toLocaleDateString("en-US", { month: "short" }),
      royalty: d.totalRoyaltyCspr,
    }));

  return (
    <div className="space-y-6">
      {/* Play Count Chart */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <h3 className="mb-4 font-medium text-sr-text">Play Count History</h3>
        {playData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={playData}>
              <XAxis dataKey="week" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="plays"
                stroke="#1ed760"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-sr-text-secondary">
            No play count data yet
          </p>
        )}
      </div>

      {/* Distribution History */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <h3 className="mb-4 font-medium text-sr-text">Distribution History</h3>
        {distData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distData}>
              <XAxis dataKey="period" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`${value} CSPR`, "Royalty"]}
              />
              <Bar dataKey="royalty" fill="#1ed760" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-sr-text-secondary">
            No distribution history yet
          </p>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="text-sm text-sr-text-secondary">Weekly Plays</p>
          <p className="mt-1 text-xl font-bold text-sr-text">
            {song.weeklyPlays?.toLocaleString() ?? "—"}
          </p>
        </div>
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="text-sm text-sr-text-secondary">Total Distributions</p>
          <p className="mt-1 text-xl font-bold text-sr-text">
            {song.distributionHistory?.length ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="text-sm text-sr-text-secondary">Schedule</p>
          <p className="mt-1 text-xl font-bold capitalize text-sr-text">
            {song.distributionSchedule ?? "weekly"}
          </p>
        </div>
      </div>
    </div>
  );
}
