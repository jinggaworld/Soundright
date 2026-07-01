import { PublicKey, AccountIdentifier, RpcClient, HttpHandler } from "casper-js-sdk";

const RPC_URLS = [
  process.env.CASPER_RPC_URL,
  "https://rpc.testnet.casperlabs.io",
].filter(Boolean) as string[];

// Try each RPC endpoint until one works
async function rpcWithFallback<T>(fn: (client: RpcClient) => Promise<T>): Promise<T> {
  let lastError: Error | null = null;
  for (const url of RPC_URLS) {
    try {
      const handler = new HttpHandler(url);
      const client = new RpcClient(handler);
      return await fn(client);
    } catch (error) {
      lastError = error as Error;
      console.warn(`RPC endpoint ${url} failed, trying next...`);
    }
  }
  throw lastError;
}

/**
 * Get CSPR balance for a public key.
 * Fetches the account info to get the main purse URef, then queries balance.
 */
export async function getBalance(publicKeyHex: string): Promise<number> {
  try {
    const publicKey = PublicKey.fromHex(publicKeyHex);
    const accountId = new AccountIdentifier(undefined, publicKey);
    const balance = await rpcWithFallback(async (client) => {
      const accountInfo = await client.getAccountInfo(null, accountId);
      const purseURef = (accountInfo as any)?.account?.main_purse;
      if (!purseURef) {
        console.warn("No main_purse found for", publicKeyHex.slice(0, 10) + "...");
        return 0;
      }
      const bal = await client.getLatestBalance(purseURef);
      if (!bal) return 0;
      return Number(bal) / 1_000_000_000;
    });
    return balance;
  } catch (error) {
    console.warn("getBalance failed (all RPC endpoints unreachable) for", publicKeyHex.slice(0, 10) + "...", error);
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
