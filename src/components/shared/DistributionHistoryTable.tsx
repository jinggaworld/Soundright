interface Distribution {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalPlays: number;
  totalRoyaltyCspr: number;
  distributedAt: string;
}

interface Props {
  distributions: Distribution[];
}

export function DistributionHistoryTable({ distributions }: Props) {
  if (distributions.length === 0) {
    return (
      <p className="text-sm text-sr-text-secondary">
        No distributions yet
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sr-border text-left text-sr-text-secondary">
            <th className="pb-2 font-medium">Period</th>
            <th className="pb-2 font-medium">Plays</th>
            <th className="pb-2 font-medium">Royalty (CSPR)</th>
            <th className="pb-2 font-medium">Distributed</th>
          </tr>
        </thead>
        <tbody>
          {distributions.map((d) => (
            <tr key={d.id} className="border-b border-sr-border/50">
              <td className="py-2 text-sr-text">
                {new Date(d.periodStart).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                –{" "}
                {new Date(d.periodEnd).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="py-2 text-sr-text">
                {d.totalPlays.toLocaleString()}
              </td>
              <td className="py-2 font-bold text-sr-green">
                {d.totalRoyaltyCspr.toFixed(4)}
              </td>
              <td className="py-2 text-sr-text-secondary">
                {new Date(d.distributedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
