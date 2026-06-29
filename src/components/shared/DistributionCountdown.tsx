import { Clock } from "lucide-react";

interface Props {
  days: number;
}

export function DistributionCountdown({ days }: Props) {
  return (
    <div className="card-sr flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sr-green/20">
        <Clock size={24} className="text-sr-green" />
      </div>
      <div>
        <p className="text-sm text-sr-text-secondary">
          Next royalty distribution
        </p>
        <p className="text-xl font-bold text-sr-text">
          {days === 0
            ? "Today!"
            : days === 1
              ? "Tomorrow"
              : `In ${days} days`}
        </p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-xs text-sr-text-secondary">
          Every Monday, 00:00 UTC
        </p>
      </div>
    </div>
  );
}
