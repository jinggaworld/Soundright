import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  yield: number;
  trend?: "up" | "down" | "stable";
}

export function YieldBadge({ yield: yieldValue, trend }: Props) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color =
    trend === "up"
      ? "text-sr-green"
      : trend === "down"
        ? "text-sr-negative"
        : "text-sr-text-secondary";

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-bold ${color}`}>
      <TrendIcon size={14} />
      {yieldValue.toFixed(1)}%
    </span>
  );
}
