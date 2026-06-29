import { explorerUrl } from "@/lib/casper";
import { ExternalLink } from "lucide-react";

interface Props {
  type: "tx" | "account" | "contract";
  address: string;
  label?: string;
}

export function CasperExplorerLink({ type, address, label }: Props) {
  return (
    <a
      href={explorerUrl(type, address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-sr-announcement hover:underline"
    >
      {label || `${address.slice(0, 8)}...${address.slice(-4)}`}
      <ExternalLink size={10} />
    </a>
  );
}
