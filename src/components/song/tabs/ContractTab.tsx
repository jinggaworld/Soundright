"use client";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  song: any;
}

export function ContractTab({ song }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium text-sr-text">Smart Contract Details</h3>

      {/* Contract Addresses */}
      <div className="space-y-3">
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="mb-1 text-sm text-sr-text-secondary">Royalty Token Contract</p>
          <code className="font-mono text-xs text-sr-text">
            {song.tokenContractAddress || "Not deployed yet"}
          </code>
        </div>
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="mb-1 text-sm text-sr-text-secondary">Oracle Contract</p>
          <code className="font-mono text-xs text-sr-text">
            {song.oracleContractAddress || "Not deployed yet"}
          </code>
        </div>
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="mb-1 text-sm text-sr-text-secondary">Distributor Contract</p>
          <code className="font-mono text-xs text-sr-text">
            {song.distributorContractAddress || "Not deployed yet"}
          </code>
        </div>
      </div>

      {/* Token Parameters */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <h4 className="mb-3 text-sm font-medium text-sr-text">Token Parameters</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-sr-text-secondary">Total Supply</p>
            <p className="font-medium text-sr-text">
              {song.totalSupply?.toLocaleString() ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sr-text-secondary">Price per Token</p>
            <p className="font-medium text-sr-text">
              {song.pricePerTokenCspr ?? "—"} CSPR
            </p>
          </div>
          <div>
            <p className="text-sr-text-secondary">Royalty Rate</p>
            <p className="font-medium text-sr-text">
              {song.royaltyRatePerMille ?? "—"}‰
            </p>
          </div>
          <div>
            <p className="text-sr-text-secondary">Distribution</p>
            <p className="font-medium capitalize text-sr-text">
              {song.distributionSchedule ?? "weekly"}
            </p>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <h4 className="mb-2 text-sm font-medium text-sr-text">Network</h4>
        <p className="text-sm text-sr-text-secondary">
          Casper Testnet — All contracts are deployed on the Casper testnet for
          demonstration purposes.
        </p>
      </div>

      {/* Artist Wallet */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <h4 className="mb-2 text-sm font-medium text-sr-text">Artist Wallet</h4>
        <code className="break-all font-mono text-xs text-sr-text">
          {song.artist?.walletAddress ?? "—"}
        </code>
      </div>
    </div>
  );
}
