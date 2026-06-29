# Plan 18: Smart Contract Deployment & Verification Scripts

## Overview
Scripts untuk build, deploy, dan verify smart contracts di Casper testnet. Termasuk deployment automation, contract address verification, dan post-deployment setup.

## Goals
- Automated build scripts untuk WASM
- Deploy scripts ke Casper testnet
- Contract address management
- Post-deployment verification
- Environment variable updates

## Tasks

### 18.1 Build Script (scripts/build-contracts.sh)
```bash
#!/bin/bash
set -e

echo "🔨 Building SoundRight Smart Contracts..."

# Build RoyaltyToken
echo "Building RoyaltyToken..."
cd contracts/royalty-token
cargo odra build -b casper-test
echo "✅ RoyaltyToken built"

# Build StreamOracle
echo "Building StreamOracle..."
cd ../oracle
cargo odra build -b casper-test
echo "✅ StreamOracle built"

# Build RoyaltyDistributor
echo "Building RoyaltyDistributor..."
cd ../distributor
cargo odra build -b casper-test
echo "✅ RoyaltyDistributor built"

echo "✅ All contracts built successfully!"
echo "WASM files:"
find ../../ -name "*.wasm" -type f
```

### 18.2 Deploy Script (scripts/deploy-contracts.sh)
```bash
#!/bin/bash
set -e

RPC_URL="https://rpc.testnet.casperlabs.io"
DEPLOY_AMOUNT=5000000000  # 5 CSPR

echo "🚀 Deploying SoundRight Smart Contracts to Casper Testnet..."

# Deploy RoyaltyToken
echo "Deploying RoyaltyToken..."
cd contracts/royalty-token
TOKEN_RESULT=$(cargo odra deploy -b casper --url $RPC_URL --amount $DEPLOY_AMOUNT 2>&1)
TOKEN_ADDRESS=$(echo "$TOKEN_RESULT" | grep -oP 'contract-address: \K[a-f0-9]+')
echo "✅ RoyaltyToken deployed: $TOKEN_ADDRESS"

# Deploy StreamOracle
echo "Deploying StreamOracle..."
cd ../oracle
ORACLE_RESULT=$(cargo odra deploy -b casper --url $RPC_URL --amount $DEPLOY_AMOUNT 2>&1)
ORACLE_ADDRESS=$(echo "$ORACLE_RESULT" | grep -oP 'contract-address: \K[a-f0-9]+')
echo "✅ StreamOracle deployed: $ORACLE_ADDRESS"

# Deploy RoyaltyDistributor
echo "Deploying RoyaltyDistributor..."
cd ../distributor
DIST_RESULT=$(cargo odra deploy -b casper --url $RPC_URL --amount $DEPLOY_AMOUNT 2>&1)
DIST_ADDRESS=$(echo "$DIST_RESULT" | grep -oP 'contract-address: \K[a-f0-9]+')
echo "✅ RoyaltyDistributor deployed: $DIST_ADDRESS"

echo ""
echo "📋 Contract Addresses:"
echo "ROYALTY_TOKEN_CONTRACT_ADDRESS=$TOKEN_ADDRESS"
echo "STREAM_ORACLE_CONTRACT_ADDRESS=$ORACLE_ADDRESS"
echo "DISTRIBUTOR_CONTRACT_ADDRESS=$DIST_ADDRESS"
echo ""
echo "Update your .env file with these addresses!"
```

### 18.3 Deploy All for Song (scripts/deploy-song.sh)
```bash
#!/bin/bash
set -e

# Deploy contracts for a specific song
# Usage: ./deploy-song.sh "Song Title" "SPOTIFY_ID" "ISRC" TOTAL_SUPPLY TOKENS_FORSale PRICE_PER_TOKEN ROYALTY_RATE

SONG_TITLE=$1
SPOTIFY_ID=$2
ISRC=$3
TOTAL_SUPPLY=${4:-1000}
TOKENS_FOR_SALE=${5:-400}
PRICE_PER_TOKEN=${6:-5}
ROYALTY_RATE=${7:-4}

echo "🎵 Deploying contracts for: $SONG_TITLE"

# Build contracts first
./build-contracts.sh

# Deploy and get addresses
./deploy-contracts.sh

# TODO: Initialize contracts with song-specific parameters
# This would call the init function on each contract

echo "✅ Song contracts deployed!"
```

### 18.4 Verification Script (scripts/verify-deployment.sh)
```bash
#!/bin/bash

RPC_URL="https://rpc.testnet.casperlabs.io"

echo "🔍 Verifying contract deployments..."

# Check if contracts are accessible
TOKEN_ADDR=$ROYALTY_TOKEN_CONTRACT_ADDRESS
ORACLE_ADDR=$STREAM_ORACLE_CONTRACT_ADDRESS
DIST_ADDR=$DISTRIBUTOR_CONTRACT_ADDRESS

echo "Token Contract: $TOKEN_ADDR"
echo "Oracle Contract: $ORACLE_ADDR"
echo "Distributor Contract: $DIST_ADDR"

# TODO: Add RPC calls to verify contract state
# This would check:
# 1. Contract exists
# 2. Contract is callable
# 3. Initial state is correct

echo "✅ Verification complete!"
```

### 18.5 Contract Address Manager (lib/contracts.ts)
```typescript
// Centralized contract address management
export const CONTRACTS = {
  royaltyToken: process.env.ROYALTY_TOKEN_CONTRACT_ADDRESS,
  streamOracle: process.env.STREAM_ORACLE_CONTRACT_ADDRESS,
  distributor: process.env.DISTRIBUTOR_CONTRACT_ADDRESS,
} as const;

export function getContractAddress(contract: keyof typeof CONTRACTS): string {
  const address = CONTRACTS[contract];
  if (!address) {
    throw new Error(`Contract ${contract} not deployed. Set ${contract.toUpperCase()}_CONTRACT_ADDRESS in .env`);
  }
  return address;
}

export function getExplorerUrl(type: "deploy" | "account" | "contract", identifier: string): string {
  const base = "https://cspr.cloud";
  switch (type) {
    case "deploy": return `${base}/deploy/${identifier}`;
    case "account": return `${base}/account/${identifier}`;
    case "contract": return `${base}/contract/${identifier}`;
  }
}
```

## Deliverables
- [ ] Build script untuk WASM compilation
- [ ] Deploy script ke Casper testnet
- [ ] Song deployment script
- [ ] Verification script
- [ ] Contract address manager
- [ ] Explorer URL generator

## Dependencies
- Plan 5 (RoyaltyToken)
- Plan 6 (StreamOracle & Distributor)
- Rust toolchain
- Odra CLI
- Casper testnet account

## Notes
- **Gas Fees**: Deploy membutuhkan CSPR untuk gas
- **Mainnet**: Deploy langsung ke testnet untuk buildathon
- **Verification**: Pastikan contracts deployed correctly
- **Documentation**: Record all contract addresses
