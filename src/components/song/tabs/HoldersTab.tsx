"use client";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  song: any;
}

export function HoldersTab({ song }: Props) {
  const holdings = song.holdings ?? [];

  // Group holdings by investor address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const holderMap = new Map<string, { amount: number; cost: number; firstPurchase: Date }>();
  for (const h of holdings) {
    const existing = holderMap.get(h.investorAddress);
    if (existing) {
      existing.amount += h.tokenAmount;
      existing.cost += Number(h.purchasePriceCspr);
      if (new Date(h.purchasedAt) < existing.firstPurchase) {
        existing.firstPurchase = new Date(h.purchasedAt);
      }
    } else {
      holderMap.set(h.investorAddress, {
        amount: h.tokenAmount,
        cost: Number(h.purchasePriceCspr),
        firstPurchase: new Date(h.purchasedAt),
      });
    }
  }

  const holders = Array.from(holderMap.entries())
    .map(([address, data]) => ({ address, ...data }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sr-text">
          Token Holders ({holders.length})
        </h3>
        <p className="text-sm text-sr-text-secondary">
          {song.totalTokensSold?.toLocaleString() ?? 0} tokens sold
        </p>
      </div>

      {holders.length === 0 ? (
        <div className="rounded-lg bg-sr-mid/50 py-12 text-center">
          <p className="text-sr-text-secondary">
            No holders yet. Be the first to invest!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {holders.map((holder, i) => (
            <div
              key={holder.address}
              className="flex items-center gap-4 rounded-lg bg-sr-mid/50 p-3"
            >
              <span className="w-8 text-center text-sm font-bold text-sr-text-secondary">
                #{i + 1}
              </span>
              <div className="flex-1">
                <p className="font-mono text-sm text-sr-text">
                  {holder.address.slice(0, 8)}...{holder.address.slice(-4)}
                </p>
                <p className="text-xs text-sr-text-secondary">
                  First purchase: {holder.firstPurchase.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-sr-text">
                  {holder.amount.toLocaleString()} tokens
                </p>
                <p className="text-xs text-sr-text-secondary">
                  {holder.cost} CSPR
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
