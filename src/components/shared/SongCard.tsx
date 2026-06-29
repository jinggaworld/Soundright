import Link from "next/link";
import { Play, TrendingUp } from "lucide-react";

interface SongData {
  id: string;
  title: string;
  spotifyTrackId: string | null;
  pricePerTokenCspr: number | null;
  tokensForSale: number | null;
  totalSupply: number | null;
  royaltyRatePerMille: number | null;
  currentPlayCount: number | null;
  weeklyPlays: number | null;
  artist?: {
    id: string;
    name: string;
    walletAddress: string;
  };
}

interface Props {
  song: SongData;
  viewMode: "grid" | "list";
}

export function SongCard({ song, viewMode }: Props) {
  const totalSold =
    song.totalSupply && song.tokensForSale
      ? song.totalSupply - song.tokensForSale
      : 0;
  const saleProgress =
    song.totalSupply && song.totalSupply > 0
      ? (totalSold / song.totalSupply) * 100
      : 0;
  const yieldPct = song.royaltyRatePerMille
    ? (song.royaltyRatePerMille * 0.1).toFixed(1)
    : "0.0";

  if (viewMode === "list") {
    return (
      <Link href={`/song/${song.id}`} className="card-sr flex items-center gap-4">
        <img
          src={song.spotifyTrackId
            ? `https://i.scdn.co/image/ab67616d00001e02`
            : "/default-album.png"}
          alt={song.title}
          className="h-16 w-16 rounded-md object-cover"
        />
        <div className="flex-1">
          <h3 className="font-bold text-sr-text">{song.title}</h3>
          <p className="text-sm text-sr-text-secondary">
            {song.artist?.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-sr-green">
            {song.pricePerTokenCspr ?? "—"} CSPR
          </p>
          <p className="text-xs text-sr-text-secondary">
            {song.weeklyPlays?.toLocaleString() ?? "—"} plays/wk
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/song/${song.id}`} className="card-sr group">
      <div className="relative mb-3">
        <img
          src={song.spotifyTrackId
            ? `https://i.scdn.co/image/ab67616d00001e02`
            : "/default-album.png"}
          alt={song.title}
          className="aspect-square w-full rounded-md object-cover"
        />
        <button className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-sr-green text-black opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 translate-y-2">
          <Play size={20} fill="currentColor" />
        </button>
      </div>
      <h3 className="truncate font-bold text-sr-text">{song.title}</h3>
      <p className="truncate text-sm text-sr-text-secondary">
        {song.artist?.name}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-sr-text-secondary">
          {song.currentPlayCount?.toLocaleString() ?? "—"} plays
        </span>
        <span className="flex items-center gap-1 text-sr-green">
          <TrendingUp size={12} />
          {yieldPct}% yield
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-sr-mid">
        <div
          className="h-full bg-sr-green"
          style={{ width: `${Math.min(saleProgress, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-sr-text-secondary">
        {song.tokensForSale?.toLocaleString() ?? "—"} tokens · {song.pricePerTokenCspr ?? "—"} CSPR
      </p>
    </Link>
  );
}
