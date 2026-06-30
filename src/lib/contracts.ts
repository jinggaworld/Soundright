// Centralized contract address management
// Used after deploying contracts to Casper testnet

/**
 * Contract addresses for SoundRight smart contracts.
 * Set these in .env.local after deploying contracts.
 */
export const CONTRACTS = {
  royaltyToken: process.env.ROYALTY_TOKEN_CONTRACT_ADDRESS,
  streamOracle: process.env.STREAM_ORACLE_CONTRACT_ADDRESS,
  distributor: process.env.DISTRIBUTOR_CONTRACT_ADDRESS,
} as const;

export type ContractName = keyof typeof CONTRACTS;

/**
 * Get a contract address by name. Throws if not deployed.
 *
 * @param contract - The contract name to get the address for
 * @returns The contract address
 * @throws Error if the contract is not deployed
 *
 * @example
 * ```ts
 * const tokenAddress = getContractAddress("royaltyToken");
 * console.log(tokenAddress); // "0x1234..."
 * ```
 */
export function getContractAddress(contract: ContractName): string {
  const address = CONTRACTS[contract];
  if (!address) {
    throw new Error(
      `Contract ${contract} not deployed. Set ${contract.toUpperCase()}_CONTRACT_ADDRESS in .env.local`
    );
  }
  return address;
}

/**
 * Get the Casper Explorer URL for a deploy, account, or contract.
 *
 * @param type - The type of identifier (deploy, account, or contract)
 * @param identifier - The hash or address to link to
 * @returns The full Explorer URL
 *
 * @example
 * ```ts
 * const url = getExplorerUrl("deploy", "abc123...");
 * // https://cspr.cloud/deploy/abc123...
 * ```
 */
export function getExplorerUrl(
  type: "deploy" | "account" | "contract",
  identifier: string
): string {
  const base = "https://cspr.cloud";
  switch (type) {
    case "deploy":
      return `${base}/deploy/${identifier}`;
    case "account":
      return `${base}/account/${identifier}`;
    case "contract":
      return `${base}/contract/${identifier}`;
  }
}

/**
 * Check if all required contracts are deployed.
 *
 * @returns Object with deployment status for each contract
 */
export function getDeploymentStatus(): Record<ContractName, boolean> {
  return {
    royaltyToken: !!CONTRACTS.royaltyToken,
    streamOracle: !!CONTRACTS.streamOracle,
    distributor: !!CONTRACTS.distributor,
  };
}
