"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { plays: number; date: string }[];
  height?: number;
}

export function PlayCountChart({ data, height = 200 }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="date"
          tick={{ fill: "#b3b3b3", fontSize: 12 }}
          axisLine={{ stroke: "#4d4d4d" }}
        />
        <YAxis
          tick={{ fill: "#b3b3b3", fontSize: 12 }}
          axisLine={{ stroke: "#4d4d4d" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#181818",
            border: "1px solid #4d4d4d",
            borderRadius: "8px",
            color: "#ffffff",
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
  );
}
