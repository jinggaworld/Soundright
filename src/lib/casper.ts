import { RpcClient, HttpHandler } from "casper-js-sdk";

const RPC_URL =
  process.env.CASPER_RPC_URL || "https://rpc.testnet.casperlabs.io";

const handler = new HttpHandler(RPC_URL);
export const rpcClient = new RpcClient(handler);

export async function getBalance(address: string): Promise<number> {
  try {
    const balance = await rpcClient.getLatestBalance(address);
    if (!balance) return 0;
    return Number(balance) / 1_000_000_000;
  } catch {
    return 0;
  }
}

// Casper TESTNET explorer
const EXPLORER_BASE = "https://testnet.cspr.live";

export function explorerUrl(
  type: "tx" | "account" | "contract",
  identifier: string
): string {
  switch (type) {
    case "tx":
      return `${EXPLORER_BASE}/deploy/${identifier}`;
    case "account":
      return `${EXPLORER_BASE}/account/${identifier}`;
    case "contract":
      return `${EXPLORER_BASE}/contract/${identifier}`;
  }
}

export function shortenAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function csprToMotes(cspr: number): bigint {
  return BigInt(Math.round(cspr * 1_000_000_000));
}

export function motesToCspr(motes: bigint): number {
  return Number(motes) / 1_000_000_000;
}
