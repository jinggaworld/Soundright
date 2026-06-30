import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton for admin panel loading state */
export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-sr-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="mb-8 h-9 w-32" />
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
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
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="card-sr">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-sr-mid px-4 py-3 last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
