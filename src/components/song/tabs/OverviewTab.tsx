"use client";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  song: any;
}

export function OverviewTab({ song }: Props) {
  const yieldPct = song.royaltyRatePerMille
    ? (song.royaltyRatePerMille * 0.1).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="text-sm text-sr-text-secondary">Current Price</p>
          <p className="mt-1 text-xl font-bold text-sr-green">
            {song.pricePerTokenCspr ?? "—"} CSPR
          </p>
        </div>
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="text-sm text-sr-text-secondary">Yield Rate</p>
          <p className="mt-1 text-xl font-bold text-sr-text">
            {yieldPct}%
          </p>
        </div>
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="text-sm text-sr-text-secondary">Total Supply</p>
          <p className="mt-1 text-xl font-bold text-sr-text">
            {song.totalSupply?.toLocaleString() ?? "—"}
          </p>
        </div>
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="text-sm text-sr-text-secondary">Holders</p>
          <p className="mt-1 text-xl font-bold text-sr-text">
            {song.totalHolders ?? 0}
          </p>
        </div>
      </div>

      {/* Token Sale Progress */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-sr-text">Token Sale Progress</p>
          <p className="text-sm text-sr-text-secondary">
            {song.saleProgress?.toFixed(1) ?? 0}% sold
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-sr-mid">
          <div
            className="h-full rounded-full bg-sr-green transition-all"
            style={{ width: `${Math.min(song.saleProgress ?? 0, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-sr-text-secondary">
          <span>{song.totalTokensSold?.toLocaleString() ?? 0} sold</span>
          <span>{song.tokensForSale?.toLocaleString() ?? 0} remaining</span>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <h3 className="mb-2 font-medium text-sr-text">About this Song</h3>
        <p className="text-sm text-sr-text-secondary">
          Tokenized royalties from &quot;{song.title}&quot; by {song.artist?.name}.
          Royalty distributions are made {song.distributionSchedule ?? "weekly"} based on
          verified play count data from Spotify and Last.fm.
        </p>
      </div>

      {/* Purchase Widget Placeholder */}
      <div className="rounded-lg border border-sr-border p-4">
        <h3 className="mb-3 font-medium text-sr-text">Buy Tokens</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={song.tokensForSale ?? 0}
            defaultValue={1}
            className="input-sr w-24"
          />
          <span className="text-sm text-sr-text-secondary">
            × {song.pricePerTokenCspr ?? 0} CSPR
          </span>
          <button className="btn-pill ml-auto bg-sr-green text-black hover:bg-sr-green/80">
            Purchase
          </button>
        </div>
        <p className="mt-2 text-xs text-sr-text-secondary">
          Connect your CSPR.click wallet to purchase tokens
        </p>
      </div>
    </div>
  );
}
