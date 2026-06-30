import { clsx } from "clsx";

/**
 * Skeleton - Animated placeholder for loading states.
 *
 * @example
 * <Skeleton className="h-4 w-3/4" />
 *
 * @example
 * <Skeleton variant="circular" className="h-10 w-10" />
 *
 * @example
 * <Skeleton variant="rectangular" className="aspect-square w-full" />
 */
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-sr-mid",
        {
          "h-4 rounded": variant === "text",
          "rounded-full": variant === "circular",
          "rounded-lg": variant === "rectangular",
        },
        className
      )}
    />
  );
}

/** Skeleton for SongCard loading state */
export function SongCardSkeleton() {
  return (
    <div className="card-sr">
      <Skeleton variant="rectangular" className="mb-3 aspect-square w-full" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-3 h-4 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

/** Skeleton for dashboard stat cards */
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-sr">
          <Skeleton className="mb-2 h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for table rows */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-sr-mid px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
