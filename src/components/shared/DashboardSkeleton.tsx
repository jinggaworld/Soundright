export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Title skeleton */}
        <div className="mb-8 h-9 w-64 animate-pulse rounded bg-sr-mid" />

        {/* Stats grid skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

        {/* Countdown skeleton */}
        <div className="mb-8">
          <div className="card-sr flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-sr-mid" />
            <div className="flex-1">
              <div className="mb-1 h-3 w-32 animate-pulse rounded bg-sr-mid" />
              <div className="h-5 w-24 animate-pulse rounded bg-sr-mid" />
            </div>
          </div>
        </div>

        {/* Songs section skeleton */}
        <div className="mb-4 h-6 w-28 animate-pulse rounded bg-sr-mid" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-sr">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 animate-pulse rounded bg-sr-mid" />
                <div className="flex-1">
                  <div className="mb-1 h-4 w-40 animate-pulse rounded bg-sr-mid" />
                  <div className="h-3 w-32 animate-pulse rounded bg-sr-mid" />
                </div>
                <div className="text-right">
                  <div className="mb-1 ml-auto h-4 w-14 animate-pulse rounded bg-sr-mid" />
                  <div className="ml-auto h-3 w-20 animate-pulse rounded bg-sr-mid" />
                </div>
              </div>
              <div className="mt-4 h-[120px] animate-pulse rounded bg-sr-mid" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
