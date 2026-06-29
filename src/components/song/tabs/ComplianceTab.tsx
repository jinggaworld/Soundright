"use client";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  song: any;
}

export function ComplianceTab({ song }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium text-sr-text">Compliance & Verification</h3>

      {/* Verification Status */}
      <div
        className={`rounded-lg p-4 ${
          song.isVerified
            ? "bg-sr-green/10 ring-1 ring-sr-green/30"
            : "bg-yellow-500/10 ring-1 ring-yellow-500/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              song.isVerified ? "bg-sr-green/20 text-sr-green" : "bg-yellow-500/20 text-yellow-500"
            }`}
          >
            {song.isVerified ? "✓" : "⏳"}
          </div>
          <div>
            <p className="font-medium text-sr-text">
              {song.isVerified ? "Verified" : "Pending Verification"}
            </p>
            <p className="text-sm text-sr-text-secondary">
              {song.isVerified
                ? "This song has passed AI compliance verification"
                : "This song is pending AI compliance verification"}
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Hash */}
      {song.complianceHash && (
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="mb-2 text-sm font-medium text-sr-text">Compliance Hash</p>
          <code className="break-all font-mono text-xs text-sr-text-secondary">
            {song.complianceHash}
          </code>
        </div>
      )}

      {/* ISRC Code */}
      {song.isrcCode && (
        <div className="rounded-lg bg-sr-mid/50 p-4">
          <p className="mb-2 text-sm font-medium text-sr-text">ISRC Code</p>
          <p className="font-mono text-sm text-sr-text">{song.isrcCode}</p>
        </div>
      )}

      {/* Token Status */}
      <div className="rounded-lg bg-sr-mid/50 p-4">
        <p className="mb-2 text-sm font-medium text-sr-text">Status</p>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            song.status === "active"
              ? "bg-sr-green/20 text-sr-green"
              : song.status === "pending"
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-sr-mid text-sr-text-secondary"
          }`}
        >
          {song.status}
        </span>
      </div>
    </div>
  );
}
