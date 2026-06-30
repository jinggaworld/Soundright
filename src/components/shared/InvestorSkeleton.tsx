import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton for investor dashboard loading state */
export function InvestorSkeleton() {
  return (
    <div className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="mb-8 h-9 w-48" />
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-sr">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-5 w-5" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mb-4 h-6 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card-sr mb-4">
            <div className="flex items-start gap-4">
              <Skeleton variant="rectangular" className="h-20 w-20 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-40" />
                <Skeleton className="mb-2 h-3 w-28" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
