import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Yield badge displaying percentage with trend indicator.
 *
 * @example
 * ```tsx
 * <YieldBadge yield={5.2} trend="up" />
 * <YieldBadge yield={3.1} trend="down" />
 * <YieldBadge yield={4.0} trend="stable" />
 * ```
 */
interface YieldBadgeProps {
  /** Yield percentage value */
  yield: number;
  /** Trend direction for icon and color */
  trend?: "up" | "down" | "stable";
}

export function YieldBadge({ yield: yieldValue, trend }: YieldBadgeProps) {
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
