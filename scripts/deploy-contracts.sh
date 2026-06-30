#!/bin/bash
set -e

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

RPC_URL="${CASPER_RPC_URL:-https://rpc.testnet.casperlabs.io}"
DEPLOY_AMOUNT=5000000000  # 5 CSPR

echo "🚀 Deploying SoundRight Smart Contracts to Casper Testnet..."
echo "RPC URL: $RPC_URL"
echo ""

# Check for required keys
if [ -z "$CASPER_ORACLE_PRIVATE_KEY" ]; then
    echo "❌ CASPER_ORACLE_PRIVATE_KEY not set in .env.local"
    echo "Generate with: casper-client keygen -o oracle"
    exit 1
fi

# Deploy RoyaltyToken
echo "Deploying RoyaltyToken..."
cd contracts/royalty-token
TOKEN_RESULT=$(cargo odra deploy -b casper --url $RPC_URL --amount $DEPLOY_AMOUNT 2>&1)
TOKEN_ADDRESS=$(echo "$TOKEN_RESULT" | grep -oP 'contract-address: \K[a-f0-9]+')
echo "✅ RoyaltyToken deployed: $TOKEN_ADDRESS"
cd ../..

# Deploy StreamOracle
echo "Deploying StreamOracle..."
cd contracts/oracle
ORACLE_RESULT=$(cargo odra deploy -b casper --url $RPC_URL --amount $DEPLOY_AMOUNT 2>&1)
ORACLE_ADDRESS=$(echo "$ORACLE_RESULT" | grep -oP 'contract-address: \K[a-f0-9]+')
echo "✅ StreamOracle deployed: $ORACLE_ADDRESS"
cd ../..

# Deploy RoyaltyDistributor
echo "Deploying RoyaltyDistributor..."
cd contracts/distributor
DIST_RESULT=$(cargo odra deploy -b casper --url $RPC_URL --amount $DEPLOY_AMOUNT 2>&1)
DIST_ADDRESS=$(echo "$DIST_RESULT" | grep -oP 'contract-address: \K[a-f0-9]+')
echo "✅ RoyaltyDistributor deployed: $DIST_ADDRESS"
cd ../..

echo ""
echo "📋 Contract Addresses:"
echo "ROYALTY_TOKEN_CONTRACT_ADDRESS=$TOKEN_ADDRESS"
echo "STREAM_ORACLE_CONTRACT_ADDRESS=$ORACLE_ADDRESS"
echo "DISTRIBUTOR_CONTRACT_ADDRESS=$DIST_ADDRESS"
echo ""
echo "Update your .env.local file with these addresses!"
echo ""
echo "Add to .env.local:"
echo "ROYALTY_TOKEN_CONTRACT_ADDRESS=$TOKEN_ADDRESS"
echo "STREAM_ORACLE_CONTRACT_ADDRESS=$ORACLE_ADDRESS"
echo "DISTRIBUTOR_CONTRACT_ADDRESS=$DIST_ADDRESS"
