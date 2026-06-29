import Link from "next/link";
import { Sparkles, TrendingUp, ArrowUpRight } from "lucide-react";

interface Props {
  songId: string;
  title: string;
  artistName: string;
  reason: string;
  matchScore: number;
  predictedYield: number;
}

export function RecommendationCard({
  songId,
  title,
  artistName,
  reason,
  matchScore,
  predictedYield,
}: Props) {
  return (
    <div className="card-sr transition-colors hover:border-sr-green/30">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sr-green/20">
          <Sparkles size={14} className="text-sr-green" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sr-text">{title}</h4>
              <p className="text-xs text-sr-text-secondary">{artistName}</p>
            </div>
            <Link
              href={`/song/${songId}`}
              className="flex items-center gap-1 text-xs text-sr-green hover:underline"
            >
              View <ArrowUpRight size={10} />
            </Link>
          </div>
          <p className="mt-2 text-sm text-sr-text-secondary">{reason}</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-sr-text-secondary">
              Match: <span className="font-bold text-sr-text">{matchScore}%</span>
            </span>
            <span className="flex items-center gap-1 text-sr-green">
              <TrendingUp size={10} />
              Predicted yield: {predictedYield.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
